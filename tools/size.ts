import { existsSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { build, type Rollup } from 'vite';
import { BUNDLES, createViteConfig } from '../config/base.js';

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
  let baselineRaw = 0;
  let baselineGzip = 0;

  for (const bundle of BUNDLES) {
    const result = await build(
      createViteConfig(bundle, {
        top: { logLevel: 'silent' },
        build: { write: false },
      }),
    );
    const output = (Array.isArray(result) ? result[0] : result) as Rollup.RollupOutput;
    const chunk = output.output[0];
    const code = 'code' in chunk ? chunk.code : '';
    const buf = Buffer.from(code, 'utf8');
    const gz = gzipSync(buf, { level: 9 });
    const diskSize = existsSync(bundle.diskPath) ? statSync(bundle.diskPath).size : -1;
    const disk =
      diskSize === -1 ? 'MISSING' : diskSize === buf.length ? 'OK' : `STALE (${diskSize} B)`;

    if (bundle.key === 'core' || bundle.key === 'essentials') {
      baselineRaw += buf.length;
      baselineGzip += gz.length;
    }

    rows.push({
      bundle: bundle.diskPath.replace(/^dist\/js\//, ''),
      rawBytes: buf.length,
      rawKB: `${kb(buf.length)} KB`,
      gzipBytes: gz.length,
      gzipKB: `${kb(gz.length)} KB`,
      disk,
    });
  }

  console.table(rows);
  console.log(
    `Default UI Baseline (core + essentials): ${kb(baselineRaw)} KB raw (${baselineRaw} B) | ${kb(baselineGzip)} KB gzip (${baselineGzip} B)`,
  );
  console.log(
    `vs v0.7.16 (uikit + core + comp):       ${signedDelta(baselineRaw, V07_CORE_UI_RAW)} raw | ${signedDelta(baselineGzip, V07_CORE_UI_GZIP)} gzip`,
  );
}

void main();
