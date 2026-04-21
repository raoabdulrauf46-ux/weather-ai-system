import json
from datetime import datetime, timedelta

out = []
today = datetime.now()

for i in range(7):
    d = today + timedelta(days=i)
    base = 28 + (i % 3)
    out.append({
        "date": d.strftime("%Y-%m-%d"),
        "temp_max_c": base + 3,
        "temp_min_c": base - 3,
        "humidity_avg": 45 + (i % 5),
        "pressure_avg_hpa": 1008 - (i % 4),
    })

with open("data/baseline_forecast.json", "w") as f:
    json.dump(out, f, indent=2)

print("Baseline forecast file created.")