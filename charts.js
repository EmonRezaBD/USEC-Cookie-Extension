// Draw a donut chart on a <canvas> element
function drawDonut(canvasId, data, colors) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext("2d");
    const cx = canvas.width / 2, cy = canvas.height / 2;
    const R = Math.min(cx, cy) - 10, r = R * 0.55;
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    let angle = -Math.PI / 2;

    Object.entries(data).forEach(([label, value], i) => {
        const slice = (value / total) * 2 * Math.PI;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, R, angle, angle + slice);
        ctx.closePath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        angle += slice;
    });

    // Punch out center hole
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue("--bg") || "#fff";
    ctx.fill();

    // Center label
    ctx.fillStyle = "#333";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(total, cx, cy);
}

// Draw a horizontal bar chart
function drawBars(containerId, data, colors) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";
    const total = Object.values(data).reduce((a, b) => a + b, 0);

    Object.entries(data).forEach(([label, value], i) => {
        const pct = Math.round((value / total) * 100);
        const row = document.createElement("div");
        row.className = "bar-row";
        row.innerHTML = `
      <span class="bar-label">${label}</span>
      <div class="bar-track">
        <div class="bar-fill" style="width:${pct}%;background:${colors[i % colors.length]}"></div>
      </div>
      <span class="bar-pct">${pct}%</span>
    `;
        container.appendChild(row);
    });
}

window.Charts = { drawDonut, drawBars };