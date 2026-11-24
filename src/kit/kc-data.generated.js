// Generated from src/kit/kc-data.ts by npm run build:src. Do not edit.
(function(K) {
  const V = K.V, M = K.M, TAU = Math.PI * 2, DIO = K.diorama = {};
  const ROLES = [
    "stone",
    "dark",
    "pale",
    "earth",
    "wood",
    "moss",
    "leaf",
    "water",
    "metal",
    "bone",
    "ember",
    "glow",
    "accent"
  ];
  DIO.styles = {
    slate: {
      palette: [
        460811,
        1382172,
        2764342,
        4672855,
        7173244,
        10133660,
        13619912,
        2046498,
        3500854,
        6727232,
        11063386,
        3810326,
        6175522,
        9067056,
        12092490,
        8006174,
        13120030,
        16742954,
        16765514,
        16774080,
        1454666,
        2381434,
        4889248,
        11067608,
        4859744,
        8012438,
        11563204,
        6969898,
        11045434,
        14729312
      ],
      roles: {
        stone: [1, 2, 3, 4, 5],
        dark: [1, 1, 2, 3],
        pale: [3, 4, 5, 6],
        earth: [11, 11, 12, 13],
        wood: [11, 12, 13, 14],
        moss: [7, 8, 9, 10],
        leaf: [7, 8, 9, 10],
        water: [20, 21, 22, 23],
        metal: [27, 28, 29, 29],
        bone: [4, 5, 6, 6],
        ember: [15, 16, 17, 18],
        glow: [18, 19],
        accent: [24, 25, 26]
      },
      sun: [-0.5, 0.8, 0.45],
      amb: 0.14,
      sky: 0.26,
      finish: { detail: 14, dither: 0.25 }
    },
    moss: {
      palette: [725268, 1848870, 3500854, 8566098, 14676164, 4853018, 11345718, 16737396],
      roles: {
        stone: [1, 2, 3, 4],
        dark: [0, 1, 1, 2],
        pale: [3, 4, 4],
        earth: [1, 1, 2],
        wood: [1, 2, 2, 3],
        moss: [1, 2, 3],
        leaf: [2, 3, 4],
        water: [5, 5, 6],
        metal: [2, 3, 4],
        bone: [3, 4, 4],
        ember: [5, 6, 7],
        glow: [7, 4],
        accent: [5, 6, 7]
      },
      sun: [-0.45, 0.75, 0.5],
      amb: 0.16,
      sky: 0.3,
      finish: { detail: 12, dither: 0.35 }
    },
    ember: {
      palette: [
        788232,
        1970710,
        3678250,
        5911616,
        8802906,
        12094080,
        15124648,
        2761750,
        4867104,
        8023596,
        4854808,
        10234404,
        15103790,
        16761418,
        16772784,
        1712696,
        2899038,
        5400716,
        9086656,
        6961682,
        11037218,
        14722624
      ],
      roles: {
        stone: [1, 2, 3, 4, 5],
        dark: [1, 1, 2],
        pale: [4, 5, 6],
        earth: [1, 2, 7, 8],
        wood: [2, 19, 19, 20],
        moss: [7, 8, 9],
        leaf: [8, 9, 21],
        water: [15, 16, 17, 18],
        metal: [19, 20, 21, 21],
        bone: [5, 6, 6],
        ember: [10, 11, 12, 13],
        glow: [13, 14],
        accent: [16, 17, 18]
      },
      sun: [-0.7, 0.45, 0.4],
      amb: 0.12,
      sky: 0.2,
      finish: { detail: 14, dither: 0.3 }
    }
  };
  const COMMON = {
    id: "str",
    mat: "mat",
    res: "pos",
    part: "str",
    group: "str",
    carve: "bool",
    ghost: "bool",
    separate: "bool",
    turn: "vec3",
    bump: "vec2",
    hold: "bool"
  };
  DIO.kinds = {
    ground: { need: {}, may: { rad: "pos", stretch: "pos" } },
    ball: { need: { at: "vec3", r: "num|vec3" } },
    rock: { need: { at: "vec3", r: "num|vec3" } },
    box: { need: { at: "vec3", half: "vec3" }, may: { round: "num" } },
    lathe: { need: { at: "vec3", h: "pos", r: "num|vec2|profile" } },
    torus: { need: { at: "vec3", R: "pos", r: "pos" } },
    tube: { need: { pts: "pts", r: "num|vec2" } },
    regular: { need: { shape: ["d4", "d6", "d8", "d12", "d20"], at: "vec3", r: "pos" }, may: { round: "num" } },
    extrude: { need: { outline: "outline", at: "vec3", depth: "pos" }, may: { round: "num" } },
    revolve: { need: { outline: "outline", at: "vec3" } },
    puff: { need: { outline: "outline", at: "vec3", height: "pos" } },
    mesh: {
      need: { asset: "str" },
      may: { size: "pos", at: "vec3", spin: "num", cells: "pos", thick: "num", up: ["y", "z"], hues: "pos" }
    },
    join: { need: { how: "join", a: "solid", b: "solid" }, may: { size: "num", steps: "pos" } },
    fold: {
      need: { of: "solid" },
      may: { polar: "pos", mirror: ["x", "y", "z"], repeat: "vec3", count: "vec3", centre: "vec3", axis: "vec3" }
    },
    warp: { need: { of: "solid" }, may: { twist: "num", bend: "num", taper: "num", centre: "vec3", wide: "pos" } },
    shell: { need: { of: "solid", t: "pos" } },
    swell: { need: { of: "solid", by: "num" } },
    rough: { need: { of: "solid", by: "pos" }, may: { scale: "pos" } },
    bubbles: { need: { of: "solid" }, may: { cell: "pos", h: "pos" } },
    pillar: { need: { at: "vec3", h: "pos" }, may: { r: "pos", bay: "pos", flutes: "num" } },
    arch: {
      need: { at: "vec3" },
      may: { span: "pos", height: "pos", depth: "pos", thick: "pos", block: "pos", face: "vec2" }
    },
    stairs: { need: { at: "vec3", dir: "vec3", rise: "pos" }, may: { width: "pos", riser: "pos", tread: "pos" } },
    fence: { need: { a: "vec3", b: "vec3" }, may: { h: "pos", bay: "pos", pickets: "num" } },
    pipe: { need: { pts: "pts" }, may: { r: "pos", wall: "pos", collar: "pos" } }
  };
  const MOTION = {
    turn: {
      need: { part: "str" },
      may: { axis: "vec3", amount: "num", period: "pos", phase: "num", keys: "list", loop: "pos" }
    },
    spin: { need: { part: "str" }, may: { axis: "vec3", speed: "num" } },
    bob: {
      need: { part: "str" },
      may: { axis: "vec3", amount: "num", period: "pos", phase: "num", keys: "list", loop: "pos" }
    },
    squash: {
      need: { part: "str" },
      may: { axis: "vec3", amount: "num", period: "pos", phase: "num", keys: "list", loop: "pos" }
    }
  };
  const EFFECT = {
    lamp: { need: { at: "vec3" }, may: { r: "pos", strength: "pos", flicker: "num", follow: "str" } },
    reveal: { need: {}, may: { dur: "pos", block: "pos" } },
    dust: { need: { at: "vec3" }, may: { every: "pos", n: "pos", colours: "mat", spread: "pos" } },
    embers: { need: { at: "vec3" }, may: { every: "pos", n: "pos", colours: "mat" } },
    smoke: { need: { at: "vec3" }, may: { every: "pos", n: "pos", colours: "mat" } },
    sparks: { need: { at: "vec3" }, may: { every: "pos", n: "pos", colours: "mat", dir: "vec3", speed: "pos" } },
    rain: { need: { box: "box" }, may: { rate: "pos", colours: "mat" } },
    wind: { need: { v: "vec3" }, may: { swirl: "num" } }
  };
  const TOP = {
    id: "str",
    name: "str",
    blurb: "str",
    seed: "num",
    style: "style",
    palette: "list",
    roles: "obj",
    camera: "obj",
    light: "obj",
    finish: "obj",
    groups: "obj",
    parts: "obj",
    solids: "list",
    motion: "list",
    effects: "list",
    tap: "obj",
    spare: "pos"
  };
  const isNum = (v) => typeof v === "number" && Number.isFinite(v), isVec = (v, n) => Array.isArray(v) && v.length === n && v.every(isNum);
  const lev = (a, b) => {
    const d = [];
    for (let i = 0; i <= a.length; i++) {
      d[i] = [i];
      for (let j = 1; j <= b.length; j++)
        d[i][j] = i === 0 ? j : Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    return d[a.length][b.length];
  };
  const nearest = (word, list) => {
    let best = null, bd = 3;
    for (const w of list) {
      const d = lev(String(word), w);
      if (d < bd) {
        bd = d;
        best = w;
      }
    }
    return best;
  };
  const styleOf = (spec) => {
    const s = spec.style === void 0 ? "slate" : spec.style, base = typeof s === "string" ? DIO.styles[s] : s && s.extends ? DIO.styles[s.extends] : s;
    if (!base) return null;
    const own = typeof s === "object" ? s : {}, out = {
      palette: (spec.palette || own.palette || base.palette).slice(),
      roles: Object.assign({}, base.roles, own.roles, spec.roles),
      sun: own.sun || base.sun || [-0.5, 0.8, 0.45],
      amb: own.amb !== void 0 ? own.amb : base.amb,
      sky: own.sky !== void 0 ? own.sky : base.sky,
      finish: Object.assign({}, base.finish, own.finish, spec.finish)
    };
    if (spec.light) {
      if (spec.light.sun) out.sun = spec.light.sun;
      if (spec.light.amb !== void 0) out.amb = spec.light.amb;
      if (spec.light.sky !== void 0) out.sky = spec.light.sky;
    }
    return out;
  };
  function applySurface(material, definition) {
    if (typeof definition === "string") return K.surface.preset(definition, material);
    if (!definition || typeof definition !== "object" || Array.isArray(definition))
      throw new TypeError("A surface is a preset name or a settings object");
    const { preset, ...settings } = definition;
    return preset === void 0 ? K.surface.material(material, settings) : K.surface.preset(preset, material, settings);
  }
  DIO.check = (spec, env) => {
    const out = [], bad = (path, problem, hint) => out.push({ level: "error", path, problem, hint: hint || "" }), warn = (path, problem, hint) => out.push({ level: "warning", path, problem, hint: hint || "" });
    if (!spec || typeof spec !== "object" || Array.isArray(spec)) {
      bad("", "a diorama is an object", 'start with { "id": ..., "solids": [ ... ] }');
      return out;
    }
    const keys = (o, path, allowed) => {
      for (const k of Object.keys(o))
        if (!(k in allowed)) {
          const n = nearest(k, Object.keys(allowed));
          bad(
            path + (path ? "." : "") + k,
            'nothing is called "' + k + '" here',
            n ? 'did you mean "' + n + '"?' : "what may be written: " + Object.keys(allowed).join(", ")
          );
        }
    };
    keys(spec, "", TOP);
    if (typeof spec.id !== "string" || !/^[a-z0-9-]+$/.test(spec.id))
      bad("id", "a diorama needs an id of small letters, digits and dashes", 'for example "old-shrine"');
    const st = styleOf(spec);
    if (!st) {
      bad("style", 'there is no style called "' + spec.style + '"', "styles: " + Object.keys(DIO.styles).join(", "));
      return out;
    }
    let surfaceEffects;
    if (st.finish.surfaceEffects !== void 0) {
      try {
        surfaceEffects = K.splatEffects.context(st.finish.surfaceEffects);
      } catch (error) {
        bad("finish.surfaceEffects", error.message);
      }
    }
    const look = st.finish.look;
    if (look?.pixelSize !== void 0 && (!Number.isSafeInteger(look.pixelSize) || look.pixelSize < 1))
      bad("finish.look.pixelSize", "pixelSize must be a positive integer");
    try {
      ArtInk.prepare(look?.ink, st.palette);
    } catch (error) {
      bad("finish.look.ink", error.message);
    }
    try {
      ArtEffects.prepare(look?.effects, st.palette);
    } catch (error) {
      bad("finish.look.effects", error.message);
    }
    try {
      ArtStability.prepare(look?.stable);
    } catch (error) {
      bad("finish.look.stable", error.message);
    }
    try {
      PixelLook.toneSettings(look?.tone);
    } catch (error) {
      bad("finish.look.tone", error.message);
    }
    if (spec.light?.surfaceDirection !== void 0)
      try {
        SurfaceLook.prepareLightTrack(spec.light.surfaceDirection);
      } catch (error) {
        bad("light.surfaceDirection", error.message);
      }
    const pal = st.palette;
    if (!Array.isArray(pal) || pal.length < 2 || !pal.every(isNum))
      bad(
        "palette",
        "a palette is a list of colours as numbers",
        "for example [460811, 1382172, ...] (or 0x07080b in a .js file)"
      );
    else if (pal.length > 48)
      bad(
        "palette",
        "a palette holds 48 colours at most; this has " + pal.length,
        "the picture is reduced to the palette by a shader that takes 48"
      );
    for (const [name, ramp] of Object.entries(st.roles)) {
      if (!Array.isArray(ramp) || !ramp.length)
        bad("roles." + name, "a role is a list of palette numbers, dark to light");
      else
        for (const i of ramp)
          if (!Number.isInteger(i) || i < 0 || i >= pal.length)
            bad("roles." + name, "colour " + i + " is not in the palette (0 to " + (pal.length - 1) + ")");
    }
    const roleNames = Object.keys(st.roles), ids = /* @__PURE__ */ new Set(), parts = /* @__PURE__ */ new Set(), groups = spec.groups || {}, assets = env && env.assets || {};
    const matOk = (m, path) => {
      if (m === void 0) return;
      const role = typeof m === "string" ? m : m && m.role;
      if (m && typeof m === "object") {
        keys(m, path, { role: 1, ramp: 1, noise: 1, scale: 1, glow: 1, over: 1, surface: 1, model: 1 });
        if (m.model !== void 0) {
          const q = m.model, at = path + ".model", channels = { color: 1, emission: 1, roughness: 1, metallic: 1 };
          if (!q || typeof q !== "object" || Array.isArray(q)) bad(at, "model material channels need an object");
          else {
            keys(q, at, channels);
            for (const [channel, value] of Object.entries(q)) {
              const valid = channel === "color" || channel === "emission" ? isVec(value, 3) && value.every((v) => v >= 0 && (channel === "emission" || v <= 1)) : isNum(value) && value >= 0 && value <= 1;
              if (!valid) bad(at + "." + channel, "invalid model material channel");
            }
          }
        }
        if (m.surface !== void 0) {
          try {
            K.surface.prepare(
              applySurface({}, m.surface).surface,
              pal,
              st.sun,
              surfaceEffects
            );
          } catch (error) {
            bad(path + ".surface", error.message);
          }
        }
        if (m.ramp) {
          if (!Array.isArray(m.ramp) || m.ramp.some((i) => !Number.isInteger(i) || i < 0 || i >= pal.length))
            bad(path + ".ramp", "a ramp is a list of palette numbers (0 to " + (pal.length - 1) + ")");
          return;
        }
        if (m.over) matOk(m.over.role, path + ".over.role");
      }
      if (typeof role !== "string")
        bad(path, 'a material is a role name, or { "role": name, ... }', "roles: " + roleNames.join(", "));
      else if (!st.roles[role]) {
        const n = nearest(role, roleNames);
        bad(
          path,
          'no role called "' + role + '" in this style',
          n ? 'did you mean "' + n + '"?' : "roles: " + roleNames.join(", ")
        );
      }
    };
    const outlineOk = (o, path) => {
      if (!o || typeof o !== "object")
        return bad(
          path,
          'an outline is { "svg": path } or { "ngon": sides, "r": size } or { "star": points, "r": outer, "inner": inner } or { "rect": [w, h] } or { "gear": teeth, "r": size }'
        );
      const k = ["svg", "ngon", "star", "rect", "gear"].filter((q) => q in o);
      if (k.length !== 1) bad(path, "an outline is one of svg, ngon, star, rect, gear");
      if (o.svg !== void 0 && typeof o.svg !== "string")
        bad(path + ".svg", 'the path is text, as in an SVG file ("M0 0 L10 0 ...")');
    };
    const typeOk = (v, type, path) => {
      if (Array.isArray(type)) {
        if (!type.includes(v))
          bad(path, '"' + v + '" is not one of the choices', "choices: " + type.join(", "));
        return;
      }
      const alts = type.split("|"), one = (t) => t === "num" ? isNum(v) : t === "pos" ? isNum(v) && v > 0 : t === "vec3" ? isVec(v, 3) : t === "vec2" ? isVec(v, 2) : t === "str" ? typeof v === "string" : t === "bool" ? typeof v === "boolean" : t === "list" ? Array.isArray(v) : t === "obj" ? v && typeof v === "object" : t === "pts" ? Array.isArray(v) && v.length >= 2 && v.every((p) => isVec(p, 3)) : t === "profile" ? Array.isArray(v) && v.length >= 2 && v.every((p) => isVec(p, 2)) : t === "box" ? Array.isArray(v) && v.length === 2 && v.every((p) => isVec(p, 3)) : null;
      if (type === "mat") return matOk(v, path);
      if (type === "solid") return solidOk(v, path, true);
      if (type === "outline") return outlineOk(v, path);
      if (type === "join") {
        if (!K.sdf.JOIN[v]) {
          const n = nearest(v, Object.keys(K.sdf.JOIN));
          bad(
            path,
            'no way of joining called "' + v + '"',
            n ? 'did you mean "' + n + '"?' : "ways: " + Object.keys(K.sdf.JOIN).join(", ")
          );
        }
        return;
      }
      if (!alts.some(one))
        bad(
          path,
          "this should be " + alts.map(
            (t) => ({
              num: "a number",
              pos: "a number above 0",
              vec3: "three numbers [x, y, z]",
              vec2: "two numbers",
              str: "text",
              bool: "true or false",
              list: "a list",
              obj: "an object",
              pts: "a list of two or more [x, y, z] points",
              profile: "a list of [height 0..1, radius] pairs",
              box: "two corners [[x, y, z], [x, y, z]]"
            })[t]
          ).join(" or "),
          "it is " + JSON.stringify(v)
        );
    };
    const fields = (o, path, def, extra) => {
      const all = Object.assign({ kind: 1, do: 1 }, extra, def.need, def.may);
      keys(o, path, all);
      for (const [k, t] of Object.entries(def.need))
        if (o[k] === void 0)
          bad(
            path + "." + k,
            "missing",
            "a " + (o.kind || o.do) + " needs: " + Object.keys(def.need).join(", ")
          );
      for (const [k, t] of Object.entries(Object.assign({}, extra, def.need, def.may)))
        if (o[k] !== void 0 && t !== 1) typeOk(o[k], t, path + "." + k);
    };
    let area = 0;
    const res0 = st.finish.res || 0.09;
    function solidOk(s, path, inner) {
      if (!s || typeof s !== "object")
        return bad(path, 'a solid is an object with a "kind"', "kinds: " + Object.keys(DIO.kinds).join(", "));
      const def = DIO.kinds[s.kind];
      if (!def) {
        const n = nearest(s.kind, Object.keys(DIO.kinds));
        return bad(
          path + ".kind",
          'no kind of solid called "' + s.kind + '"',
          n ? 'did you mean "' + n + '"?' : "kinds: " + Object.keys(DIO.kinds).join(", ")
        );
      }
      fields(s, path, def, COMMON);
      if (s.id !== void 0) {
        if (ids.has(s.id)) bad(path + ".id", 'two solids are called "' + s.id + '"');
        ids.add(s.id);
      }
      if (s.part && !inner) parts.add(s.part);
      if (s.part && inner)
        bad(path + ".part", "a solid inside another cannot be a part of its own", 'put "part" on the outer one');
      if (s.group !== void 0 && !groups[s.group])
        bad(
          path + ".group",
          'no group called "' + s.group + '"',
          'groups are declared at the top: "groups": { "' + s.group + '": { "blend": 0.2 } }'
        );
      if (s.carve && s.part) bad(path, "a carving cannot be a moving part");
      if (s.separate && (!["ball", "torus"].includes(s.kind) || s.carve || s.group || s.hold || inner))
        bad(path + ".separate", "separate model geometry needs an independent ball or torus");
      if (s.kind === "mesh" && typeof s.asset === "string" && !assets[s.asset])
        bad(
          path + ".asset",
          'no mesh called "' + s.asset + '" was handed in',
          Object.keys(assets).length ? "meshes: " + Object.keys(assets).join(", ") : 'pass { assets: { "' + s.asset + '": mesh } } when building'
        );
      if (s.kind === "warp" && s.twist === void 0 && s.bend === void 0 && s.taper === void 0)
        bad(path, "a warp needs one of twist, bend, taper");
      if (s.kind === "fold" && s.polar === void 0 && s.mirror === void 0 && s.repeat === void 0)
        bad(path, "a fold needs one of polar, mirror, repeat");
      if (s.res !== void 0 && isNum(s.res) && s.res < 0.03)
        warn(
          path + ".res",
          "a grain of " + s.res + " is very fine",
          "most solids want 0.06 to 0.15; the count goes up with the square"
        );
      const r = isNum(s.r) ? s.r : isVec(s.r, 3) ? Math.max(...s.r) : isVec(s.half, 3) ? Math.hypot(...s.half) : s.kind === "ground" ? (s.rad || 8) * 0.56 : 1, g = isNum(s.res) ? s.res : res0;
      if (!inner && !s.carve) area += 12.6 * r * r / (g * g);
    }
    if (!Array.isArray(spec.solids) || !spec.solids.length)
      bad(
        "solids",
        "a diorama needs a list of solids",
        'for example [{ "kind": "ground", "mat": "earth" }, { "kind": "ball", "at": [0, 1, 0], "r": 1, "mat": "stone" }]'
      );
    else spec.solids.forEach((s, i) => solidOk(s, "solids[" + i + "]"));
    for (const [g, v] of Object.entries(groups))
      if (!v || !isNum(v.blend))
        bad("groups." + g, "a group says how far its members melt into each other", '{ "blend": 0.2 }');
    for (const [p, v] of Object.entries(spec.parts || {})) {
      if (!parts.has(p))
        bad(
          "parts." + p,
          'no solid is marked as part "' + p + '"',
          parts.size ? "parts: " + [...parts].join(", ") : 'mark a solid with "part": "' + p + '"'
        );
      if (v.joint !== void 0 && !isVec(v.joint, 3)) bad("parts." + p + ".joint", "a joint is a point [x, y, z]");
      if (v.parent !== void 0 && !parts.has(v.parent))
        bad("parts." + p + ".parent", 'no part called "' + v.parent + '"');
      if (v.parent === p) bad("parts." + p + ".parent", "a part cannot hang from itself");
      keys(v, "parts." + p, { joint: 1, parent: 1 });
    }
    const listOf = (name, table) => {
      const l = spec[name];
      if (l === void 0) return;
      if (!Array.isArray(l)) return bad(name, "this is a list");
      l.forEach((m, i) => {
        const path = name + "[" + i + "]", def = m && table[m.do];
        if (!def)
          return bad(
            path + ".do",
            'nothing called "' + (m && m.do) + '" to do here',
            "choices: " + Object.keys(table).join(", ")
          );
        fields(m, path, def);
        for (const k of ["part", "follow"])
          if (typeof m[k] === "string" && !parts.has(m[k])) {
            const n = nearest(m[k], [...parts]);
            bad(
              path + "." + k,
              'no part called "' + m[k] + '"',
              n ? 'did you mean "' + n + '"?' : parts.size ? "parts: " + [...parts].join(", ") : 'mark a solid with "part": "' + m[k] + '"'
            );
          }
        if (m.keys !== void 0 && (!m.loop || !Array.isArray(m.keys) || m.keys.filter(isNum).length < 4))
          bad(
            path + ".keys",
            'keys are times and values in turn, with "loop" saying how long before they repeat',
            '"keys": [0, 0, 1, 0.5, 2, 0], "loop": 2'
          );
      });
    };
    listOf("motion", MOTION);
    listOf("effects", EFFECT);
    if (spec.tap !== void 0) {
      keys(spec.tap, "tap", { do: 1, colours: 1, n: 1 });
      if (!["dust", "sparks", "embers"].includes(spec.tap.do)) bad("tap.do", "a tap can raise dust, sparks or embers");
      matOk(spec.tap.colours, "tap.colours");
    }
    if (spec.camera) {
      keys(spec.camera, "camera", { target: 1, dist: 1, pitch: 1, yaw: 1, sway: 1 });
      if (spec.camera.target !== void 0 && !isVec(spec.camera.target, 3))
        bad("camera.target", "three numbers [x, y, z]");
    }
    if (area > 15e4)
      warn(
        "solids",
        "about " + Math.round(area / 1e3) + ",000 splats by a rough count: heavy on a phone",
        'coarser "res" on the big solids brings it down fastest'
      );
    return out;
  };
  DIO.report = (list) => list.map(
    (p) => (p.level === "error" ? "error    " : "warning  ") + (p.path || "(the whole thing)") + ": " + p.problem + (p.hint ? "\n           " + p.hint : "")
  ).join("\n");
  function partMotion(B, rig, order, joint, PI, motion) {
    const wave = (m, t) => m.keys ? K.kf(t % m.loop, m.keys) : (m.amount === void 0 ? 0.3 : m.amount) * Math.sin(TAU * (t / (m.period || 3) + (m.phase || 0)));
    return (t) => {
      for (const p of order) {
        let A = M.id(), off = [0, 0, 0];
        for (const m of motion) {
          if (m.part !== p) continue;
          const ax = B.norm(m.axis || [0, 1, 0]);
          if (m.do === "turn") A = M.mul(M.rot(ax, wave(m, t)), A);
          else if (m.do === "spin") A = M.mul(M.rot(ax, (m.speed === void 0 ? 1 : m.speed) * t), A);
          else if (m.do === "bob") off = V.mad(off, ax, wave(m, t));
          else if (m.do === "squash") A = M.mul(M.stretch(ax, 1 + wave(m, t), true), A);
        }
        const j = joint[p];
        if (PI[p] && PI[p].parent) {
          rig.child(p, PI[p].parent, A, j);
        } else rig.set(p, A, j, V.add(j, off));
      }
    };
  }
  DIO.build = (spec, env, modelOptions) => {
    env = env || {};
    const problems = DIO.check(spec, env), errs = problems.filter((p) => p.level === "error");
    if (errs.length) {
      const e = new Error(
        'diorama "' + (spec && spec.id) + '" has ' + errs.length + " mistake" + (errs.length > 1 ? "s" : "") + ":\n" + DIO.report(errs)
      );
      e.problems = problems;
      throw e;
    }
    const st0 = styleOf(spec), seed = spec.seed === void 0 ? 1 : spec.seed, effects = spec.effects || [], motion = spec.motion || [], lamps = effects.filter((e) => e.do === "lamp"), loose = effects.some((e) => ["dust", "embers", "smoke", "sparks", "rain"].includes(e.do)) || !!spec.tap;
    let pal = st0.palette;
    const meshLooks = {};
    for (const s of spec.solids)
      if (s.kind === "mesh" && s.mat === void 0) {
        const mesh = K.mesh.fit(env.assets[s.asset], {
          size: s.size || 4,
          at: s.at,
          turn: s.spin,
          up: s.up
        });
        meshLooks[s.asset] = { mesh, look: K.mesh.look(mesh, { hues: s.hues || 5, pal }) };
      }
    const B = (env.makeBuilder || makeBuilder)(seed, pal);
    let S, grp;
    function startSculpt() {
      S = K.sculpt((env.makeSculpt || makeSculpt)(B));
      S.sun = B.norm(st0.sun);
      if (st0.finish.look?.pixel) S.pixel = true;
      if (st0.amb !== void 0) S.amb = st0.amb;
      if (st0.sky !== void 0) S.sky = st0.sky;
      if (st0.finish.res) S.res = st0.finish.res;
      grp = {};
      for (const [g, v] of Object.entries(spec.groups || {})) grp[g] = S.grp(v.blend);
    }
    startSculpt();
    const rig = modelOptions ? null : K.rig(B, S), cap = !modelOptions && lamps.length ? K.light.capture(B, S) : null;
    const ramp = (m) => typeof m === "string" ? st0.roles[m] : m.ramp || st0.roles[m.role], matOf = (m) => {
      if (m === void 0) m = "stone";
      const r = ramp(m), out = { r };
      if (typeof m === "object") {
        const sc = m.scale || 0.7;
        if (m.noise) out.mod = (x, y, z) => m.noise * (B.n3(x * sc, y * sc, z * sc) - 0.5);
        if (m.glow) out.em = true;
        if (m.model) out.model = m.model;
        if (m.over) {
          const r2 = ramp(m.over.role), above = m.over.above === void 0 ? 0.55 : m.over.above, patch = m.over.patch === void 0 ? 0.5 : m.over.patch;
          out.tex = (x, y, z, ny, t) => ny > above && B.n3(x * 0.9 + 3, y * 0.9, z * 0.9 + 7) > 1 - patch ? r2[K.clamp(Math.floor(t * r2.length), 0, r2.length - 1)] : void 0;
        }
        if (m.surface !== void 0) return applySurface(out, m.surface);
      }
      return out;
    };
    const outline = (o) => o.svg !== void 0 ? K.poly2.svg(o.svg, o.size || 2) : o.ngon !== void 0 ? K.poly2.ngon(o.ngon, o.r || 1) : o.star !== void 0 ? K.poly2.star(o.star, o.r || 1, o.inner || (o.r || 1) * 0.5) : o.gear !== void 0 ? K.poly2.gear(o.gear, o.r || 1, o.depth || (o.r || 1) * 0.2) : K.poly2.rect(o.rect[0], o.rect[1]);
    const made = {}, make = (s, held) => {
      const o = { res: s.res };
      if (s.res === void 0) delete o.res;
      if (s.part) {
        o.tag = s.part;
        o.whole = true;
      }
      if (s.group) Object.assign(o, grp[s.group]);
      if (s.carve) o.neg = true;
      if (s.ghost) o.ghost = true;
      if (s.separate) o.model = { separate: true, name: s.id ?? s.part ?? s.kind };
      if (s.bump) o.bump = s.bump;
      if (held || s.hold) o.hold = true;
      if (s.turn) o.ax = B.frame(s.turn[0], s.turn[1], s.turn[2]);
      const m = matOf(s.mat), sub = (q) => make(q, true), k = s.kind;
      let p;
      if (k === "ground") p = S.ground(m, Object.assign({ rad: s.rad || 8 }, s.stretch ? { zs: s.stretch } : {}, o));
      else if (k === "ball") p = S.ball(s.at, s.r, m, o);
      else if (k === "rock") p = S.rock(s.at, s.r, m, o);
      else if (k === "box") p = S.box(s.at, s.half, m, Object.assign(s.round ? { rd: s.round } : {}, o));
      else if (k === "lathe")
        p = S.lathe(
          s.at,
          s.h,
          Array.isArray(s.r) && Array.isArray(s.r[0]) ? (t) => K.kf(t, s.r.flat()) : s.r,
          m,
          o
        );
      else if (k === "torus") p = S.torus(s.at, s.R, s.r, m, o);
      else if (k === "tube")
        p = S.tube(s.pts, Array.isArray(s.r) ? s.r[0] : s.r, Array.isArray(s.r) ? s.r[1] : s.r, m, o);
      else if (k === "regular")
        p = S.regular(s.shape, s.at, s.r, m, Object.assign(s.round ? { rd: s.round } : {}, o));
      else if (k === "extrude")
        p = S.extrude(
          outline(s.outline),
          s.at,
          s.depth,
          m,
          Object.assign(s.round ? { rd: s.round } : {}, o)
        );
      else if (k === "revolve") p = S.revolve(outline(s.outline), s.at, m, o);
      else if (k === "puff") p = S.puff(outline(s.outline), s.at, s.height, m, o);
      else if (k === "mesh") {
        const ml = meshLooks[s.asset] || {
          mesh: K.mesh.fit(env.assets[s.asset], { size: s.size || 4, at: s.at, turn: s.spin, up: s.up })
        };
        p = S.mesh(ml.mesh, s.mat === void 0 ? ml.look : m, Object.assign({ cells: s.cells, thick: s.thick }, o));
      } else if (k === "join")
        p = S.join(
          s.how,
          sub(s.a),
          sub(s.b),
          Object.assign({ r: s.size, n: s.steps }, o)
        );
      else if (k === "fold")
        p = S.fold(
          sub(s.of),
          s.polar ? { polar: s.polar, c: s.centre || [0, 0, 0], axis: s.axis } : s.mirror ? { mirror: s.mirror, c: s.centre || [0, 0, 0] } : { repeat: s.repeat, count: s.count || [1, 1, 1] },
          o
        );
      else if (k === "warp")
        p = S.warp(
          sub(s.of),
          Object.assign(
            { c: s.centre || [0, 0, 0] },
            s.twist !== void 0 ? { twist: s.twist } : s.bend !== void 0 ? { bend: s.bend } : { taper: s.taper },
            s.wide ? { wide: s.wide } : {}
          ),
          o
        );
      else if (k === "shell") p = S.shell(sub(s.of), s.t, o);
      else if (k === "swell") p = S.swell(sub(s.of), s.by, o);
      else if (k === "rough") {
        const sc = s.scale || 1.5;
        p = S.rough(
          sub(s.of),
          (x, y, z) => B.n3(x * sc, y * sc, z * sc) - 0.5,
          s.by,
          o
        );
      } else if (k === "bubbles")
        p = S.bubbles(sub(s.of), Object.assign({ cell: s.cell || 0.5, h: s.h || 0.12 }, o));
      else {
        const mats = { stone: m, post: m, rail: m, metal: m }, oo = Object.assign({}, s, { mats, tag: s.part, res: s.res });
        p = k === "pillar" ? K.build.pillar(S, s.at, s.h, oo) : k === "arch" ? K.build.arch(S, s.at, oo) : k === "stairs" ? K.build.stairs(S, s.at, s.dir, s.rise, oo) : k === "fence" ? K.build.fence(S, s.a, s.b, oo) : K.build.pipe(S, s.pts, oo);
      }
      if (s.id) made[s.id] = p;
      return p;
    };
    if (modelOptions) {
      let place = function(name) {
        if (visiting.has(name)) throw new Error("Scene rig has a parent cycle at " + name);
        if (names.includes(name)) return;
        visiting.add(name);
        if (parts[name]?.parent) {
          if (!groups.has(parts[name].parent))
            throw new Error("Missing export geometry for part " + parts[name].parent);
          place(parts[name].parent);
        }
        names.push(name);
        visiting.delete(name);
      };
      const groups = /* @__PURE__ */ new Map(), meshes = [];
      const { duration = 4, fps = 30, resolution, method, bounds, targetTriangles } = modelOptions;
      for (const solid of spec.solids) {
        if (solid.kind === "ground" || solid.ghost && !solid.separate) continue;
        const name = solid.part || null;
        if (!groups.has(name)) groups.set(name, []);
        groups.get(name).push(solid);
      }
      if (!groups.size) throw new Error("The diorama contains no finite model geometry");
      const parts = spec.parts || {}, names = [], visiting = /* @__PURE__ */ new Set();
      for (const name of groups.keys()) if (name !== null) place(name);
      const { rig: previewRig } = names.length ? DIO.build(spec, env).lab : {};
      const joints = [], joint2 = {};
      for (const name of [null, ...names]) {
        if (!groups.has(name)) continue;
        startSculpt();
        for (const solid of groups.get(name)) make(solid);
        let detail = name === null ? resolution ?? 0.08 : Math.min(resolution ?? 0.08, ...groups.get(name).map((solid) => solid.res ?? Infinity));
        const hasBody = groups.get(name).some((solid) => !solid.separate && !solid.carve);
        const restBounds = (name === null ? bounds : void 0) ?? (hasBody ? S.modelBounds(detail * 2) : void 0);
        if (resolution === void 0 && name === null && restBounds) {
          const volume = restBounds.max.reduce((v, high, i) => v * (high - restBounds.min[i]), 1);
          detail = Math.max(detail, Math.cbrt(volume / 4e5));
        }
        const mesh = K.model.fromSculpt(S, {
          name: name ?? spec.id,
          palette: pal,
          resolution: detail,
          method,
          bounds: restBounds,
          targetTriangles
        });
        if (name === null)
          meshes.push(...K.model.mapModelMeshes(mesh, (part) => ({ ...part, static: true })));
        else {
          const index = joints.length, box = previewRig.box(name);
          joint2[name] = parts[name]?.joint || (box ? [(box.lo[0] + box.hi[0]) * 0.5, box.lo[1], (box.lo[2] + box.hi[2]) * 0.5] : mesh.points[0]);
          joints.push({
            name,
            parent: parts[name]?.parent ? names.indexOf(parts[name].parent) : null,
            head: joint2[name],
            tail: V.mad(joint2[name], [0, 1, 0], box ? Math.max(0.05, box.hi[1] - box.lo[1]) : 0.1)
          });
          meshes.push(
            ...K.model.mapModelMeshes(mesh, (part) => ({
              ...part,
              weights: part.points.map(() => [[index, 1]])
            }))
          );
        }
      }
      const animations = motion.length ? K.model.sampleClips(
        [{ name: "Scene motion", duration, fps, pose: partMotion(B, previewRig, names, joint2, parts, motion) }],
        (pose, time) => {
          pose(time);
          return names.map((name) => {
            const index = previewRig.names.indexOf(name);
            if (index < 0) throw new Error("Splat rig has no part " + name);
            return Array.from(previewRig.M.slice(index * 12, index * 12 + 12));
          });
        }
      ) : [];
      return { meshes, joints, animations };
    }
    for (const s of spec.solids) if (!s.part) make(s);
    S.bake();
    const moving = spec.solids.filter((s) => s.part);
    if (moving.length) {
      for (const s of moving) make(s);
      S.bake();
    }
    const pool = loose ? K.pool(B, spec.spare || 600) : null, lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
    for (const s of spec.solids)
      if (s.at && s.kind !== "ground")
        for (let a = 0; a < 3; a++) {
          lo[a] = Math.min(lo[a], s.at[a]);
          hi[a] = Math.max(hi[a], s.at[a]);
        }
    const cam = Object.assign(
      {
        target: lo[0] > 1e8 ? [0, 1.5, 0] : [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2 + 0.5, (lo[2] + hi[2]) / 2],
        dist: 16,
        pitch: 0.16,
        yaw: 0.4,
        sway: 0.3
      },
      spec.camera
    );
    const W = B.finish(
      Object.assign(
        { cam, detail: 14, palName: typeof spec.style === "string" ? spec.style : "Data", dither: 0.25, radius: 9 },
        st0.finish,
        { made, spec, ...spec.light?.surfaceDirection !== void 0 && { surfaceLight: spec.light.surfaceDirection } }
      )
    );
    if (!moving.length && !effects.length && !spec.tap) return W;
    const st = K.stage(W);
    rig.bind(st);
    const partNames = [...new Set(moving.map((s) => s.part))], PI = spec.parts || {}, joint = {};
    for (const p of partNames) {
      const bx = rig.box(p), j = PI[p] && PI[p].joint;
      joint[p] = j || (bx ? [(bx.lo[0] + bx.hi[0]) / 2, bx.lo[1], (bx.lo[2] + bx.hi[2]) / 2] : [0, 0, 0]);
    }
    const order = partNames.slice().sort((a, b) => {
      const depth = (p) => {
        let d = 0;
        while (PI[p] && PI[p].parent && d < 20) {
          p = PI[p].parent;
          d++;
        }
        return d;
      };
      return depth(a) - depth(b);
    });
    const poseParts = partMotion(B, rig, order, joint, PI, motion);
    if (partNames.length)
      st.add({
        update(dt, t) {
          poseParts(t);
          rig.apply();
        }
      });
    let lit = null;
    if (lamps.length) {
      const L = lamps.map((e) => ({ p: e.at.slice(), r: e.r || 6, s: e.strength || 0.9, e, s0: e.strength || 0.9 }));
      lit = K.light.system(st, cap, L, { sun: { dir: S.sun, amb: S.amb, sky: S.sky, k: S.sunK, parts: partNames } });
      st.add(lit);
      let acc = 0;
      st.add({
        update(dt, t) {
          acc += dt;
          if (acc < 1 / 12) return;
          acc = 0;
          let moved = false;
          L.forEach((l, i) => {
            if (l.e.flicker) {
              l.s = l.s0 * (1 - l.e.flicker * (0.5 + 0.5 * Math.sin(t * 9.1 + i * 2.3) * Math.sin(t * 5.3 + i)));
              moved = true;
            }
            if (l.e.follow) {
              l.p = rig.at(l.e.follow, l.e.at);
              moved = true;
            }
          });
          if (moved) lit.touch();
        }
      });
    }
    let ps = null;
    if (loose) {
      const winds = effects.filter((e) => e.do === "wind"), flow = winds.length ? K.flow.sum(
        ...winds.map((w) => w.swirl ? K.flow.sum(K.flow.wind(w.v), K.flow.curl(0.35, w.swirl)) : K.flow.wind(w.v))
      ) : void 0;
      ps = K.particles(st, pool, { flow, ground: () => 0 });
      const cols = (e, role) => {
        const r = ramp(e.colours === void 0 ? role : e.colours);
        return r.slice().reverse();
      }, timers = effects.map(() => 0);
      st.add({
        update(dt, t) {
          effects.forEach((e, i) => {
            if (e.do === "rain") {
              timers[i] += (e.rate || 60) * dt;
              const n2 = Math.floor(timers[i]);
              timers[i] -= n2;
              if (n2) ps.rain(e.box, n2, cols(e, "water"));
              return;
            }
            if (!ps[e.do] || !e.at) return;
            timers[i] -= dt;
            if (timers[i] > 0) return;
            timers[i] = e.every || 0.5;
            const n = e.n || 3;
            if (e.do === "dust") ps.dust(e.at, n, cols(e, "earth"), e.spread);
            else if (e.do === "embers") ps.embers(e.at, n, cols(e, "ember"));
            else if (e.do === "smoke") ps.smoke(e.at, n, cols(e, "dark"));
            else if (e.do === "sparks") ps.sparks(e.at, n, cols(e, "glow"), e.dir || null, e.speed);
          });
        },
        poke(hit) {
          if (!hit || !spec.tap) return;
          const t = spec.tap, c = cols(t, t.do === "dust" ? "earth" : "ember"), n = t.n || 12;
          if (t.do === "dust") ps.dust(hit.p, n, c, 1.5);
          else if (t.do === "embers") ps.embers(hit.p, n, c);
          else ps.sparks(hit.p, n, c, null, 4);
        }
      });
      st.add(ps);
    }
    const rv = effects.find((e) => e.do === "reveal");
    if (rv) st.add(K.fx.reveal(st, { auto: true, dur: rv.dur || 1.4, block: rv.block || 0.6 }));
    W.lab = { rig, ps, lit, parts: partNames };
    return W;
  };
  DIO.scene = (spec, env) => ({
    id: spec.id,
    name: spec.name || spec.id,
    blurb: spec.blurb || "",
    seed: spec.seed === void 0 ? 1 : spec.seed,
    build: (seed) => DIO.build(Object.assign({}, spec, { seed }), env),
    model: (seed, options = {}) => DIO.build(Object.assign({}, spec, { seed }), env, options)
  });
  DIO.roles = ROLES;
})(KIT);
