const PURPOSE_COLORS = {
    advertising: "#FF3B30",
    social: "#FF9500",
    performance: "#FFCC00",
    preference: "#34C759",
    essential: "#007AFF",
};

const DURATION_COLORS = {
    persistent: "#FF3B30",
    session: "#34C759",
};

function drawDonut(canvasId, data, colorMap) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const size = canvas.width;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";
    ctx.scale(dpr, dpr);

    const cx = size / 2, cy = size / 2;
    const R = size / 2 - 7, r = R * 0.57;
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    let angle = -Math.PI / 2;
    const GAP = 0.025;

    Object.entries(data).forEach(([key, value]) => {
        const slice = (value / total) * 2 * Math.PI - GAP;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, R, angle, angle + slice);
        ctx.closePath();
        ctx.fillStyle = colorMap[key] || "#ccc";
        ctx.fill();
        angle += slice + GAP;
    });

    // Center hole
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    // Center label
    ctx.fillStyle = "#1C1C1E";
    ctx.font = "700 19px Inter, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(total, cx, cy);
}

// Origin viz — split card only, no bar or percentage
function drawOriginViz(containerId, data, cookies) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const first = data["1st party"] || 0;
    const third = data["3rd party"] || 0;

    const thirdDomains = {};
    cookies.filter(c => !c.firstParty).forEach(c => {
        thirdDomains[c.domain] = (thirdDomains[c.domain] || 0) + 1;
    });

    container.innerHTML = `
    <div class="origin-split">
      <div class="origin-half origin-first">
        <div class="origin-icon">🏠</div>
        <div class="origin-label">1st Party</div>
        <div class="origin-count">${first}</div>
        <div class="origin-sub">This site only</div>
      </div>
      <div class="origin-divider"></div>
      <div class="origin-half origin-third">
        <div class="origin-icon">🌐</div>
        <div class="origin-label">3rd Party</div>
        <div class="origin-count">${third}</div>
        <div class="origin-sub">External trackers</div>
        <div class="origin-domains">
          ${Object.entries(thirdDomains).map(([d, n]) =>
        `<span class="domain-pill">${d} <b>${n}</b></span>`
    ).join("")}
        </div>
      </div>
    </div>
  `;
}

window.Charts = { drawDonut, drawOriginViz, PURPOSE_COLORS, DURATION_COLORS };