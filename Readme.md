# 🍪 Cookie Transparency

A Chrome browser extension that shows you what cookies are already set on a website — **before you click Accept All**.

---

## Screenshots

| Popup View | Overlay on Page |
|:---:|:---:|
| ![Prototype Screenshot 1](images/installedExtension.png) | ![Prototype Screenshot 2](images/outputWindow.png) |

---

## What It Does

- **Auto-popup** — a panel slides in on every new website you visit, just like a cookie consent banner
- **Visualizes cookies** with donut charts broken down by purpose, duration, and origin
- **Risk-coded colors** — red for advertising trackers, green for essential cookies
- **Detailed cookie list** — grouped by purpose or origin, with info links for known trackers like `_fbp` and `_ga`
- **Non-intrusive** — dismiss with one click, won't re-appear on the same site

---

## File Structure

```
USEC-Cookie-Extension/
├── manifest.json                   — Extension config & permissions (must stay in root)
├── README.md
├── LICENSE
│
├── assets/
│   └── icons/
│       ├── icon16.png
│       ├── icon32.png
│       ├── icon48.png
│       └── icon128.png
│
├── src/
│   ├── background/
│   │   └── background.js           — Detects new page navigations
│   │
│   ├── content/
│   │   ├── content.js              — Injects the overlay panel into pages
│   │   └── overlay.css             — Styles for the in-page overlay
│   │
│   ├── popup/
│   │   ├── popup.html              — Toolbar popup UI
│   │   ├── popup.js                — Popup logic & chart rendering
│   │   └── popup.css               — Popup styles
│   │
│   └── shared/
│       ├── cookies.js              — Simulated cookie data
│       └── charts.js               — Donut chart drawing
│
└── images/                         — README screenshots
    ├── installedExtension.png
    └── outputWindow.png
```

---

## Installation

> Requires Google Chrome or any Chromium-based browser (Edge, Brave, etc.)

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** using the toggle in the top-right corner
4. Click **Load unpacked**
5. Select the root `USEC-Cookie-Extension/` folder
6. Pin the extension from the puzzle icon in the toolbar

That's it — navigate to any website and the panel will appear automatically.

---

## How It Works

```
New website visited
       ↓
background.js detects navigation (chrome.tabs.onUpdated)
       ↓
Sends message → content.js
       ↓
Overlay panel injected into page via Shadow DOM
       ↓
Simulated cookie data visualized with charts
```

The overlay runs inside a **Shadow DOM** so it never conflicts with the page's own styles.

---

## Path Rules (for contributors)

Chrome resolves paths differently depending on where they are referenced:

| Location | Path is relative to |
|---|---|
| `manifest.json` | Root of the extension folder |
| `popup.html` script/link tags | `popup.html`'s own location |
| `chrome.runtime.getURL()` | Root of the extension folder |

---

## Compatibility

| Browser | Status |
|---|---|
| Chrome (Windows) | ✅ |
| Chrome (macOS) | ✅ |
| Edge (Chromium) | ✅ |
| Firefox | ❌ Not supported |
| Safari | ❌ Not supported |

---

## Note on Cookie Data

This prototype uses **simulated cookie data** for demonstration purposes. The 12 cookies shown (`session_id`, `_ga`, `_fbp`, etc.) represent a realistic set of what a typical e-commerce site sets. Real cookie detection can be enabled by swapping the mock data in `src/shared/cookies.js` with a live `chrome.cookies.getAll()` call.

---

## Built With

- Vanilla JavaScript — no frameworks
- HTML & CSS (Shadow DOM for isolation)
- Chrome Extension Manifest V3
- Canvas API for donut charts

---

## License

MIT