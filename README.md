# Thanks OSGeo Map

A message map celebrating the OSGeo Foundation's 20th anniversary. Drop a pin anywhere on the map and leave your message.

**Live**: https://asahina820.github.io/thanks-osgeo-map/

## Features

- Drop a pin on the map and submit a message
- View all submitted messages as points on the map
- Click a point to see the message in a popup
- Mobile-friendly with a bottom sheet UI

## Tech Stack

| Category      | Technology                                                                  |
| ------------- | --------------------------------------------------------------------------- |
| Map           | [MapLibre GL JS](https://maplibre.org/)                                     |
| Frontend      | [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| Build         | [Vite](https://vite.dev/)                                                   |
| Styling       | [Tailwind CSS v4](https://tailwindcss.com/)                                 |
| UI Components | [shadcn/ui](https://ui.shadcn.com/) ([Base UI](https://base-ui.com/))       |
| Backend       | [Cloudflare Workers](https://workers.cloudflare.com/)                       |
| CMS           | [Re:Earth CMS](https://reearth.io/product/cms)                              |

## Getting Started

```bash
npm install
npm run dev
```

### Configuration

Set the backend URL in `src/config.ts`:

```ts
export const CONFIG = {
  backendUrl: "https://your-worker.workers.dev",
} as const;
```
