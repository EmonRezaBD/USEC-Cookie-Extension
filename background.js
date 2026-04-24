// background.js — service worker

const IGNORED_SCHEMES = ["chrome://", "chrome-extension://", "about:", "data:", "file://"];

const shownForTab = {}; // tabId -> hostname

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    // Wait for complete — more reliable on Windows than "loading"
    if (changeInfo.status !== "complete") return;
    if (!tab.url) return;

    var isIgnored = IGNORED_SCHEMES.some(function (s) { return tab.url.startsWith(s); });
    if (isIgnored) return;

    var hostname;
    try {
        hostname = new URL(tab.url).hostname;
    } catch (e) {
        return;
    }

    if (shownForTab[tabId] === hostname) return;
    shownForTab[tabId] = hostname;

    // First try sending to already-injected content script
    chrome.tabs.sendMessage(tabId, {
        type: "SHOW_COOKIE_OVERLAY",
        hostname: hostname
    }, function (response) {
        if (chrome.runtime.lastError) {
            // Content script not ready — inject it, then send after a short wait
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ["content.js"]
            }, function () {
                if (chrome.runtime.lastError) return;
                // Small wait for script to register its listener
                setTimeout(function () {
                    chrome.tabs.sendMessage(tabId, {
                        type: "SHOW_COOKIE_OVERLAY",
                        hostname: hostname
                    }, function () {
                        // Ignore any remaining errors
                        var _ = chrome.runtime.lastError;
                    });
                }, 100);
            });
        }
    });
});

chrome.tabs.onRemoved.addListener(function (tabId) {
    delete shownForTab[tabId];
});