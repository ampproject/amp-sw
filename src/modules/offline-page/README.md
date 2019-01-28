# offline-page

This is an optional module which allows user to see a pre-decided offline page if they move to a URL which has not been visited already and the network is absent.

The offine page can be configured as below:

**Config Options:**

This module accepts the config in the following shape:
```
{
  url: string;
  assets: Array<string>;
}
```

**How to use:**

In order to include this module in the service worker use the config key and its options in the following manner

```
importScripts('https://cdn.ampproject.org/sw/amp-sw.js');
AMP_SW.init({
    offlinePageOptions: {} // config options here
})
```
