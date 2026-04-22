// Risk-based colors for each purpose (red = highest risk, blue = lowest)
const PURPOSE_COLORS = {
    advertising: "#E24B4A",   // red   — highest risk
    social: "#EF7C2A",   // orange
    performance: "#EFC12A",   // amber
    preference: "#639922",   // green
    essential: "#378ADD",   // blue   — lowest risk
};

const DURATION_COLORS = {
    persistent: "#E24B4A",
    session: "#639922",
};

function drawDonut(canvasId, data, colorMap) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const cx = canvas.width / 2, cy = canvas.height / 2;
    const R = Math.min(cx, cy) - 8, r = R * 0.56;
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    let angle = -Math.PI / 2;

    // Draw gap-separated slices
    const GAP = 0.03;
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

    // Hole
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    // Center count
    ctx.fillStyle = "#222";
    ctx.font = "bold 20px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(total, cx, cy);
}

// By origin: icon-based split view instead of % bars
function drawOriginViz(containerId, data, cookies) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const first = data["1st party"] || 0;
    const third = data["3rd party"] || 0;
    const total = first + third;

    // Group third-party domains
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
    <div class="origin-track-wrap">
      <div class="origin-track">
        <div class="origin-bar-first" style="width:${Math.round(first / total * 100)}%"></div>
        <div class="origin-bar-third" style="width:${Math.round(third / total * 100)}%"></div>
      </div>
      <div class="origin-track-labels">
        <span>${Math.round(first / total * 100)}% 1st party</span>
        <span>${Math.round(third / total * 100)}% 3rd party</span>
      </div>
    </div>
  `;
}

window.Charts = { drawDonut, drawOriginViz, PURPOSE_COLORS, DURATION_COLORS };