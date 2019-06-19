import sinon from 'sinon';
import test from 'ava';
import { ServiceWorkerRemover } from '../../../../src/modules/service-worker-remover';
import {
  VERSIONED_CACHE_NAME,
  UNVERSIONED_CACHE_NAME,
} from '../../../../src/modules/amp-caching/constants';
import { AMP_ASSET_CACHE } from '../../../../src/modules/asset-caching/constants';
import { AMP_PUBLISHER_CACHE } from '../../../../src/modules/document-caching/constants';
import { AMP_PREFETCHED_LINKS } from '../../../../src/modules/link-prefetch/constants';

const swRemover = new ServiceWorkerRemover();

test.before(() => {
  global.caches = {
    delete: name => Promise.resolve(name),
  };
});

test('Service worker remover should delete all known caches', async t => {
  const deleteSpy = sinon.spy(global.caches, 'delete');
  const result = await swRemover.cleanCacheStorage();
  t.assert(deleteSpy.callCount === 5);
  t.deepEqual(result, [
    VERSIONED_CACHE_NAME,
    UNVERSIONED_CACHE_NAME,
    AMP_ASSET_CACHE,
    AMP_PUBLISHER_CACHE,
    AMP_PREFETCHED_LINKS,
  ]);
});

test('Service worker remover should delete caches even if one of the deletion fails', async t => {
  global.caches = {
    delete: name => {
      if (name === AMP_PUBLISHER_CACHE) {
        return Promise.reject();
      }
      return Promise.resolve(name);
    },
  };
  const deleteSpy = sinon.spy(global.caches, 'delete');
  try {
    await swRemover.cleanCacheStorage();
  } catch (e) {}

  t.assert(deleteSpy.callCount === 5);
});

test('Forced refresh should reset the URLs for all window clients', async t => {
  const url = 'URL';
  const windowClient = {
    url,
    navigate: sinon.stub(),
  };

  const clients = {
    claim: () => Promise.resolve(true),
    matchAll: sinon.stub().returns(
      new Promise(resolve => {
        resolve([windowClient]);
      }),
    ),
  };

  await swRemover.forceRefreshClients(clients);
  t.assert(clients.matchAll.calledOnceWith({ type: 'window' }));
  t.assert(windowClient.navigate.calledOnceWith(url));
});
