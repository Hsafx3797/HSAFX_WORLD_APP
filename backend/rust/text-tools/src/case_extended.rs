use wasm_bindgen::prelude::*;

/// dot.case converter
#[wasm_bindgen]
pub fn dot_case(text: &str) -> String {
    text.split(|c: char| !c.is_alphanumeric())
        .filter(|s| !s.is_empty())
        .map(|s| s.to_lowercase())
        .collect::<Vec<_>>()
        .join(".")
}

/// path/case converter
#[wasm_bindgen]
pub fn path_case(text: &str) -> String {
    text.split(|c: char| !c.is_alphanumeric())
        .filter(|s| !s.is_empty())
        .map(|s| s.to_lowercase())
        .collect::<Vec<_>>()
        .join("/")
}

/// Train-Case converter
#[wasm_bindgen]
pub fn train_case(text: &str) -> String {
    text.split(|c: char| !c.is_alphanumeric())
        .filter(|s| !s.is_empty())
        .map(|word| {
            let mut chars = word.chars();
            match chars.next() {
                None => String::new(),
                Some(first) => first.to_uppercase().collect::<String>() + &chars.as_str().to_lowercase(),
            }
        })
        .collect::<Vec<_>>()
        .join("-")
}

/// Swap Case (toggle each character's case)
#[wasm_bindgen]
pub fn swap_case(text: &str) -> String {
    text.chars()
        .map(|c| {
            if c.is_uppercase() {
                c.to_lowercase().next().unwrap_or(c)
            } else {
                c.to_uppercase().next().unwrap_or(c)
            }
        })
        .collect()
}

/// Sentence case (capitalize first letter of each sentence)
#[wasm_bindgen]
pub fn sentence_case(text: &str) -> String {
    let mut result = String::new();
    let mut capitalize_next = true;

    for c in text.chars() {
        if capitalize_next && c.is_alphabetic() {
            result.push_str(&c.to_uppercase().to_string());
            capitalize_next = false;
        } else {
            result.push(c.to_lowercase().next().unwrap_or(c));
            if c == '.' || c == '!' || c == '?' {
                capitalize_next = true;
            }
        }
    }
    result
}

/// Alternating case (aLtErNaTiNg)
#[wasm_bindgen]
pub fn alternating_case(text: &str) -> String {
    text.chars()
        .enumerate()
        .map(|(i, c)| {
            if i % 2 == 0 {
                c.to_lowercase().next().unwrap_or(c)
            } else {
                c.to_uppercase().next().unwrap_or(c)
            }
        })
        .collect()
}

/// Inverse case (iNVERSE)
#[wasm_bindgen]
pub fn inverse_case(text: &str) -> String {
    text.chars()
        .enumerate()
        .map(|(i, c)| {
            if i == 0 {
                c.to_lowercase().next().unwrap_or(c)
            } else if i == 1 {
                c.to_uppercase().next().unwrap_or(c)
            } else if c.is_alphabetic() {
                c.to_uppercase().next().unwrap_or(c)
            } else {
                c
            }
        })
        .collect()
}

/// SCREAMING_SNAKE_CASE
#[wasm_bindgen]
pub fn screaming_snake_case(text: &str) -> String {
    text.split(|c: char| !c.is_alphanumeric())
        .filter(|s| !s.is_empty())
        .map(|s| s.to_uppercase())
        .collect::<Vec<_>>()
        .join("_")
}

/// flatcase (all lowercase, no separator)
#[wasm_bindgen]
pub fn flat_case(text: &str) -> String {
    text.chars()
        .filter(|c| c.is_alphanumeric())
        .map(|c| c.to_lowercase().next().unwrap_or(c))
        .collect()
}

/// Capitalized Case (each word capitalized)
#[wasm_bindgen]
pub fn capitalized_case(text: &str) -> String {
    text.split_whitespace()
        .map(|word| {
            let mut chars = word.chars();
            match chars.next() {
                None => String::new(),
                Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}

/// Mocking SpongeBob case (random upper/lower)
#[wasm_bindgen]
pub fn spongebob_case(text: &str) -> String {
    text.chars()
        .enumerate()
        .map(|(i, c)| {
            if i % 2 == 0 {
                c.to_lowercase().next().unwrap_or(c)
            } else {
                c.to_uppercase().next().unwrap_or(c)
            }
        })
        .collect()
}

/// Leet speak (1337)
#[wasm_bindgen]
pub fn leet_speak(text: &str) -> String {
    text.chars()
        .map(|c| match c.to_lowercase().next().unwrap_or(c) {
            'a' => '4',
            'e' => '3',
            'i' => '1',
            'o' => '0',
            's' => '5',
            't' => '7',
            'l' => '1',
            'g' => '9',
            'b' => '8',
            _ => c,
        })
        .collect()
}

/// Studly case (random capitalization)
#[wasm_bindgen]
pub fn studly_case(text: &str) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    
    text.chars()
        .enumerate()
        .map(|(i, c)| {
            let mut hasher = DefaultHasher::new();
            (i, c).hash(&mut hasher);
            if hasher.finish() % 2 == 0 {
                c.to_uppercase().next().unwrap_or(c)
            } else {
                c.to_lowercase().next().unwrap_or(c)
            }
        })
        .collect()
}
