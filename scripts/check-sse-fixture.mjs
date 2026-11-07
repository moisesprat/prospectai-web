/* ============================================================
   SSE FIXTURE SYNC CHECK  (Node-only)
   D-10: compares the committed web copy of the SSE contract
   fixture (tests/fixtures/sse_events.json) with the backend-owned
   original, byte for byte. Fails when they differ or the backend
   file is missing.
   Usage: node scripts/check-sse-fixture.mjs [backend-fixture-path]
   Default backend path: ../prospectai-backend/tests/fixtures/sse_events.json
   ============================================================ */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const webCopy = join(root, 'tests', 'fixtures', 'sse_events.json');
const backendCopy = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(root, '..', 'prospectai-backend', 'tests', 'fixtures', 'sse_events.json');

if (!existsSync(webCopy)) {
  console.error(`web fixture copy is missing: ${webCopy}`);
  process.exit(1);
}
if (!existsSync(backendCopy)) {
  console.error(`backend fixture is missing: ${backendCopy}\n(web copy: ${webCopy})`);
  process.exit(1);
}
if (!readFileSync(webCopy).equals(readFileSync(backendCopy))) {
  console.error(
    `sse fixture differs:\n  web:     ${webCopy}\n  backend: ${backendCopy}\n`
    + 'Copy the backend file over the web copy (cp <backend> <web>) and re-run the tests.',
  );
  process.exit(1);
}
console.log('sse fixture in sync');
