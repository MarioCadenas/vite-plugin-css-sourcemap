import path from 'node:path';
import type { Plugin } from 'vite';
import mergeSourceMap from 'merge-source-map';
import type {
  NormalizedOutputOptions,
  OutputBundle,
  PluginContext,
  PreRenderedAsset,
  RenderedChunk,
  InputOption,
  OutputOptions,
  ExistingRawSourceMap,
} from 'rollup';
import { EXTENSIONS, PLUGIN_NAME } from './constants';
import { hasValidExtension } from './utils';

/**
 * Checks if a sourcemap is empty (has no meaningful mappings or sources)
 */
function isEmptySourcemap(map: ExistingRawSourceMap): boolean {
  return (
    !map.mappings ||
    map.mappings === '' ||
    !map.sources ||
    map.sources.length === 0
  );
}

/**
 * Generates an identity sourcemap for a source file.
 * This maps each line to itself in the original file.
 */
function generateIdentitySourcemap(
  code: string,
  filename: string,
): ExistingRawSourceMap {
  const lines = code.split('\n');
  // VLQ encoding for identity map: each line maps to the same line in source
  // AAAA = column 0, source 0, source line 0, source column 0
  // For subsequent lines, we only need to indicate "next line, same column offset"
  // AACA = column 0, source 0, source line +1, source column 0
  const mappings = lines.map((_, i) => (i === 0 ? 'AAAA' : 'AACA')).join(';');

  return {
    version: 3,
    file: path.basename(filename),
    sources: [filename],
    sourcesContent: [code],
    names: [],
    mappings,
  };
}

export interface CssSourcemapOptions {
  extensions?: string[];
  enabled?: boolean;
  folder?: string;
  getURL?: (fileName: string) => string;
}

function extractFileName(input: InputOption) {
  if (typeof input === 'string') {
    return path.parse(input).name;
  }

  if (Array.isArray(input) && input[0]) {
    return path.parse(input[0]).name;
  }

  return path.parse(Object.keys(input)[0]!).name;
}

function extractFullPath(outputOptions: OutputOptions, fileName: string) {
  let fullPath = fileName;

  if (outputOptions && outputOptions.assetFileNames) {
    let assetDir: string | null = null;

    if (typeof outputOptions.assetFileNames === 'string') {
      assetDir = path.dirname(outputOptions.assetFileNames);
    } else if (typeof outputOptions.assetFileNames === 'function') {
      // TODO: Implement this
    }

    if (assetDir && assetDir !== '.') {
      fullPath = path.join(assetDir, fileName);
    }
  }

  return fullPath;
}

export default function cssSourcemapPlugin(
  options: CssSourcemapOptions = {},
): Plugin {
  const {
    extensions = EXTENSIONS,
    enabled = true,
    folder = '',
    getURL = (fileName: string) => fileName,
  } = options;

  if (!enabled) {
    return {
      name: PLUGIN_NAME,
      apply: 'build',
    };
  }

  const assetToId = new Map<string, string[]>();
  const idToMap = new Map<string, string>();
  let templateName: string;
  let outputOptions: OutputOptions | null = null;
  let willAugmentChunkHash = true;

  return {
    name: PLUGIN_NAME,
    apply: 'build',
    buildStart(options) {
      const viteCSSPlugin = options.plugins.find(
        (plugin) => plugin.name === 'vite:css-post',
      );

      if (!viteCSSPlugin) {
        throw new Error('vite:css-post plugin not found.');
      }

      templateName = extractFileName(options.input);

      const augmentChunkHashHandler = {
        apply: function (
          target: (this: PluginContext, chunk: RenderedChunk) => string | void,
          thisArg: PluginContext,
          argumentsList: any[],
        ) {
          const [chunk] = argumentsList;
          const result = Reflect.apply(target, thisArg, argumentsList);

          if (!result) {
            return result;
          }

          for (const id of chunk.moduleIds) {
            if (hasValidExtension(id, extensions)) {
              if (assetToId.has(result)) {
                assetToId.get(result)?.push(id);
              } else {
                assetToId.set(result, [id]);
              }
            }
          }

          return result;
        },
      };

      const currentMethod = viteCSSPlugin['augmentChunkHash']!;
      const augmentChunkHashProxy = new Proxy(
        currentMethod,
        augmentChunkHashHandler,
      );

      Object.defineProperty(viteCSSPlugin, 'augmentChunkHash', {
        value: augmentChunkHashProxy,
      });
    },

    outputOptions(options: OutputOptions) {
      outputOptions = options;

      if (typeof options.entryFileNames === 'string') {
        willAugmentChunkHash = options.entryFileNames.includes('[hash]');
      } else if (typeof options.entryFileNames === 'function') {
        // TODO: Implement this
      }

      return options;
    },

    async renderChunk(_: string, chunk: RenderedChunk) {
      if (willAugmentChunkHash) return null;

      for (const id of chunk.moduleIds) {
        if (hasValidExtension(id, extensions)) {
          const fullPath = extractFullPath(outputOptions!, templateName);

          if (assetToId.has(fullPath)) {
            assetToId.get(fullPath)?.push(id);
          } else {
            assetToId.set(fullPath, [id]);
          }
        }
      }

      return null;
    },

    async transform(code, id) {
      if (hasValidExtension(id, extensions)) {
        const fileName = path.parse(id).name.replace('.module', '');
        let sourcemap = this.getCombinedSourcemap() as ExistingRawSourceMap;

        // If the combined sourcemap is empty (no prior transforms generated one),
        // create an identity sourcemap that maps the file to itself
        if (isEmptySourcemap(sourcemap)) {
          sourcemap = generateIdentitySourcemap(code, id);
        }

        const referenceIdMap = this.emitFile({
          type: 'asset',
          name: `${fileName}.map`,
          source: JSON.stringify(sourcemap),
        });

        idToMap.set(id, referenceIdMap);

        return {
          code: code,
          map: sourcemap,
        };
      }

      return null;
    },

    async generateBundle(_: NormalizedOutputOptions, bundle: OutputBundle) {
      const fullPath = extractFullPath(outputOptions!, templateName);

      for (const [fileName, asset] of Object.entries(bundle)) {
        if (asset.type === 'asset' && fileName.endsWith('.css')) {
          const sourceFileIds =
            assetToId.get(fileName) || assetToId.get(fullPath) || [];
          const newMapFileName = `${asset.fileName}.map`;

          const finalSourceMap = sourceFileIds.reduce(
            (mergedMap: string | object | null, refId: string) => {
              const mapReferenceId = idToMap.get(refId);
              if (!mapReferenceId) return mergedMap;

              const mapFileName = this.getFileName(mapReferenceId);
              const generatedMap = (bundle[mapFileName] as PreRenderedAsset)
                ?.source;

              delete bundle[mapFileName];

              return mergeSourceMap(mergedMap, generatedMap);
            },
            null,
          );

          if (!finalSourceMap) {
            console.warn(`No source map found for ${fileName}`);
            continue;
          }

          const mapReferencePath = path.basename(newMapFileName);
          const outputPath = path.dirname(newMapFileName);

          this.emitFile({
            type: 'asset',
            fileName: path.join(outputPath, folder, mapReferencePath),
            source:
              typeof finalSourceMap === 'string'
                ? finalSourceMap
                : JSON.stringify(finalSourceMap),
          });

          asset.source += `\n/*# sourceMappingURL=${getURL(mapReferencePath)} */`;
        }
      }
    },
  };
}
