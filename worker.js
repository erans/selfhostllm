import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

// Worker to serve static assets
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event));
});

async function handleRequest(event) {
  const url = new URL(event.request.url);
  const path = url.pathname;

  try {
    // Redirect /mac to /mac/ with a 301
    if (path === '/mac') {
      return Response.redirect(`${url.origin}/mac/`, 301);
    }
    
    // For /mac/ path, serve the index.html
    if (path === '/mac/') {
      const modifiedRequest = new Request(`${url.origin}/mac/index.html`, event.request);
      const response = await getAssetFromKV(event, {
        mapRequestToAsset: () => modifiedRequest,
        cacheControl: {
          browserTTL: 31536000, // 1 year
          edgeTTL: 86400, // 1 day
        },
      });
      
      const headers = new Headers(response.headers);
      headers.set('Access-Control-Allow-Origin', '*');
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers,
      });
    }

    // Try to serve static assets from KV normally
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
    // Return proper 404 for missing assets
    return new Response('Not Found', { status: 404 });
  }
}