use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};

/// URL slug generator
#[wasm_bindgen]
pub fn url_slug(text: &str) -> String {
    text.to_lowercase()
        .chars()
        .map(|c| {
            if c.is_alphanumeric() {
                c
            } else if c.is_whitespace() || c == '-' || c == '_' {
                '-'
            } else {
                ' '
            }
        })
        .collect::<String>()
        .split('-')
        .filter(|s| !s.is_empty())
        .collect::<Vec<_>>()
        .join("-")
}

/// Lorem ipsum generator
#[wasm_bindgen]
pub fn lorem_ipsum(paragraphs: usize) -> String {
    const LOREM: &str = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
    
    (0..paragraphs)
        .map(|_| LOREM)
        .collect::<Vec<_>>()
        .join("\n\n")
}

/// Password generator
#[wasm_bindgen]
pub fn generate_password(length: usize, include_symbols: bool, include_numbers: bool) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    
    let mut chars = String::from("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ");
    if include_numbers {
        chars.push_str("0123456789");
    }
    if include_symbols {
        chars.push_str("!@#$%^&*()_+-=[]{}|;:,.<>?");
    }
    
    let char_vec: Vec<char> = chars.chars().collect();
    
    (0..length)
        .map(|i| {
            let mut hasher = DefaultHasher::new();
            (i, length, "pwd").hash(&mut hasher);
            let idx = (hasher.finish() as usize) % char_vec.len();
            char_vec[idx]
        })
        .collect()
}

/// Escape regex special characters
#[wasm_bindgen]
pub fn escape_regex(text: &str) -> String {
    text.chars()
        .map(|c| {
            if "\\^$.|?*+()[]{}".contains(c) {
                format!("\\{}", c)
            } else {
                c.to_string()
            }
        })
        .collect()
}

/// Find and replace
#[wasm_bindgen]
pub fn find_replace(text: &str, find: &str, replace: &str) -> String {
    text.replace(find, replace)
}

/// Find and replace (case insensitive)
#[wasm_bindgen]
pub fn find_replace_case_insensitive(text: &str, find: &str, replace: &str) -> String {
    let find_lower = find.to_lowercase();
    let mut result = String::new();
    let mut remaining = text;
    
    while let Some(idx) = remaining.to_lowercase().find(&find_lower) {
        result.push_str(&remaining[..idx]);
        result.push_str(replace);
        remaining = &remaining[idx + find.len()..];
    }
    result.push_str(remaining);
    
    result
}

/// Replace with regex
#[wasm_bindgen]
pub fn regex_replace(text: &str, pattern: &str, replacement: &str) -> Result<String, JsValue> {
    regex::Regex::new(pattern)
        .map(|re| re.replace_all(text, replacement).to_string())
        .map_err(|e| JsValue::from_str(&format!("Invalid regex: {}", e)))
}

/// Match regex and return all matches
#[wasm_bindgen]
pub fn regex_match(text: &str, pattern: &str) -> Result<JsValue, JsValue> {
    regex::Regex::new(pattern)
        .map(|re| {
            let matches: Vec<&str> = re.find_iter(text).map(|m| m.as_str()).collect();
            serde_wasm_bindgen::to_value(&matches).unwrap()
        })
        .map_err(|e| JsValue::from_str(&format!("Invalid regex: {}", e)))
}

/// Test if text matches regex
#[wasm_bindgen]
pub fn regex_test(text: &str, pattern: &str) -> Result<bool, JsValue> {
    regex::Regex::new(pattern)
        .map(|re| re.is_match(text))
        .map_err(|e| JsValue::from_str(&format!("Invalid regex: {}", e)))
}

/// Line number wrapper with custom format
#[wasm_bindgen]
pub fn number_lines(text: &str, start: usize, separator: &str) -> String {
    text.lines()
        .enumerate()
        .map(|(i, line)| format!("{}{}{}", start + i, separator, line))
        .collect::<Vec<_>>()
        .join("\n")
}

/// Remove line numbers
#[wasm_bindgen]
pub fn remove_line_numbers(text: &str) -> String {
    let pattern = regex::Regex::new(r"^\s*\d+[\s.:|\-]+").unwrap();
    text.lines()
        .map(|line| pattern.replace(line, "").to_string())
        .collect::<Vec<_>>()
        .join("\n")
}

/// Diff two texts (simple line-by-line)
#[wasm_bindgen]
pub fn simple_diff(text1: &str, text2: &str) -> String {
    let lines1: Vec<&str> = text1.lines().collect();
    let lines2: Vec<&str> = text2.lines().collect();
    let max_len = lines1.len().max(lines2.len());
    
    let mut result = Vec::new();
    
    for i in 0..max_len {
        let line1 = lines1.get(i).map(|s| *s).unwrap_or("");
        let line2 = lines2.get(i).map(|s| *s).unwrap_or("");
        
        if line1 == line2 {
            result.push(format!("  {}", line1));
        } else {
            if i < lines1.len() {
                result.push(format!("- {}", line1));
            }
            if i < lines2.len() {
                result.push(format!("+ {}", line2));
            }
        }
    }
    
    result.join("\n")
}

/// Truncate text with ellipsis
#[wasm_bindgen]
pub fn truncate_text(text: &str, max_length: usize, ellipsis: &str) -> String {
    if text.len() <= max_length {
        text.to_string()
    } else {
        let truncate_at = max_length.saturating_sub(ellipsis.len());
        format!("{}{}", &text[..truncate_at], ellipsis)
    }
}

/// Center text within width
#[wasm_bindgen]
pub fn center_text(text: &str, width: usize) -> String {
    text.lines()
        .map(|line| {
            if line.len() >= width {
                line.to_string()
            } else {
                let padding = (width - line.len()) / 2;
                format!("{}{}", " ".repeat(padding), line)
            }
        })
        .collect::<Vec<_>>()
        .join("\n")
}

/// Right align text
#[wasm_bindgen]
pub fn right_align_text(text: &str, width: usize) -> String {
    text.lines()
        .map(|line| {
            if line.len() >= width {
                line.to_string()
            } else {
                let padding = width - line.len();
                format!("{}{}", " ".repeat(padding), line)
            }
        })
        .collect::<Vec<_>>()
        .join("\n")
}

/// Repeat text n times
#[wasm_bindgen]
pub fn repeat_text(text: &str, n: usize, separator: &str) -> String {
    (0..n)
        .map(|_| text)
        .collect::<Vec<_>>()
        .join(separator)
}
