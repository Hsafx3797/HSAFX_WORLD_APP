#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;
use base64::{Engine as _, engine::general_purpose};

/// Encode text to Base64
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn base64_encode(text: &str) -> String {
    general_purpose::STANDARD.encode(text.as_bytes())
}

/// Decode Base64 to text (native)
pub fn base64_decode_native(encoded: &str) -> Result<String, String> {
    general_purpose::STANDARD
        .decode(encoded)
        .map_err(|e| format!("Decode error: {}", e))
        .and_then(|bytes| {
            String::from_utf8(bytes)
                .map_err(|e| format!("UTF-8 error: {}", e))
        })
}

/// Decode Base64 to text (wasm)
#[cfg(feature = "wasm")]
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn base64_decode(encoded: &str) -> Result<String, JsValue> {
    base64_decode_native(encoded).map_err(|e| JsValue::from_str(&e))
}

/// Encode text to hexadecimal
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn hex_encode(text: &str) -> String {
    hex::encode(text.as_bytes())
}

/// Decode hexadecimal to text (native)
pub fn hex_decode_native(encoded: &str) -> Result<String, String> {
    hex::decode(encoded)
        .map_err(|e| format!("Decode error: {}", e))
        .and_then(|bytes| {
            String::from_utf8(bytes)
                .map_err(|e| format!("UTF-8 error: {}", e))
        })
}

/// Decode hexadecimal to text (wasm)
#[cfg(feature = "wasm")]
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn hex_decode(encoded: &str) -> Result<String, JsValue> {
    hex_decode_native(encoded).map_err(|e| JsValue::from_str(&e))
}

/// URL encode text
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn url_encode(text: &str) -> String {
    urlencoding::encode(text).to_string()
}

/// URL decode text (native)
pub fn url_decode_native(encoded: &str) -> Result<String, String> {
    urlencoding::decode(encoded)
        .map(|s| s.to_string())
        .map_err(|e| format!("Decode error: {}", e))
}

/// URL decode text (wasm)
#[cfg(feature = "wasm")]
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn url_decode(encoded: &str) -> Result<String, JsValue> {
    url_decode_native(encoded).map_err(|e| JsValue::from_str(&e))
}

// Need to add urlencoding crate
use percent_encoding::{utf8_percent_encode, percent_decode_str, NON_ALPHANUMERIC};

/// URL encode — aggressive variant (encodes ALL non-alphanumeric characters).
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn url_encode_alt(text: &str) -> String {
    utf8_percent_encode(text, NON_ALPHANUMERIC).to_string()
}

/// URL decode alt (native)
pub fn url_decode_alt_native(encoded: &str) -> Result<String, String> {
    percent_decode_str(encoded)
        .decode_utf8()
        .map(|s| s.to_string())
        .map_err(|e| format!("Decode error: {}", e))
}

/// URL decode — counterpart to `url_encode_alt` (wasm)
#[cfg(feature = "wasm")]
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn url_decode_alt(encoded: &str) -> Result<String, JsValue> {
    url_decode_alt_native(encoded).map_err(|e| JsValue::from_str(&e))
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
