// A deliberately small lexical (BM25) retriever with the controls an enterprise RAG system needs:
// pre-filtering by tenant and group, superseded-version exclusion, tombstones, a tenant-safe cache,
// an injection tripwire and score-based abstention. Zero dependencies. Not a production retriever.

const STOP = new Set('a an and are as at be by can do does for from how i in is it my of on or should that the to was what when who will with you your after before every than then there this which while'.split(' '));
export const tokenize = (t) => (String(t).toLowerCase().match(/[a-z0-9]+/g) || []).filter(w => !STOP.has(w));

// Heuristic tripwire only. Pattern matching is NOT a defence against prompt injection; real systems
// must treat retrieved text as untrusted data, constrain tools, and screen model inputs and outputs.
const INJECTION = [/ignore (all )?(previous|prior) instructions/i, /reveal (the )?system prompt/i, /email .{0,80}@[a-z0-9.-]+/i];
export const looksInjected = (text) => INJECTION.some(re => re.test(text));

export const canSee = (doc, user) =>
  doc.tenant === user.tenant && (!doc.groups.length || doc.groups.some(g => (user.groups || []).includes(g)));

export class Index {
  constructor(docs, opts = {}) {
    this.opts = { k1: 1.2, b: 0.75, minScore: 2.0, minMatchedTerms: 2, scanInjection: true, excludeSuperseded: true, ...opts };
    this.docs = new Map(); this.tombstones = new Set(); this.cache = new Map(); this.audit = [];
    for (const d of docs) this.docs.set(d.id, { ...d, tokens: tokenize(d.title + ' ' + d.text) });
    if (this.opts.emptyIndex) this.docs.clear(); // fault: index outage / failed build
  }
  size() { return [...this.docs.keys()].filter(id => !this.tombstones.has(id)).length; }
  delete(id) {
    this.tombstones.add(id);
    if (!this.opts.staleCache) this.cache.clear(); // fault 'staleCache' skips invalidation
    this.audit.push({ event: 'delete', id });
  }
  cacheKey(q, user, k) {
    return this.opts.sharedCache ? `${q}|${k}` // fault: key ignores identity
      : `${user.tenant}|${[...(user.groups || [])].sort().join(',')}|${q}|${k}`;
  }
  visible(user) {
    return [...this.docs.values()].filter(d => {
      if (this.tombstones.has(d.id)) return false;
      if (this.opts.excludeSuperseded && d.superseded) return false;
      if (!this.opts.aclBypass && !canSee(d, user)) return false; // fault 'aclBypass' skips the filter
      return true;
    });
  }
  search(query, user, k = 3) {
    const key = this.cacheKey(query, user, k);
    if (this.cache.has(key)) return { ...this.cache.get(key), fromCache: true };
    const out = this.#search(query, user, k);
    this.cache.set(key, out);
    return out;
  }
  #search(query, user, k) {
    // Filter first, then score over the visible set only, so hidden documents cannot influence
    // ranking or term statistics.
    const pool = this.visible(user), q = [...new Set(tokenize(query))];
    if (!pool.length || !q.length) return { results: [], abstained: true, reason: 'no-candidates', quarantined: [] };
    const N = pool.length, avg = pool.reduce((s, d) => s + d.tokens.length, 0) / N;
    const df = Object.fromEntries(q.map(t => [t, pool.filter(d => d.tokens.includes(t)).length]));
    const { k1, b } = this.opts;
    let scored = pool.map(d => {
      let score = 0, matched = 0;
      for (const t of q) {
        const tf = d.tokens.filter(x => x === t).length; if (!tf) continue;
        matched++;
        const idf = Math.log(1 + (N - df[t] + 0.5) / (df[t] + 0.5));
        score += idf * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * d.tokens.length / avg));
      }
      return { id: d.id, score, matched, text: d.title + ' ' + d.text };
    }).filter(r => r.score > 0).sort((x, y) => y.score - x.score || x.id.localeCompare(y.id));
    const quarantined = [];
    if (this.opts.scanInjection) scored = scored.filter(r => { if (looksInjected(r.text)) { quarantined.push(r.id); return false; } return true; });
    const top = scored[0];
    if (!top || top.score < this.opts.minScore || top.matched < this.opts.minMatchedTerms)
      return { results: [], abstained: true, reason: top ? 'low-confidence' : 'no-match', quarantined };
    return { results: scored.slice(0, k).map(({ id, score }) => ({ id, score: Math.round(score * 1000) / 1000 })), abstained: false, reason: 'ok', quarantined };
  }
  // Reconcile the index against the source of truth. Orphans are indexed but no longer in the source
  // (a missed deletion); missing are in the source but not indexed (a missed ingest).
  reconcile(sourceIds) {
    const src = new Set(sourceIds), live = new Set([...this.docs.keys()].filter(id => !this.tombstones.has(id)));
    return { orphans: [...live].filter(id => !src.has(id)).sort(), missing: [...src].filter(id => !live.has(id)).sort() };
  }
}
