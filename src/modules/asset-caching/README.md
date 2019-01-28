# asset-caching module
This is an optional module, which the publisher can use to tell us about the assets that are important for a page’s completeness.
These can be static assets like images and more but not an HTML file as it might conflict with a navigation route.
These assets will be cached with one of the three caching strategies(
_[STALE WHILE REVALIDATE](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#stale-while-revalidate),
[CACHE FIRST](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#cache-falling-back-to-network),
[NETWORK FIRST](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#network-falling-back-to-cache)_).
A maximum of 25 such assets can be saved with this module.

In case the publisher wants _[NETWORK ONLY](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#network-only)_ for any of the assets, they can specify the RegExp for the same in a denyList option.

**Cache Purge:**

A maximum of 25 such assets will be cached by this modules and will be purged as more requests come in to replace the least used asset.

**Config Options:**

The module accepts an array of object defined below. It helps the tell the service worker tell about different static assets, where they are located and how to cache them.

```
[
    {
        regexp: RegExp;
        cachingStrategy: 'NETWORK_FIRST' | 'CACHE_FIRST' | 'STALE_WHILE_REVALIDATE';
        denyList?: Array<RegExp>;
    }
]
```

**How to use:**

In order to include this module in the service worker use the config key and its options in the following manner

```
importScripts('https://cdn.ampproject.org/sw/amp-sw.js');
AMP_SW.init({
    assetCachingOptions: {} // config options here
})
```