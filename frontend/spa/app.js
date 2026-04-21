// =========================
// CEME SPA (Vanilla JS) - STABLE BUILD
// Pages: Dashboard, Daily (cards), History (charts), Device, Settings
// Air page is removed to prevent crashes.
// =========================

function $(sel){ return document.querySelector(sel); }
function fmtTime(iso){ try { return new Date(iso).toLocaleString(); } catch { return "—"; } }
function fmtNum(v, digits=1){
  const n = Number(v);
  if(!isFinite(n)) return "—";
  return n.toFixed(digits);
}

// ---------- Data ----------
let latestCache = null;
let forecastCache = [];
let deviceMode = localStorage.getItem("deviceMode") || "demo"; // "demo" or "esp32"
let lastTsMs = null;
// ---------- Routes ----------
const routes = [
  { path:"#/dashboard", label:"Dashboard", icon:"🏠", render: renderDashboard },
  { path:"#/daily",     label:"Forecast",  icon:"📅", render: renderDaily },
{ path:"#/air",       label:"Air Quality", icon:"🌫️", render: renderAir },
  { path:"#/history",   label:"History",   icon:"📈", render: renderHistory },
  { path:"#/device",    label:"Device",    icon:"📟", render: renderDevice },
  { path:"#/settings",  label:"Settings",  icon:"⚙️", render: renderSettings },
];

function currentRoute(){
  const h = location.hash || "#/dashboard";
  return routes.find(r => r.path === h) || routes[0];
}
function tickClock(){
  const el = document.getElementById("liveClock");
  if(el) el.textContent = new Date().toLocaleString();
}
function updateAgo(){
  const el = document.getElementById("lastAgo");
  if(!el) return;
  if(!lastTsMs){ el.textContent = "—"; return; }
  const sec = Math.max(0, Math.floor((Date.now() - lastTsMs)/1000));
  el.textContent = sec < 60 ? `${sec}s ago` : `${Math.floor(sec/60)}m ago`;
}
function shell(){
  return `
  <div class="shell">
    <aside class="sidebar">
      <div class="brand">
        <div class="brandLeft">
          <img class="logo" src="assets/ceme.png" alt="CEME">
          <div class="brandText">
            <b>CEME Weather</b>
            <span></span>
          </div>
        </div>
        <img class="logo" src="assets/nust.png" alt="NUST">
      </div>

      <div class="nav">
        ${routes.map(r => `
          <div class="navItem" data-path="${r.path}">
            <div class="navIcon">${r.icon}</div>
            <div style="font-weight:800">${r.label}</div>
          </div>
        `).join("")}
      </div>
    </aside>

    <main class="main">
      <div class="toprow">
        <div>
          <div class="pageTitle" id="pageTitle">—</div>
          <div class="pageSub" id="pageSub"> Live station • Auto refresh</div>
        </div>
        <div class="pills">
         <div class="pill">Updated: <span id="lastUpdate">—</span> (<span id="lastAgo">—</span>)</div>
          <a class="pill" style="text-decoration:none" href="/export.csv" target="_blank" rel="noopener">Download CSV</a>
        </div>
      </div>

      <div id="view" class="fadeEnter"></div>
      <nav class="bottomNav" id="bottomNav">
        ${routes.map(r => `
          <button class="bNavItem" data-path="${r.path}" type="button">
            <div class="bNavIcon">${r.icon}</div>
            <div class="bNavLabel">${r.label}</div>
          </button>
        `).join("")}
      </nav>
    </main>
  </div>`;
}
function setActiveNav(path){
  document.querySelectorAll(".navItem").forEach(el => {
    el.classList.toggle("active", el.dataset.path === path);
  });
  document.querySelectorAll(".bNavItem").forEach(el => {
    el.classList.toggle("active", el.dataset.path === path);
  });
}
// ---------- API ----------
async function loadLatest(){
  try{
    const r = await fetch("/latest");
    const j = await r.json();
    if(!j.has_data) return;
    latestCache = j.reading;
    const t = $("#lastUpdate"); if(t) t.textContent = fmtTime(latestCache.ts_utc || "");
lastTsMs = Date.parse(latestCache.ts_utc || "") || Date.now();
updateAgo();
    const elT=$("#kTemp"); if(elT) elT.textContent = fmtNum(latestCache.temp_c, 2);
const elH=$("#kHum");  if(elH) elH.textContent = fmtNum(latestCache.humidity, 2);
const elP=$("#kPres"); if(elP) elP.textContent = fmtNum(latestCache.pressure_hpa, 2);
const elL=$("#kLux");  if(elL) elL.textContent = fmtNum(latestCache.lux, 0);
updateDashboardExtras();
  }catch(e){ console.log("latest failed", e); }
}

async function loadForecast(){
  try{
    const r = await fetch("/forecast");
    const j = await r.json();
    forecastCache = j.days || [];
  }catch(e){
    console.log("forecast failed", e);
    forecastCache = [];
  }
}

async function fetchLast24h(){
  try{
    const res = await fetch("/last24h?limit=2880");
    const j = await res.json();
    return j.data || [];
  }catch(e){
    console.log("fetchLast24h failed", e);
    return [];
  }
}

// ---------- Pages ----------
function renderDashboard(){
  return `
  <div class="grid">
    <div class="card span3">
      <div class="kTitle">Temperature</div>
      <div class="kValue" id="kTemp">—</div>
      <div class="kUnit">°C</div>
    </div>

    <div class="card span3">
      <div class="kTitle">Humidity</div>
      <div class="kValue" id="kHum">—</div>
      <div class="kUnit">%</div>
    </div>

    <div class="card span3">
      <div class="kTitle">Pressure</div>
      <div class="kValue" id="kPres">—</div>
      <div class="kUnit">hPa</div>
    </div>

    <div class="card span3">
      <div class="kTitle">Ambient Light</div>
      <div class="kValue" id="kLux">—</div>
      <div class="kUnit">lux</div>
    </div>

    <div class="card span6">
      <div class="kTitle">Comfort Index</div>
      <div style="margin-top:10px;font-weight:900;font-size:22px" id="comfortText">gfgfgf</div>
      <div class="kUnit" id="comfortSub">Feels like based on temp + humidity</div>
    </div>

    <div class="card span6">
      <div class="kTitle">Quick Insights</div>
      <div style="margin-top:10px;color:var(--muted);line-height:1.6" id="insightsText">—</div>
    </div>

    <div class="card span12">
      <div class="kTitle">Status</div>
      <div style="margin-top:10px;color:var(--muted);line-height:1.6">
        Live updates every 30 seconds • <b id="liveClock">—</b>
      </div>
    </div>
  </div>
  `;
}
function updateDashboardExtras(){
  const r = latestCache;
  if(!r) return;

  const t = Number(r.temp_c);
  const h = Number(r.humidity);

  let mood = "—";

  if(!isNaN(t) && !isNaN(h)){
    if(t >= 35) mood = "🔥 Very Hot";
    else if(t >= 28) mood = "☀️ Warm";
    else if(t >= 18) mood = "⛅ Comfortable";
    else mood = "🧥 Cool";

    if(h >= 70) mood += " • Humid";
  }

  const c = document.getElementById("comfortText");
  if(c) c.textContent = mood;

 const insights = [];

if(!isNaN(t) && !isNaN(h)){

  // VC (Cafe)
  if(t >= 30) insights.push("🥤 Too warm outside • Better to sit inside VC");
  else insights.push("☕ Good weather to sit at VC");

  // ASG Ground
  if(t >= 34) insights.push("⚠️ Avoid heavy activity at ASG ground");
  else if(t >= 25) insights.push("🏃 Good time for ASG ground activities");
  else insights.push("🌤️ Light activity suitable at ASG ground");

  // Sports Complex
  if(h > 70) insights.push("💧 Humidity high • Indoor sports complex preferred");
  else insights.push("🏋️ Good conditions for sports complex");

  // Library
  if(t >= 28 && h >= 60) insights.push("📚 Library will feel comfortable");
  else insights.push("📖 Good time for study sessions");

  // General campus life
  if(t >= 35) insights.push("🔥 Campus heat is high • Stay hydrated");
  else if(t <= 18) insights.push("🧥 Slightly cool on campus");
}

  const ins = document.getElementById("insightsText");
  if(ins) ins.textContent = insights.join(" ");
}

function renderDaily(){
  const days = forecastCache || [];
  const cards = days.map((d) => {
    const hi = Number(d.ai_temp_c);
    const lo = Number(d.temp_min_c ?? (hi - 6));
    const conf = d.confidence || "—";

    return `
      <div class="dayCard">
        <div class="dayCardTop">
          <div>
            <div class="dayName">${d.day}</div>
            <div class="miniMuted">Forecast <span class="confPill">${conf}</span></div>
          </div>
          <div class="tempBig">${isNaN(hi) ? "—" : hi.toFixed(1) + "°"}</div>
        </div>

        <div class="dayCardMid">
          <div class="miniRow"><span class="miniMuted">Low</span><b>${isNaN(lo) ? "—" : lo.toFixed(1) + "°"}</b></div>
          <div class="miniRow"><span class="miniMuted">Baseline</span><b>${d.baseline_temp_c ?? "—"}°</b></div>
        </div>

        <div class="expandHint">Tap for details</div>
        <div class="dayDetails">
          <div class="detailGrid">
            <div class="detailBox"><div class="miniMuted">AI</div><div class="detailVal">${d.ai_temp_c ?? "—"} °C</div></div>
            <div class="detailBox"><div class="miniMuted">Baseline</div><div class="detailVal">${d.baseline_temp_c ?? "—"} °C</div></div>
            <div class="detailBox"><div class="miniMuted">Humidity</div><div class="detailVal">${d.humidity_avg ?? "—"} %</div></div>
            <div class="detailBox"><div class="miniMuted">Pressure</div><div class="detailVal">${d.pressure_avg_hpa ?? "—"} hPa</div></div>
          </div>
        </div>
      </div>`;
  }).join("");

  return `
  <div class="grid">
    <div class="card span12">
      <div class="kTitle">Forecast</div>
      <div class="miniMuted" style="margin-top:8px;">Swipe/scroll cards. Tap to expand.</div>
      <div class="cardStrip" id="cardStrip">${cards || ""}</div>
    </div>
  </div>`;
}
function renderAir(){
  // SAFE: never throws, never crashes app
  const r = latestCache || {};
  const mq135 = (r.mq135_raw == null ? null : Number(r.mq135_raw));
  const mq7   = (r.mq7_raw == null ? null : Number(r.mq7_raw));

  const aq = labelAQ(mq135);
  const co = labelCO(mq7);

  return `
  <div class="grid">
    <div class="card span4">
      <div class="kTitle">Air Quality (MQ135)</div>
      <div class="kValue level-${aq.level}">${aq.label}</div>
      <div class="kUnit">${aq.sub}</div>
    </div>

    <div class="card span4">
      <div class="kTitle">CO Risk (MQ7)</div>
      <div class="kValue level-${co.level}">${co.label}</div>
      <div class="kUnit">${co.sub}</div>
    </div>

    <div class="card span4">
      <div class="kTitle">Trend (10 min)</div>
      <div style="margin-top:10px;font-weight:900;font-size:22px" id="trendText">Loading…</div>
      <div class="kUnit">Computed from last 10 minutes</div>
    </div>

    <div class="card span12">
      <div class="kTitle">Alerts</div>
      <div id="alertsBox" style="margin-top:10px; display:flex; flex-direction:column; gap:10px;">
        <div class="miniMuted">Loading…</div>
      </div>
    </div>

    <div class="card span12">
      <div class="kTitle">Raw Values</div>
      <div style="margin-top:12px; display:grid; grid-template-columns: repeat(2, 1fr); gap:12px;">
        <div class="detailBox">
          <div class="miniMuted">MQ135 raw</div>
          <div class="detailVal">${mq135 == null || Number.isNaN(mq135) ? "—" : mq135}</div>
        </div>
        <div class="detailBox">
          <div class="miniMuted">MQ7 raw</div>
          <div class="detailVal">${mq7 == null || Number.isNaN(mq7) ? "—" : mq7}</div>
        </div>
      </div>
      <div style="margin-top:12px;color:var(--muted);line-height:1.6">
        Raw ADC values for demo. Calibration to ppm can be added later.
      </div>
    </div>
  </div>`;
}

function renderHistory(){
  return `
  <div class="grid">
    <div class="card span12">
      <div class="kTitle">History (Last 24 Hours)</div>

      <div style="margin-top:14px; display:grid; grid-template-columns: repeat(2, 1fr); gap:12px;">
        <div class="chartBox"><div class="kTitle">Temp (°C)</div><canvas id="chTemp" width="520" height="220" style="width:100%;height:auto;"></canvas></div>
        <div class="chartBox"><div class="kTitle">Hum (%)</div><canvas id="chHum" width="520" height="220" style="width:100%;height:auto;"></canvas></div>
        <div class="chartBox"><div class="kTitle">Pres (hPa)</div><canvas id="chPres" width="520" height="220" style="width:100%;height:auto;"></canvas></div>
        <div class="chartBox"><div class="kTitle">Lux</div><canvas id="chLux" width="520" height="220" style="width:100%;height:auto;"></canvas></div>
      </div>

      <div style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap;">
        <a class="btn" href="/export.csv" target="_blank" rel="noopener">Download CSV</a>
        <button class="btn" id="btnRefreshHist" type="button">Refresh Charts</button>
      </div>
    </div>
  </div>`;
}

function renderDevice(){
  return `
  <div class="grid">
    <div class="card span12">
      <div class="kTitle">Device</div>
      <div style="margin-top:10px;color:var(--muted);line-height:1.7">
        Select where live readings come from.  
        <b>Demo</b> = fake/simulator.  
        <b>ESP32</b> = real device will POST to backend every 30 seconds.
      </div>

      <div style="margin-top:14px; display:flex; gap:10px; flex-wrap:wrap;">
        <button class="btn" id="btnDemo">Demo Mode</button>
        <button class="btn" id="btnESP">ESP32 Mode</button>
      </div>

      <div style="margin-top:12px;color:var(--muted)">
        Current mode: <b id="modeText">${deviceMode.toUpperCase()}</b>
      </div>

      <div style="margin-top:14px;color:var(--muted);line-height:1.7">
        <b>ESP32 plan:</b><br>
        • Wi-Fi → ESP32 sends JSON to <code>/ingest</code><br>
        • No Wi-Fi → ESP32 sends BLE to phone → phone forwards same JSON to <code>/ingest</code><br>
      </div>
    </div>
  </div>`;
}
function renderSettings(){
  return `
  <div class="grid">
    <div class="card span12">
      <div class="kTitle">Settings</div>
      <div style="margin-top:10px;color:var(--muted);line-height:1.6">
        Coming soon: competition mode toggle, units, refresh rate.
      </div>
    </div>
  </div>`;
}

// ---------- Charts ----------
function drawLineChart(canvasId, values){
  const c = document.getElementById(canvasId);
  if(!c) return;
  const ctx = c.getContext("2d");
  const W = c.width, H = c.height;

  ctx.clearRect(0,0,W,H);

  const padL=40, padR=12, padT=12, padB=26;
  const plotW=W-padL-padR, plotH=H-padT-padB;

  const clean = values.filter(v => typeof v === "number" && !isNaN(v));
  if(clean.length < 2) return;

  let min = Math.min(...clean), max = Math.max(...clean);
  const extra = (max-min)*0.15 || 1;
  min -= extra; max += extra;

  const yAt = v => padT + (1 - (v-min)/(max-min))*plotH;

  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = "#FFD260";
  ctx.lineWidth = 1;
  for(let k=0;k<=4;k++){
    const y = padT + (k/4)*plotH;
    ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(W-padR,y); ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.font = "12px system-ui";
  for(let k=0;k<=4;k++){
    const v = (max - (k/4)*(max-min)).toFixed(0);
    const y = padT + (k/4)*plotH;
    ctx.fillText(v, 8, y+4);
  }

  ctx.strokeStyle = "#FFD260";
  ctx.lineWidth = 2;
  ctx.beginPath();
  values.forEach((v,i)=>{
    if(typeof v !== "number" || isNaN(v)) return;
    const x = padL + (i/(values.length-1))*plotW;
    const y = yAt(v);
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.stroke();
}

async function renderHistoryCharts(){
  const data = await fetchLast24h();
  drawLineChart("chTemp", data.map(r => Number(r.temp_c)));
  drawLineChart("chHum",  data.map(r => Number(r.humidity)));
  drawLineChart("chPres", data.map(r => Number(r.pressure_hpa)));
  drawLineChart("chLux",  data.map(r => Number(r.lux)));
}
function labelAQ(mq135){
  if(mq135 == null || Number.isNaN(mq135)) return {label:"—", sub:"No MQ135 data yet", level:"neutral"};
  if(mq135 < 1200) return {label:"Good", sub:"Clean air", level:"good"};
  if(mq135 < 2000) return {label:"Moderate", sub:"Some pollutants", level:"warn"};
  return {label:"Poor", sub:"High pollutants/smoke", level:"bad"};
}

function labelCO(mq7){
  if(mq7 == null || Number.isNaN(mq7)) return {label:"—", sub:"No MQ7 data yet", level:"neutral"};
  if(mq7 < 900) return {label:"Safe", sub:"Normal range", level:"good"};
  if(mq7 < 1400) return {label:"Warning", sub:"Ventilation recommended", level:"warn"};
  return {label:"Danger", sub:"Move to fresh air", level:"bad"};
}

function trendArrow(delta){
  if(Number.isNaN(delta)) return "—";
  if(delta > 40) return "⬆ Rising";
  if(delta < -40) return "⬇ Falling";
  return "→ Stable";
}

function postRender(path){
  if(path==="#/daily"){
    document.querySelectorAll(".dayCard").forEach(card => {
      card.addEventListener("click", () => card.classList.toggle("open"));
    });
  }
  if(path==="#/history"){
    renderHistoryCharts();
    const b = document.getElementById("btnRefreshHist");
    if(b) b.onclick = renderHistoryCharts;
  if(path==="#/air") updateAirExtras();
  if(path==="#/device"){
  const d = document.getElementById("btnDemo");
  const e = document.getElementById("btnESP");
  const m = document.getElementById("modeText");

  if(d) d.onclick = () => { deviceMode="demo"; localStorage.setItem("deviceMode","demo"); if(m) m.textContent="DEMO"; };
  if(e) e.onclick = () => { deviceMode="esp32"; localStorage.setItem("deviceMode","esp32"); if(m) m.textContent="ESP32"; };
}
  }
}

// ---------- Render ----------

async function updateAirExtras(){
  // SAFE: this function must never throw
  try{
    const box = document.getElementById("alertsBox");
    const trendEl = document.getElementById("trendText");

    const r = latestCache || {};
    const mq135 = (r.mq135_raw == null ? NaN : Number(r.mq135_raw));
    const mq7   = (r.mq7_raw == null ? NaN : Number(r.mq7_raw));

    // Alerts based on current reading
    const alerts = [];
    if(!Number.isNaN(mq7) && mq7 >= 1400){
      alerts.push(alertLine("bad","CO Danger","High MQ7 detected. Ventilate immediately."));
    }else if(!Number.isNaN(mq7) && mq7 >= 900){
      alerts.push(alertLine("warn","CO Warning","MQ7 elevated. Ventilation recommended."));
    }

    if(!Number.isNaN(mq135) && mq135 >= 2000){
      alerts.push(alertLine("bad","Poor Air Quality","High MQ135 indicates pollution/smoke."));
    }else if(!Number.isNaN(mq135) && mq135 >= 1200){
      alerts.push(alertLine("warn","Moderate Air","Some pollutants detected. Monitor trend."));
    }

    if(box) box.innerHTML = alerts.length ? alerts.join("") : `<div class="miniMuted">No alerts right now.</div>`;

    // Trend from last ~10 minutes (20 points at 30s interval)
    let trendMsg = "Trend unavailable";
    try{
      const data = await fetchLast24h();
      const recent = data.slice(-20);

      const a = recent[0]?.mq135_raw, b = recent[recent.length-1]?.mq135_raw;
      const c1 = recent[0]?.mq7_raw,   c2 = recent[recent.length-1]?.mq7_raw;

      const d135 = (a==null||b==null) ? NaN : Number(b) - Number(a);
      const d7   = (c1==null||c2==null) ? NaN : Number(c2) - Number(c1);

      trendMsg = `MQ135 ${trendArrow(d135)} • MQ7 ${trendArrow(d7)}`;
    }catch{
      trendMsg = "Trend unavailable";
    }

    if(trendEl) trendEl.textContent = trendMsg;

  }catch(e){
    console.log("updateAirExtras failed", e);
    const box = document.getElementById("alertsBox");
    const trendEl = document.getElementById("trendText");
    if(box) box.innerHTML = `<div class="miniMuted">Air module error (ignored).</div>`;
    if(trendEl) trendEl.textContent = "—";
  }
}

function alertLine(type, title, text){
  const border = type==="bad" ? "rgba(239,68,68,.25)" : "rgba(245,158,11,.25)";
  const bg     = type==="bad" ? "rgba(239,68,68,.06)" : "rgba(245,158,11,.06)";
  return `
    <div style="border:1px solid ${border}; background:${bg}; border-radius:16px; padding:12px;">
      <b>${title}</b>
      <div class="miniMuted" style="margin-top:4px">${text}</div>
    </div>`;
}
async function render(){
  const root = $("#app");
  if(!root.innerHTML) root.innerHTML = shell();

  const r = currentRoute();
  setActiveNav(r.path);
  $("#pageTitle").textContent = r.label;

  await Promise.all([loadLatest(), loadForecast()]);

 const view = $("#view");
view.innerHTML = r.render();

if(r.path === "#/dashboard" && latestCache){
  const elT = $("#kTemp"); if(elT) elT.textContent = fmtNum(latestCache.temp_c, 2);
  const elH = $("#kHum");  if(elH) elH.textContent = fmtNum(latestCache.humidity, 2);
  const elP = $("#kPres"); if(elP) elP.textContent = fmtNum(latestCache.pressure_hpa, 2);
  const elL = $("#kLux");  if(elL) elL.textContent = fmtNum(latestCache.lux, 0);

  updateDashboardExtras();
}

tickClock();

  document.querySelectorAll(".navItem").forEach(el => {
    el.onclick = () => { location.hash = el.dataset.path; };
  });
document.querySelectorAll(".bNavItem").forEach(el => {
  el.onclick = () => { location.hash = el.dataset.path; };
});
  postRender(r.path);
}

window.addEventListener("hashchange", render);

// boot
if(!location.hash) location.hash = "#/dashboard";
render();
setInterval(loadLatest, 3000);
setInterval(tickClock, 1000);
setInterval(updateAgo, 1000);