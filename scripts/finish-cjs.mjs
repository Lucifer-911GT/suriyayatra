// dist/cjs holds CommonJS files; mark the folder so Node does not read them as ESM.
import { writeFileSync } from 'node:fs';
writeFileSync(new URL('../dist/cjs/package.json', import.meta.url), '{ "type": "commonjs" }\n');
