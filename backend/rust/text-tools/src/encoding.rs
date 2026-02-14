use wasm_bindgen::prelude::*;
use base64::{Engine as _, engine::general_purpose};

/// Encode text to Base64
#[wasm_bindgen]
pub fn base64_encode(text: &str) -> String {
    general_purpose::STANDARD.encode(text.as_bytes())
}

/// Decode Base64 to text
#[wasm_bindgen]
pub fn base64_decode(encoded: &str) -> Result<String, JsValue> {
    general_purpose::STANDARD
        .decode(encoded)
        .map_err(|e| JsValue::from_str(&format!("Decode error: {}", e)))
        .and_then(|bytes| {
            String::from_utf8(bytes)
                .map_err(|e| JsValue::from_str(&format!("UTF-8 error: {}", e)))
        })
}

/// Encode text to hexadecimal
#[wasm_bindgen]
pub fn hex_encode(text: &str) -> String {
    hex::encode(text.as_bytes())
}

/// Decode hexadecimal to text
#[wasm_bindgen]
pub fn hex_decode(encoded: &str) -> Result<String, JsValue> {
    hex::decode(encoded)
        .map_err(|e| JsValue::from_str(&format!("Decode error: {}", e)))
        .and_then(|bytes| {
            String::from_utf8(bytes)
                .map_err(|e| JsValue::from_str(&format!("UTF-8 error: {}", e)))
        })
}

/// URL encode text
#[wasm_bindgen]
pub fn url_encode(text: &str) -> String {
    urlencoding::encode(text).to_string()
}

/// URL decode text
#[wasm_bindgen]
pub fn url_decode(encoded: &str) -> Result<String, JsValue> {
    urlencoding::decode(encoded)
        .map(|s| s.to_string())
        .map_err(|e| JsValue::from_str(&format!("Decode error: {}", e)))
}

// Need to add urlencoding crate
use percent_encoding::{utf8_percent_encode, percent_decode_str, NON_ALPHANUMERIC};

/// URL encode — aggressive variant (encodes ALL non-alphanumeric characters).
///
/// Unlike `url_encode` (RFC 3986, which preserves `-._~`), this uses
/// `percent_encoding::NON_ALPHANUMERIC`, so characters like `-`, `.`, `_`, `~`
/// are also percent-encoded. Use when maximum encoding is desired.
#[wasm_bindgen]
pub fn url_encode_alt(text: &str) -> String {
    utf8_percent_encode(text, NON_ALPHANUMERIC).to_string()
}

/// URL decode — counterpart to `url_encode_alt`.
///
/// Functionally identical to `url_decode` for well-formed input; provided as a
/// symmetric pair with `url_encode_alt`.
#[wasm_bindgen]
pub fn url_decode_alt(encoded: &str) -> Result<String, JsValue> {
    percent_decode_str(encoded)
        .decode_utf8()
        .map(|s| s.to_string())
        .map_err(|e| JsValue::from_str(&format!("Decode error: {}", e)))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_base64() {
        let text = "hello world";
        let encoded = base64_encode(text);
        let decoded = base64_decode(&encoded).unwrap();
        assert_eq!(decoded, text);
    }

    #[test]
    fn test_hex() {
        let text = "hello";
        let encoded = hex_encode(text);
        assert_eq!(encoded, "68656c6c6f");
        let decoded = hex_decode(&encoded).unwrap();
        assert_eq!(decoded, text);
    }
}
