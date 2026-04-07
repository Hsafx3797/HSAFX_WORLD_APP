/**
 * Hash Engine — Hashing & Checksums
 *
 * Pure-JS synchronous implementations of MD5, SHA-1, SHA-256, SHA-512,
 * plus fast checksums (CRC32, DJB2, FNV-1a, Adler-32).
 *
 * All crypto hash algorithms follow their respective RFCs:
 *  - MD5:     RFC 1321
 *  - SHA-1:   RFC 3174 (FIPS 180-1)
 *  - SHA-256:  RFC 6234 (FIPS 180-4)
 *  - SHA-512:  RFC 6234 (FIPS 180-4)
 */

import type { Engine, HashEngineOptions, EngineInput, EngineResult, ValidationOutcome } from './types';

// ---------------------------------------------------------------------------
// Helpers: UTF-8 encode + word conversion
// ---------------------------------------------------------------------------

function utf8Encode(str: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

function toHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i]!.toString(16).padStart(2, '0');
  }
  return hex;
}

// ---------------------------------------------------------------------------
// CRC32
// ---------------------------------------------------------------------------

function crc32(input: string): string {
  const bytes = utf8Encode(input);
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i]!;
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return ((crc ^ 0xFFFFFFFF) >>> 0).toString(16).padStart(8, '0');
}

// ---------------------------------------------------------------------------
// DJB2
// ---------------------------------------------------------------------------

function djb2(input: string): string {
  const bytes = utf8Encode(input);
  let hash = 5381;
  for (let i = 0; i < bytes.length; i++) {
    hash = ((hash << 5) + hash) + bytes[i]!;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

// ---------------------------------------------------------------------------
// FNV-1a
// ---------------------------------------------------------------------------

function fnv1a(input: string): string {
  const bytes = utf8Encode(input);
  let hash = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i++) {
    hash ^= bytes[i]!;
    hash = (hash * 0x01000193) & 0xFFFFFFFF;
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

// ---------------------------------------------------------------------------
// Adler-32
// ---------------------------------------------------------------------------

function adler32(input: string): string {
  const bytes = utf8Encode(input);
  let a = 1;
  let b = 0;
  for (let i = 0; i < bytes.length; i++) {
    a = (a + bytes[i]!) % 65521;
    b = (b + a) % 65521;
  }
  return (((b << 16) | a) >>> 0).toString(16).padStart(8, '0');
}

// ---------------------------------------------------------------------------
// MD5 — RFC 1321 (pure JS, synchronous)
// ---------------------------------------------------------------------------

function md5(input: string): string {
  const bytes = utf8Encode(input);

  // Per-round shift amounts
  const s = [
    7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,
    5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,
    4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,
    6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21,
  ];

  // Pre-computed T[i] = floor(2^32 × abs(sin(i+1)))
  const K = new Uint32Array(64);
  for (let i = 0; i < 64; i++) {
    K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000) >>> 0;
  }

  // Pre-processing: pad message
  const bitLen = bytes.length * 8;
  const padLen = (bytes.length % 64 < 56) ? (56 - bytes.length % 64) : (120 - bytes.length % 64);
  const padded = new Uint8Array(bytes.length + padLen + 8);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  // Append length in bits as 64-bit little-endian
  const dv = new DataView(padded.buffer);
  dv.setUint32(padded.length - 8, bitLen >>> 0, true);
  dv.setUint32(padded.length - 4, Math.floor(bitLen / 0x100000000) >>> 0, true);

  let a0 = 0x67452301 >>> 0;
  let b0 = 0xEFCDAB89 >>> 0;
  let c0 = 0x98BADCFE >>> 0;
  let d0 = 0x10325476 >>> 0;

  for (let offset = 0; offset < padded.length; offset += 64) {
    const M = new Uint32Array(16);
    for (let j = 0; j < 16; j++) {
      M[j] = dv.getUint32(offset + j * 4, true);
    }

    let A = a0, B = b0, C = c0, D = d0;

    for (let i = 0; i < 64; i++) {
      let F: number, g: number;
      if (i < 16) {
        F = (B & C) | (~B & D);
        g = i;
      } else if (i < 32) {
        F = (D & B) | (~D & C);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        F = B ^ C ^ D;
        g = (3 * i + 5) % 16;
      } else {
        F = C ^ (B | ~D);
        g = (7 * i) % 16;
      }
      F = (F + A + K[i]! + M[g]!) >>> 0;
      A = D;
      D = C;
      C = B;
      const rotated = ((F << s[i]!) | (F >>> (32 - s[i]!))) >>> 0;
      B = (B + rotated) >>> 0;
    }

    a0 = (a0 + A) >>> 0;
    b0 = (b0 + B) >>> 0;
    c0 = (c0 + C) >>> 0;
    d0 = (d0 + D) >>> 0;
  }

  // Output as little-endian hex
  const result = new Uint8Array(16);
  const rdv = new DataView(result.buffer);
  rdv.setUint32(0, a0, true);
  rdv.setUint32(4, b0, true);
  rdv.setUint32(8, c0, true);
  rdv.setUint32(12, d0, true);
  return toHex(result);
}

// ---------------------------------------------------------------------------
// SHA-1 — FIPS 180-1 (pure JS, synchronous)
// ---------------------------------------------------------------------------

function sha1(input: string): string {
  const bytes = utf8Encode(input);

  const bitLen = bytes.length * 8;
  const padLen = (bytes.length % 64 < 56) ? (56 - bytes.length % 64) : (120 - bytes.length % 64);
  const padded = new Uint8Array(bytes.length + padLen + 8);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const dv = new DataView(padded.buffer);
  // Length as big-endian 64-bit
  dv.setUint32(padded.length - 4, bitLen >>> 0, false);
  dv.setUint32(padded.length - 8, Math.floor(bitLen / 0x100000000) >>> 0, false);

  let h0 = 0x67452301 >>> 0;
  let h1 = 0xEFCDAB89 >>> 0;
  let h2 = 0x98BADCFE >>> 0;
  let h3 = 0x10325476 >>> 0;
  let h4 = 0xC3D2E1F0 >>> 0;

  const W = new Uint32Array(80);

  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let t = 0; t < 16; t++) {
      W[t] = dv.getUint32(offset + t * 4, false);
    }
    for (let t = 16; t < 80; t++) {
      const x = (W[t - 3]! ^ W[t - 8]! ^ W[t - 14]! ^ W[t - 16]!) >>> 0;
      W[t] = ((x << 1) | (x >>> 31)) >>> 0;
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4;

    for (let t = 0; t < 80; t++) {
      let f: number, k: number;
      if (t < 20) {
        f = (b & c) | (~b & d);
        k = 0x5A827999;
      } else if (t < 40) {
        f = b ^ c ^ d;
        k = 0x6ED9EBA1;
      } else if (t < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8F1BBCDC;
      } else {
        f = b ^ c ^ d;
        k = 0xCA62C1D6;
      }
      const temp = (((a << 5) | (a >>> 27)) + f + e + k + W[t]!) >>> 0;
      e = d;
      d = c;
      c = ((b << 30) | (b >>> 2)) >>> 0;
      b = a;
      a = temp;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
  }

  const result = new Uint8Array(20);
  const rdv = new DataView(result.buffer);
  rdv.setUint32(0, h0, false);
  rdv.setUint32(4, h1, false);
  rdv.setUint32(8, h2, false);
  rdv.setUint32(12, h3, false);
  rdv.setUint32(16, h4, false);
  return toHex(result);
}

// ---------------------------------------------------------------------------
// SHA-256 — FIPS 180-4 (pure JS, synchronous)
// ---------------------------------------------------------------------------

const SHA256_K = new Uint32Array([
  0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
  0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
  0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
  0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
  0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
  0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
  0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
  0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2,
]);

function sha256(input: string): string {
  const bytes = utf8Encode(input);

  const bitLen = bytes.length * 8;
  const padLen = (bytes.length % 64 < 56) ? (56 - bytes.length % 64) : (120 - bytes.length % 64);
  const padded = new Uint8Array(bytes.length + padLen + 8);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const dv = new DataView(padded.buffer);
  dv.setUint32(padded.length - 4, bitLen >>> 0, false);
  dv.setUint32(padded.length - 8, Math.floor(bitLen / 0x100000000) >>> 0, false);

  let H0 = 0x6a09e667 >>> 0;
  let H1 = 0xbb67ae85 >>> 0;
  let H2 = 0x3c6ef372 >>> 0;
  let H3 = 0xa54ff53a >>> 0;
  let H4 = 0x510e527f >>> 0;
  let H5 = 0x9b05688c >>> 0;
  let H6 = 0x1f83d9ab >>> 0;
  let H7 = 0x5be0cd19 >>> 0;

  const W = new Uint32Array(64);

  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let t = 0; t < 16; t++) {
      W[t] = dv.getUint32(offset + t * 4, false);
    }
    for (let t = 16; t < 64; t++) {
      const s0 = ((W[t-15]! >>> 7) | (W[t-15]! << 25)) ^ ((W[t-15]! >>> 18) | (W[t-15]! << 14)) ^ (W[t-15]! >>> 3);
      const s1 = ((W[t-2]! >>> 17) | (W[t-2]! << 15)) ^ ((W[t-2]! >>> 19) | (W[t-2]! << 13)) ^ (W[t-2]! >>> 10);
      W[t] = (W[t-16]! + s0 + W[t-7]! + s1) >>> 0;
    }

    let a = H0, b = H1, c = H2, d = H3, e = H4, f = H5, g = H6, h = H7;

    for (let t = 0; t < 64; t++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + SHA256_K[t]! + W[t]!) >>> 0;
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g; g = f; f = e;
      e = (d + temp1) >>> 0;
      d = c; c = b; b = a;
      a = (temp1 + temp2) >>> 0;
    }

    H0 = (H0 + a) >>> 0; H1 = (H1 + b) >>> 0;
    H2 = (H2 + c) >>> 0; H3 = (H3 + d) >>> 0;
    H4 = (H4 + e) >>> 0; H5 = (H5 + f) >>> 0;
    H6 = (H6 + g) >>> 0; H7 = (H7 + h) >>> 0;
  }

  const result = new Uint8Array(32);
  const rdv = new DataView(result.buffer);
  rdv.setUint32(0, H0, false); rdv.setUint32(4, H1, false);
  rdv.setUint32(8, H2, false); rdv.setUint32(12, H3, false);
  rdv.setUint32(16, H4, false); rdv.setUint32(20, H5, false);
  rdv.setUint32(24, H6, false); rdv.setUint32(28, H7, false);
  return toHex(result);
}

// ---------------------------------------------------------------------------
// SHA-512 — FIPS 180-4 (pure JS using BigInt for 64-bit words)
// ---------------------------------------------------------------------------

function sha512(input: string): string {
  const bytes = utf8Encode(input);
  const n = BigInt;

  const K: bigint[] = [
    n('0x428a2f98d728ae22'),n('0x7137449123ef65cd'),n('0xb5c0fbcfec4d3b2f'),n('0xe9b5dba58189dbbc'),
    n('0x3956c25bf348b538'),n('0x59f111f1b605d019'),n('0x923f82a4af194f9b'),n('0xab1c5ed5da6d8118'),
    n('0xd807aa98a3030242'),n('0x12835b0145706fbe'),n('0x243185be4ee4b28c'),n('0x550c7dc3d5ffb4e2'),
    n('0x72be5d74f27b896f'),n('0x80deb1fe3b1696b1'),n('0x9bdc06a725c71235'),n('0xc19bf174cf692694'),
    n('0xe49b69c19ef14ad2'),n('0xefbe4786384f25e3'),n('0x0fc19dc68b8cd5b5'),n('0x240ca1cc77ac9c65'),
    n('0x2de92c6f592b0275'),n('0x4a7484aa6ea6e483'),n('0x5cb0a9dcbd41fbd4'),n('0x76f988da831153b5'),
    n('0x983e5152ee66dfab'),n('0xa831c66d2db43210'),n('0xb00327c898fb213f'),n('0xbf597fc7beef0ee4'),
    n('0xc6e00bf33da88fc2'),n('0xd5a79147930aa725'),n('0x06ca6351e003826f'),n('0x142929670a0e6e70'),
    n('0x27b70a8546d22ffc'),n('0x2e1b21385c26c926'),n('0x4d2c6dfc5ac42aed'),n('0x53380d139d95b3df'),
    n('0x650a73548baf63de'),n('0x766a0abb3c77b2a8'),n('0x81c2c92e47edaee6'),n('0x92722c851482353b'),
    n('0xa2bfe8a14cf10364'),n('0xa81a664bbc423001'),n('0xc24b8b70d0f89791'),n('0xc76c51a30654be30'),
    n('0xd192e819d6ef5218'),n('0xd6990624dbaa0b31'),n('0xf40e35855771202a'),n('0x106aa07032bbd1b8'),
    n('0x19a4c116b8d2d0c8'),n('0x1e376c085141ab53'),n('0x2748774cdf8eeb99'),n('0x34b0bcb5e19b48a8'),
    n('0x391c0cb3c5c95a63'),n('0x4ed8aa4ae3418acb'),n('0x5b9cca4f7763e373'),n('0x682e6ff3d6b2b8a3'),
    n('0x748f82ee5defb2fc'),n('0x78a5636f43172f60'),n('0x84c87814a1f0ab72'),n('0x8cc702081a6439ec'),
    n('0x90befffa23631e28'),n('0xa4506cebde82bde9'),n('0xbef9a3f7b2c67915'),n('0xc67178f2e372532b'),
    n('0xca273eceea26619c'),n('0xd186b8c721c0c207'),n('0xeada7dd6cde0eb1e'),n('0xf57d4f7fee6ed178'),
    n('0x06f067aa72176fba'),n('0x0a637dc5a2c898a6'),n('0x113f9804bef90dae'),n('0x1b710b35131c471b'),
    n('0x28db77f523047d84'),n('0x32caab7b40c72493'),n('0x3c9ebe0a15c9bebc'),n('0x431d67c49c100d4c'),
    n('0x4cc5d4becb3e42b6'),n('0x597f299cfc657e2a'),n('0x5fcb6fab3ad6faec'),n('0x6c44198c4a475817'),
  ];

  const MASK64 = n('0xFFFFFFFFFFFFFFFF');
  const add64 = (a: bigint, b: bigint) => (a + b) & MASK64;
  const rotr64 = (x: bigint, shift: number) => ((x >> n(shift)) | (x << n(64 - shift))) & MASK64;
  const shr64 = (x: bigint, shift: number) => x >> n(shift);

  // Pad: message + 0x80 + zeros + 128-bit length (big-endian)
  const bitLen = BigInt(bytes.length) * n(8);
  const padLen = (bytes.length % 128 < 112) ? (112 - bytes.length % 128) : (240 - bytes.length % 128);
  const padded = new Uint8Array(bytes.length + padLen + 16);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  // Write 128-bit length as big-endian (we only use low 64 bits)
  const lenDv = new DataView(padded.buffer);
  const hiLen = bitLen >> n(32);
  const loLen = bitLen & n('0xFFFFFFFF');
  lenDv.setUint32(padded.length - 4, Number(loLen), false);
  lenDv.setUint32(padded.length - 8, Number(hiLen), false);

  let H0 = n('0x6a09e667f3bcc908');
  let H1 = n('0xbb67ae8584caa73b');
  let H2 = n('0x3c6ef372fe94f82b');
  let H3 = n('0xa54ff53a5f1d36f1');
  let H4 = n('0x510e527fade682d1');
  let H5 = n('0x9b05688c2b3e6c1f');
  let H6 = n('0x1f83d9abfb41bd6b');
  let H7 = n('0x5be0cd19137e2179');

  const W: bigint[] = new Array(80);

  for (let offset = 0; offset < padded.length; offset += 128) {
    for (let t = 0; t < 16; t++) {
      const hi = lenDv.getUint32(offset + t * 8, false);
      const lo = lenDv.getUint32(offset + t * 8 + 4, false);
      W[t] = (n(hi) << n(32)) | n(lo);
    }
    for (let t = 16; t < 80; t++) {
      const s0 = rotr64(W[t-15]!, 1) ^ rotr64(W[t-15]!, 8) ^ shr64(W[t-15]!, 7);
      const s1 = rotr64(W[t-2]!, 19) ^ rotr64(W[t-2]!, 61) ^ shr64(W[t-2]!, 6);
      W[t] = add64(add64(W[t-16]!, s0), add64(W[t-7]!, s1));
    }

    let a = H0, b = H1, c = H2, d = H3, e = H4, f = H5, g = H6, h = H7;

    for (let t = 0; t < 80; t++) {
      const S1 = rotr64(e, 14) ^ rotr64(e, 18) ^ rotr64(e, 41);
      const ch = (e & f) ^ ((~e & MASK64) & g);
      const temp1 = add64(add64(add64(h, S1), add64(ch, K[t]!)), W[t]!);
      const S0 = rotr64(a, 28) ^ rotr64(a, 34) ^ rotr64(a, 39);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = add64(S0, maj);

      h = g; g = f; f = e;
      e = add64(d, temp1);
      d = c; c = b; b = a;
      a = add64(temp1, temp2);
    }

    H0 = add64(H0, a); H1 = add64(H1, b);
    H2 = add64(H2, c); H3 = add64(H3, d);
    H4 = add64(H4, e); H5 = add64(H5, f);
    H6 = add64(H6, g); H7 = add64(H7, h);
  }

  let hex = '';
  for (const hv of [H0, H1, H2, H3, H4, H5, H6, H7]) {
    hex += hv.toString(16).padStart(16, '0');
  }
  return hex;
}

// ---------------------------------------------------------------------------
// Algorithm registry
// ---------------------------------------------------------------------------

export const SYNC_ALGORITHMS: Record<string, (input: string) => string> = {
  md5,
  sha1,
  'sha-1': sha1,
  sha256,
  'sha-256': sha256,
  sha512,
  'sha-512': sha512,
  crc32,
  djb2,
  fnv1a,
  adler32,
};

const VALID_ALGORITHMS = Object.keys(SYNC_ALGORITHMS);

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const hashEngine: Engine<HashEngineOptions> = {
  name: 'hash',
  description: 'Compute hashes and checksums (md5, sha1, sha256, sha512, crc32, djb2, fnv1a, adler32).',

  validate(options: HashEngineOptions): ValidationOutcome {
    const errors: string[] = [];
    if (!VALID_ALGORITHMS.includes(options.algorithm)) {
      errors.push(`Unknown algorithm "${options.algorithm}". Available: ${VALID_ALGORITHMS.join(', ')}`);
    }
    return errors.length ? { valid: false, errors } : { valid: true };
  },

  execute(input: EngineInput, options: HashEngineOptions): EngineResult {
    const text = typeof input === 'string' ? input : JSON.stringify(input);
    const fn = SYNC_ALGORITHMS[options.algorithm];
    if (!fn) {
      return { output: '', metadata: { error: `Algorithm "${options.algorithm}" not available.` } };
    }
    const hash = fn(text);
    return { output: hash, metadata: { algorithm: options.algorithm, length: hash.length } };
  },
};
