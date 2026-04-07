use crate::ExecuteResponse;
use serde_json::json;

/// Filter engine — remove/extract/keep/replace/count text patterns.
pub fn execute(input: &str, options: &serde_json::Value) -> Result<ExecuteResponse, String> {
    let operation = options
        .get("operation")
        .and_then(|v| v.as_str())
        .ok_or("Missing required option: operation")?;
    let target = options
        .get("target")
        .and_then(|v| v.as_str())
        .ok_or("Missing required option: target")?;
    let replacement = options
        .get("replacement")
        .and_then(|v| v.as_str())
        .unwrap_or("");
    let custom_pattern = options.get("customPattern").and_then(|v| v.as_str());

    let pattern = resolve_pattern(target, custom_pattern)?;

    match operation {
        "remove" => {
            let re = regex::Regex::new(&pattern).map_err(|e| format!("Invalid pattern: {}", e))?;
            let match_count = re.find_iter(input).count();
            let output = re.replace_all(input, replacement).to_string();
            Ok(ExecuteResponse {
                output: json!(output),
                metadata: Some(json!({ "target": target, "matchCount": match_count })),
            })
        }
        "extract" => {
            let re = regex::Regex::new(&pattern).map_err(|e| format!("Invalid pattern: {}", e))?;
            let matches: Vec<&str> = re.find_iter(input).map(|m| m.as_str()).collect();
            let count = matches.len();
            let output = matches.join("\n");
            Ok(ExecuteResponse {
                output: json!(output),
                metadata: Some(json!({ "target": target, "matchCount": count, "matches": matches })),
            })
        }
        "keep" => {
            let re = regex::Regex::new(&pattern).map_err(|e| format!("Invalid pattern: {}", e))?;
            let matches: Vec<&str> = re.find_iter(input).map(|m| m.as_str()).collect();
            let count = matches.len();
            let output = matches.concat();
            Ok(ExecuteResponse {
                output: json!(output),
                metadata: Some(json!({ "target": target, "matchCount": count })),
            })
        }
        "replace" => {
            let re = regex::Regex::new(&pattern).map_err(|e| format!("Invalid pattern: {}", e))?;
            let match_count = re.find_iter(input).count();
            let output = re.replace_all(input, replacement).to_string();
            Ok(ExecuteResponse {
                output: json!(output),
                metadata: Some(json!({ "target": target, "matchCount": match_count })),
            })
        }
        "count" => {
            let re = regex::Regex::new(&pattern).map_err(|e| format!("Invalid pattern: {}", e))?;
            let count = re.find_iter(input).count();
            Ok(ExecuteResponse {
                output: json!(count.to_string()),
                metadata: Some(json!({ "target": target, "matchCount": count })),
            })
        }
        "duplicate-lines" => {
            let lines: Vec<&str> = input.lines().collect();
            let mut seen = std::collections::HashSet::new();
            let unique: Vec<&str> = lines
                .iter()
                .filter(|l| seen.insert(l.trim()))
                .copied()
                .collect();
            let removed = lines.len() - unique.len();
            let output = unique.join("\n");
            Ok(ExecuteResponse {
                output: json!(output),
                metadata: Some(json!({ "target": target, "removedCount": removed })),
            })
        }
        _ => Err(format!("Unknown filter operation: {}", operation)),
    }
}

fn resolve_pattern(target: &str, custom_pattern: Option<&str>) -> Result<String, String> {
    if target == "custom" {
        return custom_pattern
            .map(|p| p.to_string())
            .ok_or_else(|| "customPattern required when target is 'custom'".into());
    }

    match target {
        "spaces" => Ok(r"\s".into()),
        "extra-spaces" => Ok(r" {2,}".into()),
        "vowels" => Ok(r"[aeiouAEIOU]".into()),
        "consonants" => Ok(r"[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]".into()),
        "numbers" => Ok(r"\d+".into()),
        "symbols" => Ok(r"[^\w\s]".into()),
        "punctuation" => Ok(r#"[.,;:!?\-\[\](){}'"/\\]"#.into()),
        "empty-lines" => Ok(r"(?m)^\s*$\n?".into()),
        "leading-zeros" => Ok(r"\b0+(\d)".into()),
        "trailing-spaces" => Ok(r"[ \t]+$".into()),
        "html-tags" => Ok(r"<[^>]+>".into()),
        "emails" => Ok(r#"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"#.into()),
        "urls" => Ok(r"https?://[^\s]+".into()),
        "hashtags" => Ok(r"#\w+".into()),
        "mentions" => Ok(r"@\w+".into()),
        "ip-addresses" => Ok(r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b".into()),
        "phone-numbers" => Ok(r#"[\+]?[\d\-\(\)\s]{7,}"#.into()),
        "dates" => Ok(r"\b\d{1,4}[-/]\d{1,2}[-/]\d{1,4}\b".into()),
        "duplicate-lines" => Ok(r"^.*$".into()), // handled specially in operation
        _ => {
            // Treat unknown target as a literal string pattern
            Ok(regex::escape(target))
        }
    }
}
