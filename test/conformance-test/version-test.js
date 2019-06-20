import test from 'ava';
import * as fs from 'fs';
import { promisify } from 'util';
import { resolve } from 'path';
import { version } from '../../package.json';

const readFile = promisify(fs.readFile);

test('should have the package version for the bundle', async t => {
  const entryBundlePath = resolve(__dirname, '../../dist/amp-sw.js');
  const entryBundleContent = await readFile(entryBundlePath, 'utf-8');
  t.assert(entryBundleContent.startsWith(`/*! AMP_SW_v${version} */`));
});
