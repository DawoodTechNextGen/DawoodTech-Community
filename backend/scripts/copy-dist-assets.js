import { copyFileSync } from 'node:fs';

for (const file of ['package.json', 'package-lock.json']) {
  copyFileSync(file, `dist/${file}`);
}
