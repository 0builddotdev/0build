import { existsSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { build, type Rollup } from 'vite';

const BUNDLES = ['core', 'components', 'runtime', 'icon', 'chart', 'rte'] as const;
const V07_CORE_UI_RAW = 295_285; // uikit.min.js (153,729) + core (48,747) + components (92,809)
const V07_CORE_UI_GZIP = 94_801; // uikit.min.js (53,114) + core (17,303) + components (24,384)

interface BundleRow {
  bundle: string;
  rawBytes: number;
  rawKB: string;
  gzipBytes: number;
  gzipKB: string;
  disk: string;
}

const kb = (bytes: number): string => (bytes / 1024).toFixed(2);
const signedDelta = (curr: number, base: number): string => {
  const diff = curr - base;
  const pct = ((diff / base) * 100).toFixed(1);
  const sign = diff >= 0 ? '+' : '';

  return `${sign}${kb(diff)} KB (${sign}${pct}%)`;
};

async function main(): Promise<void> {
  const rows: BundleRow[] = [];
  let coreUiRaw = 0;
  let coreUiGzip = 0;

  for (const name of BUNDLES) {
    const result = await build({
      configFile: `config/${name}.js`,
      logLevel: 'silent',
      build: { write: false },
    });
    const output = (Array.isArray(result) ? result[0] : result) as Rollup.RollupOutput;
    const chunk = output.output[0];
    const code = 'code' in chunk ? chunk.code : '';
    const buf = Buffer.from(code, 'utf8');
    const gz = gzipSync(buf, { level: 9 });
    const diskPath = `dist/js/${name}.iife.js`;
    const diskSize = existsSync(diskPath) ? statSync(diskPath).size : -1;
    const disk =
      diskSize === -1 ? 'MISSING' : diskSize === buf.length ? 'OK' : `STALE (${diskSize} B)`;

    if (name === 'core' || name === 'components') {
      coreUiRaw += buf.length;
      coreUiGzip += gz.length;
    }

    rows.push({
      bundle: `${name}.iife.js`,
      rawBytes: buf.length,
      rawKB: `${kb(buf.length)} KB`,
      gzipBytes: gz.length,
      gzipKB: `${kb(gz.length)} KB`,
      disk,
    });
  }

  console.table(rows);
  console.log(
    `Core UI Total (core + components): ${kb(coreUiRaw)} KB raw (${coreUiRaw} B) | ${kb(coreUiGzip)} KB gzip (${coreUiGzip} B)`,
  );
  console.log(
    `vs v0.7.16 (uikit + core + comp):  ${signedDelta(coreUiRaw, V07_CORE_UI_RAW)} raw | ${signedDelta(coreUiGzip, V07_CORE_UI_GZIP)} gzip`,
  );
}

void main();
