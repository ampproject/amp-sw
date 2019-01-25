
[![build](https://travis-ci.org/ampproject/amp-sw.svg?branch=master)](https://travis-ci.org/ampproject/amp-sw.svg?branch=master)
# AMP Service worker
AMP service worker is a service worker library for your AMP pages.

The project aims to bring network resiliency and other network related optimizations to any AMP page which is being controlled by this service worker.
Core use cases:
- Cache AMP scripts with a `stale-while-revalidate` strategy for a longer duration that http-headers.
- Cache valid visited AMP documents, and serve only in case of flaky network conditions.
- Cache assets which are critical to a page with a given stategy.
- Prefetch outgoing linksfrom an AMP page.
- Cache an offline page in order to show when a user navigates to a page which was previously not visited.


## Usage
In order to use this library user can include the library with an importScript in their service worker

```
importScript('https://cdn.ampproject.org/amp-sw.js');
AMP_SW.init({});
```

## Modules
AMP service worker is made up of multiple modules that help it achieve the above said functionality

1. Amp Caching - [Mandatory]
This module caches the amp-scripts deployed to amp cdn and help them cache reliably.
This module makes sure that the scripts demanded by the pages are delivered from the cache and the cahe itself is kept as fresh as possible,

2. Document Caching - [Mandatory]
This module is responsible for caching publisher’s AMP document.
By default, all AMP documents will be cached with a network-first strategy as this will ensure the freshness of the document is never hampered by the presence of the service worker.

3. Asset Caching - [Optional]
This is an optional module, which the publisher can use to tell us about the assets that are important for a page’s completeness. These can be static assets like images and more but not an HTML file as it might conflict with a navigation route.

4. Prefetch outgoing links - [Optional]
This will be another optional module which the publisher can opt into and express their will to prefetch any outgoing same-origin links from their AMP pages, thus increasing the performance for the user when navigation from an AMP page to a NON AMP page.

5. Offline module - [Optional]
This module will let the publisher specify an offline page which is to be shown in case the user navigates to page which wa not previously visited.