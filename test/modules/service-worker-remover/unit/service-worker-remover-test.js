import sinon from 'sinon';
import test from 'ava';
import { ServiceWorkerRemover } from '../../../../lib/modules/service-worker-remover';
import { AMP_PUBLISHER_CACHE } from '../../../../lib/modules/document-caching/constants';

const swRemover = new ServiceWorkerRemover();

test('Service worker remover.', async t => {
  global.caches = {
    delete: name => {
      if (name === AMP_PUBLISHER_CACHE) {
        return Promise.reject();
      }
      return Promise.resolve(true);
    },
  };
  const deleteSpy = sinon.spy(global.caches, 'delete');
  try {
    await swRemover.cleanCacheStorage();
  } catch (e) {}

  t.assert(deleteSpy.callCount === 5);
});
