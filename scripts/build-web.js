import { rm, mkdir, readdir, copyFile } from 'node:fs/promises';
import { join } from 'node:path';

const sourceDir = join(process.cwd(), 'apps', 'web', 'src');
const targetDir = join(process.cwd(), 'public');
const ASSET_ALLOWLIST = new Set([
  'index.html',
  'styles.css',
  'app.js',
  'sw.js',
  'manifest.webmanifest'
]);

async function buildWeb() {
  await rm(targetDir, { recursive: true, force: true });
  await mkdir(targetDir, { recursive: true });

  const files = await readdir(sourceDir);
  const copyTargets = files.filter((file) => ASSET_ALLOWLIST.has(file));

  await Promise.all(copyTargets.map((file) => copyFile(join(sourceDir, file), join(targetDir, file))));

  console.log(`[build:web] copied ${copyTargets.length} files to public/`);
}

buildWeb().catch((error) => {
  console.error('[build:web] failed', error);
  process.exit(1);
});
