use crate::ExecuteResponse;
use serde_json::json;

/// Encode engine — dispatches to text-tools encoding functions.
/// Options: codec, operation (encode/decode), shift, key, rails
pub fn execute(input: &str, options: &serde_json::Value) -> Result<ExecuteResponse, String> {
    let codec = options
        .get("codec")
        .and_then(|v| v.as_str())
        .ok_or("Missing required option: codec")?;
    let operation = options
        .get("operation")
        .and_then(|v| v.as_str())
        .unwrap_or("encode");

    let output = match (codec, operation) {
        ("base64", "encode") => text_tools::base64_encode(input),
        ("base64", "decode") => text_tools::base64_decode_native(input)?,
        ("hex", "encode") => text_tools::hex_encode(input),
        ("hex", "decode") => text_tools::hex_decode_native(input)?,
        ("url", "encode") => text_tools::url_encode(input),
        ("url", "decode") => text_tools::url_decode_native(input)?,
        ("url-component", "encode") => text_tools::url_encode_alt(input),
        ("url-component", "decode") => text_tools::url_decode_alt_native(input)?,
        ("html", "encode") => text_tools::html_escape(input),
        ("html", "decode") => text_tools::html_unescape(input),
        ("xml", "encode") => text_tools::xml_escape(input),
        ("json", "encode") => text_tools::json_escape(input),
        ("rot13", _) => text_tools::rot13(input),
        ("rot47", _) => text_tools::rot47(input),
        ("caesar", "encode") => {
            let shift = options.get("shift").and_then(|v| v.as_i64()).unwrap_or(3) as i32;
            text_tools::caesar_cipher(input, shift)
        }
        ("caesar", "decode") => {
            let shift = options.get("shift").and_then(|v| v.as_i64()).unwrap_or(3) as i32;
            text_tools::caesar_cipher(input, -shift)
        }
        ("morse", "encode") => text_tools::morse_encode(input),
        ("morse", "decode") => text_tools::morse_decode(input),
        ("nato", "encode") => text_tools::nato_encode(input),
        ("pig-latin", _) => text_tools::pig_latin(input),
        ("base32", "encode") => text_tools::base32_encode(input),
        ("base32", "decode") => text_tools::base32_decode_native(input)?,
        ("binary", "encode") => text_tools::binary_encode(input),
        ("binary", "decode") => text_tools::binary_decode_native(input)?,
        ("octal", "encode") => text_tools::octal_encode(input),
        ("octal", "decode") => text_tools::octal_decode_native(input)?,
        ("ascii", "encode") => text_tools::ascii_encode(input),
        ("ascii", "decode") => text_tools::ascii_decode_native(input)?,
        ("atbash", _) => text_tools::atbash_cipher(input),
        _ => return Err(format!("Unknown codec/operation: {}/{}", codec, operation)),
    };

    Ok(ExecuteResponse {
        output: json!(output),
        metadata: Some(json!({
            "codec": codec,
            "operation": operation,
            "inputLength": input.len(),
            "outputLength": output.len(),
        })),
    })
}
