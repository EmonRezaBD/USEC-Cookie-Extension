// content.js — injected into every page
// Listens for SHOW_COOKIE_OVERLAY, then injects the cookie panel into the page DOM.

(function () {
    "use strict";

    // ── Cookie purpose heuristics ──────────────────────────────────────────────
    const PURPOSE_MAP = {
        // Analytics / Performance
        _ga: "performance", _gid: "performance", _gat: "performance",
        __utma: "performance", __utmb: "performance", __utmz: "performance",
        _clck: "performance", _clsk: "performance",
        // Advertising
        _fbp: "advertising", _fbc: "advertising",
        li_gc: "advertising", li_sugr: "advertising",
        IDE: "advertising", DSID: "advertising",
        fr: "advertising", tr: "advertising",
        // Social
        tw_ct: "social", twid: "social",
        // Preference
        lang: "preference", locale: "preference",
        user_pref: "preference", theme: "preference",
        currency: "preference", timezone: "preference",
        // Essential (fallback for common patterns)
        session_id: "essential", sessionid: "essential",
        sess: "essential", PHPSESSID: "essential",
        JSESSIONID: "essential", csrf_token: "essential",
        csrftoken: "essential", auth_token: "essential",
        cart_token: "essential", ab_test: "performance",
    };

    function guessPurpose(name) {
        if (PURPOSE_MAP[name]) return PURPOSE_MAP[name];
        const n = name.toLowerCase();
        if (n.includes("sess") || n.includes("auth") || n.includes("csrf") || n.includes("token")) return "essential";
        if (n.includes("_ga") || n.includes("_gid") || n.includes("analytics") || n.includes("stat")) return "performance";
        if (n.includes("ad") || n.includes("track") || n.includes("pixel") || n.includes("fb")) return "advertising";
        if (n.includes("pref") || n.includes("lang") || n.includes("theme")) return "preference";
        return "essential";
    }

    // ── Colors (matching popup design) ────────────────────────────────────────
    const PURPOSE_COLORS = {
        advertising: "#FF3B30",
        social: "#FF9500",
        performance: "#FFCC00",
        preference: "#34C759",
        essential: "#007AFF",
    };

    const RISK_LABELS = {
        advertising: { label: "High risk", icon: "🔴" },
        social: { label: "Medium risk", icon: "🟠" },
        performance: { label: "Medium risk", icon: "🟡" },
        preference: { label: "Low risk", icon: "🟢" },
        essential: { label: "No risk", icon: "🔵" },
    };

    const PURPOSE_LABELS = {
        essential: "Essential", preference: "Preference",
        performance: "Performance", advertising: "Advertising", social: "Social",
    };

    const COOKIE_INFO_LINKS = {
        "_fbp": "https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/fbp-and-fbc/",
        "li_gc": "https://www.linkedin.com/legal/privacy-policy#cookies",
        "_ga": "https://support.google.com/analytics/answer/11397207",
        "tw_ct": "https://help.twitter.com/en/using-twitter/twitter-cookies",
    };

    // ── Categorize cookies ────────────────────────────────────────────────────
    function categorizeCookies(rawCookies, hostname) {
        const cookies = rawCookies.map(c => ({
            name: c.name,
            domain: c.domain,
            type: c.session ? "session" : "persistent",
            purpose: guessPurpose(c.name),
            firstParty: c.domain.replace(/^\./, "").endsWith(hostname.replace(/^www\./, ""))
        }));

        const byPurpose = {}, byType = {}, byOrigin = { "1st party": 0, "3rd party": 0 };
        cookies.forEach(c => {
            byPurpose[c.purpose] = (byPurpose[c.purpose] || 0) + 1;
            byType[c.type] = (byType[c.type] || 0) + 1;
            c.firstParty ? byOrigin["1st party"]++ : byOrigin["3rd party"]++;
        });
        return { cookies, byPurpose, byType, byOrigin, total: cookies.length };
    }

    // ── Donut chart (canvas) ─────────────────────────────────────────────────
    function drawDonut(canvas, data, colorMap) {
        const dpr = window.devicePixelRatio || 1;
        const size = 110;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        canvas.style.width = size + "px";
        canvas.style.height = size + "px";
        const ctx = canvas.getContext("2d");
        ctx.scale(dpr, dpr);

        const cx = size / 2, cy = size / 2;
        const R = size / 2 - 7, r = R * 0.57;
        const total = Object.values(data).reduce((a, b) => a + b, 0);
        if (total === 0) return;

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

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, 2 * Math.PI);
        ctx.fillStyle = "#ffffff";
        ctx.fill();

        ctx.fillStyle = "#1C1C1E";
        ctx.font = "700 16px -apple-system, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(total, cx, cy);
    }

    // ── Build panel HTML ──────────────────────────────────────────────────────
    function buildPanel(stats, hostname) {
        const panel = document.createElement("div");
        panel.id = "ct-overlay-panel";

        // Header
        panel.innerHTML = `
      <div class="ct-header">
        <div class="ct-header-top">
          <span class="ct-icon">🍪</span>
          <span class="ct-title">Cookie Transparency</span>
          <span class="ct-badge">${stats.total} cookies</span>
          <button class="ct-close" id="ct-close-btn" title="Dismiss">✕</button>
        </div>
        <div class="ct-sub">Already set cookies if you click <strong>Accept All</strong></div>
      </div>

      <div class="ct-body">
        <div class="ct-charts-row">
          <div class="ct-card">
            <div class="ct-card-label">By purpose</div>
            <canvas id="ct-canvas-purpose"></canvas>
            <div id="ct-legend-purpose" class="ct-legend"></div>
          </div>
          <div class="ct-card">
            <div class="ct-card-label">By duration</div>
            <canvas id="ct-canvas-type"></canvas>
            <div id="ct-legend-type" class="ct-legend"></div>
          </div>
        </div>

        <div class="ct-card ct-origin-card">
          <div class="ct-card-label">By origin</div>
          <div id="ct-origin-viz"></div>
        </div>

        <div class="ct-section-title">All cookies</div>

        <div class="ct-accordion" id="ct-acc-purpose">
          <button class="ct-acc-btn">
            <span class="ct-chevron" id="ct-chev-purpose">▶</span>
            <span class="ct-acc-label">By purpose</span>
            <span class="ct-acc-count">${stats.total}</span>
          </button>
          <div class="ct-acc-body" id="ct-acc-body-purpose">
            <div id="ct-cookies-purpose"></div>
          </div>
        </div>

        <div class="ct-accordion" id="ct-acc-origin">
          <button class="ct-acc-btn">
            <span class="ct-chevron" id="ct-chev-origin">▶</span>
            <span class="ct-acc-label">By origin</span>
            <span class="ct-acc-count">${stats.total}</span>
          </button>
          <div class="ct-acc-body" id="ct-acc-body-origin">
            <div id="ct-cookies-origin"></div>
          </div>
        </div>
      </div>
    `;

        return panel;
    }

    // ── Render origin split ────────────────────────────────────────────────────
    function renderOrigin(container, byOrigin, cookies) {
        const first = byOrigin["1st party"] || 0;
        const third = byOrigin["3rd party"] || 0;
        const thirdDomains = {};
        cookies.filter(c => !c.firstParty).forEach(c => {
            thirdDomains[c.domain] = (thirdDomains[c.domain] || 0) + 1;
        });

        container.innerHTML = `
      <div class="ct-origin-split">
        <div class="ct-origin-half ct-origin-first">
          <div class="ct-o-icon">🏠</div>
          <div class="ct-o-label">1st Party</div>
          <div class="ct-o-count ct-o-blue">${first}</div>
          <div class="ct-o-sub">This site only</div>
        </div>
        <div class="ct-origin-divider"></div>
        <div class="ct-origin-half ct-origin-third">
          <div class="ct-o-icon">🌐</div>
          <div class="ct-o-label">3rd Party</div>
          <div class="ct-o-count ct-o-red">${third}</div>
          <div class="ct-o-sub">External trackers</div>
          <div class="ct-o-domains">
            ${Object.entries(thirdDomains).map(([d, n]) =>
            `<span class="ct-dpill">${d} <b>${n}</b></span>`
        ).join("")}
          </div>
        </div>
      </div>
    `;
    }

    // ── Render cookie accordion groups ────────────────────────────────────────
    function renderByPurpose(container, cookies) {
        const grouped = {};
        cookies.forEach(c => {
            if (!grouped[c.purpose]) grouped[c.purpose] = [];
            grouped[c.purpose].push(c);
        });
        const order = ["advertising", "social", "performance", "preference", "essential"];
        container.innerHTML = order.filter(p => grouped[p]).map(purpose => {
            const list = grouped[purpose];
            const risk = RISK_LABELS[purpose] || { icon: "⚪", label: "" };
            const color = PURPOSE_COLORS[purpose] || "#ccc";
            return `
        <div class="ct-group">
          <div class="ct-group-hdr" style="border-left:3px solid ${color}">
            <span>${risk.icon}</span>
            <span class="ct-gname">${PURPOSE_LABELS[purpose]}</span>
            <span class="ct-grisk">${risk.label}</span>
            <span class="ct-gcount">${list.length}</span>
          </div>
          ${list.map(c => cookieRowHTML(c)).join("")}
        </div>
      `;
        }).join("");
    }

    function renderByOrigin(container, cookies) {
        const first = cookies.filter(c => c.firstParty);
        const third = cookies.filter(c => !c.firstParty);
        container.innerHTML = `
      <div class="ct-group">
        <div class="ct-group-hdr" style="border-left:3px solid #007AFF">
          <span>🏠</span>
          <span class="ct-gname">1st Party</span>
          <span class="ct-grisk">This site</span>
          <span class="ct-gcount">${first.length}</span>
        </div>
        ${first.map(c => cookieRowHTML(c)).join("")}
      </div>
      <div class="ct-group">
        <div class="ct-group-hdr" style="border-left:3px solid #FF3B30">
          <span>🌐</span>
          <span class="ct-gname">3rd Party</span>
          <span class="ct-grisk">External</span>
          <span class="ct-gcount">${third.length}</span>
        </div>
        ${third.map(c => cookieRowHTML(c)).join("")}
      </div>
    `;
    }

    function cookieRowHTML(c) {
        const color = PURPOSE_COLORS[c.purpose] || "#ccc";
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        const faded = `rgba(${r},${g},${b},0.12)`;
        const infoUrl = COOKIE_INFO_LINKS[c.name];
        const linkHTML = infoUrl
            ? `<a class="ct-info-link" href="${infoUrl}" target="_blank" rel="noopener">↗ What is ${c.name}?</a>`
            : "";
        return `
      <div class="ct-row">
        <div class="ct-row-top">
          <span class="ct-cname">${c.name}</span>${linkHTML}
        </div>
        <div class="ct-meta">
          <span class="ct-tag ct-tag-p" style="background:${faded};color:${color}">${c.purpose}</span>
          <span class="ct-tag">${c.type}</span>
          <span class="ct-tag">${c.firstParty ? "1st party" : "3rd party"}</span>
          <span class="ct-domain">${c.domain}</span>
        </div>
      </div>
    `;
    }

    // ── Render legend ─────────────────────────────────────────────────────────
    function renderLegend(el, data, colors, labels) {
        el.innerHTML = Object.entries(data).map(([key, val]) => `
      <div class="ct-legend-item">
        <span class="ct-dot" style="background:${colors[key] || '#ccc'}"></span>
        <span>${labels[key] || key} (${val})</span>
      </div>
    `).join("");
    }

    // ── Main: show overlay ────────────────────────────────────────────────────
    function showOverlay(hostname, rawCookies) {
        if (document.getElementById("ct-overlay-root")) return; // already showing

        const stats = categorizeCookies(rawCookies, hostname);

        // Root wrapper (shadow host)
        const root = document.createElement("div");
        root.id = "ct-overlay-root";
        document.body.appendChild(root);

        // Use Shadow DOM so page styles can't bleed in
        const shadow = root.attachShadow({ mode: "open" });

        // Inject overlay.css into shadow
        const linkEl = document.createElement("link");
        linkEl.rel = "stylesheet";
        linkEl.href = chrome.runtime.getURL("overlay.css");
        shadow.appendChild(linkEl);

        const panel = buildPanel(stats, hostname);
        shadow.appendChild(panel);

        // Draw canvases (after DOM attached)
        requestAnimationFrame(() => {
            const cp = shadow.getElementById("ct-canvas-purpose");
            const ct = shadow.getElementById("ct-canvas-type");
            if (cp) drawDonut(cp, stats.byPurpose, PURPOSE_COLORS);
            if (ct) drawDonut(ct, stats.byType, { persistent: "#FF3B30", session: "#34C759" });

            const lpEl = shadow.getElementById("ct-legend-purpose");
            const ltEl = shadow.getElementById("ct-legend-type");
            if (lpEl) renderLegend(lpEl, stats.byPurpose, PURPOSE_COLORS, PURPOSE_LABELS);
            if (ltEl) renderLegend(ltEl, stats.byType, { persistent: "#FF3B30", session: "#34C759" }, {});

            const originEl = shadow.getElementById("ct-origin-viz");
            if (originEl) renderOrigin(originEl, stats.byOrigin, stats.cookies);

            const purpEl = shadow.getElementById("ct-cookies-purpose");
            if (purpEl) renderByPurpose(purpEl, stats.cookies);
            const origEl = shadow.getElementById("ct-cookies-origin");
            if (origEl) renderByOrigin(origEl, stats.cookies);
        });

        // Close button
        shadow.getElementById("ct-close-btn").addEventListener("click", () => {
            root.remove();
        });

        // Accordion toggles
        shadow.querySelectorAll(".ct-acc-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const accordion = btn.closest(".ct-accordion");
                const bodyId = accordion.id.replace("ct-acc-", "ct-acc-body-");
                const chevId = accordion.id.replace("ct-acc-", "ct-chev-");
                const body = shadow.getElementById(bodyId);
                const chev = shadow.getElementById(chevId);
                const isOpen = body.classList.toggle("open");
                if (chev) chev.style.transform = isOpen ? "rotate(90deg)" : "rotate(0deg)";
            });
        });

        // Animate in
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                panel.classList.add("ct-visible");
            });
        });
    }

    // ── Simulated cookie data (same as popup) ─────────────────────────────────
    const SIMULATED_COOKIES = [
        { name: "session_id", domain: "mystore.com", session: true, firstParty: true },
        { name: "user_pref", domain: "mystore.com", session: false, firstParty: true },
        { name: "_ga", domain: "google.com", session: false, firstParty: false },
        { name: "_fbp", domain: "facebook.com", session: false, firstParty: false },
        { name: "cart_token", domain: "mystore.com", session: true, firstParty: true },
        { name: "lang", domain: "mystore.com", session: false, firstParty: true },
        { name: "_gid", domain: "google.com", session: true, firstParty: false },
        { name: "tw_ct", domain: "twitter.com", session: false, firstParty: false },
        { name: "auth_token", domain: "mystore.com", session: true, firstParty: true },
        { name: "ab_test", domain: "mystore.com", session: false, firstParty: true },
        { name: "li_gc", domain: "linkedin.com", session: false, firstParty: false },
        { name: "csrf_token", domain: "mystore.com", session: true, firstParty: true },
    ];

    // ── Message listener ───────────────────────────────────────────────────────
    chrome.runtime.onMessage.addListener((msg) => {
        if (msg.type !== "SHOW_COOKIE_OVERLAY") return;
        showOverlay(msg.hostname, SIMULATED_COOKIES);
    });

})();