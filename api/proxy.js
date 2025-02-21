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
        'X-Served-By': 'Vercel Serverless'
      };

      if (pathname.startsWith('/avatar')) {
        // Chuyển hướng avatar sang Gravatar
        targetUrl = new URL(`https://secure.gravatar.com/avatar${pathname.replace('/avatar', '')}${search || ''}`);
        customHeaders['X-Served-By'] = 'Vercel Serverless & Gravatar';
      } 
      else if (pathname.startsWith('/comment')) {
        // Chuyển hướng comment images
        targetUrl = new URL(`https://i0.wp.com/comment.bibica.net/static/images${pathname.replace('/comment', '')}${search || ''}`);
        customHeaders['X-Served-By'] = 'Vercel Serverless & Artalk & Jetpack';
      } 
      else {
        // Chuyển hướng mặc định
        targetUrl = new URL(`https://i0.wp.com/bibica.net/wp-content/uploads${pathname}${search || ''}`);
        customHeaders['X-Served-By'] = 'Vercel Serverless & Jetpack';
      }

      const fetchResponse = await fetch(targetUrl.toString(), {
        headers: {
          'Accept': req.headers['accept'] || '*/*'
        }
      });

      if (!fetchResponse.ok) {
        throw new Error(`Upstream server responded with ${fetchResponse.status}`);
      }

      const imageBuffer = await fetchResponse.arrayBuffer();

      // Copy relevant headers from the upstream response
      if (fetchResponse.headers.get('link')) {
        customHeaders['link'] = fetchResponse.headers.get('link');
      }
      if (fetchResponse.headers.get('x-nc')) {
        customHeaders['X-Cache'] = fetchResponse.headers.get('x-nc');
      }

      res.writeHead(200, customHeaders);
      res.end(Buffer.from(imageBuffer));
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`Request not supported: ${hostname} does not match any rules.`);
    }
  } catch (error) {
    console.error('Proxy error:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(`Internal server error: ${error.message}`);
  }
};
