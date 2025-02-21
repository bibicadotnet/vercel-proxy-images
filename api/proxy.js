export default async function handler(req) {
  const url = new URL(req.url);
  
  // Chỉ xử lý các request tới i.bibica.net
  if (url.hostname === 'i.bibica.net') {
    try {
      if (url.pathname.startsWith('/avatar')) {
        // Chuyển hướng avatar sang Gravatar
        const gravatarUrl = new URL(req.url);
        gravatarUrl.hostname = 'secure.gravatar.com';
        gravatarUrl.pathname = '/avatar' + url.pathname.replace('/avatar', '');
        
        const gravatarResponse = await fetch(gravatarUrl, {
          headers: {
            'Accept': req.headers.get('Accept') || '*/*'
          }
        });

        return new Response(gravatarResponse.body, {
          headers: {
            'content-type': 'image/webp',
            'link': gravatarResponse.headers.get('link'),
            'X-Cache': gravatarResponse.headers.get('x-nc'),
            'X-Served-By': 'Vercel Edge & Gravatar'
          }
        });

      } else if (url.pathname.startsWith('/comment')) {
        // Chuyển hướng comment images sang WordPress.com
        const commentUrl = new URL(req.url);
        commentUrl.hostname = 'i0.wp.com';
        commentUrl.pathname = '/comment.bibica.net/static/images' + url.pathname.replace('/comment', '');
        
        const commentResponse = await fetch(commentUrl, {
          headers: {
            'Accept': req.headers.get('Accept') || '*/*'
          }
        });

        return new Response(commentResponse.body, {
          headers: {
            'content-type': 'image/webp',
            'link': commentResponse.headers.get('link'),
            'X-Cache': commentResponse.headers.get('x-nc'),
            'X-Served-By': 'Vercel Edge & Artalk & Jetpack'
          }
        });

      } else {
        // Chuyển hướng mặc định sang WordPress.com
        const wpUrl = new URL(req.url);
        wpUrl.hostname = 'i0.wp.com';
        wpUrl.pathname = '/bibica.net/wp-content/uploads' + url.pathname;
        wpUrl.search = url.search;
        
        const imageResponse = await fetch(wpUrl, {
          headers: {
            'Accept': req.headers.get('Accept') || '*/*'
          }
        });

        return new Response(imageResponse.body, {
          headers: {
            'content-type': 'image/webp',
            'link': imageResponse.headers.get('link'),
            'X-Cache': imageResponse.headers.get('x-nc'),
            'X-Served-By': 'Vercel Edge & Jetpack'
          }
        });
      }
    } catch (error) {
      return new Response(`Error processing request: ${error.message}`, {
        status: 500
      });
    }
  }

  // Trả về lỗi 404 nếu không khớp với bất kỳ quy tắc nào
  return new Response(`Request not supported: ${url.hostname} does not match any rules.`, {
    status: 404
  });
}
