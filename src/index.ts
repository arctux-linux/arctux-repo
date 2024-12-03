export default {
  async fetch(request, env, context): Promise<Response> {
    const url = new URL(request.url);

    // Construct the cache key from the cache URL
    const cacheKey = new Request(url.toString(), request);
    const cache = caches.default;

    // Check whether the value is already available in the cache
    // if not, you will need to fetch it from R2, and store it in the cache
    // for future access
    let response = await cache.match(cacheKey);
    console.log({ event: response ? 'cache_hit' : 'cache_miss', url: request.url });
    if (response) {
      return response;
    }

    const objectKey = url.pathname.slice(1);

    // No need to query the bucket if the object key does not start with a
    // known path prefix.
    if (objectKey === '' || !objectKey.startsWith('aarch64/')) {
      return new Response('Object Not Found', { status: 404 });
    }

    // If not in cache, get it from R2
    const object = await env.REPO_BUCKET.get(objectKey);
    if (object === null) {
      return new Response('Object Not Found', { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.append('Cache-Control', 's-maxage=3600');

    response = new Response(object.body, { headers });
    context.waitUntil(cache.put(cacheKey, response.clone()));

    return response;
  },
} satisfies ExportedHandler<Env>;
