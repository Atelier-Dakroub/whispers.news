// Sends www.whispers.news to whispers.news, keeping the path and the query.
//
// Its own worker rather than a branch inside the site's. The site is a static
// asset worker with no script at all, and adding one would mean turning on
// `run_worker_first` — assets are matched before a worker otherwise, so a
// redirect written there would never run for `/`. That would put a script in
// front of every request to the real site to serve a domain nobody should land
// on twice.
//
//   npm run deploy:www

export default {
  /**
   * @param {Request} request
   * @returns {Response} 301 to the same path on the apex
   */
  fetch(request) {
    const url = new URL(request.url);
    url.hostname = 'whispers.news';

    // 301, because this is permanent and worth caching. The canonical host is
    // in the sitemap and every og:url, so nothing here is provisional.
    return Response.redirect(url.toString(), 301);
  },
};
