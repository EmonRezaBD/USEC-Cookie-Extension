const COLORS_PURPOSE = ["#E24B4A", "#EF9F27", "#639922", "#378ADD", "#D4537E"];
const COLORS_DURATION = ["#E24B4A", "#639922"];
const COLORS_ORIGIN = ["#378ADD", "#EF9F27"];
const PURPOSE_LABELS = {
    essential: "Essential", preference: "Preference",
    performance: "Performance", advertising: "Advertising", social: "Social"
};

document.addEventListener("DOMContentLoaded", () => {
    const { MOCK_COOKIES, categorizeCookies } = window.CookieData;
    const { drawDonut, drawBars } = window.Charts;
    const stats = categorizeCookies(MOCK_COOKIES);

    // Badge
    document.getElementById("total-badge").textContent = stats.total + " cookies";

    // Donut charts
    drawDonut("chart-purpose", stats.byPurpose, COLORS_PURPOSE);
    drawDonut("chart-type", stats.byType, COLORS_DURATION);

    // Legends
    renderLegend("legend-purpose", stats.byPurpose, COLORS_PURPOSE, PURPOSE_LABELS);
    renderLegend("legend-type", stats.byType, COLORS_DURATION, {});

    // Bar chart
    drawBars("bars-origin", stats.byOrigin, COLORS_ORIGIN);

    // Cookie list
    renderCookieList(stats.cookies);
});

function renderLegend(id, data, colors, labels) {
    const el = document.getElementById(id);
    el.innerHTML = Object.entries(data).map(([key, val], i) => `
    <div class="legend-item">
      <span class="dot" style="background:${colors[i % colors.length]}"></span>
      <span>${labels[key] || key} (${val})</span>
    </div>
  `).join("");
}

function renderCookieList(cookies) {
    const container = document.getElementById("cookie-rows");
    container.innerHTML = cookies.map(c => `
    <div class="cookie-row">
      <div class="cookie-name">${c.name}</div>
      <div class="cookie-meta">
        <span class="tag tag-${c.purpose}">${c.purpose}</span>
        <span class="tag">${c.type}</span>
        <span class="tag tag-origin">${c.firstParty ? "1st party" : "3rd party"}</span>
        <span class="domain">${c.domain}</span>
      </div>
    </div>
  `).join("");
}