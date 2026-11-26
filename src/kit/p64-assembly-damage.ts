/* Seeded state changes over stable part keys and explicit support dependencies. */
interface P64AssemblyDamagePartInput {
  key: string;
  module?: string;
  state?: string;
  data?: unknown;
}

interface P64AssemblyDamagePart {
  key: string;
  role: string;
  state: string;
  data: unknown;
}

interface P64AssemblyDamagePinInput {
  key: string;
  state?: string;
}

interface P64AssemblyDamageContext {
  tick: number;
  exposure: number;
  from: string;
  supported: boolean;
}

interface P64AssemblyDamageRuleInput {
  id: string;
  from?: string;
  to: string;
  role?: string;
  chance?: number;
  weight?: number;
  when?: (part: Readonly<P64AssemblyDamagePart>, context: P64AssemblyDamageContext) => boolean;
}

interface P64AssemblyDamageRule {
  id: string;
  from: string;
  to: string;
  role?: string;
  chance: number;
  weight: number;
  when?: (part: Readonly<P64AssemblyDamagePart>, context: P64AssemblyDamageContext) => boolean;
}

interface P64AssemblyDamageSupportInput {
  child: string;
  by: readonly string[];
  required?: number;
}

interface P64AssemblyDamageParent {
  by: string[];
  required: number;
}

interface P64AssemblyDamageOptions {
  rules?: readonly P64AssemblyDamageRuleInput[];
  supports?: readonly P64AssemblyDamageSupportInput[];
  pins?: readonly P64AssemblyDamagePinInput[];
  seed?: number;
  steps?: number;
  exposure?: (part: Readonly<P64AssemblyDamagePart>) => number;
  inactive?: readonly string[];
  failure?: string;
  maxChecks?: number;
}

interface P64AssemblyDamageEvent {
  key: string;
  from: string;
  to: string;
  tick: number;
  cause: string;
}

interface P64AssemblyDamageState extends P64AssemblyDamagePart {
  active: boolean;
  supported: boolean;
}

interface P64AssemblyDamageResult {
  status: 'ok' | 'budget';
  states: P64AssemblyDamageState[];
  events: P64AssemblyDamageEvent[];
  work: { steps: number; checks: number };
}

interface P64AssemblyDamageData {
  clone<T>(value: T): T;
  freeze<T>(value: T): Readonly<T>;
  hash(text: string, seed?: number): number;
}

interface P64AssemblyDamageConstruct {
  damage?: (
    input: readonly P64AssemblyDamagePartInput[],
    options?: P64AssemblyDamageOptions
  ) => Readonly<P64AssemblyDamageResult>;
}

interface P64AssemblyDamageApi {
  data: P64AssemblyDamageData;
  construct?: P64AssemblyDamageConstruct;
}

interface P64AssemblyDamageGrow {
  dice(seed: number): () => number;
}

interface P64AssemblyDamageKitHost {
  procedural: P64AssemblyDamageApi;
  grow: P64AssemblyDamageGrow;
}

declare const KIT: P64AssemblyDamageKitHost;

(function (K: P64AssemblyDamageKitHost) {
  const P = K.procedural,
    name = (s: unknown, max = 120): s is string => typeof s === 'string' && s.length > 0 && s.length <= max,
    integer = (n: number, a: number, b: number): n is number => Number.isSafeInteger(n) && n >= a && n <= b,
    bounded = (n: number, a: number, b: number): n is number => Number.isFinite(n) && n >= a && n <= b;

  function damage(
    input: readonly P64AssemblyDamagePartInput[],
    {
      rules,
      supports = [],
      pins = [],
      seed = 0,
      steps = 1,
      exposure,
      inactive = ['missing', 'collapsed'],
      failure = 'collapsed',
      maxChecks = 2500000
    }: P64AssemblyDamageOptions = {}
  ): Readonly<P64AssemblyDamageResult> {
    if (
      !Array.isArray(input) ||
      input.length > 24000 ||
      !Array.isArray(rules) ||
      rules.length > 128 ||
      !Array.isArray(supports) ||
      supports.length > input.length ||
      !Array.isArray(pins) ||
      pins.length > input.length ||
      !Number.isSafeInteger(seed) ||
      !integer(steps, 0, 300) ||
      !Array.isArray(inactive) ||
      inactive.length > 64 ||
      !inactive.every(s => name(s)) ||
      !name(failure) ||
      !inactive.includes(failure) ||
      (exposure !== undefined && typeof exposure !== 'function') ||
      !integer(maxChecks, 1, 30000000)
    )
      throw new Error('Damage grammar needs bounded parts, named states and seeded rules');
    const source = new Map<string, P64AssemblyDamagePart>(),
      fields = new Map<string, number>(),
      stay = new Map<string, string>(),
      dependents = new Map<string, string[]>(),
      parents = new Map<string, P64AssemblyDamageParent>(),
      allowed = new Set<string>(inactive),
      transitions = new Map<string, P64AssemblyDamageRule[]>(),
      events: P64AssemblyDamageEvent[] = [];
    for (const entry of input) {
      const { key, role = entry?.module, state = 'intact' } = entry ?? {};
      if (!name(key, 4096) || source.has(key) || !name(role) || !name(state))
        throw new Error('Damage parts need unique keys, roles and valid states');
      source.set(key, { key, role, state, data: P.data.clone(entry.data ?? {}) });
      dependents.set(key, []);
    }
    for (const pin of pins) {
      const { key, state = source.get(pin?.key)?.state } = pin ?? {};
      if (!source.has(key) || stay.has(key) || !name(state))
        throw new Error('Damage pins need unique existing part keys');
      stay.set(key, state);
    }
    const ruleIds = new Set<string>();
    for (const entry of rules) {
      const { id, from = 'intact', to, role, chance = 1, weight = 1, when } = entry ?? {};
      if (
        !name(id) ||
        ruleIds.has(id) ||
        !name(from) ||
        !name(to) ||
        from === to ||
        (role !== undefined && !name(role)) ||
        !bounded(chance, 0, 1) ||
        !bounded(weight, 0, 1e6) ||
        (when !== undefined && typeof when !== 'function')
      )
        throw new Error('Invalid damage grammar transition');
      ruleIds.add(id);
      if (!transitions.has(from)) transitions.set(from, []);
      transitions.get(from)!.push({ id, from, to, role, chance, weight, when });
    }
    const pending = new Map<string, number>();
    for (const { child, by, required = 1 } of supports.map(entry => entry ?? {})) {
      if (
        !source.has(child) ||
        parents.has(child) ||
        !Array.isArray(by) ||
        !integer(by.length, 1, 64) ||
        new Set(by).size !== by.length ||
        by.some(p => p === child || !source.has(p)) ||
        !integer(required, 1, by.length)
      )
        throw new Error('Invalid damage support dependency');
      parents.set(child, { by: by.slice(), required });
      pending.set(child, by.length);
      for (const supporter of by) dependents.get(supporter)!.push(child);
    }
    const order = [...source.keys()].filter(key => !pending.has(key));
    for (let i = 0; i < order.length; i++) {
      for (const child of dependents.get(order[i])!) {
        const left = pending.get(child)! - 1;
        pending.set(child, left);
        if (!left) order.push(child);
      }
    }
    if (order.length !== source.size) throw new Error('Damage supports must form an acyclic graph');
    const overhead = source.size + [...parents.values()].reduce((sum, link) => sum + link.by.length, 0);
    if (overhead > maxChecks) throw new Error('Damage parts exceed the graph budget');
    for (const record of source.values()) {
      const local = exposure ? exposure(P.data.freeze({ ...record })) : 1;
      if (!bounded(local, 0, 1)) throw new Error('Damage exposure must be between zero and one');
      fields.set(record.key, local);
    }
    let state = new Map<string, string>([...source].map(([key, p]) => [key, stay.get(key) ?? p.state])),
      stepsDone = 0,
      checks = overhead,
      status: 'ok' | 'budget' = 'ok';
    const dependencies = (key: string, states: Map<string, string>): boolean => {
      const support = parents.get(key);
      if (!support) return true;
      let available = 0;
      for (const p of support.by) if (!allowed.has(states.get(p)!)) available++;
      return available >= support.required;
    };
    function failurePass(states: Map<string, string>, changes: P64AssemblyDamageEvent[], tick: number): void {
      for (const key of order) {
        const from = states.get(key)!;
        if (stay.has(key) || allowed.has(from) || dependencies(key, states)) continue;
        states.set(key, failure);
        changes.push({ key, from, to: failure, tick, cause: 'support' });
      }
    }
    failurePass(state, events, 0);
    outer: for (let tick = 1; tick <= steps; tick++) {
      if (checks + overhead > maxChecks) {
        status = 'budget';
        break;
      }
      checks += overhead;
      const next = new Map(state),
        changes: P64AssemblyDamageEvent[] = [];
      for (const [key, from] of state) {
        if (stay.has(key)) continue;
        const options = transitions.get(from);
        if (!options?.length) continue;
        const part = source.get(key)!,
          local = fields.get(key)!,
          context: P64AssemblyDamageContext = {
            tick,
            exposure: local,
            from,
            supported: dependencies(key, state)
          },
          dice = K.grow.dice(P.data.hash(JSON.stringify([key, tick]), seed));
        let chosen: P64AssemblyDamageRule | undefined,
          total = 0;
        for (const rule of options) {
          if (checks >= maxChecks) {
            status = 'budget';
            break outer;
          }
          checks++;
          if (
            (rule.role !== undefined && rule.role !== part.role) ||
            !rule.weight ||
            (rule.when && !rule.when(P.data.freeze({ ...part, state: from }), context)) ||
            dice() >= rule.chance * local
          )
            continue;
          total += rule.weight;
          if (dice() * total < rule.weight) chosen = rule;
        }
        if (!chosen) continue;
        next.set(key, chosen.to);
        changes.push({ key, from, to: chosen.to, tick, cause: chosen.id });
      }
      failurePass(next, changes, tick);
      events.push(...changes);
      state = next;
      stepsDone++;
    }
    const states: P64AssemblyDamageState[] = [...source.values()].map(part => {
      const current = state.get(part.key)!;
      return {
        ...part,
        state: current,
        active: !allowed.has(current),
        supported: dependencies(part.key, state)
      };
    });
    return P.data.freeze({ status, states, events, work: { steps: stepsDone, checks } });
  }
  const construct = P.construct ?? (P.construct = {});
  construct.damage = damage;
})(KIT);

export {};
