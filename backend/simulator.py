import time
import random
import requests
from datetime import datetime, timezone

API = "http://localhost:8000/ingest"
DEVICE_ID = "ceme_station_01"

# start with reasonable values
temp = 24.0
hum = 45.0
pres = 1008.0
lux = 300.0
mq135 = 1800
mq7 = 900

while True:
    # small random walk to look realistic
    temp += random.uniform(-0.05, 0.05)
    hum += random.uniform(-0.2, 0.2)
    pres += random.uniform(-0.03, 0.03)
    lux += random.uniform(-10, 10)
    mq135 += random.randint(-5, 5)
    mq7 += random.randint(-3, 3)

    payload = {
        "device_id": DEVICE_ID,
        "ts_utc": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "temp_c": round(temp, 2),
        "humidity": round(hum, 2),
        "pressure_hpa": round(pres, 2),
        "lux": max(0, round(lux, 0)),
        "mq135_raw": max(0, int(mq135)),
        "mq7_raw": max(0, int(mq7)),
    }

    try:
        r = requests.post(API, json=payload, timeout=5)
        print("sent:", payload, "->", r.status_code)
    except Exception as e:
        print("error:", e)

    time.sleep(30)  # exactly like your ESP32 plan