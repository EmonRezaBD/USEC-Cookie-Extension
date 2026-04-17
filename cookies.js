// Simulated cookie data — swap with chrome.cookies.getAll() later for real cookie data
const MOCK_COOKIES = [
    { name: "session_id", domain: "mystore.com", type: "session", purpose: "essential", firstParty: true },
    { name: "user_pref", domain: "mystore.com", type: "persistent", purpose: "preference", firstParty: true },
    { name: "_ga", domain: "google.com", type: "persistent", purpose: "performance", firstParty: false },
    { name: "_fbp", domain: "facebook.com", type: "persistent", purpose: "advertising", firstParty: false },
    { name: "cart_token", domain: "mystore.com", type: "session", purpose: "essential", firstParty: true },
    { name: "lang", domain: "mystore.com", type: "persistent", purpose: "preference", firstParty: true },
    { name: "_gid", domain: "google.com", type: "session", purpose: "performance", firstParty: false },
    { name: "tw_ct", domain: "twitter.com", type: "persistent", purpose: "social", firstParty: false },
    { name: "auth_token", domain: "mystore.com", type: "session", purpose: "essential", firstParty: true },
    { name: "ab_test", domain: "mystore.com", type: "persistent", purpose: "performance", firstParty: true },
    { name: "li_gc", domain: "linkedin.com", type: "persistent", purpose: "advertising", firstParty: false },
    { name: "csrf_token", domain: "mystore.com", type: "session", purpose: "essential", firstParty: true },
];

function categorizeCookies(cookies) {
    const byPurpose = {}, byType = {}, byOrigin = { firstParty: 0, thirdParty: 0 };

    cookies.forEach(c => {
        byPurpose[c.purpose] = (byPurpose[c.purpose] || 0) + 1;
        byType[c.type] = (byType[c.type] || 0) + 1;
        c.firstParty ? byOrigin.firstParty++ : byOrigin.thirdParty++;
    });

    return { cookies, byPurpose, byType, byOrigin, total: cookies.length };
}

// Export
window.CookieData = { MOCK_COOKIES, categorizeCookies };