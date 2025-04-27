import { describe, it, expect, vi } from 'vitest';
import cssSourcemap from './plugin';
import { PLUGIN_NAME } from './constants';
import { hasValidExtension } from './utils';
import type { PluginContext, OutputAsset } from 'rollup';

describe('vite-plugin-css-sourcemap', () => {
  it('should be a function', () => {
    expect(typeof cssSourcemap).toBe('function');
  });

  it('should return a plugin object with correct name', () => {
    const plugin = cssSourcemap();
    expect(plugin).toBeDefined();
    expect(plugin.name).toBe(PLUGIN_NAME);
  });

  it('should only apply in build mode', () => {
    const plugin = cssSourcemap();
    expect(plugin.apply).toBe('build');
  });

  it('should handle disabled state', () => {
    const plugin = cssSourcemap({ enabled: false });

    expect(plugin.name).toBe(PLUGIN_NAME);
    expect(plugin.apply).toBe('build');
    expect(Object.keys(plugin)).toEqual(['name', 'apply']);
  });

  it('should accept and use custom extensions', () => {
    const customExtensions = ['.less', '.scss'];

    cssSourcemap({ extensions: customExtensions });

    expect(hasValidExtension('/path/to/file.less', customExtensions)).toBe(
      true,
    );
    expect(hasValidExtension('/path/to/file.scss', customExtensions)).toBe(
      true,
    );
    expect(hasValidExtension('/path/to/file.css', customExtensions)).toBe(
      false,
    );
  });

  it('should use default extensions when none provided', () => {
    cssSourcemap();

    expect(hasValidExtension('/path/to/file.css')).toBe(true);
    expect(hasValidExtension('/path/to/file.scss')).toBe(true);
    expect(hasValidExtension('/path/to/file.less')).toBe(false);
  });

  it('should handle custom sourcemap URL function', () => {
    const customPrefix = '/custom-sourcemaps/';
    const getURL = (fileName: string) => `${customPrefix}${fileName}`;

    const plugin = cssSourcemap({ getURL });

    const mockContext = {
      getCombinedSourcemap: () => ({ toString: () => '{}' }),
      emitFile: vi.fn().mockReturnValue('referenceId'),
    };

    const cssFile = '/path/to/styles.css';
    if (plugin.transform && typeof plugin.transform === 'function') {
      plugin.transform.call(
        mockContext as any,
        'body { color: red; }',
        cssFile,
      );

      expect(mockContext.emitFile).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.stringContaining('.map'),
        }),
      );
    }
  });

  // TODO: Fix this test
  it.skip('should handle custom folder option', () => {
    const customFolder = 'custom-sourcemaps';
    const plugin = cssSourcemap({ folder: customFolder });
    const mockBundle = {
      'styles.css': {
        type: 'asset',
        fileName: 'styles.css',
        source: 'body { color: red; }',
        name: 'styles.css',
        needsCodeReference: false,
        names: [],
        originalFileName: 'styles.css',
        originalFileNames: ['styles.css'],
      } as OutputAsset,
    };
    const mockMap = {
      finalSourceMap: {
        version: 3,
        sources: [
          'vite-plugin-css-sourcemap/playground/src/styles/main.css',
          'vite-plugin-css-sourcemap/playground/src/styles/second.css',
        ],
        names: [],
        mappings: 'AAAA,CAAC,CAAC',
        sourcesContent: ['body { color: red; }'],
      },
    };
    const emitFile = vi.fn().mockReturnValue('referenceId');

    const mockContext = {
      emitFile,
    } as unknown as PluginContext;

    if (plugin.generateBundle && typeof plugin.generateBundle === 'function') {
      plugin.generateBundle.call(mockContext, {} as any, mockBundle, false);

      expect(emitFile).toHaveBeenCalledWith(
        expect.objectContaining({
          fileName: expect.stringContaining(`${customFolder}/`),
        }),
      );
    }
  });
});
