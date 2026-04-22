const PURPOSE_LABELS = {
  essential: "Essential",
  preference: "Preference",
  performance: "Performance",
  advertising: "Advertising",
  social: "Social",
};

const RISK_LABELS = {
  advertising: { label: "High risk", icon: "🔴" },
  social: { label: "Medium risk", icon: "🟠" },
  performance: { label: "Medium risk", icon: "🟡" },
  preference: { label: "Low risk", icon: "🟢" },
  essential: { label: "No risk", icon: "🔵" },
};

document.addEventListener("DOMContentLoaded", () => {
  const { MOCK_COOKIES, categorizeCookies } = window.CookieData;
  const { drawDonut, drawOriginViz, PURPOSE_COLORS, DURATION_COLORS } = window.Charts;
  const stats = categorizeCookies(MOCK_COOKIES);

  // Badge
  document.getElementById("total-badge").textContent = stats.total + " cookies";

  // Charts
  drawDonut("chart-purpose", stats.byPurpose, PURPOSE_COLORS);
  drawDonut("chart-type", stats.byType, DURATION_COLORS);

  // Legends
  renderLegend("legend-purpose", stats.byPurpose, PURPOSE_COLORS, PURPOSE_LABELS);
  renderLegend("legend-type", stats.byType, DURATION_COLORS, {});

  // Origin viz
  drawOriginViz("origin-viz", stats.byOrigin, stats.cookies);

  // Accordion cookie list — by purpose
  renderAccordionByPurpose(stats.cookies);

  // Accordion cookie list — by origin
  renderAccordionByOrigin(stats.cookies);

  // Accordion toggle
  document.querySelectorAll(".accordion-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const body = document.getElementById(targetId);
      const icon = btn.querySelector(".acc-icon");
      const isOpen = body.classList.toggle("open");
      icon.textContent = isOpen ? "▾" : "▸";
    });
  });
});

function renderLegend(id, data, colors, labels) {
  const el = document.getElementById(id);
  el.innerHTML = Object.entries(data).map(([key, val]) => `
    <div class="legend-item">
      <span class="dot" style="background:${colors[key] || '#ccc'}"></span>
      <span>${labels[key] || key} (${val})</span>
    </div>
  `).join("");
}

function renderAccordionByPurpose(cookies) {
  const grouped = {};
  cookies.forEach(c => {
    if (!grouped[c.purpose]) grouped[c.purpose] = [];
    grouped[c.purpose].push(c);
  });

  // Sort purposes by risk (advertising first)
  const riskOrder = ["advertising", "social", "performance", "preference", "essential"];
  const sorted = riskOrder.filter(p => grouped[p]);

  const container = document.getElementById("cookies-by-purpose");
  document.getElementById("count-purpose").textContent = cookies.length;

  container.innerHTML = sorted.map(purpose => {
    const list = grouped[purpose];
    const risk = RISK_LABELS[purpose] || { label: "", icon: "⚪" };
    const { PURPOSE_COLORS } = window.Charts;
    return `
      <div class="cookie-group">
        <div class="cookie-group-header" style="border-left: 3px solid ${PURPOSE_COLORS[purpose] || '#ccc'}">
          <span class="group-icon">${risk.icon}</span>
          <span class="group-name">${PURPOSE_LABELS[purpose] || purpose}</span>
          <span class="group-risk">${risk.label}</span>
          <span class="group-count">${list.length}</span>
        </div>
        ${list.map(c => cookieRow(c)).join("")}
      </div>
    `;
  }).join("");
}

function renderAccordionByOrigin(cookies) {
  const firstParty = cookies.filter(c => c.firstParty);
  const thirdParty = cookies.filter(c => !c.firstParty);

  const container = document.getElementById("cookies-by-origin");
  document.getElementById("count-origin").textContent = cookies.length;

  container.innerHTML = `
    <div class="cookie-group">
      <div class="cookie-group-header" style="border-left:3px solid #378ADD">
        <span class="group-icon">🏠</span>
        <span class="group-name">1st Party</span>
        <span class="group-risk">This site</span>
        <span class="group-count">${firstParty.length}</span>
      </div>
      ${firstParty.map(c => cookieRow(c)).join("")}
    </div>
    <div class="cookie-group">
      <div class="cookie-group-header" style="border-left:3px solid #E24B4A">
        <span class="group-icon">🌐</span>
        <span class="group-name">3rd Party</span>
        <span class="group-risk">External</span>
        <span class="group-count">${thirdParty.length}</span>
      </div>
      ${thirdParty.map(c => cookieRow(c)).join("")}
    </div>
  `;
}

function cookieRow(c) {
  const { PURPOSE_COLORS } = window.Charts;
  return `
    <div class="cookie-row">
      <div class="cookie-name">${c.name}</div>
      <div class="cookie-meta">
        <span class="tag tag-purpose" style="background:${hexToFaded(PURPOSE_COLORS[c.purpose] || '#ccc')};color:${PURPOSE_COLORS[c.purpose] || '#555'}">${c.purpose}</span>
        <span class="tag">${c.type}</span>
        <span class="tag">${c.firstParty ? "1st party" : "3rd party"}</span>
        <span class="domain">${c.domain}</span>
      </div>
    </div>
  `;
}

function hexToFaded(hex) {
  // Convert hex color to a light tinted background
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},0.1)`;
}