# AI Job Hunt Assistant — Chrome Extension

Reads job posts on **LinkedIn, Naukri, Indeed** (and any site via the generic
extractor) and sends them to your local **Job Hunt Assistant** service for
scoring, CV tailoring and assisted application prep.

**Supervised only.** The extension **reads** job pages — it never fills,
submits, or automates a form. Automation control lives in the app (autonomy
modes + the continuous scheduler), always with human checkpoints.

## Install (load unpacked)

1. Start the local app: `npm run dev` → http://localhost:3000
2. Open `chrome://extensions`
3. Enable **Developer mode** (top right)
4. **Load unpacked** → select the `extension/` folder
5. Pin the extension icon

## Usage

- Open a job page on LinkedIn / Naukri / Indeed. The extension auto-extracts it.
- Click the extension icon → **Send to Job Hunt** → the job is scored and queued.
- On any other site, click **Extract this page** (injects the generic extractor).
- Optionally enable **Auto-send** to push detected jobs automatically.
- Set **Local service URL** if your app runs elsewhere (default
  `http://localhost:3000`).

## How it works

```
content/portal.js  → detects portal, extracts RawJobInput, stores locally
background.js      → persists job, POSTs to {base}/api/ingest (if auto-send)
popup              → shows extracted job, health check, manual send
content/generic.js → on-demand JSON-LD/meta extraction for any site
```

The extracted payload follows the `RawJobInput` contract
(`src/lib/engine/ingest.ts`) and is validated/normalized server-side by
`src/lib/adapters`.

## Files

| Path | Purpose |
| --- | --- |
| `manifest.json` | MV3 manifest, permissions, host_permissions |
| `background.js` | Service worker: storage, API calls, on-demand injection |
| `content/portal.js` | LinkedIn / Naukri / Indeed extractors |
| `content/generic.js` | Generic extractor (JSON-LD / meta tags) |
| `popup/` | Extension popup UI |
| `icons/` | Generated PNG icons |
| `tools/gen-icons.mjs` | Zero-dependency icon generator |

## Permissions

- `activeTab` + `scripting` — to inject the generic extractor on demand.
- `storage` — to remember the extracted job and your settings.
- `host_permissions` — to reach `http://localhost` and the three job portals.

## Security

- No CAPTCHA solving, no bot-evasion, no hidden automation.
- Only reads pages; sends extracted text to your local service.
- Your API base URL and data stay on your machine.
