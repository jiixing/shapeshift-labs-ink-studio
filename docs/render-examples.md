# Render examples

Run these commands from the repository root after editing the scene files.

## 1. Airflow scene

Render a colored frame at 1.4 seconds:

```sh
node cli/ink-studio.js render examples/airflow.js --t 1.4 --colored
```

Output: `studio/out/airflow.png` (900×620).


animation

node cli/ink-studio.js shimmer examples/airflow.js --mode still --t 0 --frames 30 --step 0.1 --delay 10 --w 600 --h 420 --colored --out studio/out/airflow.gif 

## 2. Art-effects scene with automatic pixel sizing

```sh
node cli/ink-studio.js render examples/art-effects.js --t 1.2 --colored --out studio/out/art-effects.png
```

This command currently fails with `PNG pixel count does not match its shape`. The scene does not set `detail` in `B.finish(...)`, so the renderer cannot calculate an automatic art-pixel size. Add a finite `detail` value to the scene to use this form.

## 3. Art-effects scene with an explicit pixel size

Use this working command until the scene supplies `detail`:

```sh
node cli/ink-studio.js render examples/art-effects.js --t 1.2 --colored --px 5 --out studio/out/art-effects.png
```

`--px 5` renders a 180×124 native art grid and upscales it to a 900×620 PNG. Adjust `--px` after scene tweaks if you want a different pixel size.

## 4. Mountain lake reflection

Render the blue lake, copper mountains, and saturated grass field:

```sh
node cli/ink-studio.js render examples/lake-reflection.js --t 0.94 --colored --out studio/out/lake-reflection.png
```

Output: `studio/out/lake-reflection.png` (900×621).

## 5. Vegetation growth animation

Render the tree, roots, leaves, and leaf veins growing over 30 seconds:

```sh
node cli/ink-studio.js shimmer examples/vegetation-growth.js --mode still --t 0 --frames 300 --step 0.1 --delay 10 --w 480 --h 340 --colored --out studio/out/vegetation-growth.gif
```

Output: `studio/out/vegetation-growth.gif` (480×340, 300 frames, 10 FPS, 30 seconds, looping).

## 6. Procedural geometry gallery

`examples/procedural/gallery.js` is a browser canvas gallery, not a CLI scene module. Build its standalone HTML page instead of passing it to `ink-studio render`:

```sh
node examples/procedural/build.js
```

Output: `dist/procedural-gallery.html`. Open that file in a browser to view and rotate the gallery examples. To choose another output path:

```sh
node examples/procedural/build.js path/to/procedural-gallery.html
```

## 7. Socket walkway TypeScript example

The typed source is `examples/socket-walkway.ts`. Render it through the stable CommonJS facade `examples/socket-walkway.js`, which loads the generated TypeScript implementation:

```sh
node cli/ink-studio.js render examples/socket-walkway.js --colored --out studio/out/socket-walkway.png
```

Output: `studio/out/socket-walkway.png` (900×621).
