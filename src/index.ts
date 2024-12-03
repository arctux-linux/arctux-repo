export default {
  async fetch(request, env, context): Promise<Response> {
    const url = new URL(request.url);
    const cache = caches.default;
    const cacheKey = new Request(url.toString(), request);
    const objectKey = url.pathname.slice(1);

    let response = await cache.match(cacheKey);
    console.log({ event: response ? 'cache_hit' : 'cache_miss', url: request.url });
    if (response) {
      return response;
    }

    const object = await getObjectFor(objectKey, env);
    if (!object) {
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

async function getObjectFor(objectKey: string, env: Env): Promise<R2ObjectBody | null> {
  // Minor optimization: No need to query the bucket if the object key does not
  // start with a known path prefix.
  if (objectKey === '' || !objectKey.startsWith('aarch64/')) {
    return null;
  }

  return env.REPO_BUCKET.get(objectKey);
}
