from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

import sqlite3
import json
import math
import joblib
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional
from fastapi.responses import StreamingResponse
import csv
import io
from fastapi.responses import JSONResponse
import random
from datetime import timedelta


# ---------- Paths (bulletproof on Windows) ----------
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
BASELINE_PATH = DATA_DIR / "baseline_forecast.json"
MODEL_PATH = BASE_DIR / "ceme_models.joblib"
DB_PATH = BASE_DIR / "weather.db"

# ---------- App ----------
app = FastAPI(title="CEME Smart Microclimate System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- DB ----------
def db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = db()
    cur = conn.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts_utc TEXT NOT NULL,
        device_id TEXT NOT NULL,
        temp_c REAL,
        humidity REAL,
        pressure_hpa REAL,
        lux REAL,
        mq135_raw INTEGER,
        mq7_raw INTEGER
    )
    """)
    conn.commit()
    conn.close()

init_db()

# ---------- Model ----------
MODEL_BUNDLE = None

def load_models():
    """
    Loads the model bundle safely. If anything is wrong, disables AI instead of crashing.
    """
    global MODEL_BUNDLE
    if not MODEL_PATH.exists():
        print("⚠️ Model file not found:", MODEL_PATH, "(AI disabled)")
        MODEL_BUNDLE = None
        return

    try:
        bundle = joblib.load(MODEL_PATH)

        # Validate expected keys
        required = ["features", "model_temp"]
        for k in required:
            if k not in bundle:
                raise ValueError(f"Model bundle missing key: {k}")

        # Basic sanity: model must have predict
        if not hasattr(bundle["model_temp"], "predict"):
            raise ValueError("model_temp has no predict()")

        MODEL_BUNDLE = bundle
        print("✅ Loaded AI model bundle:", MODEL_PATH)

    except Exception as e:
        print("⚠️ Failed to load model bundle:", e, "(AI disabled)")
        MODEL_BUNDLE = None

load_models()

# ---------- Schemas ----------
class ReadingIn(BaseModel):
    device_id: str = Field(..., examples=["ceme_station_01"])
    ts_utc: Optional[str] = Field(None, description="ISO8601 UTC timestamp. If omitted, server time is used.")
    temp_c: Optional[float] = None
    humidity: Optional[float] = None
    pressure_hpa: Optional[float] = None
    lux: Optional[float] = None
    mq135_raw: Optional[int] = None
    mq7_raw: Optional[int] = None

# ---------- Routes ----------
@app.get("/health")
def health():
    return {"ok": True, "model_loaded": MODEL_BUNDLE is not None}

@app.post("/ingest")
def ingest(r: ReadingIn):
    ts = r.ts_utc or datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    conn = db()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO readings (ts_utc, device_id, temp_c, humidity, pressure_hpa, lux, mq135_raw, mq7_raw)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (ts, r.device_id, r.temp_c, r.humidity, r.pressure_hpa, r.lux, r.mq135_raw, r.mq7_raw))
    conn.commit()
    conn.close()
    return {"status": "stored", "ts_utc": ts}

@app.get("/latest")
def latest():
    conn = db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM readings ORDER BY id DESC LIMIT 1")
    row = cur.fetchone()
    conn.close()
    if not row:
        return {"has_data": False}
    return {"has_data": True, "reading": dict(row)}

@app.get("/last24h")
def last24h(limit: int = 2880):
    conn = db()
    cur = conn.cursor()
    cur.execute("""
        SELECT ts_utc, temp_c, humidity, pressure_hpa, lux, mq135_raw, mq7_raw
        FROM readings
        ORDER BY id DESC
        LIMIT ?
    """, (limit,))
    rows = cur.fetchall()
    conn.close()
    data = [dict(r) for r in rows][::-1]
    return {"count": len(data), "data": data}

@app.get("/export.csv")
def export_csv(limit: int = 10000):
    conn = db()
    cur = conn.cursor()
    cur.execute("""
        SELECT ts_utc, device_id, temp_c, humidity, pressure_hpa, lux, mq135_raw, mq7_raw
        FROM readings
        ORDER BY id DESC
        LIMIT ?
    """, (limit,))
    rows = cur.fetchall()
    conn.close()

    output = io.StringIO()
    w = csv.writer(output)
    w.writerow(["ts_utc","device_id","temp_c","humidity","pressure_hpa","lux","mq135_raw","mq7_raw"])
    for r in rows[::-1]:
        w.writerow([r["ts_utc"], r["device_id"], r["temp_c"], r["humidity"], r["pressure_hpa"], r["lux"], r["mq135_raw"], r["mq7_raw"]])

    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv")

@app.get("/forecast")
def forecast():
    """
    Offline forecast:
    - Reads local baseline_forecast.json
    - Applies ML correction if model exists
    """
    if not BASELINE_PATH.exists():
        return {"days": []}

    with BASELINE_PATH.open("r", encoding="utf-8") as f:
        baseline_days = json.load(f)

    out = []

    for i, item in enumerate(baseline_days):
        dt = datetime.strptime(item["date"], "%Y-%m-%d")

        t_base = float(item["temp_max_c"])
        rh_base = float(item.get("humidity_avg", 50))
        p_base = float(item.get("pressure_avg_hpa", 1008))

        t_ai = t_base
        conf = "Baseline"

        if MODEL_BUNDLE is not None:
            feats = MODEL_BUNDLE["features"]

            hour = 12
            dow = dt.weekday()
            month = dt.month
            doy = int(dt.strftime("%j"))

            hour_sin = math.sin(2 * math.pi * hour / 24)
            hour_cos = math.cos(2 * math.pi * hour / 24)
            doy_sin = math.sin(2 * math.pi * doy / 365.25)
            doy_cos = math.cos(2 * math.pi * doy / 365.25)

            feature_map = {
                "t_base": t_base,
                "rh_base": rh_base,
                "p_base": p_base,
                "hour_sin": hour_sin,
                "hour_cos": hour_cos,
                "doy_sin": doy_sin,
                "doy_cos": doy_cos,
                "dow": dow,
                "month": month,
            }

            X = [[feature_map[name] for name in feats]]
            t_corr = float(MODEL_BUNDLE["model_temp"].predict(X)[0])
            t_ai = t_base + t_corr

            if i <= 1:
                conf = "High"
            elif i <= 4:
                conf = "Medium"
            else:
                conf = "Low"

        out.append({
            "day": dt.strftime("%a %d %b"),
            "baseline_temp_c": round(t_base, 1),
            "ai_temp_c": round(t_ai, 1),
            "confidence": conf
        })

    return {"days": out}# ---------------- DEMO DATA SEED ----------------
@app.get("/admin/seed_demo")
def seed_demo():
    conn = db()
    cur = conn.cursor()

    now = datetime.now(timezone.utc)

    for i in range(200):  # 200 readings (~100 minutes if 30s interval)
        ts = (now - timedelta(seconds=30*i)).isoformat().replace("+00:00","Z")
        cur.execute("""
            INSERT INTO readings
            (ts_utc, device_id, temp_c, humidity, pressure_hpa, lux, mq135_raw, mq7_raw)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            ts,
            "demo_station",
            28 + random.uniform(-3,3),
            60 + random.uniform(-10,10),
            1008 + random.uniform(-5,5),
            300 + random.uniform(-100,100),
            random.randint(800,1800),
            random.randint(600,1500)
        ))

    conn.commit()
    conn.close()

    return {"status":"demo data inserted"}


# ---------------- RESET DATABASE ----------------
@app.get("/admin/reset")
def reset_db():
    conn = db()
    cur = conn.cursor()
    cur.execute("DELETE FROM readings")
    conn.commit()
    conn.close()
    return {"status":"database cleared"}


# ---------------- HEALTH CHECK ----------------
@app.get("/health")
def health():
    baseline_path = BASELINE_PATH if 'BASELINE_PATH' in globals() else None
    baseline_days = 0

    try:
        if baseline_path and baseline_path.exists():
            with baseline_path.open("r", encoding="utf-8") as f:
                baseline_days = len(json.load(f))
    except:
        baseline_days = 0

    return {
        "db_ok": True,
        "model_loaded": MODEL_BUNDLE is not None,
        "baseline_days": baseline_days
    }

# Serve frontend files (keep LAST)
app.mount("/", StaticFiles(directory=str(BASE_DIR.parent / "frontend"), html=True), name="frontend")