use crate::ExecuteResponse;
use serde_json::json;

/// Wrap engine — wraps text with left/right delimiters at various scopes.
pub fn execute(input: &str, options: &serde_json::Value) -> Result<ExecuteResponse, String> {
    let style = options.get("style").and_then(|v| v.as_str());

    let (left, right) = if let Some(style) = style {
        resolve_style(style)?
    } else {
        let left = options
            .get("left")
            .and_then(|v| v.as_str())
            .unwrap_or("");
        let right = options
            .get("right")
            .and_then(|v| v.as_str())
            .unwrap_or("");
        (left.to_string(), right.to_string())
    };

    let scope = options
        .get("scope")
        .and_then(|v| v.as_str())
        .unwrap_or("selection");

    let (output, wrapped_count) = match scope {
        "word" => wrap_words(input, &left, &right),
        "line" => wrap_lines(input, &left, &right),
        "sentence" => wrap_sentences(input, &left, &right),
        "selection" | _ => {
            let output = format!("{}{}{}", left, input, right);
            (output, 1)
        }
    };

    Ok(ExecuteResponse {
        output: json!(output),
        metadata: Some(json!({ "wrappedCount": wrapped_count })),
    })
}

fn resolve_style(style: &str) -> Result<(String, String), String> {
    match style {
        "parentheses" => Ok(("(".into(), ")".into())),
        "brackets" => Ok(("[".into(), "]".into())),
        "braces" => Ok(("{".into(), "}".into())),
        "angle" => Ok(("<".into(), ">".into())),
        "double-angle" => Ok(("«".into(), "»".into())),
        "single-quotes" => Ok(("'".into(), "'".into())),
        "double-quotes" => Ok(("\"".into(), "\"".into())),
        "backticks" => Ok(("`".into(), "`".into())),
        "triple-backtick" => Ok(("```\n".into(), "\n```".into())),
        "triple-single" => Ok(("'''".into(), "'''".into())),
        "triple-double" => Ok(("\"\"\"".into(), "\"\"\"".into())),
        "asterisk" => Ok(("*".into(), "*".into())),
        "double-asterisk" => Ok(("**".into(), "**".into())),
        "spoiler" => Ok(("||".into(), "||".into())),
        "blockquote-prefix" => Ok(("> ".into(), "".into())),
        "hashtag" => Ok(("#".into(), "".into())),
        _ => Err(format!("Unknown wrap style: {}", style)),
    }
}

fn wrap_words(input: &str, left: &str, right: &str) -> (String, usize) {
    let mut count = 0;
    let mut result = String::new();
    let mut in_word = false;

    for ch in input.chars() {
        if ch.is_whitespace() {
            if in_word {
                result.push_str(right);
                in_word = false;
            }
            result.push(ch);
        } else {
            if !in_word {
                result.push_str(left);
                count += 1;
                in_word = true;
            }
            result.push(ch);
        }
    }
    if in_word {
        result.push_str(right);
    }

    (result, count)
}

fn wrap_lines(input: &str, left: &str, right: &str) -> (String, usize) {
    let mut count = 0;
    let output = input
        .lines()
        .map(|line| {
            if !line.trim().is_empty() {
                count += 1;
                format!("{}{}{}", left, line, right)
            } else {
                line.to_string()
            }
        })
        .collect::<Vec<_>>()
        .join("\n");
    (output, count)
}

fn wrap_sentences(input: &str, left: &str, right: &str) -> (String, usize) {
    let mut count = 0;
    let mut result = String::new();
    let mut current = String::new();

    for ch in input.chars() {
        current.push(ch);
        if ch == '.' || ch == '!' || ch == '?' {
            let trimmed = current.trim();
            if !trimmed.is_empty() {
                count += 1;
                result.push_str(left);
                result.push_str(trimmed);
                result.push_str(right);
                result.push(' ');
            }
            current.clear();
        }
    }
    let trimmed = current.trim();
    if !trimmed.is_empty() {
        count += 1;
        result.push_str(left);
        result.push_str(trimmed);
        result.push_str(right);
    }

    (result.trim_end().to_string(), count)
}
