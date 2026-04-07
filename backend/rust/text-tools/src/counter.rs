#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
pub struct TextStats {
    pub char_count: usize,
    pub char_count_no_spaces: usize,
    pub word_count: usize,
    pub line_count: usize,
    pub sentence_count: usize,
    pub paragraph_count: usize,
    pub avg_word_length: f64,
}

/// Count words in text
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn word_count(text: &str) -> usize {
    text.split_whitespace().count()
}

/// Count characters in text
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn char_count(text: &str) -> usize {
    text.chars().count()
}

/// Count lines in text
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn line_count(text: &str) -> usize {
    if text.is_empty() {
        0
    } else {
        text.lines().count()
    }
}

/// Get comprehensive text statistics (native)
pub fn text_stats_native(text: &str) -> TextStats {
    let chars = text.chars().count();
    let chars_no_spaces = text.chars().filter(|c| !c.is_whitespace()).count();
    let words = text.split_whitespace().count();
    let lines = if text.is_empty() { 0 } else { text.lines().count() };
    
    let sentences = text.chars()
        .filter(|&c| c == '.' || c == '!' || c == '?')
        .count()
        .max(1);
    
    let paragraphs = text.split("\n\n")
        .filter(|p| !p.trim().is_empty())
        .count()
        .max(1);
    
    let avg_word_length = if words > 0 {
        chars_no_spaces as f64 / words as f64
    } else {
        0.0
    };
    
    TextStats {
        char_count: chars,
        char_count_no_spaces: chars_no_spaces,
        word_count: words,
        line_count: lines,
        sentence_count: sentences,
        paragraph_count: paragraphs,
        avg_word_length,
    }
}

/// Get comprehensive text statistics (wasm)
#[cfg(feature = "wasm")]
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn text_stats(text: &str) -> JsValue {
    serde_wasm_bindgen::to_value(&text_stats_native(text)).unwrap()
}

/// Count occurrences of a substring
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn count_occurrences(text: &str, search: &str, case_sensitive: bool) -> usize {
    if case_sensitive {
        text.matches(search).count()
    } else {
        let text_lower = text.to_lowercase();
        let search_lower = search.to_lowercase();
        text_lower.matches(&search_lower).count()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_word_count() {
        assert_eq!(word_count("hello world"), 2);
        assert_eq!(word_count("  hello   world  "), 2);
    }

    #[test]
    fn test_char_count() {
        assert_eq!(char_count("hello"), 5);
    }

    #[test]
    fn test_count_occurrences() {
        assert_eq!(count_occurrences("hello hello world", "hello", true), 2);
        assert_eq!(count_occurrences("Hello hello HELLO", "hello", false), 3);
    }
}
