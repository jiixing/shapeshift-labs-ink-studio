# Rendering `watcher` at 2.6 seconds

This document traces the high-level functions used by:

```sh
node cli/ink-studio.js render watcher --t 2.6
```

It assumes the command runs from the repository root without a local `ink-studio.config.js` or additional flags. The command uses the **CPU software renderer** in `cli/render.js`; it does not use `webgl.mjs` or `src/webgl/`.

## Call path

```text
cli/ink-studio.js
└── run()
    └── CMD.render()
        ├── num('t', 0)                         read --t 2.6
        ├── build('watcher')                    construct the world
        │   ├── lib() → index.js load()         load the toolkit and demos
        │   ├── scene('watcher')                find the built-in scene
        │   └── sceneWatcher(seed)              build geometry, artwork and stage systems
        ├── pose(world, 2.6)                    advance the stateful animation
        │   └── world.anim.update(...)          run the stage 156 times at 1/60 s
        ├── view({ t: 2.6 })                    assemble camera and render options
        ├── cli/render.js render(world, options)
        │   ├── viewMatrix(...)                 build the camera matrix
        │   ├── cameraRays(...)                 generate rays for the art-pixel grid
        │   ├── rasterize and blend splats      project, shade, composite and quantize
        │   └── PixelLook.bayerRank(...)        apply ordered palette dithering
        ├── cli/render.js upscale(image, px)    enlarge art pixels with nearest-neighbor
        └── save('watcher.png', image)
            └── cli/png.js write() → encode()   encode and write studio/out/watcher.png
```

## 1. CLI dispatch and toolkit loading

| Module | Function | What it does |
| --- | --- | --- |
| `cli/ink-studio.js` | `run()` | Dispatches the parsed command to `CMD.render`. |
| `cli/ink-studio.js` | `num('t', 0)` | Converts `--t 2.6` to the numeric render time. |
| `cli/ink-studio.js` | `CMD.render()` | Orchestrates build, pose, render, upscale, and PNG output. |
| `cli/ink-studio.js` | `lib()` | Loads the configured toolkit, or the package's built-in toolkit and demo collection. |
| `index.js` | `load()` | Returns the compiled Node toolkit and `SCENES`; rebuilds `dist/standalone.js` when missing or stale. |
| `index.js` | `files()`, `bundle()`, `demos()` | Used by `load()` to assemble the toolkit and built-in dioramas. |
| `cli/ink-studio.js` | `scene('watcher')` | Finds the scene whose `id` is `watcher`. |

## 2. Building the Watcher world

| Module | Function | What it does |
| --- | --- | --- |
| `cli/ink-studio.js` | `build('watcher')` | Resolves the scene and seed, calls its builder, attaches runtime helpers, and initializes the world clock. |
| `demos/labscenes.js` | `sceneWatcher(seed)` | Builds the die, dais, columns, eye/pip, lighting, particles, rig, and animation controller. |
| `src/builder.js` | `makeBuilder(seed, palette)` | Creates the splat builder and Watcher's palette. |
| `src/sculpt.js` | `makeSculpt(builder)` | Creates the base signed-distance sculptor. |
| `src/kit/k3-shapes.js` | `K.sculpt(sculptor)` | Adds extended modeling operations used for the dais, columns, and regular die. |
| `src/sculpt.js`, `src/kit/k3-shapes.js` | `S.ground`, `S.box`, `S.join`, `S.fold`, `S.lathe`, `S.warp`, `S.regular`, `S.bake` | Construct the scenery and die, then sample their surfaces into splat data. |
| `src/kit/k1-stage.js` | `K.rig(...)`, `rig.bind(stage)` | Records which splats belong to the die and attaches the rig that transforms the whole part. |
| `src/kit/k8-light.js` | `K.light.capture(builder, sculptor)` | Records ramps, brightness, and normals for the moving lamp. |
| `src/kit/k4-art.js` | `K.art(...)`, `K.art.faces(...)` | Creates the blinking eye and pips and attaches them to the die's faces. |
| `src/kit/k1-stage.js` | `K.pool(builder, 520)` | Reserves hidden splats for dust, chips, and other particles. |
| `src/builder.js` | `builder.finish(...)` | Packages splat buffers, palette, camera, detail, radius, and metadata into the world. |
| `src/kit/k1-stage.js` | `K.stage(world)` | Creates the stateful animation stage and exposes `world.anim`. |
| `src/kit/k1-stage.js` | `stage.add(system)` | Registers each artwork, particle, light, field, and camera system in execution order. |

### Stage systems installed by `sceneWatcher`

| Module | Function or method | What it does |
| --- | --- | --- |
| `demos/labscenes.js` | Watcher controller `update(dt, t)` | Runs the idle/crouch/air/land sequence, spring squash, quarter-turn tumble, lamp placement, and shadow size. |
| `src/kit/k1-stage.js` | `rig.set(...)`, `rig.apply()` | Sets the die's transform and applies it to the die's positions and covariance matrices. |
| `src/kit/k4-art.js` | Artwork system `update` / `paint` | Moves the iris, closes the eyelids, and paints the face artwork. |
| `src/kit/k7-particles.js` | `K.particles(...)` system `update` | Emits and advances landing dust, rings, chips, and interaction sparks. |
| `src/kit/k8-light.js` | `K.light.system(...)` system `update` | Repaints splats reached by the lamp as it moves with the die. |
| `src/kit/k5-fields.js` | `K.fx.reveal(...)`, `K.fx.tint(...)` | Handles the opening reveal and the soft shadow field on the dais. |
| `demos/labscenes.js` | `labShake(st)` | Supplies the small camera kick used when the die lands or is struck. |
| `src/kit/k0-math.js` | `K.spring(...)` | Produces the die's squash-and-rebound spring motion. |
| `src/kit/k5-fields.js` | `K.field(...)` | Defines the soft shadow field used by `K.fx.tint`. |

## 3. Advancing to 2.6 seconds

| Module | Function | What it does |
| --- | --- | --- |
| `cli/ink-studio.js` | `pose(world, 2.6)` | Advances the stateful world from its current clock to 2.6 seconds in steps no larger than 1/60 s. For this fresh render, that is 156 simulation steps. |
| `src/kit/k1-stage.js` | `stage.update(dt, t)` | Runs system updates and painters, writing changed splat positions, colors, and opacity into `world.data`. |
| `demos/labscenes.js` | Watcher controller `update(dt, t)` | Computes the die's pose at each simulation step. |
| `src/kit/k1-stage.js` | `rig.set(...)`, `rig.apply()` | Transform the die and its splat shapes for the current step. |

Watcher uses `K.rig`, which writes the posed splats directly into `world.data`. It does **not** use `K.bones.posed`; that helper is only for bone-driven splats whose GPU pose must be materialized for CPU tools.

## 4. CPU rendering

| Module | Function | What it does |
| --- | --- | --- |
| `cli/ink-studio.js` | `view({ t: 2.6 })` | Builds the render options, including the default 900 × 620 viewport and scene camera. |
| `cli/render.js` | `render(world, options)` | Main software renderer. It derives the art-pixel grid, evaluates splat motion, projects each covariance to a screen ellipse, sorts and blends splats, resolves outlines/lighting, quantizes colors, and returns RGB art pixels. |
| `cli/render.js` | `viewMatrix(...)` | Builds the camera's column-major view matrix. |
| `cli/scene-optics.js` | `cameraRays(...)` | Creates the ray sampler used for per-pixel camera projection and optional optics. |
| `src/airflow.ts` | `Airflow.frame(...)` | Prepares airflow state for splats that carry airflow motion. |
| `src/light-schedule.ts` | `LightSchedule.gain(...)`, `LightSchedule.select(...)` | Computes daylight response and selects scheduled lights affecting the frame. |
| `src/sample-coverage.ts` | `SampleCoverage.amount(...)` | Resolves sample-withdrawal coverage; the default is zero. |
| `src/pixel-look.ts` | `PixelLook.bayerRank(...)` | Supplies the ordered dither offset used before nearest-palette quantization. |

`render()` also calls optional setup helpers: `ArtInk.prepare`, `ArtEffects.prepare`, `ArtStability.prepare`, `ArtPasses.select`, `toneFor`, `createArtPasses`, and `surfaceShading`. The default Watcher world enables none of those looks, passes, or surface layers, so they return null or empty settings and add no extra render pass. Palette selection and dithering then run directly inside `render()`.

The projection, covariance-to-ellipse calculation, depth sorting, alpha blending, outline extraction, and palette search are inline stages of `cli/render.js`'s `render()` rather than separate exported functions.

## 5. Enlargement and PNG output

| Module | Function | What it does |
| --- | --- | --- |
| `cli/render.js` | `upscale(image, px)` | Repeats each art pixel into `px × px` screen pixels using nearest-neighbor enlargement. |
| `cli/ink-studio.js` | `save('watcher.png', image)` | Creates the output directory and chooses `--out` or `studio/out/watcher.png`. |
| `cli/png.js` | `write(file, width, height, rgb)` | Writes an 8-bit RGB PNG. |
| `cli/png.js` | `encode(width, height, pixels)` | Adds PNG scanline filters and compressed `IHDR`/`IDAT`/`IEND` chunks. |

With the default options, the final image is **900 × 620** pixels at `studio/out/watcher.png`. The renderer first draws a smaller art-pixel grid derived from the scene's detail and camera distance, then enlarges it.

## Features not used by this exact command

- `webgl.mjs` and `src/webgl/*`: this is the CPU rendering path.
- `K.bones.posed`: Watcher uses the CPU rig, not GPU bone skinning.
- `--colored`, `--raw`, `--tone`, `--clean`, `--ortho`, `--text`, and `--surface`: none are enabled.
- Planar reflection and atmosphere renderers: Watcher does not supply reflection or atmosphere data.
- `cli/ink-studio.js`'s `asciiFrame()`: only used when `--text` is supplied.
