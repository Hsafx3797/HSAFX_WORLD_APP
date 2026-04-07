use crate::ExecuteResponse;
use serde_json::json;

/// Case engine — dispatches to text-tools case functions based on options.
/// Options: separator, wordCase, firstWordCase, charTransform, wordWrap,
///          preserveConsecutiveUppercase, stripNonAlphanumeric
pub fn execute(input: &str, options: &serde_json::Value) -> Result<ExecuteResponse, String> {
    let char_transform = options.get("charTransform").and_then(|v| v.as_str());

    if let Some(transform) = char_transform {
        let output = match transform {
            "alternating" => text_tools::alternating_case(input),
            "inverse-alternating" => text_tools::inverse_case(input),
            "swap" => text_tools::swap_case(input),
            "random" => text_tools::spongebob_case(input),
            _ => return Err(format!("Unknown charTransform: {}", transform)),
        };
        return Ok(ExecuteResponse {
            output: json!(output),
            metadata: Some(json!({ "wordCount": input.split_whitespace().count() })),
        });
    }

    let separator = options
        .get("separator")
        .and_then(|v| v.as_str())
        .unwrap_or("_");
    let word_case = options
        .get("wordCase")
        .and_then(|v| v.as_str())
        .unwrap_or("lower");
    let first_word_case = options
        .get("firstWordCase")
        .and_then(|v| v.as_str());

    // Try to match known patterns to existing text-tools functions
    let output = match (separator, word_case, first_word_case) {
        ("_", "lower", None) => text_tools::snake_case(input),
        ("-", "lower", None) => text_tools::kebab_case(input),
        (".", "lower", None) => text_tools::dot_case(input),
        ("/", "lower", None) => text_tools::path_case(input),
        ("_", "upper", None) => text_tools::constant_case(input),
        ("_", "upper", Some("upper")) => text_tools::screaming_snake_case(input),
        ("", "lower", None) => text_tools::flat_case(input),
        ("", "title", Some("lower")) => text_tools::camel_case(input),
        ("", "title", None) => text_tools::pascal_case(input),
        ("-", "title", None) => text_tools::train_case(input),
        (" ", "title", None) => text_tools::title_case(input),
        (" ", "lower", Some("title")) | (" ", "lower", Some("capitalize")) => {
            text_tools::sentence_case(input)
        }
        _ => {
            // Generic: split words, apply case, join with separator
            generic_case(input, separator, word_case, first_word_case)
        }
    };

    let word_count = input.split_whitespace().count();
    Ok(ExecuteResponse {
        output: json!(output),
        metadata: Some(json!({ "wordCount": word_count })),
    })
}

fn split_words(text: &str) -> Vec<String> {
    let mut words = Vec::new();
    let mut current = String::new();

    for ch in text.chars() {
        if !ch.is_alphanumeric() {
            if !current.is_empty() {
                words.push(std::mem::take(&mut current));
            }
        } else if ch.is_uppercase() && !current.is_empty() {
            words.push(std::mem::take(&mut current));
            current.push(ch);
        } else {
            current.push(ch);
        }
    }
    if !current.is_empty() {
        words.push(current);
    }
    words
}

fn apply_case(word: &str, case: &str) -> String {
    match case {
        "lower" => word.to_lowercase(),
        "upper" => word.to_uppercase(),
        "title" | "capitalize" => {
            let mut chars = word.chars();
            match chars.next() {
                None => String::new(),
                Some(first) => {
                    first.to_uppercase().collect::<String>() + &chars.as_str().to_lowercase()
                }
            }
        }
        "preserve" => word.to_string(),
        _ => word.to_lowercase(),
    }
}

fn generic_case(input: &str, separator: &str, word_case: &str, first_word_case: Option<&str>) -> String {
    let words = split_words(input);
    words
        .iter()
        .enumerate()
        .map(|(i, word)| {
            if i == 0 {
                apply_case(word, first_word_case.unwrap_or(word_case))
            } else {
                apply_case(word, word_case)
            }
        })
        .collect::<Vec<_>>()
        .join(separator)
}
