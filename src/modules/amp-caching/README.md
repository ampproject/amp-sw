# amp-caching module
AMP caching module is a mendatory module and is bundles with in core `amp-sw.js`.
This provides a caching for AMP resources, which mainly includes the unversioned/versioned jS binaries that we deploy as part of AMP deployment.

The AMP deployed binaries and their caching strategies will be as follows:

- Unversioned
These are the binaries which the publishers are required to add in their AMP documents and have no {rtv} numbers in their path. E.g. https://cdn.ampproject.org/v0.js
Since these files are not cached for a long time and are always referred by the same path, its best suited for the service worker to cache these files with a stale-while-revalidate strategy where every request to these resources will respond from cache and fetch a new copy to update the cache.

    **Cache purge:**
These files have a default cache period of 5 minutes, but in order to provide network resiliency, we will allow these files to stay for a day and be updated with staleWhileRevalidate.

- Versioned
The files that are referred with the {rtv} version in their path can be safely assumed to be
Immutable forever and thus makes a clear sense to have them cache-first strategy. As these resources never change so any copy once stored in the cache does not need to be updated ever.

    **Cache purge:**
These files will be cached for a max life of 14 days, as AMP deploys a new set of files every week. So all older entries will be purged with a grace period of 7 days.


## Options:
This module accepts no options and is not configurable.