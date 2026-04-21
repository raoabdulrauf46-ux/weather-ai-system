import json
import requests

# CEME NUST Rawalpindi (approx)
LAT = 33.5936
LON = 73.0551

url = "https://api.open-meteo.com/v1/forecast"
params = {
    "latitude": LAT,
    "longitude": LON,
    "daily": "temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,surface_pressure_mean",
    "forecast_days": 16,
    "timezone": "UTC"
}

r = requests.get(url, params=params, timeout=30)
r.raise_for_status()
j = r.json()

daily = j["daily"]
out = []
for i, date in enumerate(daily["time"]):
    out.append({
        "date": date,
        "temp_max_c": daily["temperature_2m_max"][i],
        "temp_min_c": daily["temperature_2m_min"][i],
        "humidity_avg": daily.get("relative_humidity_2m_mean", [None]*len(daily["time"]))[i],
        "pressure_avg_hpa": daily.get("surface_pressure_mean", [None]*len(daily["time"]))[i],
    })

with open("data/baseline_forecast.json", "w", encoding="utf-8") as f:
    json.dump(out, f, indent=2)

print("Saved 16-day baseline to data/baseline_forecast.json")
print("Days:", len(out))
print("First:", out[0])