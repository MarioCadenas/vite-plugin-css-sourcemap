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
