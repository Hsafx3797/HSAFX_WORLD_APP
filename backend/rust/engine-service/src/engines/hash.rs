use crate::ExecuteResponse;
use serde_json::json;

/// Hash engine — dispatches to text-tools hashing functions.
pub fn execute(input: &str, options: &serde_json::Value) -> Result<ExecuteResponse, String> {
    let algorithm = options
        .get("algorithm")
        .and_then(|v| v.as_str())
        .ok_or("Missing required option: algorithm")?;
    let output_format = options
        .get("output")
        .and_then(|v| v.as_str())
        .unwrap_or("hex");

    let hash_hex = match algorithm {
        "md5" => text_tools::md5_hash(input),
        "sha1" | "sha-1" => text_tools::sha1_hash(input),
        "sha256" | "sha-256" => text_tools::sha256_hash(input),
        "sha512" | "sha-512" => text_tools::sha512_hash(input),
        "crc32" => text_tools::crc32_hash(input),
        "djb2" => text_tools::djb2_hash(input),
        "fnv1a" | "fnv-1a" => text_tools::fnv1a_hash(input),
        "adler32" => text_tools::adler32_hash(input),
        _ => return Err(format!("Unknown hash algorithm: {}", algorithm)),
    };

    let output = if output_format == "base64" {
        if let Ok(bytes) = hex::decode(&hash_hex) {
            use base64::Engine;
            base64::engine::general_purpose::STANDARD.encode(&bytes)
        } else {
            hash_hex
        }
    } else {
        hash_hex
    };

    Ok(ExecuteResponse {
        output: json!(output),
        metadata: Some(json!({
            "algorithm": algorithm,
            "outputFormat": output_format,
        })),
    })
}
