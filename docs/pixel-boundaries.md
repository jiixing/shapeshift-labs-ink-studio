# Pixel boundaries across a shot

Use the headless clip renderer to decide ambiguous art pixels jointly across a moving shot. The solver reads the posed scene at the native grid and at four subpixel locations per art pixel. It detects silhouettes against empty background, overlaps between named objects or parts, material seams and named light thresholds. A pixel can take a different owner only when a sample inside that pixel sees the alternative. The same choice controls both sides of the shared boundary.

```sh
node cli/ink-studio.js clip examples/pixel-boundaries/warden-key.js \
  --w 152 --h 120 --px 1 --from 0 --to 1.5 --fps 12 --camera-orbit 30.94 \
  --pixel-boundaries examples/pixel-boundaries/warden-plan.json --out warden.png
```

The renderer applies the choices before native palette lookup. Chosen samples carry their color, depth, normal, material and owner together. Pixels protected by authored marks or native cels keep their original samples. Glass, glowing surfaces, and masked palette overlays keep their regular render path. Lighting, objects and pose still come from the scene.

## Settings

- `types` selects any of `silhouette`, `overlap`, `seam` and `light`. Omit it to consider all four.
- `targets` optionally limits work to boundaries that touch any matching scene object, material or part.
- `bands` names light regions. Each band accepts `id`, an optional target `select`, a `threshold` from 0 to 1, and a `channel`. The `key` channel uses the resolved live sun direction and shadow visibility. The `value` channel uses pre-palette luminance when the lighting comes from other sources. With omitted bands, Ink uses a key threshold of 0.42.
- `temporal` balances motion-linked consistency against subpixel evidence. `spatial` penalizes ragged edges and detached diagonal corners. Set either weight to zero to remove its contribution. `steps` controls the number of solver sweeps.
- `constraints` can keep a named light band connected or keep two targets separated. Use `bounds: [x, y, width, height]` in native pixels. An optional `frames: [first, last]` uses inclusive zero-based frame numbers. Keep the bounds close to the feature.

```json
{
  "bands": [
    {"id":"helmet-key","select":{"object":"head","material":"brass"},"threshold":0.64}
  ],
  "constraints": [
    {"id":"highlight","kind":"connected","band":"helmet-key","bounds":[46,6,58,33]},
    {"id":"grip","kind":"gap","between":[{"object":"hand-R"},{"object":"chest"}],"bounds":[67,28,34,39]}
  ]
}
```

The report beside the clip lists changes by frame and motion-linked label switches before and after the solve. A rule is `hidden` when the subpixel evidence lacks a target, `unsupported` when that evidence already shows a contact or disconnected band, and `active` when the geometry supports the rule. Active rule conflicts that remain at the native grid appear in the `after` field.

Ink matches nearby ambiguous pixels by their projected motion and competing owners. It uses dynamic programming to solve those tracks over time, alternating with spatial updates. Each shot has a fixed art grid and 2–96 samples. Use a seekable headless clip with native palette resolve.

## Review in motion

```sh
node examples/pixel-boundaries/warden-review.js warden-review
```

The review contains the original and solved render side by side under the same orbit and moving key. For a custom Node sequence, `renderBoundaryShot({width,height,count,settings,draw,output})` calls `draw(index, options, lane, passes)` to sample each pose, then `output(index, overrides)` to render the chosen native pixels. Merge those options and pass requests into the renderer and use the same pose and camera for each lane. The optional `progress(phase,index)` callback reports sampling and delivery progress.

The temporal approach draws on Kuo, Yang, and Chu's work on optimizing feature lines across neighboring frames. Ink uses the renderer's visible samples and projected motion to build those tracks. [Feature-Aware Pixel Art Animation](https://researchportal.bath.ac.uk/en/publications/feature-aware-pixel-art-animation/)
