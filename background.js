// background.js — service worker
// Fires when a tab finishes loading a new page.
// Sends a message to the content script to show the overlay.

const IGNORED_SCHEMES = ["chrome://", "chrome-extension://", "about:", "data:", "file://"];

// Track which tabs we've already shown the overlay for in this session
// so we don't re-show it on every reload — only on domain changes.
const shownForTab = {};   // tabId -> hostname

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Trigger as soon as navigation starts, not after full page load
    if (changeInfo.status !== "loading") return;
    if (!tab.url) return;

    // Skip internal Chrome pages
    const isIgnored = IGNORED_SCHEMES.some(s => tab.url.startsWith(s));
    if (isIgnored) return;

    let hostname;
    try {
        hostname = new URL(tab.url).hostname;
    } catch {
        return;
    }

    // Only show once per unique hostname per tab lifetime
    if (shownForTab[tabId] === hostname) return;
    shownForTab[tabId] = hostname;

    // Fire immediately — no delay needed for simulated data
    chrome.tabs.sendMessage(tabId, {
        type: "SHOW_COOKIE_OVERLAY",
        hostname
    }).catch(() => {
        // Content script not yet ready — inject it on demand as fallback
        chrome.scripting.executeScript({
            target: { tabId },
            files: ["content.js"]
        }).then(() => {
            chrome.tabs.sendMessage(tabId, {
                type: "SHOW_COOKIE_OVERLAY",
                hostname
            }).catch(() => { });
        }).catch(() => { });
    });
});

// Clean up when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
    delete shownForTab[tabId];
});