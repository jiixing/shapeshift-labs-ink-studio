// Generated from src/kit/p64-assembly-damage.ts by npm run build:src. Do not edit.
(function(K) {
  const P = K.procedural, name = (s, max = 120) => typeof s === "string" && s.length > 0 && s.length <= max, integer = (n, a, b) => Number.isSafeInteger(n) && n >= a && n <= b, bounded = (n, a, b) => Number.isFinite(n) && n >= a && n <= b;
  function damage(input, {
    rules,
    supports = [],
    pins = [],
    seed = 0,
    steps = 1,
    exposure,
    inactive = ["missing", "collapsed"],
    failure = "collapsed",
    maxChecks = 25e5
  } = {}) {
    if (!Array.isArray(input) || input.length > 24e3 || !Array.isArray(rules) || rules.length > 128 || !Array.isArray(supports) || supports.length > input.length || !Array.isArray(pins) || pins.length > input.length || !Number.isSafeInteger(seed) || !integer(steps, 0, 300) || !Array.isArray(inactive) || inactive.length > 64 || !inactive.every((s) => name(s)) || !name(failure) || !inactive.includes(failure) || exposure !== void 0 && typeof exposure !== "function" || !integer(maxChecks, 1, 3e7))
      throw new Error("Damage grammar needs bounded parts, named states and seeded rules");
    const source = /* @__PURE__ */ new Map(), fields = /* @__PURE__ */ new Map(), stay = /* @__PURE__ */ new Map(), dependents = /* @__PURE__ */ new Map(), parents = /* @__PURE__ */ new Map(), allowed = new Set(inactive), transitions = /* @__PURE__ */ new Map(), events = [];
    for (const entry of input) {
      const { key, role = entry?.module, state: state2 = "intact" } = entry ?? {};
      if (!name(key, 4096) || source.has(key) || !name(role) || !name(state2))
        throw new Error("Damage parts need unique keys, roles and valid states");
      source.set(key, { key, role, state: state2, data: P.data.clone(entry.data ?? {}) });
      dependents.set(key, []);
    }
    for (const pin of pins) {
      const { key, state: state2 = source.get(pin?.key)?.state } = pin ?? {};
      if (!source.has(key) || stay.has(key) || !name(state2))
        throw new Error("Damage pins need unique existing part keys");
      stay.set(key, state2);
    }
    const ruleIds = /* @__PURE__ */ new Set();
    for (const entry of rules) {
      const { id, from = "intact", to, role, chance = 1, weight = 1, when } = entry ?? {};
      if (!name(id) || ruleIds.has(id) || !name(from) || !name(to) || from === to || role !== void 0 && !name(role) || !bounded(chance, 0, 1) || !bounded(weight, 0, 1e6) || when !== void 0 && typeof when !== "function")
        throw new Error("Invalid damage grammar transition");
      ruleIds.add(id);
      if (!transitions.has(from)) transitions.set(from, []);
      transitions.get(from).push({ id, from, to, role, chance, weight, when });
    }
    const pending = /* @__PURE__ */ new Map();
    for (const { child, by, required = 1 } of supports.map((entry) => entry ?? {})) {
      if (!source.has(child) || parents.has(child) || !Array.isArray(by) || !integer(by.length, 1, 64) || new Set(by).size !== by.length || by.some((p) => p === child || !source.has(p)) || !integer(required, 1, by.length))
        throw new Error("Invalid damage support dependency");
      parents.set(child, { by: by.slice(), required });
      pending.set(child, by.length);
      for (const supporter of by) dependents.get(supporter).push(child);
    }
    const order = [...source.keys()].filter((key) => !pending.has(key));
    for (let i = 0; i < order.length; i++) {
      for (const child of dependents.get(order[i])) {
        const left = pending.get(child) - 1;
        pending.set(child, left);
        if (!left) order.push(child);
      }
    }
    if (order.length !== source.size) throw new Error("Damage supports must form an acyclic graph");
    const overhead = source.size + [...parents.values()].reduce((sum, link) => sum + link.by.length, 0);
    if (overhead > maxChecks) throw new Error("Damage parts exceed the graph budget");
    for (const record of source.values()) {
      const local = exposure ? exposure(P.data.freeze({ ...record })) : 1;
      if (!bounded(local, 0, 1)) throw new Error("Damage exposure must be between zero and one");
      fields.set(record.key, local);
    }
    let state = new Map([...source].map(([key, p]) => [key, stay.get(key) ?? p.state])), stepsDone = 0, checks = overhead, status = "ok";
    const dependencies = (key, states2) => {
      const support = parents.get(key);
      if (!support) return true;
      let available = 0;
      for (const p of support.by) if (!allowed.has(states2.get(p))) available++;
      return available >= support.required;
    };
    function failurePass(states2, changes, tick) {
      for (const key of order) {
        const from = states2.get(key);
        if (stay.has(key) || allowed.has(from) || dependencies(key, states2)) continue;
        states2.set(key, failure);
        changes.push({ key, from, to: failure, tick, cause: "support" });
      }
    }
    failurePass(state, events, 0);
    outer: for (let tick = 1; tick <= steps; tick++) {
      if (checks + overhead > maxChecks) {
        status = "budget";
        break;
      }
      checks += overhead;
      const next = new Map(state), changes = [];
      for (const [key, from] of state) {
        if (stay.has(key)) continue;
        const options = transitions.get(from);
        if (!options?.length) continue;
        const part = source.get(key), local = fields.get(key), context = {
          tick,
          exposure: local,
          from,
          supported: dependencies(key, state)
        }, dice = K.grow.dice(P.data.hash(JSON.stringify([key, tick]), seed));
        let chosen, total = 0;
        for (const rule of options) {
          if (checks >= maxChecks) {
            status = "budget";
            break outer;
          }
          checks++;
          if (rule.role !== void 0 && rule.role !== part.role || !rule.weight || rule.when && !rule.when(P.data.freeze({ ...part, state: from }), context) || dice() >= rule.chance * local)
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
    const states = [...source.values()].map((part) => {
      const current = state.get(part.key);
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
