// =========================
// CEME SPA (Vanilla JS) - FULL, CRASH-PROOF
// =========================

const API = ""; // same-origin

function $(sel){ return document.querySelector(sel); }
function fmtTime(iso){ try { return new Date(iso).toLocaleString(); } catch { return "—"; } }

// ---------- FATAL ERROR OVERLAY (prevents blank screen) ----------
function showFatal(err){
  const root = document.getElementById("app");
  const msg = (err && (err.stack || err.message)) ? (err.stack || err.message) : String(err);

  if(root && !root.innerHTML){
    root.innerHTML = `<div style="padding:18px;color:white;font-family:system-ui">
      <h2 style="margin:0 0 10px 0;color:#ffd260">CEME App Error</h2>
      <pre style="white-space:pre-wrap;background:rgba(0,0,0,.6);border:1px solid rgba(255,210,96,.25);padding:12px;border-radius:12px">${msg}</pre>
      <div style="margin-top:10px;color:rgba(255,255,255,.7)">Copy this error and send it to me.</div>
    </div>`;
  }

  const view = document.getElementById("view");
  if(view){
    view.innerHTML = `<div class="card span12">
      <div class="kTitle">App crashed</div>
      <div style="margin-top:10px;color:rgba(255,255,255,.75)">Copy this error and send it to me:</div>
      <pre style="white-space:pre-wrap;background:rgba(0,0,0,.35);border:1px solid rgba(255,210,96,.25);padding:12px;border-radius:14px;margin-top:10px">${msg}</pre>
    </div>`;
  }

  console.log("FATAL:", err);
}
window.addEventListener("error", (e) => showFatal(e.error || e.message));
window.addEventListener("unhandledrejection", (e) => showFatal(e.reason || e));

// ---------- Icons ----------
const I = {
  dash: `<svg viewBox="0 0 24 24"><path d="M4 13h6V4H4v9Zm10 7h6V11h-6v9ZM4 20h6v-5H4v5Zm10-11h6V4h-6v5Z"/></svg>`,
  clock:`<svg viewBox="0 0 24 24"><path d="M12 8v5l3 2"/><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>`,
  cal:  `<svg viewBox="0 0 24 24"><path d="M8 2v3M16 2v3"/><path d="M3 9h18"/><path d="M5 5h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/></svg>`,
  air:  `<svg viewBox="0 0 24 24"><path d="M3 12h10a2 2 0 1 0-2-2"/><path d="M3 18h14a2 2 0 1 1-2 2"/><path d="M3 6h16a2 2 0 1 1-2 2"/></svg>`,
  hist: `<svg viewBox="0 0 24 24"><path d="M4 19V5"/><path d="M4 19h16"/><path d="M7 15l3-3 3 2 5-6"/></svg>`,
  dev:  `<svg viewBox="0 0 24 24"><path d="M8 7h8"/><path d="M9 11h6"/><path d="M10 15h4"/><path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/></svg>`,
  set:  `<svg viewBox="0 0 24 24"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a7.7 7.7 0 0 0 .1-2l2-1.2-2-3.4-2.3.6a7.3 7.3 0 0 0-1.7-1L13 2h-2l-.5 3a7.3 7.3 0 0 0-1.7 1L6.5 5.4l-2 3.4L6.5 10a7.7 7.7 0 0 0 0 4l-2 1.2 2 3.4 2.3-.6c.5.4 1.1.7 1.7 1l.5 3h2l.5-3c.6-.3 1.2-.6 1.7-1l2.3.6 2-3.4-2-1.2Z"/></svg>`
};

// ---------- Routes ----------
const routes = [
  { path:"#/dashboard", label:"Dashboard", icon:I.dash, render: renderDashboard },
  { path:"#/hourly",    label:"Hourly",    icon:I.clock, render: renderHourly },
  { path:"#/daily",     label:"Daily",     icon:I.cal, render: renderDaily },
  { path:"#/air",       label:"Air Quality", icon:I.air, render: renderAir },
  { path:"#/history",   label:"History",   icon:I.hist, render: renderHistory },
  { path:"#/device",    label:"Device",    icon:I.dev, render: renderDevice },
  { path:"#/settings",  label:"Settings",  icon:I.set, render: renderSettings },
];

function hintFor(path){
  if(path==="#/dashboard") return "Live station";
  if(path==="#/daily") return "AI forecast cards";
  if(path==="#/hourly") return "Nowcasting (soon)";
  if(path==="#/air") return "MQ alerts + trend";
  if(path==="#/history") return "Charts (24h)";
  if(path==="#/device") return "Wi-Fi/BLE (soon)";
  return "Export & controls";
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
            <span>NUST • Black & Gold</span>
          </div>
        </div>
        <img class="logo" src="assets/nust.png" alt="NUST">
      </div>

      <div class="nav">
        ${routes.map(r => `
          <div class="navItem" data-path="${r.path}">
            <div class="navIcon">${r.icon}</div>
            <div>
              <div style="font-weight:800">${r.label}</div>
              <div style="color:var(--muted);font-size:12px;margin-top:2px">${hintFor(r.path)}</div>
            </div>
          </div>
        `).join("")}
      </div>
    </aside>

    <main class="main">
      <div class="toprow">
        <div>
          <div class="pageTitle" id="pageTitle">—</div>
          <div class="pageSub" id="pageSub">—</div>
        </div>
        <div class="pills">
          <div class="pill"><span class="dot"></span><span id="statusText">Online</span></div>
          <div class="pill">Updated: <span id="lastUpdate">—</span></div>
          <div class="pill">Model: <span id="modelState">—</span></div>
          <a class="pill" style="text-decoration:none" href="/export.csv" target="_blank" rel="noopener">Download CSV</a>
        </div>
      </div>

      <div id="view" class="fadeEnter"></div>
    </main>
  </div>`;
}

function setActiveNav(path){
  document.querySelectorAll(".navItem").forEach(el => {
    el.classList.toggle("active", el.dataset.path === path);
  });
}

function currentRoute(){
  const h = location.hash || "#/dashboard";
  return routes.find(r => r.path === h) || routes[0];
}

// ---------- Data ----------
let latestCache = null;
let forecastCache = [];

async function loadHealth(){
  try{
    const r = await fetch("/health");
    const j = await r.json();
    $("#modelState").textContent = j.model_loaded ? "Loaded" : "Disabled";
  }catch{ $("#modelState").textContent = "—"; }
}

async function loadLatest(){
  try{
    const r = await fetch("/latest");
    const j = await r.json();
    if(!j.has_data) return;
    latestCache = j.reading;
    const t = $("#lastUpdate"); if(t) t.textContent = fmtTime(latestCache.ts_utc || "");
    // live cards if present
    const elT=$("#kTemp"); if(elT) elT.textContent = latestCache.temp_c ?? "—";
    const elH=$("#kHum");  if(elH) elH.textContent = latestCache.humidity ?? "—";
    const elP=$("#kPres"); if(elP) elP.textContent = latestCache.pressure_hpa ?? "—";
    const elL=$("#kLux");  if(elL) elL.textContent = latestCache.lux ?? "—";
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

// ---------- Charts (History) ----------
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

  // grid
  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = "#FFD260";
  ctx.lineWidth = 1;
  for(let k=0;k<=4;k++){
    const y = padT + (k/4)*plotH;
    ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(W-padR,y); ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // y labels
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.font = "12px system-ui";
  for(let k=0;k<=4;k++){
    const v = (max - (k/4)*(max-min)).toFixed(0);
    const y = padT + (k/4)*plotH;
    ctx.fillText(v, 8, y+4);
  }

  // line
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

  // dots
  ctx.fillStyle = "rgba(255,210,96,0.9)";
  for(let i=0;i<values.length;i+=60){
    const v = values[i];
    if(typeof v !== "number" || isNaN(v)) continue;
    const x = padL + (i/(values.length-1))*plotW;
    const y = yAt(v);
    ctx.beginPath(); ctx.arc(x,y,2.2,0,Math.PI*2); ctx.fill();
  }
}

async function renderHistoryCharts(){
  const data = await fetchLast24h();
  const temp = data.map(r => (r.temp_c==null? NaN : Number(r.temp_c)));
  const hum  = data.map(r => (r.humidity==null? NaN : Number(r.humidity)));
  const pres = data.map(r => (r.pressure_hpa==null? NaN : Number(r.pressure_hpa)));
  const lux  = data.map(r => (r.lux==null? NaN : Number(r.lux)));

  drawLineChart("chTemp", temp);
  drawLineChart("chHum", hum);
  drawLineChart("chPres", pres);
  drawLineChart("chLux", lux);
}

// ---------- Air labeling helpers ----------
function labelAQ(mq135){
  if(mq135 == null || isNaN(mq135)) return {label:"—", sub:"No data", level:"neutral"};
  if(mq135 < 1200) return {label:"Good", sub:"Clean air", level:"good"};
  if(mq135 < 2000) return {label:"Moderate", sub:"Some pollutants", level:"warn"};
  return {label:"Poor", sub:"High pollutants", level:"bad"};
}

function labelCO(mq7){
  if(mq7 == null || isNaN(mq7)) return {label:"—", sub:"No data", level:"neutral"};
  if(mq7 < 900) return {label:"Safe", sub:"Normal range", level:"good"};
  if(mq7 < 1400) return {label:"Warning", sub:"Ventilation recommended", level:"warn"};
  return {label:"Danger", sub:"Move to fresh air", level:"bad"};
}

function trendArrow(delta){
  if(isNaN(delta)) return "—";
  if(delta > 40) return "⬆ Rising";
  if(delta < -40) return "⬇ Falling";
  return "→ Stable";
}

function alertLine(type, title, text){
  return `
    <div class="alert ${type}">
      <b>${title}</b>
      <div class="miniMuted" style="margin-top:4px">${text}</div>
    </div>
  `;
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
      <div style="margin-top:10px;font-weight:900;font-size:22px" id="comfortText">—</div>
      <div class="kUnit" id="comfortSub">Feels like based on temp + humidity</div>
    </div>

    <div class="card span6">
      <div class="kTitle">Quick Insights</div>
      <div style="margin-top:10px;color:var(--muted);line-height:1.6" id="insightsText">—</div>
    </div>
  </div>`;
}

function renderHourly(){
  return `
  <div class="grid">
    <div class="card span12">
      <div class="kTitle">Hourly / Nowcasting</div>
      <div style="margin-top:10px;color:var(--muted);line-height:1.6">
        Next 24h + next 6h sensor-based nowcasting will be added next.
      </div>
    </div>
  </div>`;
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
            <div class="miniMuted">AI Forecast <span class="confPill">${conf}</span></div>
          </div>
          <div class="tempBig">${isNaN(hi) ? "—" : hi.toFixed(1) + "°"}</div>
        </div>

        <div class="dayCardMid">
          <div class="miniRow">
            <span class="miniMuted">Low</span>
            <b>${isNaN(lo) ? "—" : lo.toFixed(1) + "°"}</b>
          </div>
          <div class="miniRow">
            <span class="miniMuted">Baseline</span>
            <b>${d.baseline_temp_c ?? "—"}°</b>
          </div>
        </div>

        <div class="dayCardBottom">
          <div class="miniRow">
            <span class="miniMuted">Humidity</span>
            <b>${d.humidity_avg ?? "—"}%</b>
          </div>
          <div class="miniRow">
            <span class="miniMuted">Pressure</span>
            <b>${d.pressure_avg_hpa ?? "—"} hPa</b>
          </div>
        </div>

        <div class="expandHint">Tap for details</div>

        <div class="dayDetails">
          <div class="detailGrid">
            <div class="detailBox">
              <div class="miniMuted">AI Adjusted</div>
              <div class="detailVal">${d.ai_temp_c ?? "—"} °C</div>
            </div>
            <div class="detailBox">
              <div class="miniMuted">Baseline</div>
              <div class="detailVal">${d.baseline_temp_c ?? "—"} °C</div>
            </div>
            <div class="detailBox">
              <div class="miniMuted">Min Temp</div>
              <div class="detailVal">${d.temp_min_c ?? "—"} °C</div>
            </div>
            <div class="detailBox">
              <div class="miniMuted">Confidence</div>
              <div class="detailVal">${conf}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  return `
  <div class="grid">
    <div class="card span12">
      <div class="kTitle">Swipe Daily Cards</div>
      <div class="miniMuted" style="margin-top:8px;">Tap a card to expand.</div>
      <div class="cardStrip" id="cardStrip">${cards || ""}</div>
    </div>
  </div>`;
}

function renderAir(){
  return `
  <div class="grid">
    <div class="card span4">
      <div class="kTitle">Air Quality (MQ135)</div>
      <div class="kValue" id="aqLabel">—</div>
      <div class="kUnit" id="aqSub">—</div>
    </div>

    <div class="card span4">
      <div class="kTitle">CO Risk (MQ7)</div>
      <div class="kValue" id="coLabel">—</div>
      <div class="kUnit" id="coSub">—</div>
    </div>

    <div class="card span4">
      <div class="kTitle">Trend (10 min)</div>
      <div style="margin-top:10px;font-weight:900;font-size:22px" id="trendText">—</div>
      <div class="kUnit">Based on recent sensor change</div>
    </div>

    <div class="card span12">
      <div class="kTitle">Alerts</div>
      <div style="margin-top:10px; display:flex; flex-direction:column; gap:10px;" id="alertsBox">
        <div class="miniMuted">No alerts yet.</div>
      </div>
    </div>

    <div class="card span12">
      <div class="kTitle">Raw Sensors</div>
      <div style="margin-top:12px; display:grid; grid-template-columns: repeat(2, 1fr); gap:12px;">
        <div class="rawBox">
          <div class="miniMuted">MQ135 raw</div>
          <div style="font-weight:900;font-size:26px" id="mq135">—</div>
        </div>
        <div class="rawBox">
          <div class="miniMuted">MQ7 raw</div>
          <div style="font-weight:900;font-size:26px" id="mq7">—</div>
        </div>
      </div>
      <div style="margin-top:12px;color:var(--muted);line-height:1.6">
        Note: raw ADC values for demo. Calibration → ppm later.
      </div>
    </div>
  </div>`;
}

function renderHistory(){
  return `
  <div class="grid">
    <div class="card span12">
      <div class="kTitle">History (Last 24 Hours)</div>
      <div style="margin-top:10px;color:var(--muted);line-height:1.6">
        Live plot from your station database.
      </div>

      <div style="margin-top:14px; display:grid; grid-template-columns: repeat(2, 1fr); gap:12px;">
        <div style="border:1px solid rgba(255,255,255,.08); border-radius:16px; padding:10px; background: rgba(0,0,0,.22);">
          <div class="kTitle">Temperature (°C)</div>
          <canvas id="chTemp" width="520" height="220" style="width:100%; height:auto;"></canvas>
        </div>
        <div style="border:1px solid rgba(255,255,255,.08); border-radius:16px; padding:10px; background: rgba(0,0,0,.22);">
          <div class="kTitle">Humidity (%)</div>
          <canvas id="chHum" width="520" height="220" style="width:100%; height:auto;"></canvas>
        </div>
        <div style="border:1px solid rgba(255,255,255,.08); border-radius:16px; padding:10px; background: rgba(0,0,0,.22);">
          <div class="kTitle">Pressure (hPa)</div>
          <canvas id="chPres" width="520" height="220" style="width:100%; height:auto;"></canvas>
        </div>
        <div style="border:1px solid rgba(255,255,255,.08); border-radius:16px; padding:10px; background: rgba(0,0,0,.22);">
          <div class="kTitle">Light (lux)</div>
          <canvas id="chLux" width="520" height="220" style="width:100%; height:auto;"></canvas>
        </div>
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
      <div class="kTitle">Device & Connectivity</div>
      <div style="margin-top:10px;color:var(--muted);line-height:1.6">
        Next: show Wi-Fi status, BLE fallback, last ESP32 heartbeat, battery.
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
        Units, refresh rate, competition mode.
      </div>
    </div>
  </div>`;
}

// ---------- Page hooks ----------
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
  const c = $("#comfortText"); if(c) c.textContent = mood;

  const insights = [];
  if(!isNaN(t)) insights.push(`Temperature is ${t.toFixed(1)}°C.`);
  if(!isNaN(h)) insights.push(`Humidity is ${h.toFixed(0)}%.`);
  if(forecastCache?.length){
    insights.push(`AI forecast horizon: ${forecastCache.length} days.`);
    insights.push(`Tomorrow (AI): ${forecastCache[1]?.ai_temp_c ?? "—"}°C.`);
  }
  const ins = $("#insightsText"); if(ins) ins.textContent = insights.join(" ");
}

async function updateAirExtras(){
  const r = latestCache;
  if(!r) return;

  const mq135 = (r.mq135_raw == null ? NaN : Number(r.mq135_raw));
  const mq7   = (r.mq7_raw == null ? NaN : Number(r.mq7_raw));

  const aq = labelAQ(mq135);
  const co = labelCO(mq7);

  const aqEl = $("#aqLabel"); const aqSub = $("#aqSub");
  const coEl = $("#coLabel"); const coSub = $("#coSub");

  if(aqEl){ aqEl.textContent = aq.label; aqEl.className = `kValue level-${aq.level}`; }
  if(aqSub) aqSub.textContent = aq.sub;

  if(coEl){ coEl.textContent = co.label; coEl.className = `kValue level-${co.level}`; }
  if(coSub) coSub.textContent = co.sub;

  const m1=$("#mq135"); if(m1) m1.textContent = isNaN(mq135) ? "—" : mq135;
  const m2=$("#mq7");   if(m2) m2.textContent = isNaN(mq7) ? "—" : mq7;

  // Trend (crash-proof)
  let trendMsg = "—";
  const trendEl = $("#trendText");

  try{
    const data = await fetchLast24h();
    const recent = data.slice(-20);

    const a = recent[0]?.mq135_raw, b = recent[recent.length-1]?.mq135_raw;
    const c1 = recent[0]?.mq7_raw,   c2 = recent[recent.length-1]?.mq7_raw;

    const d135 = (a==null||b==null) ? NaN : Number(b) - Number(a);
    const d7   = (c1==null||c2==null) ? NaN : Number(c2) - Number(c1);

    trendMsg = `MQ135 ${trendArrow(d135)} • MQ7 ${trendArrow(d7)}`;
  }catch(e){
    console.log("trend calc failed", e);
    trendMsg = "—";
  }

  if(trendEl) trendEl.textContent = trendMsg;

  // Alerts
  const alerts = [];
  if(co.level === "bad"){
    alerts.push(alertLine("bad","CO Danger","High MQ7 detected. Move to fresh air and ventilate immediately."));
  }else if(co.level === "warn"){
    alerts.push(alertLine("warn","CO Warning","MQ7 elevated. Ventilation recommended."));
  }

  if(aq.level === "bad"){
    alerts.push(alertLine("bad","Poor Air Quality","High MQ135 indicates pollution/smoke. Consider mask/ventilation."));
  }else if(aq.level === "warn"){
    alerts.push(alertLine("warn","Moderate Air Quality","Some pollutants detected. Monitor trend."));
  }

  const box = $("#alertsBox");
  if(box) box.innerHTML = alerts.length ? alerts.join("") : `<div class="miniMuted">No alerts right now.</div>`;
}

function postRender(path){
  if(path==="#/dashboard") updateDashboardExtras();
  if(path==="#/daily"){
    document.querySelectorAll(".dayCard").forEach(card => {
      card.addEventListener("click", () => card.classList.toggle("open"));
    });
  }
  if(path==="#/air") updateAirExtras();
  if(path==="#/history"){
    renderHistoryCharts();
    const b = document.getElementById("btnRefreshHist");
    if(b) b.onclick = renderHistoryCharts;
  }
}

// ---------- Router render ----------
async function render(){
  try{
    const root = $("#app");
    if(!root.innerHTML) root.innerHTML = shell();

    const r = currentRoute();
    setActiveNav(r.path);

    $("#pageTitle").textContent = r.label;
    $("#pageSub").textContent = hintFor(r.path);

    await Promise.all([loadHealth(), loadLatest(), loadForecast()]);

    const view = $("#view");
    view.className = "fadeEnter";
    view.innerHTML = r.render();

    document.querySelectorAll(".navItem").forEach(el => {
      el.onclick = () => { location.hash = el.dataset.path; };
    });

    postRender(r.path);
  }catch(err){
    showFatal(err);
  }
}

window.addEventListener("hashchange", render);

// boot
if(!location.hash) location.hash = "#/dashboard";
render();
setInterval(loadLatest, 5000);