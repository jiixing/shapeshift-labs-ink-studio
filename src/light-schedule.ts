/* Daylight-driven emission and bounded point-light selection. */
type ScheduledVector = readonly [number, number, number];

interface ScheduledLight {
  p: ScheduledVector;
  radius: number;
  intensity: number;
  color: ScheduledVector;
  schedule?: string;
  normal?: ScheduledVector;
  [key: string]: unknown;
}

interface LightSelectionOptions {
  daylight?: number;
  duskOnly?: boolean;
  limit?: number;
}

interface RankedLight {
  light: ScheduledLight;
  intensity: number;
  weight: number;
}

interface LightTransfer {
  gain: number;
  color: number[];
}

const LightSchedule = (() => {
  const emissionKind = 7,
    emissionMarker = -7;
  const marker = Object.freeze({ k: emissionKind, ex: emissionMarker, em: true });
  const smooth = (a: number, b: number, value: number): number => {
    const x = Math.max(0, Math.min(1, (value - a) / (b - a)));
    return x * x * (3 - 2 * x);
  };

  function gain(daylight = 1): number {
    if (!Number.isFinite(daylight) || daylight < 0 || daylight > 1) throw new RangeError('Daylight must be in [0, 1]');
    return 1 - smooth(0.16, 0.58, daylight);
  }

  function select(
    lights: readonly ScheduledLight[],
    eye: ScheduledVector,
    { daylight, duskOnly = false, limit = 8 }: LightSelectionOptions = {}
  ): ScheduledLight[] {
    if (!Array.isArray(lights as unknown) || !Number.isSafeInteger(limit) || limit < 0 || limit > 64)
      throw Error('Light selection needs a source list and a limit from zero to 64');
    const dusk = gain(daylight),
      ranked: RankedLight[] = [];
    for (const light of lights) {
      const automatic = light.schedule === 'dusk';
      if (duskOnly && !automatic) continue;
      const intensity = light.intensity * (automatic ? dusk : 1);
      if (!(intensity > 0)) continue;
      const distance = Math.hypot(...light.p.map((v, i) => v - eye[i]));
      ranked.push({ light, intensity, weight: (intensity * light.radius) / (4 + distance) });
    }
    ranked.sort((a, b) => b.weight - a.weight);
    return ranked.slice(0, limit).map(({ light, intensity }) => ({ ...light, intensity }));
  }

  const emissionScale = (dusk: number): number => 0.22 + 0.78 * dusk;
  function contribution(light: ScheduledLight, x: number, y: number, z: number): number {
    const delta = [x - light.p[0], y - light.p[1], z - light.p[2]];
    const distance = Math.hypot(...delta);
    if (distance >= light.radius) return 0;
    const facing = light.normal
      ? smooth(
          -0.07,
          0.25,
          delta.reduce((v, d, i) => v + d * light.normal![i], 0)
        )
      : 1;
    return (1 - distance / light.radius) ** 2 * light.intensity * facing;
  }

  function transfer(lights: readonly ScheduledLight[], x: number, y: number, z: number): LightTransfer {
    const color = [0, 0, 0];
    let power = 0;
    for (const light of lights) {
      const amount = contribution(light, x, y, z);
      if (!amount) continue;
      power += amount;
      for (let k = 0; k < 3; k++) color[k] += light.color[k] * amount;
    }
    return { gain: 1 + 0.65 * power, color: color.map(v => 0.25 * v) };
  }

  // prettier-ignore
  const glsl = `
float scheduledFalloff(vec3 delta, float radius, vec4 direction) {
  float radial = max(0.0, 1.0 - length(delta) / radius);
  float facing = direction.w > 0.5 ? smoothstep(-.07, .25, dot(delta, direction.xyz)) : 1.0;
  return radial * radial * facing;
}
`;
  return Object.freeze({
    gain,
    select,
    marker,
    emissionKind,
    emissionMarker,
    emissionScale,
    contribution,
    transfer,
    glsl
  });
})();
if (typeof module !== 'undefined') module.exports = LightSchedule;
