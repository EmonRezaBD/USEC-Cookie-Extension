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

// Info links for specific well-known tracking cookies
const COOKIE_INFO_LINKS = {
  "_fbp": {
    label: "What is _fbp?",
    url: "https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/fbp-and-fbc/"
  },
  "li_gc": {
    label: "What is li_gc?",
    url: "https://www.linkedin.com/legal/privacy-policy#cookies"
  },
  "_ga": {
    label: "What is _ga?",
    url: "https://support.google.com/analytics/answer/11397207"
  },
  "tw_ct": {
    label: "What is tw_ct?",
    url: "https://help.twitter.com/en/using-twitter/twitter-cookies"
  },
};

document.addEventListener("DOMContentLoaded", () => {
  const { MOCK_COOKIES, categorizeCookies } = window.CookieData;
  const { drawDonut, drawOriginViz, PURPOSE_COLORS, DURATION_COLORS } = window.Charts;
  const stats = categorizeCookies(MOCK_COOKIES);

  document.getElementById("total-badge").textContent = stats.total + " cookies";

  drawDonut("chart-purpose", stats.byPurpose, PURPOSE_COLORS);
  drawDonut("chart-type", stats.byType, DURATION_COLORS);

  renderLegend("legend-purpose", stats.byPurpose, PURPOSE_COLORS, PURPOSE_LABELS);
  renderLegend("legend-type", stats.byType, DURATION_COLORS, {});

  drawOriginViz("origin-viz", stats.byOrigin, stats.cookies);

  renderAccordionByPurpose(stats.cookies);
  renderAccordionByOrigin(stats.cookies);

  // Accordion toggle
  document.querySelectorAll(".accordion-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const body = document.getElementById(targetId);
      const chevronId = "chevron-" + targetId.replace("acc-", "");
      const chevron = document.getElementById(chevronId);
      const isOpen = body.classList.toggle("open");
      if (chevron) chevron.classList.toggle("open", isOpen);
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

  const riskOrder = ["advertising", "social", "performance", "preference", "essential"];
  const sorted = riskOrder.filter(p => grouped[p]);

  document.getElementById("count-purpose").textContent = cookies.length;

  document.getElementById("cookies-by-purpose").innerHTML = sorted.map(purpose => {
    const list = grouped[purpose];
    const risk = RISK_LABELS[purpose] || { label: "", icon: "⚪" };
    const color = window.Charts.PURPOSE_COLORS[purpose] || "#ccc";
    return `
      <div class="cookie-group">
        <div class="cookie-group-header" style="border-left:3px solid ${color}">
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

  document.getElementById("count-origin").textContent = cookies.length;

  document.getElementById("cookies-by-origin").innerHTML = `
    <div class="cookie-group">
      <div class="cookie-group-header" style="border-left:3px solid #007AFF">
        <span class="group-icon">🏠</span>
        <span class="group-name">1st Party</span>
        <span class="group-risk">This site</span>
        <span class="group-count">${firstParty.length}</span>
      </div>
      ${firstParty.map(c => cookieRow(c)).join("")}
    </div>
    <div class="cookie-group">
      <div class="cookie-group-header" style="border-left:3px solid #FF3B30">
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
  const color = window.Charts.PURPOSE_COLORS[c.purpose] || "#ccc";
  const faded = hexToFaded(color);
  const infoLink = COOKIE_INFO_LINKS[c.name];

  const linkHTML = infoLink
    ? `<a class="cookie-info-link" href="${infoLink.url}" target="_blank" rel="noopener">
         ↗ ${infoLink.label}
       </a>`
    : "";

  return `
    <div class="cookie-row">
      <div class="cookie-name-row">
        <span class="cookie-name">${c.name}</span>
        ${linkHTML}
      </div>
      <div class="cookie-meta">
        <span class="tag tag-purpose" style="background:${faded};color:${color}">${c.purpose}</span>
        <span class="tag">${c.type}</span>
        <span class="tag">${c.firstParty ? "1st party" : "3rd party"}</span>
        <span class="domain">${c.domain}</span>
      </div>
    </div>
  `;
}

function hexToFaded(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},0.12)`;
}