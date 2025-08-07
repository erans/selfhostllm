import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

// Worker to serve static assets
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event));
});

async function handleRequest(event) {
  try {
    // Try to serve static assets from KV
    const response = await getAssetFromKV(event, {
      // Cache static assets
      cacheControl: {
        browserTTL: 31536000, // 1 year
        edgeTTL: 86400, // 1 day
      },
    });

    // Add CORS headers if needed
    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: headers,
    });
  } catch (e) {
    // If asset not found, try to serve index.html for SPA routing
    try {
      const notFoundResponse = await getAssetFromKV(event, {
        mapRequestToAsset: (req) => new Request(`${new URL(req.url).origin}/index.html`, req),
      });

      return new Response(notFoundResponse.body, {
        headers: notFoundResponse.headers,
        status: 200, // Return 200 instead of 404 for SPA
      });
    } catch (e) {
      // Return 404 if index.html also not found
      return new Response('Not Found', { status: 404 });
    }
  }
}