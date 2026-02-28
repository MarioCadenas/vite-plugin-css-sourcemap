import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { build } from 'vite';
import { resolve } from 'path';
import { readFile, readdir } from 'fs/promises';
import { rimraf } from 'rimraf';

describe('vite-plugin-css-sourcemap integration', () => {
  const playgroundDir = resolve(__dirname, '../playground');
  const distDir = resolve(playgroundDir, 'dist');
  const assetsDir = resolve(distDir, 'assets');
  const customDistDir = resolve(playgroundDir, 'dist-custom');
  const customAssetsDir = resolve(customDistDir, 'assets');

  beforeEach(async () => {
    await rimraf(distDir);
    await rimraf(customDistDir);
  });

  it('should generate sourcemap files in the correct custom location', async () => {
    const sourceMapsOutput = 'sourcemaps';
    await build({
      root: playgroundDir,
      build: {
        outDir: 'dist',
      },
      configFile: false,
      plugins: [
        (await import('./index')).default({
          folder: sourceMapsOutput,
          getURL: (fileName) => `${sourceMapsOutput}/${fileName}`,
        }),
      ],
    });
    const sourceMapsDir = resolve(assetsDir, sourceMapsOutput);
    const files = await readdir(assetsDir);
    const sourceMapsFiles = await readdir(sourceMapsDir);

    const cssFiles = files.filter((file) => file.endsWith('.css'));
    expect(cssFiles.length).toBeGreaterThan(0);

    const mapFiles = sourceMapsFiles
      .filter((file) => file.endsWith('.map'))
      .map((file) => [file, `${sourceMapsOutput}/${file}`]);

    expect(mapFiles.length).toBeGreaterThan(0);

    const sourceMapFiles = Object.fromEntries(mapFiles);

    for (const cssFile of cssFiles) {
      const mapFile = `${cssFile}.map`;
      expect(sourceMapFiles).toHaveProperty(mapFile);

      const cssContent = await readFile(resolve(assetsDir, cssFile), 'utf-8');
      expect(cssContent).toContain(
        `/*# sourceMappingURL=${sourceMapFiles[mapFile]} */`,
      );
    }
  });

  it('should generate sourcemap files in the correct location', async () => {
    await build({
      root: playgroundDir,
      build: {
        outDir: 'dist',
      },
      configFile: false,
      plugins: [(await import('./index')).default()],
    });
    const sourceMapsDir = resolve(assetsDir);
    const files = await readdir(assetsDir);
    const sourceMapsFiles = await readdir(sourceMapsDir);

    const cssFiles = files.filter((file) => file.endsWith('.css'));
    expect(cssFiles.length).toBeGreaterThan(0);

    const mapFiles = sourceMapsFiles
      .filter((file) => file.endsWith('.map'))
      .map((file) => [file, `${file}`]);

    expect(mapFiles.length).toBeGreaterThan(0);

    const sourceMapFiles = Object.fromEntries(mapFiles);

    for (const cssFile of cssFiles) {
      const mapFile = `${cssFile}.map`;
      expect(sourceMapFiles).toHaveProperty(mapFile);

      const cssContent = await readFile(resolve(assetsDir, cssFile), 'utf-8');
      expect(cssContent).toContain(
        `/*# sourceMappingURL=${sourceMapFiles[mapFile]} */`,
      );
    }
  });

  it('should generate sourcemap files in a custom dist location', async () => {
    await build({
      root: playgroundDir,
      build: {
        outDir: customDistDir,
      },
      configFile: false,
      plugins: [(await import('./index')).default()],
    });
    const sourceMapsDir = resolve(customAssetsDir);
    const files = await readdir(customAssetsDir);
    const sourceMapsFiles = await readdir(sourceMapsDir);

    const cssFiles = files.filter((file) => file.endsWith('.css'));
    expect(cssFiles.length).toBeGreaterThan(0);

    const mapFiles = sourceMapsFiles
      .filter((file) => file.endsWith('.map'))
      .map((file) => [file, `${file}`]);

    expect(mapFiles.length).toBeGreaterThan(0);

    const sourceMapFiles = Object.fromEntries(mapFiles);

    for (const cssFile of cssFiles) {
      const mapFile = `${cssFile}.map`;
      expect(sourceMapFiles).toHaveProperty(mapFile);

      const cssContent = await readFile(
        resolve(customAssetsDir, cssFile),
        'utf-8',
      );
      expect(cssContent).toContain(
        `/*# sourceMappingURL=${sourceMapFiles[mapFile]} */`,
      );
    }
  });

  it('should generate sourcemap files in the correct custom location and a custom dist location', async () => {
    const sourceMapsOutput = 'sourcemaps';
    await build({
      root: playgroundDir,
      build: {
        outDir: customDistDir,
      },
      configFile: false,
      plugins: [
        (await import('./index')).default({
          folder: sourceMapsOutput,
          getURL: (fileName) => `${sourceMapsOutput}/${fileName}`,
        }),
      ],
    });
    const sourceMapsDir = resolve(customAssetsDir, sourceMapsOutput);
    const files = await readdir(customAssetsDir);
    const sourceMapsFiles = await readdir(sourceMapsDir);

    const cssFiles = files.filter((file) => file.endsWith('.css'));
    expect(cssFiles.length).toBeGreaterThan(0);

    const mapFiles = sourceMapsFiles
      .filter((file) => file.endsWith('.map'))
      .map((file) => [file, `${sourceMapsOutput}/${file}`]);

    expect(mapFiles.length).toBeGreaterThan(0);

    const sourceMapFiles = Object.fromEntries(mapFiles);

    for (const cssFile of cssFiles) {
      const mapFile = `${cssFile}.map`;
      expect(sourceMapFiles).toHaveProperty(mapFile);

      const cssContent = await readFile(
        resolve(customAssetsDir, cssFile),
        'utf-8',
      );
      expect(cssContent).toContain(
        `/*# sourceMappingURL=${sourceMapFiles[mapFile]} */`,
      );
    }
  });

  it('should generate sourcemap files using entryFileNames: "[name].js"', async () => {
    await build({
      root: playgroundDir,
      build: {
        outDir: distDir,
        sourcemap: true,
        minify: false,
        emptyOutDir: true,
        rollupOptions: {
          output: {
            entryFileNames: '[name].js',
            chunkFileNames: 'js/[name].js',
            assetFileNames: 'assets/[name].[ext]',
          },
        },
      },
      configFile: false,
      plugins: [
        (await import('./index')).default({
          extensions: ['.scss', '.css', '.less'],
        }),
      ],
    });
    const sourceMapsDir = resolve(assetsDir);
    const files = await readdir(assetsDir);
    const sourceMapsFiles = await readdir(sourceMapsDir);

    const cssFiles = files.filter((file) => file.endsWith('.css'));
    expect(cssFiles.length).toBeGreaterThan(0);

    const mapFiles = sourceMapsFiles
      .filter((file) => file.endsWith('.map'))
      .map((file) => [file, `${file}`]);

    expect(mapFiles.length).toBeGreaterThan(0);

    const sourceMapFiles = Object.fromEntries(mapFiles);

    for (const cssFile of cssFiles) {
      const mapFile = `${cssFile}.map`;
      expect(sourceMapFiles).toHaveProperty(mapFile);

      const cssContent = await readFile(resolve(assetsDir, cssFile), 'utf-8');
      expect(cssContent).toContain(
        `/*# sourceMappingURL=${sourceMapFiles[mapFile]} */`,
      );
    }

    for (const sourceMapFile of Object.values(sourceMapFiles)) {
      const sourceMapContent = await readFile(
        resolve(assetsDir, sourceMapFile as string),
        'utf-8',
      );

      expect(sourceMapContent).not.toBe('null');
    }
  });

  it('should generate sourcemap files using entryFileNames: "[name].js" and assetFileNames empty', async () => {
    await build({
      root: playgroundDir,
      build: {
        outDir: distDir,
        sourcemap: true,
        minify: false,
        emptyOutDir: true,
        rollupOptions: {
          input: {
            foo: 'playground/foo.html',
          },
          output: {
            entryFileNames: '[name].js',
            chunkFileNames: 'js/[name].js',
          },
        },
      },
      configFile: false,
      plugins: [
        (await import('./index')).default({
          extensions: ['.scss', '.css', '.less'],
        }),
      ],
    });
    const sourceMapsDir = resolve(assetsDir);
    const files = await readdir(assetsDir);
    const sourceMapsFiles = await readdir(sourceMapsDir);

    const cssFiles = files.filter((file) => file.endsWith('.css'));
    expect(cssFiles.length).toBeGreaterThan(0);

    const mapFiles = sourceMapsFiles
      .filter((file) => file.endsWith('.map'))
      .map((file) => [file, `${file}`]);

    expect(mapFiles.length).toBeGreaterThan(0);

    const sourceMapFiles = Object.fromEntries(mapFiles);

    for (const cssFile of cssFiles) {
      const mapFile = `${cssFile}.map`;
      expect(sourceMapFiles).toHaveProperty(mapFile);

      const cssContent = await readFile(resolve(assetsDir, cssFile), 'utf-8');
      expect(cssContent).toContain(
        `/*# sourceMappingURL=${sourceMapFiles[mapFile]} */`,
      );
    }

    for (const sourceMapFile of Object.values(sourceMapFiles)) {
      const sourceMapContent = await readFile(
        resolve(assetsDir, sourceMapFile as string),
        'utf-8',
      );

      expect(sourceMapContent).not.toBe('null');
    }
  });

  afterAll(async () => {
    await rimraf(distDir);
    await rimraf(customDistDir);
  });
});

describe('vite-plugin-css-sourcemap SCSS entrypoint integration', () => {
  const scssPlaygroundDir = resolve(__dirname, '../playground-scss-entrypoint');
  const distDir = resolve(scssPlaygroundDir, 'dist');
  const assetsDir = resolve(distDir, 'assets');

  beforeEach(async () => {
    await rimraf(distDir);
  });

  it('should generate sourcemap for SCSS as direct rollup entrypoint', async () => {
    await build({
      root: scssPlaygroundDir,
      build: {
        outDir: distDir,
        sourcemap: true,
        minify: false,
        emptyOutDir: true,
        rollupOptions: {
          input: {
            main: resolve(scssPlaygroundDir, 'javascript/main.js'),
            styles: resolve(scssPlaygroundDir, 'styles/main.scss'),
          },
          output: {
            entryFileNames: 'js/[name].js',
            chunkFileNames: 'js/[name].[hash].js',
            assetFileNames: 'assets/[name].[ext]',
          },
        },
      },
      configFile: false,
      plugins: [
        (await import('./index')).default({
          extensions: ['.css', '.scss'],
        }),
      ],
    });

    const files = await readdir(assetsDir);
    const cssFiles = files.filter((file) => file.endsWith('.css'));
    const mapFiles = files.filter((file) => file.endsWith('.css.map'));

    expect(cssFiles.length).toBeGreaterThan(0);
    expect(mapFiles.length).toBeGreaterThan(0);

    for (const cssFile of cssFiles) {
      const mapFile = `${cssFile}.map`;
      expect(mapFiles).toContain(mapFile);

      const cssContent = await readFile(resolve(assetsDir, cssFile), 'utf-8');
      expect(cssContent).toContain(`/*# sourceMappingURL=${mapFile} */`);
    }
  });

  it('should include all SCSS partials in sourcemap sources', async () => {
    await build({
      root: scssPlaygroundDir,
      build: {
        outDir: distDir,
        sourcemap: true,
        minify: false,
        emptyOutDir: true,
        rollupOptions: {
          input: {
            main: resolve(scssPlaygroundDir, 'javascript/main.js'),
            styles: resolve(scssPlaygroundDir, 'styles/main.scss'),
          },
          output: {
            entryFileNames: 'js/[name].js',
            chunkFileNames: 'js/[name].[hash].js',
            assetFileNames: 'assets/[name].[ext]',
          },
        },
      },
      configFile: false,
      plugins: [
        (await import('./index')).default({
          extensions: ['.css', '.scss'],
        }),
      ],
    });

    const files = await readdir(assetsDir);
    const mapFiles = files.filter((file) => file.endsWith('.css.map'));

    expect(mapFiles.length).toBeGreaterThan(0);

    const mapContent = await readFile(resolve(assetsDir, mapFiles[0]), 'utf-8');
    const sourcemap = JSON.parse(mapContent);

    expect(sourcemap.sources).toBeDefined();
    expect(Array.isArray(sourcemap.sources)).toBe(true);

    // The sourcemap should include multiple SCSS files (main + partials)
    // not just the entrypoint
    expect(sourcemap.sources.length).toBeGreaterThan(1);

    // Check that partials are included (they should contain partial file names)
    const sourceNames = sourcemap.sources.map((s: string) =>
      s.split('/').pop(),
    );

    // Should include at least some of the partials
    const expectedPartials = [
      '_variables.scss',
      '_reset.scss',
      '_layout.scss',
      '_buttons.scss',
      '_cards.scss',
      '_forms.scss',
      '_utilities.scss',
    ];

    const foundPartials = expectedPartials.filter((partial) =>
      sourceNames.some((name: string) => name === partial),
    );

    // We should find most of the partials in the sourcemap
    expect(foundPartials.length).toBeGreaterThanOrEqual(5);
  });

  afterAll(async () => {
    await rimraf(distDir);
  });
});
