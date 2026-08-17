# whispers.news

The marketing site for [Whispers](https://github.com/Atelier-Dakroub/whispers) —
one page describing the product, and a thank-you page buyers return to after
checkout. The product itself lives in the other repository.

```sh
npm install
npm run dev            # http://localhost:1970
```

Port 1970 because 1960 belongs to the app. Both run at once during a copy
change, so the page and the thing it describes can be read side by side.

A page is an `.html` file in `app/routes/`; the directory tree is the route
table. Every page here is prerendered — the build reports `0 routes left to the
server` — so there is nothing dynamic to host.

## Deploying

```sh
npm run deploy         # build, bundle, ship to Cloudflare
npm run deploy:www     # only when the www redirect changes
```

`npm run bundle` is the step worth knowing about. `transclude-build` writes
three directories and only one of them is pages: `dist/static` holds the
prerendered HTML, `dist/client` the hashed CSS and JS it asks for at `/assets/…`,
and `dist/public` whatever was in `public/`. The build says `dist/static` is
self-contained, and for this site it is not — a host given only that directory
answers every page with a stylesheet that 404s. `scripts/bundle-static.js`
merges the three into `dist/site` and drops the `.br`/`.gz` twins, which
Cloudflare would otherwise publish as URLs of their own.

Two workers, deliberately:

| | |
| --- | --- |
| `wrangler.jsonc` | the site, on `whispers.news` |
| `wrangler.www.jsonc` | `www.whispers.news`, which 301s to the apex |

The redirect is its own worker because the site has no script at all. Assets are
matched before a worker runs, so a redirect living in the main worker would
never fire for `/` without `run_worker_first` — and that would put a script in
front of every request to the real site to serve a hostname nobody should land
on twice.

## The share card

`app/og/card.svg` is the source. `app/public/og.png` is what ships, and it is
committed rather than built, so neither CI nor a fresh clone needs a converter.

```sh
brew install librsvg    # once
npm run og              # after editing the SVG
```

Check the PNG before you commit it. `rsvg-convert` draws with the fonts on the
machine, so a face that is missing falls back without a warning.

The card is drawn as the product — a masthead, a day heading, headline rows with
their sources — so somebody who meets it in Slack has already seen what is for
sale. 1200 by 630 is the size every scraper crops to. It must stay PNG: most
scrapers will not render an SVG.

Validate the card against Facebook, X, Slack and iMessage after a deploy — each
one caches what it fetched, so a fix to the PNG is not the same as a fix to the
preview they already hold.

## Selling it

Purchases go through [Polar](https://polar.sh), a merchant of record, so sales
tax and VAT are handled and the buyer gets the invoice the pricing page
promises. The checkout link is created in the Polar dashboard and pasted into
`app/routes/_layout.html`, in one place.

**Do not wire Polar's license keys into the app.** Polar can issue keys with
activation limits and a validation endpoint, and it is tempting. But the pricing
page says, in as many words, that there is no key to enter and nothing counting
installs — and the footer credit is honest for the same reason. A key check
would make both of those false, turn every buyer's outage into your outage, and
buy nothing: the license is a legal instrument, and someone willing to ignore it
is equally willing to delete the check from source they were handed.

Treat the key, if you issue one at all, as a receipt.

## Commands

| | |
| --- | --- |
| `npm run dev` | dev server, hot reload |
| `npm run check` | types, from the shapes the loaders return |
| `npm run build` | write `dist/` |
| `npm run bundle` | merge the build into `dist/site` |
| `npm run preview` | build, then serve it |
| `npm run deploy` | build, bundle and ship |
| `npm run deploy:www` | ship the www redirect |
