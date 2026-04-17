# Gas Quebec

Gas Quebec is a mobile-first bilingual Leaflet web app that loads Quebec gas station prices from the Regie de l'energie GeoJSON feed, renders compact always-visible price labels, and opens Google Maps driving navigation for each visible station.

## File Structure

```text
GasQuebec/
├── index.html      # App shell and external Leaflet/pako scripts
├── styles.css      # Mobile-first layout, map controls, labels, price colors
├── app.js          # Data loading, gzip parsing, geolocation, ranking, Leaflet label layer
├── README.md       # Setup and implementation notes
└── StartPrompt.txt # Original project prompt
```

## Setup

No build step is required.

Run a local static server:

```bash
python3 -m http.server 8765
```

Open:

```text
http://127.0.0.1:8765/index.html
```

Use `localhost`, `127.0.0.1`, or HTTPS in production. Mobile browsers generally block geolocation from plain `http://` origins except localhost.

## Key Technical Choices

- Leaflet powers the map, with OpenStreetMap raster tiles.
- The station feed is fetched from `https://regieessencequebec.ca/stations.geojson.gz`.
- The app detects whether the response bytes are gzip-compressed. It uses the browser `DecompressionStream` API when available and falls back to `pako` for older browsers.
- Station records are normalized defensively: invalid coordinates, missing prices, unavailable fuel types, and unknown fuel names are skipped safely.
- Distances are computed with the Haversine formula from the current user location and refreshed when the user moves meaningfully or after a periodic timeout.
- A custom Leaflet layer renders HTML station labels only in the current map view. It uses a collision grid and zoom-aware limits to keep dense areas readable while preserving high price visibility.
- Price competitiveness is computed per fuel type against comparable stations within 50 km. When at least four comparable prices exist, the local percentile is colored green, yellow, or red.
- The UI text is driven by a simple `I18N` dictionary in `app.js`; the FR/EN toggle rerenders controls and visible station labels.

## Caveats

- Geolocation requires user permission and a secure context. If permission is denied, the app still loads the Quebec map and station labels, but distances remain `-- km`.
- Browser geolocation accuracy varies by device, OS settings, and signal quality. The app uses `watchPosition` with cached readings allowed to reduce battery use.
- The gzip feed must be reachable from the browser and must allow cross-origin reads. If the upstream server changes CORS headers, serve the feed through your own backend/proxy.
- The Google Maps URL uses the official directions endpoint with `travelmode=driving` and `dir_action=navigate`. On mobile, Google decides whether to open the installed app, a browser tab, or the directions preview.
- CDN dependencies are used for Leaflet and pako. For stricter production deployments, vendor and pin these assets locally.
