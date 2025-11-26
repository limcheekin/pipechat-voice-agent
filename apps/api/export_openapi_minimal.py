"""Minimal OpenAPI export script that doesn't require full dependencies."""
import json

# Create a minimal OpenAPI schema manually for demonstration
openapi_schema = {
    "openapi": "3.1.0",
    "info": {
        "title": "PipeChat Voice Agent API",
        "description": "Backend API for PipeChat Voice Agent",
        "version": "0.1.0"
    },
    "paths": {
        "/": {
            "get": {
                "summary": "Root",
                "operationId": "root__get",
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "message": {"type": "string"}
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/health": {
            "get": {
                "summary": "Health Check",
                "operationId": "health_check_health_get",
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "status": {"type": "string"}
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/bot/start": {
            "post": {
                "summary": "Start Bot",
                "operationId": "start_bot_api_bot_start_post",
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "message": {"type": "string"}
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

if __name__ == "__main__":
    with open("openapi.json", "w") as f:
        json.dump(openapi_schema, f, indent=2)
    print("✅ openapi.json generated successfully.")
