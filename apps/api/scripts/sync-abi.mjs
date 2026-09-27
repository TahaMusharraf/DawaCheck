import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, '../../../contracts/MedicineRegistry.abi.json');
const target = resolve(here, '../src/chain/abi/medicine-registry.abi.json');

const parsed = JSON.parse(await readFile(source, 'utf8'));
const abi = Array.isArray(parsed) ? parsed : parsed.abi;

if (!Array.isArray(abi) || abi.length === 0) {
  throw new Error(`No ABI found in ${source}`);
}

await mkdir(dirname(target), { recursive: true });
await writeFile(target, `${JSON.stringify(abi, null, 2)}\n`);

const functions = abi.filter((entry) => entry.type === 'function').length;
const events = abi.filter((entry) => entry.type === 'event').length;
console.log(`ABI synced: ${functions} functions, ${events} events -> ${target}`);
