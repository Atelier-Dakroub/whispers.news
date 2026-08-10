// The marketing site for whispers.news.
//
// The app it sells lives beside this one, in ../whispers, and on GitHub at
// https://github.com/Atelier-Dakroub/whispers.

export default {
  appDir: 'app',
  routesDir: 'routes',
  elementsDir: 'elements',
  stylesheet: 'app/styles/global.css',

  // 1960 belongs to the app. Both run at once during a copy change, so the
  // page and the product it describes can be read side by side.
  port: 1970,

  trailingSlash: 'never',

  // A policy per page, from the hashes of what that page inlines. This site
  // takes no input and holds no session, so it is pure defense in depth — but
  // a page selling a product on its restraint should not be the loose one.
  csp: true,

  // What `ctx.absolute()` resolves against: og:image, canonical, the sitemap.
  metadataBase: 'https://whispers.news',
  sitemap: { hostname: 'https://whispers.news' },

  outDir: 'dist',
  typesFile: 'app/transclude-env.d.ts',
};
