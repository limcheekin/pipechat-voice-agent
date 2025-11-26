import json
from main import app

def export_openapi():
    openapi_data = app.openapi()
    with open("openapi.json", "w") as f:
        json.dump(openapi_data, f, indent=2)
    print("openapi.json generated successfully.")

if __name__ == "__main__":
    export_openapi()
