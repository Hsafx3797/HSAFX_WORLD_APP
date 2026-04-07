/**
 * QR Code Generator — Pure JavaScript implementation
 *
 * Supports Version 1–10 (up to ~211 bytes), Error Correction Level M.
 * Outputs SVG string.
 */

// ---------------------------------------------------------------------------
// GF(256) arithmetic for Reed-Solomon
// ---------------------------------------------------------------------------

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);

(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsGenPoly(nsym: number): number[] {
  let g = [1];
  for (let i = 0; i < nsym; i++) {
    const ng: number[] = new Array(g.length + 1).fill(0);
    for (let j = 0; j < g.length; j++) {
      ng[j] ^= g[j];
      ng[j + 1] ^= gfMul(g[j], GF_EXP[i]);
    }
    g = ng;
  }
  return g;
}

function rsEncode(data: number[], nsym: number): number[] {
  const gen = rsGenPoly(nsym);
  const out = new Array(data.length + nsym).fill(0);
  for (let i = 0; i < data.length; i++) out[i] = data[i];
  for (let i = 0; i < data.length; i++) {
    const coef = out[i];
    if (coef !== 0) {
      for (let j = 1; j < gen.length; j++) {
        out[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }
  return out.slice(data.length);
}

// ---------------------------------------------------------------------------
// QR Data Tables (Error Correction Level M)
// ---------------------------------------------------------------------------

// [version] → { totalCodewords, ecCodewordsPerBlock, numBlocksGroup1, dataPerBlock1, numBlocksGroup2?, dataPerBlock2? }
interface VersionInfo {
  total: number; ecPerBlock: number;
  g1Blocks: number; g1Data: number;
  g2Blocks: number; g2Data: number;
  size: number; alignments: number[];
}

const VERSION_TABLE: VersionInfo[] = [
  { total: 0, ecPerBlock: 0, g1Blocks: 0, g1Data: 0, g2Blocks: 0, g2Data: 0, size: 0, alignments: [] }, // placeholder v0
  { total: 26, ecPerBlock: 10, g1Blocks: 1, g1Data: 16, g2Blocks: 0, g2Data: 0, size: 21, alignments: [] },
  { total: 44, ecPerBlock: 16, g1Blocks: 1, g1Data: 28, g2Blocks: 0, g2Data: 0, size: 25, alignments: [18] },
  { total: 70, ecPerBlock: 26, g1Blocks: 1, g1Data: 44, g2Blocks: 0, g2Data: 0, size: 29, alignments: [22] },
  { total: 100, ecPerBlock: 18, g1Blocks: 2, g1Data: 32, g2Blocks: 0, g2Data: 0, size: 33, alignments: [26] },
  { total: 134, ecPerBlock: 24, g1Blocks: 2, g1Data: 43, g2Blocks: 0, g2Data: 0, size: 37, alignments: [30] },
  { total: 172, ecPerBlock: 16, g1Blocks: 4, g1Data: 27, g2Blocks: 0, g2Data: 0, size: 41, alignments: [34] },
  { total: 196, ecPerBlock: 18, g1Blocks: 4, g1Data: 31, g2Blocks: 0, g2Data: 0, size: 45, alignments: [6, 22, 38] },
  { total: 242, ecPerBlock: 22, g1Blocks: 2, g1Data: 38, g2Blocks: 2, g2Data: 39, size: 49, alignments: [6, 24, 42] },
  { total: 292, ecPerBlock: 22, g1Blocks: 3, g1Data: 36, g2Blocks: 2, g2Data: 37, size: 53, alignments: [6, 26, 46] },
  { total: 346, ecPerBlock: 26, g1Blocks: 4, g1Data: 43, g2Blocks: 1, g2Data: 44, size: 57, alignments: [6, 28, 50] },
];

// Format info strings for EC level M (mask 0–7)
const FORMAT_INFO_M = [
  0x5412, 0x5125, 0x5E7C, 0x5B4B, 0x45F9, 0x40CE, 0x4F97, 0x4AA0,
];

// ---------------------------------------------------------------------------
// Data Encoding (Byte Mode)
// ---------------------------------------------------------------------------

function encodeData(text: string): { version: number; codewords: number[] } {
  const bytes = new TextEncoder().encode(text);
  const dataLen = bytes.length;

  // Find smallest version that fits
  let version = 0;
  for (let v = 1; v <= 10; v++) {
    const vi = VERSION_TABLE[v];
    const dataCapacity = vi.g1Blocks * vi.g1Data + vi.g2Blocks * vi.g2Data;
    // Byte mode: 4 (mode) + 8 or 16 (length) + data*8 + terminator
    const lenBits = v >= 10 ? 16 : 8;
    const totalBits = 4 + lenBits + dataLen * 8;
    if (Math.ceil(totalBits / 8) <= dataCapacity) {
      version = v;
      break;
    }
  }
  if (version === 0) {
    throw new Error(`Data too long (${dataLen} bytes). Max ~211 bytes for version 10.`);
  }

  const vi = VERSION_TABLE[version];
  const dataCapacity = vi.g1Blocks * vi.g1Data + vi.g2Blocks * vi.g2Data;
  const lenBits = version >= 10 ? 16 : 8;

  // Build bit stream
  const bits: number[] = [];
  const pushBits = (val: number, count: number) => {
    for (let i = count - 1; i >= 0; i--) bits.push((val >> i) & 1);
  };

  // Mode indicator: 0100 (byte mode)
  pushBits(0b0100, 4);
  // Character count
  pushBits(dataLen, lenBits);
  // Data
  for (const b of bytes) pushBits(b, 8);
  // Terminator (up to 4 bits)
  const maxBits = dataCapacity * 8;
  const termLen = Math.min(4, maxBits - bits.length);
  pushBits(0, termLen);
  // Pad to byte boundary
  while (bits.length % 8 !== 0) bits.push(0);
  // Pad bytes (0xEC, 0x11 alternating)
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < maxBits) {
    pushBits(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  // Convert bits to codewords
  const codewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | (bits[i + j] || 0);
    codewords.push(byte);
  }

  return { version, codewords };
}

// ---------------------------------------------------------------------------
// Error correction + interleaving
// ---------------------------------------------------------------------------

function addErrorCorrection(version: number, dataCodewords: number[]): number[] {
  const vi = VERSION_TABLE[version];
  const blocks: number[][] = [];
  let offset = 0;

  // Group 1 blocks
  for (let i = 0; i < vi.g1Blocks; i++) {
    blocks.push(dataCodewords.slice(offset, offset + vi.g1Data));
    offset += vi.g1Data;
  }
  // Group 2 blocks
  for (let i = 0; i < vi.g2Blocks; i++) {
    blocks.push(dataCodewords.slice(offset, offset + vi.g2Data));
    offset += vi.g2Data;
  }

  // Generate EC codewords for each block
  const ecBlocks: number[][] = [];
  for (const block of blocks) {
    ecBlocks.push(rsEncode([...block], vi.ecPerBlock));
  }

  // Interleave data codewords
  const result: number[] = [];
  const maxDataLen = Math.max(vi.g1Data, vi.g2Data);
  for (let i = 0; i < maxDataLen; i++) {
    for (const block of blocks) {
      if (i < block.length) result.push(block[i]);
    }
  }
  // Interleave EC codewords
  for (let i = 0; i < vi.ecPerBlock; i++) {
    for (const ec of ecBlocks) {
      if (i < ec.length) result.push(ec[i]);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Matrix construction
// ---------------------------------------------------------------------------

type Module = 0 | 1 | -1; // 0=white, 1=dark, -1=unset

function createMatrix(version: number): { matrix: Module[][]; reserved: boolean[][] } {
  const size = VERSION_TABLE[version].size;
  const matrix: Module[][] = Array.from({ length: size }, () => new Array(size).fill(-1));
  const reserved: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));

  const set = (r: number, c: number, val: Module) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      matrix[r][c] = val;
      reserved[r][c] = true;
    }
  };

  // Finder patterns (3 corners)
  const finderPattern = (startR: number, startC: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const row = startR + r, col = startC + c;
        if (row < 0 || row >= size || col < 0 || col >= size) continue;
        const inOuter = r === 0 || r === 6 || c === 0 || c === 6;
        const inInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        const inSeparator = r === -1 || r === 7 || c === -1 || c === 7;
        set(row, col, (inOuter || inInner) && !inSeparator ? 1 : 0);
      }
    }
  };

  finderPattern(0, 0);
  finderPattern(0, size - 7);
  finderPattern(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    set(6, i, (i % 2 === 0 ? 1 : 0));
    set(i, 6, (i % 2 === 0 ? 1 : 0));
  }

  // Alignment patterns
  const alignments = VERSION_TABLE[version].alignments;
  if (alignments.length > 0) {
    const positions = [6, ...alignments];
    for (const r of positions) {
      for (const c of positions) {
        // Skip if overlapping with finder patterns
        if (r <= 8 && c <= 8) continue;
        if (r <= 8 && c >= size - 8) continue;
        if (r >= size - 8 && c <= 8) continue;
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const isDark = Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0);
            set(r + dr, c + dc, isDark ? 1 : 0);
          }
        }
      }
    }
  }

  // Dark module
  set(size - 8, 8, 1);

  // Reserve format info areas (will be filled later)
  for (let i = 0; i < 8; i++) {
    if (!reserved[8][i]) { reserved[8][i] = true; matrix[8][i] = 0; }
    if (!reserved[8][size - 1 - i]) { reserved[8][size - 1 - i] = true; matrix[8][size - 1 - i] = 0; }
    if (!reserved[i][8]) { reserved[i][8] = true; matrix[i][8] = 0; }
    if (!reserved[size - 1 - i][8]) { reserved[size - 1 - i][8] = true; matrix[size - 1 - i][8] = 0; }
  }
  if (!reserved[8][8]) { reserved[8][8] = true; matrix[8][8] = 0; }

  return { matrix, reserved };
}

function placeData(matrix: Module[][], reserved: boolean[][], data: number[]): void {
  const size = matrix.length;
  const bits: number[] = [];
  for (const byte of data) {
    for (let i = 7; i >= 0; i--) bits.push((byte >> i) & 1);
  }

  let bitIdx = 0;
  let upward = true;

  for (let col = size - 1; col >= 0; col -= 2) {
    if (col === 6) col = 5; // skip timing column
    const rows = upward
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const row of rows) {
      for (const dc of [0, -1]) {
        const c = col + dc;
        if (c < 0 || reserved[row][c]) continue;
        matrix[row][c] = (bitIdx < bits.length ? bits[bitIdx] : 0) as Module;
        bitIdx++;
      }
    }
    upward = !upward;
  }
}

// ---------------------------------------------------------------------------
// Masking
// ---------------------------------------------------------------------------

type MaskFn = (row: number, col: number) => boolean;

const MASK_FUNCTIONS: MaskFn[] = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (_, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

function applyMask(matrix: Module[][], reserved: boolean[][], maskIdx: number): Module[][] {
  const size = matrix.length;
  const result: Module[][] = matrix.map(row => [...row]);
  const fn = MASK_FUNCTIONS[maskIdx];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!reserved[r][c] && fn(r, c)) {
        result[r][c] = result[r][c] === 1 ? 0 : 1;
      }
    }
  }
  return result;
}

function placeFormatInfo(matrix: Module[][], maskIdx: number): void {
  const size = matrix.length;
  const info = FORMAT_INFO_M[maskIdx];

  // Horizontal (row 8)
  const hPositions = [0, 1, 2, 3, 4, 5, 7, 8, size - 8, size - 7, size - 6, size - 5, size - 4, size - 3, size - 2, size - 1];
  // Vertical (col 8)
  const vPositions = [size - 1, size - 2, size - 3, size - 4, size - 5, size - 6, size - 7, size - 8, 7, 5, 4, 3, 2, 1, 0];

  for (let i = 0; i < 15; i++) {
    const bit = ((info >> (14 - i)) & 1) as Module;
    if (i < hPositions.length) matrix[8][hPositions[i]] = bit;
    if (i < vPositions.length) matrix[vPositions[i]][8] = bit;
  }
}

function scoreMask(matrix: Module[][]): number {
  const size = matrix.length;
  let penalty = 0;

  // Rule 1: consecutive same-color modules in row/col
  for (let r = 0; r < size; r++) {
    let count = 1;
    for (let c = 1; c < size; c++) {
      if (matrix[r][c] === matrix[r][c - 1]) { count++; }
      else { if (count >= 5) penalty += count - 2; count = 1; }
    }
    if (count >= 5) penalty += count - 2;
  }
  for (let c = 0; c < size; c++) {
    let count = 1;
    for (let r = 1; r < size; r++) {
      if (matrix[r][c] === matrix[r - 1][c]) { count++; }
      else { if (count >= 5) penalty += count - 2; count = 1; }
    }
    if (count >= 5) penalty += count - 2;
  }

  // Rule 4: ratio of dark modules
  let dark = 0;
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (matrix[r][c] === 1) dark++;
  const total = size * size;
  const pct = (dark / total) * 100;
  penalty += Math.abs(Math.floor(pct / 5) * 5 - 50) * 2;

  return penalty;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function generateQrSvg(
  text: string,
  options: { size?: number; fg?: string; bg?: string; quiet?: number } = {},
): string {
  const { size: svgSize = 256, fg = '#000000', bg = '#ffffff', quiet = 4 } = options;

  const { version, codewords } = encodeData(text);
  const allCodewords = addErrorCorrection(version, codewords);
  const { matrix, reserved } = createMatrix(version);
  placeData(matrix, reserved, allCodewords);

  // Try all 8 masks, pick best
  let bestMask = 0;
  let bestScore = Infinity;
  for (let m = 0; m < 8; m++) {
    const masked = applyMask(matrix, reserved, m);
    placeFormatInfo(masked, m);
    const score = scoreMask(masked);
    if (score < bestScore) { bestScore = score; bestMask = m; }
  }

  const finalMatrix = applyMask(matrix, reserved, bestMask);
  placeFormatInfo(finalMatrix, bestMask);

  // Render SVG
  const qrSize = finalMatrix.length;
  const totalModules = qrSize + quiet * 2;
  const moduleSize = svgSize / totalModules;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgSize} ${svgSize}" width="${svgSize}" height="${svgSize}">`;
  svg += `<rect width="${svgSize}" height="${svgSize}" fill="${bg}"/>`;

  for (let r = 0; r < qrSize; r++) {
    for (let c = 0; c < qrSize; c++) {
      if (finalMatrix[r][c] === 1) {
        const x = (c + quiet) * moduleSize;
        const y = (r + quiet) * moduleSize;
        svg += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${moduleSize.toFixed(2)}" height="${moduleSize.toFixed(2)}" fill="${fg}"/>`;
      }
    }
  }

  svg += '</svg>';
  return svg;
}

export function generateVcardQr(
  contact: { name: string; email?: string; phone?: string; org?: string; title?: string; url?: string },
  options: { size?: number; fg?: string; bg?: string } = {},
): string {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
  lines.push(`FN:${contact.name}`);
  if (contact.org) lines.push(`ORG:${contact.org}`);
  if (contact.title) lines.push(`TITLE:${contact.title}`);
  if (contact.phone) lines.push(`TEL:${contact.phone}`);
  if (contact.email) lines.push(`EMAIL:${contact.email}`);
  if (contact.url) lines.push(`URL:${contact.url}`);
  lines.push('END:VCARD');
  const vcard = lines.join('\r\n');
  return generateQrSvg(vcard, options);
}
