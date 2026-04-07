mod engines;

use axum::{
    extract::Json,
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use subtle::ConstantTimeEq;
use tower_http::cors::CorsLayer;
use tracing::info;

#[derive(Deserialize)]
struct ExecuteRequest {
    engine: String,
    input: serde_json::Value,
    options: Option<serde_json::Value>,
}

#[derive(Serialize)]
struct ExecuteResponse {
    output: serde_json::Value,
    #[serde(skip_serializing_if = "Option::is_none")]
    metadata: Option<serde_json::Value>,
}

#[derive(Serialize)]
struct ErrorResponse {
    error: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    code: Option<String>,
}

fn verify_secret(headers: &HeaderMap) -> Result<(), (StatusCode, Json<ErrorResponse>)> {
    let expected = std::env::var("INTERNAL_API_SECRET").unwrap_or_default();
    if expected.is_empty() {
        return Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: "INTERNAL_API_SECRET not configured".into(),
                code: Some("CONFIG_ERROR".into()),
            }),
        ));
    }

    let provided = headers
        .get("x-internal-secret")
        .and_then(|v| v.to_str().ok())
        .unwrap_or_default();

    if provided.as_bytes().ct_eq(expected.as_bytes()).unwrap_u8() != 1 {
        return Err((
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse {
                error: "Invalid internal secret".into(),
                code: Some("UNAUTHORIZED".into()),
            }),
        ));
    }

    Ok(())
}

async fn health() -> impl IntoResponse {
    Json(serde_json::json!({
        "status": "ok",
        "service": "engine-service",
        "engines": engines::SUPPORTED_ENGINES,
    }))
}

async fn execute(
    headers: HeaderMap,
    Json(req): Json<ExecuteRequest>,
) -> Result<Json<ExecuteResponse>, (StatusCode, Json<ErrorResponse>)> {
    verify_secret(&headers)?;

    let input = match &req.input {
        serde_json::Value::String(s) => s.clone(),
        other => serde_json::to_string(other).unwrap_or_default(),
    };

    let options = req.options.unwrap_or(serde_json::Value::Object(Default::default()));

    let result = engines::dispatch(&req.engine, &input, &options).map_err(|e| {
        let status = if e.contains("Unknown engine") || e.contains("Unknown") {
            StatusCode::BAD_REQUEST
        } else {
            StatusCode::UNPROCESSABLE_ENTITY
        };
        (
            status,
            Json(ErrorResponse {
                error: e,
                code: Some("ENGINE_ERROR".into()),
            }),
        )
    })?;

    Ok(Json(result))
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "engine_service=info,tower_http=info".into()),
        )
        .init();

    let app = Router::new()
        .route("/health", get(health))
        .route("/execute", post(execute))
        .layer(CorsLayer::permissive());

    let host = std::env::var("HOST").unwrap_or_else(|_| "0.0.0.0".into());
    let port = std::env::var("PORT").unwrap_or_else(|_| "3001".into());
    let addr = format!("{}:{}", host, port);

    info!("Engine service listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
