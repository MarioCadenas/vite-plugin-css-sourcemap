# SCSS Entrypoint Playground

This playground tests the scenario where SCSS is used as a direct rollup entrypoint, with `@import`ed partials that should all appear in the sourcemap.

## The Issue

In traditional server-rendered projects, you might have a Vite config like this:

```js
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'javascript/main.js',
        styles: 'styles/main.scss', // SCSS as direct entrypoint
      },
    },
  },
});
```

The `styles/main.scss` file uses `@import` to pull in multiple partials:

```scss
@import 'partials/variables';
@import 'partials/reset';
@import 'partials/buttons';
// ... etc
```

**Expected:** The generated sourcemap should include mappings for ALL SCSS files.

**Actual:** The sourcemap only covers `main.scss`, not the imported partials.

## Structure

```
playground-scss-entrypoint/
├── vite.config.ts          # Vite config with SCSS as rollup input
├── javascript/
│   └── main.js             # JS entrypoint (minimal)
├── styles/
│   ├── main.scss           # SCSS entrypoint (uses @import)
│   └── partials/
│       ├── _variables.scss
│       ├── _reset.scss
│       ├── _layout.scss
│       ├── _buttons.scss
│       ├── _cards.scss
│       ├── _forms.scss
│       └── _utilities.scss
└── index.html              # Test page
```

## Running

```bash
# From the root of the project
cd playground-scss-entrypoint
npx vite build

# Check the sourcemap
cat dist/assets/styles.css.map | jq '.sources'
```

## What to Verify

1. Build succeeds
2. `dist/assets/styles.css` is generated
3. `dist/assets/styles.css.map` is generated
4. The sourcemap's `sources` array should include ALL partials, not just `main.scss`

## Current Behavior (Fixed)

After the fix, the sourcemap includes all SCSS partials:

```json
{
  "sources": [
    "file:///path/to/styles/main.scss",
    "file:///path/to/styles/partials/_reset.scss",
    "file:///path/to/styles/partials/_variables.scss",
    "file:///path/to/styles/partials/_layout.scss",
    "file:///path/to/styles/partials/_buttons.scss",
    "file:///path/to/styles/partials/_cards.scss",
    "file:///path/to/styles/partials/_forms.scss",
    "file:///path/to/styles/partials/_utilities.scss"
  ],
  "sourcesContent": ["/* Original SCSS source for each file */"]
}
```

When debugging in browser DevTools, styles correctly point to the actual partial files like `_buttons.scss`, `_forms.scss`, etc.

## Fixes Applied

### Fix 1: Asset Name Matching

The plugin now tries multiple key formats when looking up source files in `generateBundle`:

- The full filename with extension (e.g., `assets/styles.css`)
- The filename without extension (e.g., `assets/styles`)
- The fallback template path (e.g., `assets/main`)

### Fix 2: SCSS Compilation for Sourcemaps

When `getCombinedSourcemap()` returns an empty sourcemap (which happens when SCSS is a direct rollup entrypoint), the plugin now:

1. Detects that the file is SCSS/Sass
2. Dynamically loads `sass-embedded` or `sass` if available
3. Compiles the SCSS file to extract the proper sourcemap with all `@import`ed partials
4. Falls back to identity sourcemap if no Sass compiler is available

## Requirements

For SCSS sourcemaps to work correctly, you need either `sass-embedded` or `sass` installed:

```bash
npm install -D sass-embedded
# or
npm install -D sass
```

## Related

This playground was created to test SCSS sourcemap support when SCSS is used as a direct rollup entrypoint.
