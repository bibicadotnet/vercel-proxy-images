export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `https://${req.headers.host}`);
    
    if (url.hostname === 'i.bibica.net') {
      let targetUrl, serviceInfo;
      
      if (url.pathname.startsWith('/avatar')) {
        targetUrl = new URL(url.pathname.replace('/avatar', ''), 'https://secure.gravatar.com/avatar');
        serviceInfo = 'Vercel & Gravatar';
      } else if (url.pathname.startsWith('/comment')) {
        targetUrl = new URL(url.pathname.replace('/comment', ''), 'https://i0.wp.com/comment.bibica.net/static/images');
        serviceInfo = 'Vercel & Artalk & Jetpack';
      } else {
        targetUrl = new URL(url.pathname, 'https://i0.wp.com/bibica.net/wp-content/uploads');
        serviceInfo = 'Vercel & Jetpack';
      }
      
      targetUrl.search = url.search;
      
      const response = await fetch(targetUrl.toString(), {
        headers: { 'Accept': req.headers.accept || '*/*' }
      });

      if (!response.ok) {
        throw new Error(`Upstream server responded with ${response.status}`);
      }

      const buffer = await response.arrayBuffer();

      res.setHeader('Content-Type', 'image/webp');
      res.setHeader('Link', response.headers.get('link'));
      res.setHeader('X-Cache', response.headers.get('x-nc'));
      res.setHeader('X-Served-By', serviceInfo);
      
      return res.status(200).send(Buffer.from(buffer));
    }

    return res.status(404).json({
      error: `Request not supported: ${url.hostname} does not match any rules.`
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
