import os
import requests

api_key = os.getenv("LEONARDO_API_KEY", "")
if not api_key:
    raise RuntimeError("Set LEONARDO_API_KEY before running this script.")

headers = {"Authorization": f"Bearer {api_key}"}

response = requests.get("https://cloud.leonardo.ai/api/rest/v1/models", headers=headers, timeout=30)
response.raise_for_status()
models = response.json().get("models", [])

# Create a mapping: Likely API Name -> Model ID
model_map = {}
for m in models:
    model_map[m["name"]] = m["id"]

# Example output
print(model_map)
