# document-caching module.

This is a required module which is responsible for caching publisher’s AMP document.

By default, all AMP documents will be cached with a _[network-first](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#cache-falling-back-to-network)_ strategy as this will ensure the freshness of the document is never hampered by the presence of the service worker.

Since this will primarily be working with _[network-first](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#cache-falling-back-to-network)_ strategy we’ll ensure that this is done with an aggressive timeout of 2s by default, this timeout will be configurable upto a max limit of 5s. Which means if the server does not respond within the configured timeout the page will get a response from cache if present.

The list of documents that are controlled by this module will be open for the publisher to control with the help of allow/deny list RegExp array. Whereas deny list will supersede in preference.

**Config Options:**

This module accepts the config in the following shape:
```
{
  allowList?: Array<RegExp>;
  denyList?: Array<RegExp>;
  timeoutSeconds?: Number;
  maxDocumentsInCache?: Number;
  maxAgeSecondsforDocumentsInCache?: Number;
}
```
**P.S.:** In order to not make the service worker boot time a perf bottleneck, we’ll enable the Navigation-Preload option for all our service workers.
