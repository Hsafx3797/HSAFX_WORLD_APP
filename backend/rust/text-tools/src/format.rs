#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

/// Trim whitespace from both ends
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn trim_whitespace(text: &str) -> String {
    text.trim().to_string()
}

/// Remove extra spaces (multiple spaces to single space)
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn remove_extra_spaces(text: &str) -> String {
    text.split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

/// Remove all whitespace
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn remove_all_whitespace(text: &str) -> String {
    text.chars()
        .filter(|c| !c.is_whitespace())
        .collect()
}

/// Add line numbers to text
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn add_line_numbers(text: &str) -> String {
    text.lines()
        .enumerate()
        .map(|(i, line)| format!("{:4} | {}", i + 1, line))
        .collect::<Vec<_>>()
        .join("\n")
}

/// Reverse text
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn reverse_text(text: &str) -> String {
    text.chars().rev().collect()
}

/// Reverse words
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn reverse_words(text: &str) -> String {
    text.split_whitespace()
        .rev()
        .collect::<Vec<_>>()
        .join(" ")
}

/// Sort lines alphabetically
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn sort_lines(text: &str, ascending: bool) -> String {
    let mut lines: Vec<&str> = text.lines().collect();
    
    if ascending {
        lines.sort();
    } else {
        lines.sort_by(|a, b| b.cmp(a));
    }
    
    lines.join("\n")
}

/// Remove duplicate lines
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn remove_duplicate_lines(text: &str) -> String {
    let mut seen = std::collections::HashSet::new();
    text.lines()
        .filter(|line| seen.insert(*line))
        .collect::<Vec<_>>()
        .join("\n")
}

/// Wrap text at specified column width
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn wrap_text(text: &str, width: usize) -> String {
    let mut result = Vec::new();
    let mut current_line = String::new();
    
    for word in text.split_whitespace() {
        if current_line.len() + word.len() + 1 > width {
            if !current_line.is_empty() {
                result.push(current_line);
                current_line = String::new();
            }
        }
        
        if !current_line.is_empty() {
            current_line.push(' ');
        }
        current_line.push_str(word);
    }
    
    if !current_line.is_empty() {
        result.push(current_line);
    }
    
    result.join("\n")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_remove_extra_spaces() {
        assert_eq!(remove_extra_spaces("hello    world"), "hello world");
    }

    #[test]
    fn test_reverse_text() {
        assert_eq!(reverse_text("hello"), "olleh");
    }

    #[test]
    fn test_sort_lines() {
        let text = "zebra\napple\nbanana";
        let sorted = sort_lines(text, true);
        assert_eq!(sorted, "apple\nbanana\nzebra");
    }
}
