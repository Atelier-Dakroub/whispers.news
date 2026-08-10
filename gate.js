// A password in front of the whole site, for as long as it is not launched.
//
// This runs before the assets rather than beside them: `run_worker_first` is
// set in wrangler.jsonc, and without it Cloudflare answers every request that
// matches a real file directly from the asset store and this script never runs.
// The gate would be on the pages nobody asked for and off the ones they did.
//
// Basic auth is the right size for this. It is one shared password, it is
// understood by every browser without a login page to build, and it is only
// safe because the site is HTTPS-only — the credentials travel base64-encoded,
// which is encoding, not encryption.
//
// To lift the gate: delete `main` and `run_worker_first` from wrangler.jsonc
// and redeploy. Nothing else here is load-bearing.

/**
 * Compares two strings without leaking, through timing, how much of the first
 * one was right.
 *
 * `===` on strings returns at the first differing byte, and that difference is
 * measurable over enough attempts. Hashing both sides first makes every
 * comparison the same length and the same cost.
 *
 * @param {string} a
 * @param {string} b
 * @returns {Promise<boolean>}
 */
async function same(a, b) {
  const encoder = new TextEncoder();
  const [x, y] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(a)),
    crypto.subtle.digest('SHA-256', encoder.encode(b)),
  ]);

  const left = new Uint8Array(x);
  const right = new Uint8Array(y);

  let difference = 0;
  for (let i = 0; i < left.length; i += 1) difference |= left[i] ^ right[i];

  return difference === 0;
}

/** The answer to anyone who has not proved they belong here. */
const ask = () =>
  new Response('Not open yet.', {
    status: 401,
    headers: {
      'www-authenticate': 'Basic realm="whispers.news", charset="UTF-8"',
      // Nothing about a refusal should be held anywhere, by the browser or by
      // an intermediary — least of all once the gate is lifted.
      'cache-control': 'no-store',
      'content-type': 'text/plain; charset=utf-8',
    },
  });

export default {
  /**
   * @param {Request} request
   * @param {{ ASSETS: { fetch: (r: Request) => Promise<Response> },
   *   SITE_USER?: string, SITE_PASSWORD?: string }} env
   * @returns {Promise<Response>}
   */
  async fetch(request, env) {
    // No password configured means no gate. Deliberate: a missing secret should
    // not lock the owner out of their own site with no way back in.
    if (!env.SITE_PASSWORD) return env.ASSETS.fetch(request);

    const offered = request.headers.get('authorization') ?? '';
    const [scheme, encoded] = offered.split(' ');

    if (scheme !== 'Basic' || !encoded) return ask();

    let decoded;
    try {
      decoded = atob(encoded);
    } catch {
      return ask();
    }

    // Only the first colon separates them, because a password may contain one.
    const at = decoded.indexOf(':');
    if (at === -1) return ask();

    // Both halves are always checked, even when the name is already wrong, so a
    // valid name cannot be found by watching how quickly the answer comes back.
    const [nameOk, passOk] = await Promise.all([
      same(decoded.slice(0, at), env.SITE_USER ?? 'whispers'),
      same(decoded.slice(at + 1), env.SITE_PASSWORD),
    ]);

    if (!nameOk || !passOk) return ask();

    return env.ASSETS.fetch(request);
  },
};
