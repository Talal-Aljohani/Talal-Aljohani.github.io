/*
 * Sima's sky tiles (SKY-8, SPEC 6.1). Owner: lane C. Plain JavaScript: a service worker cannot be
 * bundled by Vite here, so the few tile rules it needs repeat src/sky/hips.ts
 * (tests/sky-hips.test.ts checks they agree).
 *
 * What it does:
 * 1. Presents each channel of IRSA's SPHEREx cube as an ordinary 2D HiPS at
 *    /sky-hips/spherex/<channel>/<rev>/ (Aladin Lite reads one image per HiPS). `rev` changes on
 *    Retry, so Aladin asks again for tiles that failed.
 * 2. Serves the shipped low-resolution sky first (public/sky-seed/): full base tiles of the
 *    default channel, and every channel's order-0 tiles cut from its Allsky image, so the first
 *    sky appears without waiting for NASA's archive. Zoomed far out Aladin draws a layer's
 *    Allsky image, so the sharp layer's is sharp (`allskyImage`); the smoothed shipped ones stay
 *    under it.
 * 3. Fetches the rest from IRSA, the view's own channel first, with retries. Bright star centres,
 *    which the map leaves empty, are filled in from their rim (the sky note says so).
 * 4. A tile that still fails is drawn from the low-resolution sky (soft, never black) and
 *    reported as failed, so the page offers Retry (SKY-7). Failed tiles are never cached.
 * 5. Tells the page about every tile (start, done, failed), for the loading card (O-I15).
 */
/* global self, caches, clients, OffscreenCanvas, createImageBitmap */
'use strict';

const CACHE = 'sima-sky-tiles-v1';
const CACHE_MAX = 3000;
const IRSA = 'https://irsa.ipac.caltech.edu/data/hips/SPHEREx/spherex_allsky_cube';
const SCOPE = self.registration.scope;
const ROOT = new URL('sky-hips/', SCOPE).pathname;
const SEED = new URL('sky-seed/', SCOPE).href;
const PARALLEL = 6;
const RETRY_MS = [600, 1800];
const TIMEOUT_MS = 20000;
/** Channel → wavelength, µm (src/sky/hips.ts CHANNEL_LAM), for the HiPS title. */
const BLANK = new Set([50, 51]);

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key.startsWith('sima-sky-tiles-') && key !== CACHE) await caches.delete(key);
      }
      await self.clients.claim();
    })(),
  );
});

/** Channels the page shows now; their tiles go first. */
let active = new Set();
self.addEventListener('message', (event) => {
  const msg = event.data || {};
  if (msg.type === 'sky-active') active = new Set(msg.channels || []);
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(ROOT)) return;
  event.respondWith(route(url.pathname.slice(ROOT.length), event.clientId));
});

// ----- Tile rules (src/sky/hips.ts) ------------------------------------------------------------

function deinterleave(v) {
  let out = 0;
  for (let bit = 0; v > 0; bit++, v = Math.floor(v / 4)) out |= (v & 1) << bit;
  return out;
}
function subTilePosition(sub) {
  return { row: deinterleave(sub), col: deinterleave(Math.floor(sub / 2)) };
}
function allskyBox(n3) {
  return { x: (n3 % 27) * 64, y: Math.floor(n3 / 27) * 64 };
}
function irsaTileUrl(ch, k, n) {
  if (n < 0) return `${IRSA}/Norder3/Allsky${ch === 0 ? '' : `_${ch}`}.png`;
  return `${IRSA}/Norder${k}/Dir${Math.floor(n / 10000) * 10000}/Npix${n}${ch === 0 ? '' : `_${ch}`}.png`;
}

// ----- Routes ---------------------------------------------------------------------------------

async function route(path, clientId) {
  const parts = path.split('/');
  const soft = parts[0] === 'spherex-soft';
  if (parts[0] !== 'spherex' && !soft) return new Response('Not a sky map', { status: 404 });
  const ch = Number(parts[1]);
  const rev = parts[2] || '0';
  const rest = parts.slice(3);
  if (!Number.isInteger(ch) || ch < 0 || ch > 101 || BLANK.has(ch)) {
    return new Response('No such channel', { status: 404 });
  }
  if (rest[0] === 'properties') return text(properties(ch, rev, soft));
  if (rest[0] === 'Moc.fits')
    return new Response(fullSkyMoc(), { headers: { 'Content-Type': 'application/fits' } });
  if (/^Allsky\.\w+$/.test(rest[1] || '')) {
    return soft ? softTile(ch, 3, -1) : allskyImage(ch, rev, clientId);
  }
  const m = /^Norder(\d+)$/.exec(rest[0] || '');
  const t = /^Npix(\d+)\.\w+$/.exec(rest[2] || '');
  if (!m || !t) return new Response('Not a tile', { status: 404 });
  if (soft) return softTile(ch, Number(m[1]), Number(t[1]));
  return tile(ch, Number(m[1]), Number(t[1]), rev, clientId);
}

function text(body) {
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

/**
 * A channel as a 2D HiPS. The soft one goes no deeper than order 3 and comes only from the
 * shipped sky: it lies under the sharp one, so the view is sky while NASA's tiles load.
 */
function properties(ch, rev, soft) {
  return [
    `creator_did = ivo://sima/spherex-dr1-ch${ch}-r${rev}${soft ? '-soft' : ''}`,
    `obs_title = SPHEREx DR1 all-sky map, channel ${ch}${soft ? ', shipped low resolution' : ''}`,
    'obs_collection = SPHEREx DR1',
    `hips_service_url = ${IRSA}`,
    'dataproduct_type = image',
    'hips_version = 1.4',
    'hips_frame = equatorial',
    `hips_order = ${soft ? 3 : 5}`,
    'hips_order_min = 0',
    'hips_tile_width = 512',
    'hips_tile_format = png',
    'moc_sky_fraction = 1',
    '',
  ].join('\n');
}

/** A MOC (FITS, NUNIQ) that covers the whole sky: the 12 order-0 cells. */
function fullSkyMoc() {
  const card = (s) => s.padEnd(80, ' ');
  const header = (cards) => {
    const body = [...cards, 'END'].map(card).join('');
    return body.padEnd(Math.ceil(body.length / 2880) * 2880, ' ');
  };
  const primary = header([
    'SIMPLE  =                    T',
    'BITPIX  =                    8',
    'NAXIS   =                    0',
    'EXTEND  =                    T',
  ]);
  const ext = header([
    "XTENSION= 'BINTABLE'",
    'BITPIX  =                    8',
    'NAXIS   =                    2',
    'NAXIS1  =                    8',
    'NAXIS2  =                   12',
    'PCOUNT  =                    0',
    'GCOUNT  =                    1',
    'TFIELDS =                    1',
    "TTYPE1  = 'UNIQ    '",
    "TFORM1  = 'K       '",
    "PIXTYPE = 'HEALPIX '",
    "ORDERING= 'NUNIQ   '",
    "COORDSYS= 'C       '",
    'MOCORDER=                    0',
    "MOCDIM  = 'SPACE   '",
    "MOCTOOL = 'Sima    '",
  ]);
  const data = new Uint8Array(2880);
  const view = new DataView(data.buffer);
  for (let i = 0; i < 12; i++) view.setBigInt64(i * 8, BigInt(4 + i), false);
  const ascii = new TextEncoder().encode(primary + ext);
  const out = new Uint8Array(ascii.length + data.length);
  out.set(ascii);
  out.set(data, ascii.length);
  return out;
}

// ----- Tiles ----------------------------------------------------------------------------------

let manifestPromise = null;
function manifest() {
  manifestPromise ??= fetch(`${SEED}manifest.json`)
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  return manifestPromise;
}

async function tile(ch, k, n, rev, clientId) {
  tell(clientId, { ch, rev, k, n, state: 'start' });
  const key = `https://sima.invalid/sky/${ch}/${k}/${n}`;
  const cache = await caches.open(CACHE);
  const hit = await cache.match(key);
  if (hit) {
    tell(clientId, { ch, rev, k, n, state: 'done', from: 'cache' });
    return hit;
  }
  const seed = await manifest();
  // 1. The shipped base tiles of the default channel.
  if (seed?.base && seed.base.channel === ch && seed.base.orders.includes(k)) {
    const res = await fetch(`${SEED}tiles/${ch}/Norder${k}/Npix${n}.webp`).catch(() => null);
    if (res?.ok) {
      tell(clientId, { ch, rev, k, n, state: 'done', from: 'seed' });
      return image(await res.blob());
    }
  }
  // 2. Order 0 from the channel's shipped Allsky image: the first sky at once.
  if (k === 0 && n >= 0 && hasAllsky(seed, ch)) {
    const blob = await fromAllsky(ch, k, n).catch(() => null);
    if (blob) {
      tell(clientId, { ch, rev, k, n, state: 'done', from: 'allsky' });
      return image(blob);
    }
  }
  // 3. NASA's archive.
  try {
    const blob = await queued(ch, () => fetchTile(irsaTileUrl(ch, k, n)));
    const filled = await fillHoles(blob);
    const res = image(filled);
    await cache.put(key, res.clone());
    trim(cache);
    tell(clientId, { ch, rev, k, n, state: 'done', from: 'irsa' });
    return res;
  } catch (err) {
    // 4. Still failing: the soft low-resolution sky in its place, and Retry on the page.
    tell(clientId, {
      ch,
      rev,
      k,
      n,
      state: 'failed',
      why: String(err && err.message ? err.message : err),
    });
    const soft =
      (await fromBase(seed, ch, k, n).catch(() => null)) ??
      (n >= 0 && hasAllsky(seed, ch) ? await fromAllsky(ch, k, n).catch(() => null) : null) ??
      (n < 0 && hasAllsky(seed, ch)
        ? await fetch(`${SEED}allsky/${ch}.webp`)
            .then((r) => (r.ok ? r.blob() : null))
            .catch(() => null)
        : null);
    if (soft) return image(soft);
    const canvas = new OffscreenCanvas(512, 512);
    canvas.getContext('2d', { willReadFrequently: true });
    return image(await canvas.convertToBlob({ type: 'image/png' }));
  }
}

/**
 * The sharp layer's Allsky image (order 3). Aladin draws it instead of tiles when zoomed far out
 * (the whole globe), so it must be sharp: the default channel's is put together from its
 * shipped base tiles; the others' is IRSA's own, holes filled. The shipped Allsky images are
 * smoothed hard to fit the budget, so they only lie under it (the soft layer) and stand in when
 * IRSA's does not come.
 */
async function allskyImage(ch, rev, clientId) {
  const seed = await manifest();
  if (seed?.base?.channel === ch && seed.base.orders.includes(1)) {
    tell(clientId, { ch, rev, k: 3, n: -1, state: 'start' });
    const blob = await allskyFromBase(ch).catch(() => null);
    if (blob) {
      tell(clientId, { ch, rev, k: 3, n: -1, state: 'done', from: 'seed' });
      return image(blob);
    }
  }
  return tile(ch, 3, -1, rev, clientId);
}

/** An Allsky image cut from the default channel's shipped order-1 base tiles (128 px a tile). */
let baseAllsky = null;
function allskyFromBase(ch) {
  baseAllsky ??= (async () => {
    const canvas = new OffscreenCanvas(1728, 1856);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    await Promise.all(
      Array.from({ length: 48 }, async (_, n1) => {
        const res = await fetch(`${SEED}tiles/${ch}/Norder1/Npix${n1}.webp`);
        if (!res.ok) throw new Error(`no shipped tile 1/${n1}`);
        const bmp = await createImageBitmap(await res.blob());
        for (let sub = 0; sub < 16; sub++) {
          const { row, col } = subTilePosition(sub);
          const box = allskyBox(n1 * 16 + sub);
          ctx.drawImage(bmp, col * 128, row * 128, 128, 128, box.x, box.y, 64, 64);
        }
        bmp.close();
      }),
    );
    return canvas.convertToBlob({ type: 'image/png' });
  })();
  baseAllsky.catch(() => (baseAllsky = null));
  return baseAllsky;
}

/** A tile of the soft layer: shipped base tiles, else cut from the shipped Allsky image. */
async function softTile(ch, k, n) {
  const seed = await manifest();
  const local =
    n < 0
      ? hasAllsky(seed, ch) && `${SEED}allsky/${ch}.webp`
      : seed?.base?.channel === ch &&
        seed.base.orders.includes(k) &&
        `${SEED}tiles/${ch}/Norder${k}/Npix${n}.webp`;
  if (local) {
    const res = await fetch(local).catch(() => null);
    if (res?.ok) return image(await res.blob());
  }
  const blob =
    (await fromBase(seed, ch, k, n).catch(() => null)) ??
    (n >= 0 && hasAllsky(seed, ch) ? await fromAllsky(ch, k, n).catch(() => null) : null);
  if (blob) return image(blob);
  const canvas = new OffscreenCanvas(n < 0 ? 1728 : 512, n < 0 ? 1856 : 512);
  canvas.getContext('2d', { willReadFrequently: true });
  return image(await canvas.convertToBlob({ type: 'image/png' }));
}

function image(blob) {
  return new Response(blob, { headers: { 'Content-Type': blob.type || 'image/png' } });
}

function hasAllsky(seed, ch) {
  return !!seed?.allsky?.some?.((a) => a.channel === ch);
}

async function tell(clientId, msg) {
  const client = clientId ? await self.clients.get(clientId) : null;
  const to = client ? [client] : await self.clients.matchAll({ type: 'window' });
  for (const c of to) c.postMessage({ type: 'sky-tile', ...msg });
}

let trimming = false;
async function trim(cache) {
  if (trimming) return;
  trimming = true;
  try {
    const keys = await cache.keys();
    for (const req of keys.slice(0, Math.max(0, keys.length - CACHE_MAX))) await cache.delete(req);
  } finally {
    trimming = false;
  }
}

// Requests to IRSA: at most PARALLEL at once; the page's own channels first, newest first.
const waiting = [];
let running = 0;
let seq = 0;
function queued(ch, run) {
  return new Promise((resolve, reject) => {
    waiting.push({ ch, run, resolve, reject, seq: seq++ });
    pump();
  });
}
function pump() {
  while (running < PARALLEL && waiting.length) {
    let best = 0;
    for (let i = 1; i < waiting.length; i++) {
      const a = waiting[i];
      const b = waiting[best];
      const pa = active.has(a.ch) ? 0 : 1;
      const pb = active.has(b.ch) ? 0 : 1;
      if (pa < pb || (pa === pb && a.seq > b.seq)) best = i;
    }
    const job = waiting.splice(best, 1)[0];
    running++;
    job
      .run()
      .then(job.resolve, job.reject)
      .finally(() => {
        running--;
        pump();
      });
  }
}

async function fetchTile(url) {
  let last = null;
  for (let attempt = 0; attempt <= RETRY_MS.length; attempt++) {
    try {
      const res = await fetch(url, { mode: 'cors', signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (res.ok) return await res.blob();
      last = new Error(`NASA's archive answered ${res.status}`);
      if (res.status === 404) break;
    } catch (err) {
      last = err;
    }
    if (attempt < RETRY_MS.length) await new Promise((r) => setTimeout(r, RETRY_MS[attempt]));
  }
  throw last || new Error('no answer');
}

/** Fills see-through pixels (bright star centres) from their rim, ring by ring. */
async function fillHoles(blob) {
  const bmp = await createImageBitmap(blob);
  const { width: w, height: h } = bmp;
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bmp, 0, 0);
  bmp.close();
  const img = ctx.getImageData(0, 0, w, h);
  const px = img.data;
  let holes = [];
  for (let i = 0; i < w * h; i++) if (px[i * 4 + 3] === 0) holes.push(i);
  if (!holes.length) return blob;
  for (let pass = 0; pass < 48 && holes.length; pass++) {
    const add = [];
    const left = [];
    for (const i of holes) {
      const x = i % w;
      const y = (i - x) / w;
      let sum = 0;
      let count = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
          const j = (yy * w + xx) * 4;
          if (px[j + 3] !== 0) {
            sum += px[j];
            count++;
          }
        }
      }
      if (count) add.push(i, sum / count);
      else left.push(i);
    }
    if (!add.length) break;
    for (let a = 0; a < add.length; a += 2) {
      const j = add[a] * 4;
      px[j] = px[j + 1] = px[j + 2] = add[a + 1];
      px[j + 3] = 255;
    }
    holes = left;
  }
  ctx.putImageData(img, 0, 0);
  return canvas.convertToBlob({ type: 'image/png' });
}

// The shipped Allsky images, decoded, a few channels at a time.
const allskies = new Map();
function allsky(ch) {
  let p = allskies.get(ch);
  if (!p) {
    p = fetch(`${SEED}allsky/${ch}.webp`)
      .then((r) => {
        if (!r.ok) throw new Error(`no shipped sky for channel ${ch}`);
        return r.blob();
      })
      .then((b) => createImageBitmap(b));
    p.catch(() => allskies.delete(ch));
    allskies.set(ch, p);
    while (allskies.size > 4) allskies.delete(allskies.keys().next().value);
  }
  return p;
}

// The shipped base tiles of the deepest order, decoded, a few at a time.
const bases = new Map();
function baseTile(ch, k, n) {
  const key = `${ch}/${k}/${n}`;
  let p = bases.get(key);
  if (!p) {
    p = fetch(`${SEED}tiles/${ch}/Norder${k}/Npix${n}.webp`)
      .then((r) => {
        if (!r.ok) throw new Error(`no shipped tile ${key}`);
        return r.blob();
      })
      .then((b) => createImageBitmap(b));
    p.catch(() => bases.delete(key));
    bases.set(key, p);
    while (bases.size > 8) bases.delete(bases.keys().next().value);
  }
  return p;
}

/**
 * A tile deeper than the shipped base tiles (the default channel only), cut from the deepest
 * base tile that holds it and scaled to 512 px: four times sharper than the Allsky image.
 * Null for a channel without base tiles, or an order the base tiles already have.
 */
async function fromBase(seed, ch, k, n) {
  const top = seed?.base?.channel === ch ? Math.max(...seed.base.orders) : -1;
  if (n < 0 || top < 0 || k <= top) return null;
  const per = 4 ** (k - top);
  const bmp = await baseTile(ch, top, Math.floor(n / per));
  const { row, col } = subTilePosition(n % per);
  const size = 512 / 2 ** (k - top);
  const inset = Math.min(0.5, size / 4);
  const canvas = new OffscreenCanvas(512, 512);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    bmp,
    col * size + inset,
    row * size + inset,
    size - 2 * inset,
    size - 2 * inset,
    0,
    0,
    512,
    512,
  );
  return canvas.convertToBlob({ type: 'image/png' });
}

/** Any tile, cut from the channel's Allsky image (order 3, 64 px a tile) and scaled to 512 px. */
async function fromAllsky(ch, k, n) {
  const bmp = await allsky(ch);
  const canvas = new OffscreenCanvas(512, 512);
  // CPU-backed: a GPU canvas makes convertToBlob read pixels back, which stalls the page's drawing.
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  if (k <= 3) {
    const per = 4 ** (3 - k);
    const size = 512 / 2 ** (3 - k);
    for (let s = 0; s < per; s++) {
      const box = allskyBox(n * per + s);
      const { row, col } = subTilePosition(s);
      // Half a pixel in from the edge, so smoothing never reaches the neighbouring tile.
      ctx.drawImage(bmp, box.x + 0.5, box.y + 0.5, 63, 63, col * size, row * size, size, size);
    }
  } else {
    const per = 4 ** (k - 3);
    const box = allskyBox(Math.floor(n / per));
    const { row, col } = subTilePosition(n % per);
    const size = 64 / 2 ** (k - 3);
    const inset = Math.min(0.5, size / 4);
    ctx.drawImage(
      bmp,
      box.x + col * size + inset,
      box.y + row * size + inset,
      size - 2 * inset,
      size - 2 * inset,
      0,
      0,
      512,
      512,
    );
  }
  return canvas.convertToBlob({ type: 'image/png' });
}
