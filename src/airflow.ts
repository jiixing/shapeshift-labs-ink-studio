/* Horizontal flow measured in scene units per second. Transport uses raw
   velocity, while flexible surfaces saturate smoothly as the wind increases. */
type AirflowWind = readonly [number, number];

interface AirflowFrame {
  velocity: [number, number];
  flex: [number, number];
}

interface PinnedAirflowOptions {
  reach: number;
  phase?: number;
  frequency?: number;
  phaseTravel?: number;
}

interface PinnedAirflowMotion {
  k: 11;
  wind: true;
  ph: number;
  sp: number;
  rg: number;
}

const Airflow = (() => {
  const calm: AirflowWind = Object.freeze([0, 0] as const);
  const packedFlag = 8192;
  const mean = 0.5,
    first = 0.34,
    second = 0.16,
    harmonic = 1.81,
    shift = 0.85;

  function frame(wind: AirflowWind = calm): AirflowFrame {
    if (
      !Array.isArray(wind as unknown) ||
      wind.length !== 2 ||
      ![wind[0], wind[1]].every(value => Number.isFinite(value) && Math.abs(value) <= 20)
    )
      throw new Error('Wind needs two finite horizontal components in [-20, 20]');
    const [x, z] = wind,
      scale = 1 / (1 + Math.hypot(x, z));
    return { velocity: [x, z], flex: [x * scale, z * scale] };
  }

  function bend(time: number, phase: number, frequency: number, reach: number): number {
    const wave = time * frequency + phase;
    return reach * (mean + first * Math.sin(wave) + second * Math.sin(wave * harmonic + shift));
  }

  function pinned(
    { reach, phase = 0, frequency = 2.25, phaseTravel = 4 }: PinnedAirflowOptions = {} as PinnedAirflowOptions
  ) {
    if (
      !Number.isFinite(reach) ||
      reach < 0 ||
      !Number.isFinite(phase) ||
      !Number.isFinite(frequency) ||
      frequency <= 0 ||
      !Number.isFinite(phaseTravel)
    )
      throw Error('Pinned airflow needs finite motion and nonnegative reach');
    return (station: number, freedom = station): PinnedAirflowMotion => {
      const u = Math.max(0, Math.min(1, station));
      const free = Math.max(0, Math.min(1, freedom));
      return { k: 11, wind: true, ph: phase - u * phaseTravel, sp: frequency, rg: reach * free * free };
    };
  }

  const glsl = `
float airflowBend(float time, float phase, float frequency, float reach) {
  float wave = time * frequency + phase;
  return reach * (${mean} + ${first} * sin(wave) + ${second} * sin(wave * ${harmonic} + ${shift}));
}
`;
  return Object.freeze({ frame, bend, pinned, packedFlag, glsl });
})();
if (typeof module !== 'undefined') module.exports = Airflow;
