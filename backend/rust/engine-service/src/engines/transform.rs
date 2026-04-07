use crate::ExecuteResponse;
use serde_json::json;

/// Transform engine — reverse, sort, shuffle, pad, join lines, trim, truncate, etc.
pub fn execute(input: &str, options: &serde_json::Value) -> Result<ExecuteResponse, String> {
    let operation = options
        .get("operation")
        .and_then(|v| v.as_str())
        .ok_or("Missing required option: operation")?;
    let scope = options
        .get("scope")
        .and_then(|v| v.as_str())
        .unwrap_or("selection");

    match operation {
        "reverse" => {
            let output = match scope {
                "characters" => text_tools::reverse_text(input),
                "words" => text_tools::reverse_words(input),
                "lines" | _ => input.lines().rev().collect::<Vec<_>>().join("\n"),
            };
            Ok(response(output))
        }
        "sort" => {
            let direction = options
                .get("direction")
                .and_then(|v| v.as_str())
                .unwrap_or("asc");
            let case_sensitive = options
                .get("caseSensitive")
                .and_then(|v| v.as_bool())
                .unwrap_or(false);
            let numeric = options
                .get("numeric")
                .and_then(|v| v.as_bool())
                .unwrap_or(false);

            let mut lines: Vec<String> = input.lines().map(|l| l.to_string()).collect();

            if numeric {
                lines.sort_by(|a, b| {
                    let na: f64 = a.trim().parse().unwrap_or(f64::MAX);
                    let nb: f64 = b.trim().parse().unwrap_or(f64::MAX);
                    na.partial_cmp(&nb).unwrap_or(std::cmp::Ordering::Equal)
                });
            } else if case_sensitive {
                lines.sort();
            } else {
                lines.sort_by(|a, b| a.to_lowercase().cmp(&b.to_lowercase()));
            }

            if direction == "desc" {
                lines.reverse();
            }

            let output = lines.join("\n");
            Ok(response(output))
        }
        "shuffle" => {
            let mut lines: Vec<String> = input.lines().map(|l| l.to_string()).collect();
            // Simple deterministic shuffle using char xor
            let seed = input.len();
            for i in (1..lines.len()).rev() {
                let j = (seed.wrapping_mul(i).wrapping_add(7)) % (i + 1);
                lines.swap(i, j);
            }
            let output = lines.join("\n");
            Ok(response(output))
        }
        "unique" => {
            let mut seen = std::collections::HashSet::new();
            let unique: Vec<&str> = input
                .lines()
                .filter(|line| seen.insert(*line))
                .collect();
            let removed = input.lines().count() - unique.len();
            Ok(ExecuteResponse {
                output: json!(unique.join("\n")),
                metadata: Some(json!({ "removedCount": removed })),
            })
        }
        "trim" => {
            let output = match scope {
                "lines" => input
                    .lines()
                    .map(|l| l.trim())
                    .collect::<Vec<_>>()
                    .join("\n"),
                _ => input.trim().to_string(),
            };
            Ok(response(output))
        }
        "pad" => {
            let direction = options
                .get("direction")
                .and_then(|v| v.as_str())
                .unwrap_or("left");
            let char_val = options
                .get("char")
                .and_then(|v| v.as_str())
                .unwrap_or(" ");
            let length = options
                .get("length")
                .and_then(|v| v.as_u64())
                .unwrap_or(0) as usize;

            let output = input
                .lines()
                .map(|line| {
                    if line.len() >= length {
                        return line.to_string();
                    }
                    let padding = char_val.repeat(length - line.len());
                    match direction {
                        "right" => format!("{}{}", line, padding),
                        "both" => {
                            let half = (length - line.len()) / 2;
                            let left = char_val.repeat(half);
                            let right = char_val.repeat(length - line.len() - half);
                            format!("{}{}{}", left, line, right)
                        }
                        _ => format!("{}{}", padding, line), // left
                    }
                })
                .collect::<Vec<_>>()
                .join("\n");
            Ok(response(output))
        }
        "join" => {
            let delimiter = options
                .get("delimiter")
                .and_then(|v| v.as_str())
                .unwrap_or(", ");
            let output = input.lines().collect::<Vec<_>>().join(delimiter);
            Ok(response(output))
        }
        "split" => {
            let delimiter = options
                .get("delimiter")
                .and_then(|v| v.as_str())
                .unwrap_or(",");
            let output = input.split(delimiter).collect::<Vec<_>>().join("\n");
            Ok(response(output))
        }
        "truncate" => {
            let length = options
                .get("length")
                .and_then(|v| v.as_u64())
                .unwrap_or(100) as usize;
            let suffix = options
                .get("suffix")
                .and_then(|v| v.as_str())
                .unwrap_or("...");
            let output = if input.len() > length {
                let mut end = length;
                while end > 0 && !input.is_char_boundary(end) {
                    end -= 1;
                }
                let truncated = &input[..end];
                format!("{}{}", truncated, suffix)
            } else {
                input.to_string()
            };
            Ok(response(output))
        }
        "repeat" => {
            let count = options
                .get("count")
                .and_then(|v| v.as_u64())
                .unwrap_or(2) as usize;
            let separator = options
                .get("separator")
                .and_then(|v| v.as_str())
                .unwrap_or("\n");
            let output = std::iter::repeat(input)
                .take(count)
                .collect::<Vec<_>>()
                .join(separator);
            Ok(response(output))
        }
        "prefix" => {
            let prefix_text = options
                .get("text")
                .and_then(|v| v.as_str())
                .unwrap_or("");
            let output = input
                .lines()
                .map(|l| format!("{}{}", prefix_text, l))
                .collect::<Vec<_>>()
                .join("\n");
            Ok(response(output))
        }
        "suffix" => {
            let suffix_text = options
                .get("text")
                .and_then(|v| v.as_str())
                .unwrap_or("");
            let output = input
                .lines()
                .map(|l| format!("{}{}", l, suffix_text))
                .collect::<Vec<_>>()
                .join("\n");
            Ok(response(output))
        }
        "number-lines" => {
            let start = options
                .get("start")
                .and_then(|v| v.as_u64())
                .unwrap_or(1) as usize;
            let separator = options
                .get("separator")
                .and_then(|v| v.as_str())
                .unwrap_or(". ");
            let output = input
                .lines()
                .enumerate()
                .map(|(i, l)| format!("{}{}{}", start + i, separator, l))
                .collect::<Vec<_>>()
                .join("\n");
            Ok(response(output))
        }
        "indent" => {
            let count = options
                .get("count")
                .and_then(|v| v.as_u64())
                .unwrap_or(2) as usize;
            let use_tabs = options
                .get("useTabs")
                .and_then(|v| v.as_bool())
                .unwrap_or(false);
            let indent = if use_tabs {
                "\t".repeat(count)
            } else {
                " ".repeat(count)
            };
            let output = input
                .lines()
                .map(|l| format!("{}{}", indent, l))
                .collect::<Vec<_>>()
                .join("\n");
            Ok(response(output))
        }
        "outdent" => {
            let count = options
                .get("count")
                .and_then(|v| v.as_u64())
                .unwrap_or(2) as usize;
            let output = input
                .lines()
                .map(|l| {
                    let mut removed = 0;
                    let mut chars = l.chars().peekable();
                    while removed < count {
                        match chars.peek() {
                            Some(' ') => { chars.next(); removed += 1; }
                            Some('\t') => { chars.next(); removed += count; }
                            _ => break,
                        }
                    }
                    chars.collect::<String>()
                })
                .collect::<Vec<_>>()
                .join("\n");
            Ok(response(output))
        }
        _ => Err(format!("Unknown transform operation: {}", operation)),
    }
}

fn response(output: String) -> ExecuteResponse {
    let line_count = output.lines().count();
    ExecuteResponse {
        output: json!(output),
        metadata: Some(json!({ "lineCount": line_count })),
    }
}
