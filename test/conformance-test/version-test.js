import test from 'ava';
import * as fs from 'fs';
import { promisify } from 'util';
import { resolve, join } from 'path';
import webpack from 'webpack';
import webpackConfig from '../../webpack.config';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const copyFile = promisify(fs.copyFile);
const deleteFile = promisify(fs.unlink);

const newPackageFile = resolve(join('.', '.test-package.json'));
const version = `${Date.now()}.0.0`;

test.before(async () => {
  await copyFile('./package.json', newPackageFile);
  const packageData = await readFile(newPackageFile, {
    encoding: 'utf-8',
  });
  const packageJSON = JSON.parse(packageData);
  packageJSON.version = version;
  await writeFile(newPackageFile, JSON.stringify(packageJSON));

  const compiler = webpack(webpackConfig({ packageFile: newPackageFile }));
  return new Promise((res, rej) => {
    compiler.run((err, stats) => {
      if (err || (stats && stats.hasErrors())) {
        rej();
      }
      res(stats);
    });
  });
});

test.after(async () => {
  await deleteFile(newPackageFile);
});

test('should have the package version for the bundle', async (t) => {
  t.timeout(240000); // 4 minute timeout for CI.
  const entryBundlePath = resolve(__dirname, '../../dist/amp-sw.js');
  const entryBundleContent = await readFile(entryBundlePath, 'utf-8');
  t.assert(entryBundleContent.startsWith(`/*! AMP_SW_v${version} */`));
});
