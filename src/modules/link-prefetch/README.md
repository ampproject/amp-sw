# link-prefetch module

This module enables a guaranteed cross browser prefetching of outgoing links on an AMP page.


**Config Options:**

The only config this module accepts is the number of seconds a page can remain in the service worker cache.

```
{
    maxAgeSecondsInCache: 5
}
```

**How to use:**

In order to include this module in the service worker use the config key and its options in the following manner

```
importScripts('https://cdn.ampproject.org/sw/amp-sw.js');
AMP_SW.init({
    linkPrefetchOptions: {} // config options here
})
```

In additions with this the outgoing links that you want to be precached need to have the attribute `data-rel="prefetch"`.
e.g. `<a href='/' data-rel='prefetch'>`
