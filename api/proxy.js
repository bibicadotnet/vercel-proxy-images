// api/proxy.js
const { parse } = require('url');

module.exports = async (req, res) => {
  try {
    const { hostname, pathname, search } = parse(req.url);
    
    // Kiểm tra nếu request đến từ i.bibica.net
    if (hostname === 'i.bibica.net' || req.headers.host === 'i.bibica.net') {
      let targetUrl;
      let customHeaders = {
        'content-type': 'image/webp',
        'X-Served-By': 'Vercel Serverless',
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache 1 năm cho static images
      };

      if (pathname.startsWith('/avatar')) {
        targetUrl = new URL(`https://secure.gravatar.com/avatar${pathname.replace('/avatar', '')}${search || ''}`);
        customHeaders['X-Served-By'] = 'Vercel Serverless & Gravatar';
        // Gravatar avatars có thể thay đổi, giảm thời gian cache
        customHeaders['Cache-Control'] = 'public, max-age=3600';
      } 
      else if (pathname.startsWith('/comment')) {
        targetUrl = new URL(`https://i0.wp.com/comment.bibica.net/static/images${pathname.replace('/comment', '')}${search || ''}`);
        customHeaders['X-Served-By'] = 'Vercel Serverless & Artalk & Jetpack';
      } 
      else {
        targetUrl = new URL(`https://i0.wp.com/bibica.net/wp-content/uploads${pathname}${search || ''}`);
        customHeaders['X-Served-By'] = 'Vercel Serverless & Jetpack';
      }

      const fetchResponse = await fetch(targetUrl.toString(), {
        headers: {
          'Accept': req.headers['accept'] || '*/*',
          'User-Agent': req.headers['user-agent'] || 'Vercel Proxy Bot'
        }
      });

      if (!fetchResponse.ok) {
        throw new Error(`Upstream server responded with ${fetchResponse.status}`);
      }

      // Copy relevant headers from upstream
      const headersToKeep = ['link', 'etag', 'last-modified'];
      headersToKeep.forEach(header => {
        const value = fetchResponse.headers.get(header);
        if (value) {
          customHeaders[header] = value;
        }
      });

      // Keep the original x-cache header and append our status
      const upstreamCache = fetchResponse.headers.get('x-nc');
      customHeaders['X-Cache'] = upstreamCache ? 
        `${upstreamCache} vercel` : 
        'MISS vercel';

      const imageBuffer = await fetchResponse.arrayBuffer();

      res.writeHead(200, customHeaders);
      res.end(Buffer.from(imageBuffer));
    } else {
      res.writeHead(404, { 
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-store'
      });
      res.end(`Request not supported: ${hostname} does not match any rules.`);
    }
  } catch (error) {
    console.error('Proxy error:', error);
    res.writeHead(500, { 
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-store'
    });
    res.end(`Internal server error: ${error.message}`);
  }
};
