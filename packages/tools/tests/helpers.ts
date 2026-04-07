import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';

const FIXTURES_DIR = join(__dirname, 'fixtures');
const INPUT_DIR = join(FIXTURES_DIR, 'input');
const OUTPUT_DIR = join(FIXTURES_DIR, 'output');

export function readTextInput(relativePath: string): string {
  return readFileSync(join(INPUT_DIR, 'text', relativePath), 'utf-8');
}

export function readJsonInput<T = unknown>(relativePath: string): T {
  const raw = readFileSync(join(INPUT_DIR, 'json', relativePath), 'utf-8');
  return JSON.parse(raw) as T;
}

export function writeOutput(category: string, filename: string, data: unknown): void {
  const dir = join(OUTPUT_DIR, category);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  writeFileSync(join(dir, filename), content, 'utf-8');
}
