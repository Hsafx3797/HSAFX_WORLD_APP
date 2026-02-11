use wasm_bindgen::prelude::*;

/// Remove vowels
#[wasm_bindgen]
pub fn remove_vowels(text: &str) -> String {
    text.chars()
        .filter(|c| !"aeiouAEIOU".contains(*c))
        .collect()
}

/// Remove consonants
#[wasm_bindgen]
pub fn remove_consonants(text: &str) -> String {
    text.chars()
        .filter(|c| !c.is_alphabetic() || "aeiouAEIOU".contains(*c))
        .collect()
}

/// Remove numbers
#[wasm_bindgen]
pub fn remove_numbers(text: &str) -> String {
    text.chars()
        .filter(|c| !c.is_numeric())
        .collect()
}

/// Remove symbols (keep only alphanumeric and spaces)
#[wasm_bindgen]
pub fn remove_symbols(text: &str) -> String {
    text.chars()
        .filter(|c| c.is_alphanumeric() || c.is_whitespace())
        .collect()
}

/// Remove empty lines
#[wasm_bindgen]
pub fn remove_empty_lines(text: &str) -> String {
    text.lines()
        .filter(|line| !line.trim().is_empty())
        .collect::<Vec<_>>()
        .join("\n")
}

/// Remove leading zeros from numbers
#[wasm_bindgen]
pub fn remove_leading_zeros(text: &str) -> String {
    text.split_whitespace()
        .map(|word| {
            if word.chars().all(|c| c.is_ascii_digit()) {
                word.trim_start_matches('0')
                    .to_string()
                    .chars()
                    .next()
                    .map(|_| word.trim_start_matches('0').to_string())
                    .unwrap_or_else(|| "0".to_string())
            } else {
                word.to_string()
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}

/// Keep only letters
#[wasm_bindgen]
pub fn keep_only_letters(text: &str) -> String {
    text.chars()
        .filter(|c| c.is_alphabetic())
        .collect()
}

/// Keep only numbers
#[wasm_bindgen]
pub fn keep_only_numbers(text: &str) -> String {
    text.chars()
        .filter(|c| c.is_numeric())
        .collect()
}

/// Extract emails from text
#[wasm_bindgen]
pub fn extract_emails(text: &str) -> String {
    let email_pattern = regex::Regex::new(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}").unwrap();
    email_pattern
        .find_iter(text)
        .map(|m| m.as_str())
        .collect::<Vec<_>>()
        .join("\n")
}

/// Extract URLs from text
#[wasm_bindgen]
pub fn extract_urls(text: &str) -> String {
    let url_pattern = regex::Regex::new(r#"https?://[^\s<>"']+"#).unwrap();
    url_pattern
        .find_iter(text)
        .map(|m| m.as_str())
        .collect::<Vec<_>>()
        .join("\n")
}

/// Extract numbers from text
#[wasm_bindgen]
pub fn extract_numbers(text: &str) -> String {
    let num_pattern = regex::Regex::new(r"-?\d+\.?\d*").unwrap();
    num_pattern
        .find_iter(text)
        .map(|m| m.as_str())
        .collect::<Vec<_>>()
        .join("\n")
}

/// Extract hashtags from text
#[wasm_bindgen]
pub fn extract_hashtags(text: &str) -> String {
    let hashtag_pattern = regex::Regex::new(r"#\w+").unwrap();
    hashtag_pattern
        .find_iter(text)
        .map(|m| m.as_str())
        .collect::<Vec<_>>()
        .join("\n")
}

/// Extract mentions from text
#[wasm_bindgen]
pub fn extract_mentions(text: &str) -> String {
    let mention_pattern = regex::Regex::new(r"@\w+").unwrap();
    mention_pattern
        .find_iter(text)
        .map(|m| m.as_str())
        .collect::<Vec<_>>()
        .join("\n")
}

/// Trim each line
#[wasm_bindgen]
pub fn trim_lines(text: &str) -> String {
    text.lines()
        .map(|line| line.trim())
        .collect::<Vec<_>>()
        .join("\n")
}

/// Pad lines to same length
#[wasm_bindgen]
pub fn pad_lines(text: &str, width: usize, pad_char: char) -> String {
    text.lines()
        .map(|line| {
            if line.len() < width {
                format!("{}{}", line, pad_char.to_string().repeat(width - line.len()))
            } else {
                line.to_string()
            }
        })
        .collect::<Vec<_>>()
        .join("\n")
}

/// Dedent text (remove common leading whitespace)
#[wasm_bindgen]
pub fn dedent_text(text: &str) -> String {
    let lines: Vec<&str> = text.lines().collect();
    let min_indent = lines
        .iter()
        .filter(|line| !line.trim().is_empty())
        .map(|line| line.len() - line.trim_start().len())
        .min()
        .unwrap_or(0);
    
    lines
        .iter()
        .map(|line| {
            if line.len() >= min_indent {
                &line[min_indent..]
            } else {
                line
            }
        })
        .collect::<Vec<_>>()
        .join("\n")
}

/// Indent text
#[wasm_bindgen]
pub fn indent_text(text: &str, spaces: usize) -> String {
    let indent = " ".repeat(spaces);
    text.lines()
        .map(|line| format!("{}{}", indent, line))
        .collect::<Vec<_>>()
        .join("\n")
}

/// Replace line breaks
#[wasm_bindgen]
pub fn replace_line_breaks(text: &str, replacement: &str) -> String {
    text.replace('\n', replacement).replace('\r', "")
}

/// Split lines by length
#[wasm_bindgen]
pub fn split_lines_by_length(text: &str, max_length: usize) -> String {
    let mut result = Vec::new();
    
    for line in text.lines() {
        if line.len() <= max_length {
            result.push(line.to_string());
        } else {
            let mut remaining = line;
            while remaining.len() > max_length {
                result.push(remaining[..max_length].to_string());
                remaining = &remaining[max_length..];
            }
            if !remaining.is_empty() {
                result.push(remaining.to_string());
            }
        }
    }
    
    result.join("\n")
}

/// Shuffle lines randomly
#[wasm_bindgen]
pub fn shuffle_lines(text: &str) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    
    let mut lines: Vec<&str> = text.lines().collect();
    let len = lines.len();
    
    for i in (1..len).rev() {
        let mut hasher = DefaultHasher::new();
        (i, text.len()).hash(&mut hasher);
        let j = (hasher.finish() as usize) % (i + 1);
        lines.swap(i, j);
    }
    
    lines.join("\n")
}

/// Scramble words in text
#[wasm_bindgen]
pub fn scramble_words(text: &str) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    
    text.split_whitespace()
        .enumerate()
        .map(|(i, word)| {
            let chars: Vec<char> = word.chars().collect();
            if chars.len() <= 3 {
                return word.to_string();
            }
            
            let first = chars[0];
            let last = chars[chars.len() - 1];
            let mut middle: Vec<char> = chars[1..chars.len()-1].to_vec();
            
            for j in (1..middle.len()).rev() {
                let mut hasher = DefaultHasher::new();
                (i, j, word).hash(&mut hasher);
                let k = (hasher.finish() as usize) % (j + 1);
                middle.swap(j, k);
            }
            
            format!("{}{}{}", first, middle.iter().collect::<String>(), last)
        })
        .collect::<Vec<_>>()
        .join(" ")
}

/// Pick random line
#[wasm_bindgen]
pub fn pick_random_line(text: &str) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    
    let lines: Vec<&str> = text.lines().collect();
    if lines.is_empty() {
        return String::new();
    }
    
    let mut hasher = DefaultHasher::new();
    text.hash(&mut hasher);
    let idx = (hasher.finish() as usize) % lines.len();
    
    lines[idx].to_string()
}
