# LocEdge

This is a simple tool showcasing how to use the [datasets](https://github.com/ruh010/locedge-db) provided in our SIGCOMM'22 demo paper to locate CDN edge servers based on a given HTTP Archive (HAR) file. It tells you the **location**, **provider**, and **cache status** of the CDN edge server that delivered resources for you.

For more information, please refer to our paper "Locating CDN Edge Servers with HTTP Responses" (not yet published).

### API

```javascript
parse(har)
```

- har: the captured HAR file