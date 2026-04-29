use crate::ExecuteResponse;
use serde_json::json;

/// Generate-data engine — UUID, password, nanoid, lorem, person names, etc.
pub fn execute(input: &str, options: &serde_json::Value) -> Result<ExecuteResponse, String> {
    let gen_type = options
        .get("type")
        .and_then(|v| v.as_str())
        .ok_or("Missing required option: type")?;
    let count = options
        .get("count")
        .and_then(|v| v.as_u64())
        .unwrap_or(1) as usize;

    let items: Vec<String> = (0..count)
        .map(|_| generate_one(gen_type, input, options))
        .collect::<Result<Vec<_>, _>>()?;

    let output = if items.len() == 1 {
        items[0].clone()
    } else {
        items.join("\n")
    };

    Ok(ExecuteResponse {
        output: json!(output),
        metadata: Some(json!({ "type": gen_type, "count": count })),
    })
}

fn generate_one(
    gen_type: &str,
    _input: &str,
    options: &serde_json::Value,
) -> Result<String, String> {
    match gen_type {
        "uuid" | "uuid-v4" => Ok(text_tools::generate_uuid()),
        "uuid-v1" => Ok(text_tools::generate_uuid_v1()),
        "uuid-v5" => {
            let namespace = get_opt_str(options, "namespace", "url");
            let name = if _input.is_empty() { "example" } else { _input };
            Ok(text_tools::generate_uuid_v5(namespace, name))
        }
        "uuid-v7" => Ok(text_tools::generate_uuid_v7()),
        "password" => {
            let length = get_opt_u64(options, "length", 16) as usize;
            let include_symbols = get_opt_bool(options, "includeSymbols", true);
            let include_numbers = get_opt_bool(options, "includeNumbers", true);
            Ok(text_tools::generate_password(length, include_symbols, include_numbers))
        }
        "lorem" | "lorem-ipsum" => {
            let paragraphs = get_opt_u64(options, "paragraphs", 1) as usize;
            Ok(text_tools::lorem_ipsum(paragraphs))
        }
        "slug" => Ok(text_tools::url_slug(_input)),
        "nanoid" => {
            let size = get_opt_u64(options, "size", 21) as usize;
            Ok(text_tools::generate_nanoid(size))
        }
        "passphrase" => {
            let words = get_opt_u64(options, "words", 4) as usize;
            let sep = get_opt_str(options, "separator", "-");
            Ok(text_tools::generate_passphrase(words, sep))
        }
        "person" => Ok(text_tools::generate_person_name()),
        "company" => Ok(text_tools::generate_company_name()),
        "credit-card" => {
            let card_type = get_opt_str(options, "cardType", "visa");
            Ok(text_tools::generate_credit_card(card_type))
        }
        "color" => Ok(text_tools::generate_color()),
        "color-palette" => {
            let count = get_opt_u64(options, "count", 5) as usize;
            Ok(text_tools::generate_color_palette(count))
        }
        "random-number" => {
            let min = get_opt_i64(options, "min", 0);
            let max = get_opt_i64(options, "max", 1_000_000);
            Ok(text_tools::generate_random_number(min, max))
        }
        "timestamp" => {
            let fmt = get_opt_str(options, "format", "unix");
            Ok(text_tools::generate_timestamp(fmt))
        }
        "username" => Ok(text_tools::generate_username()),
        "hash" => {
            let length = get_opt_u64(options, "length", 32) as usize;
            Ok(text_tools::generate_random_hash(length))
        }
        "jwt" => Ok(text_tools::generate_dummy_jwt()),
        _ => Err(format!("Unknown generate-data type: {}", gen_type)),
    }
}

fn get_opt_str<'a>(options: &'a serde_json::Value, key: &str, default: &'a str) -> &'a str {
    options
        .get("options")
        .and_then(|o| o.get(key))
        .and_then(|v| v.as_str())
        .or_else(|| options.get(key).and_then(|v| v.as_str()))
        .unwrap_or(default)
}

fn get_opt_i64(options: &serde_json::Value, key: &str, default: i64) -> i64 {
    options
        .get("options")
        .and_then(|o| o.get(key))
        .and_then(|v| v.as_i64())
        .or_else(|| options.get(key).and_then(|v| v.as_i64()))
        .unwrap_or(default)
}

fn get_opt_u64(options: &serde_json::Value, key: &str, default: u64) -> u64 {
    options
        .get("options")
        .and_then(|o| o.get(key))
        .and_then(|v| v.as_u64())
        .or_else(|| options.get(key).and_then(|v| v.as_u64()))
        .unwrap_or(default)
}

fn get_opt_bool(options: &serde_json::Value, key: &str, default: bool) -> bool {
    options
        .get("options")
        .and_then(|o| o.get(key))
        .and_then(|v| v.as_bool())
        .or_else(|| options.get(key).and_then(|v| v.as_bool()))
        .unwrap_or(default)
}
