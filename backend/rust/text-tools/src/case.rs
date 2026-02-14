use wasm_bindgen::prelude::*;

/// Convert text to UPPERCASE
#[wasm_bindgen]
pub fn uppercase(text: &str) -> String {
    text.to_uppercase()
}

/// Convert text to lowercase
#[wasm_bindgen]
pub fn lowercase(text: &str) -> String {
    text.to_lowercase()
}

/// Convert text to Title Case
#[wasm_bindgen]
pub fn title_case(text: &str) -> String {
    text.split_whitespace()
        .map(|word| {
            let mut chars = word.chars();
            match chars.next() {
                None => String::new(),
                Some(first) => {
                    first.to_uppercase().collect::<String>()
                        + &chars.as_str().to_lowercase()
                }
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}

/// Convert text to camelCase
#[wasm_bindgen]
pub fn camel_case(text: &str) -> String {
    let words: Vec<&str> = text
        .split(|c: char| !c.is_alphanumeric())
        .filter(|s| !s.is_empty())
        .collect();

    if words.is_empty() {
        return String::new();
    }

    let mut result = words[0].to_lowercase();
    for word in &words[1..] {
        let mut chars = word.chars();
        if let Some(first) = chars.next() {
            result.push_str(&first.to_uppercase().collect::<String>());
            result.push_str(&chars.as_str().to_lowercase());
        }
    }

    result
}

/// Split text into words, handling camelCase boundaries and non-alphanumeric separators.
fn split_words(text: &str) -> Vec<String> {
    let mut words = Vec::new();
    let mut current = String::new();

    for ch in text.chars() {
        if !ch.is_alphanumeric() {
            if !current.is_empty() {
                words.push(std::mem::take(&mut current));
            }
        } else if ch.is_uppercase() && !current.is_empty() {
            // camelCase boundary: push accumulated word, start new one
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

/// Convert text to snake_case
#[wasm_bindgen]
pub fn snake_case(text: &str) -> String {
    split_words(text)
        .iter()
        .map(|s| s.to_lowercase())
        .collect::<Vec<_>>()
        .join("_")
}

/// Convert text to kebab-case
#[wasm_bindgen]
pub fn kebab_case(text: &str) -> String {
    split_words(text)
        .iter()
        .map(|s| s.to_lowercase())
        .collect::<Vec<_>>()
        .join("-")
}

/// Convert text to CONSTANT_CASE
#[wasm_bindgen]
pub fn constant_case(text: &str) -> String {
    split_words(text)
        .iter()
        .map(|s| s.to_uppercase())
        .collect::<Vec<_>>()
        .join("_")
}

/// Convert text to PascalCase
#[wasm_bindgen]
pub fn pascal_case(text: &str) -> String {
    text.split(|c: char| !c.is_alphanumeric())
        .filter(|s| !s.is_empty())
        .map(|word| {
            let mut chars = word.chars();
            match chars.next() {
                None => String::new(),
                Some(first) => {
                    first.to_uppercase().collect::<String>()
                        + &chars.as_str().to_lowercase()
                }
            }
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_uppercase() {
        assert_eq!(uppercase("hello world"), "HELLO WORLD");
    }

    #[test]
    fn test_camel_case() {
        assert_eq!(camel_case("hello world"), "helloWorld");
        assert_eq!(camel_case("hello-world"), "helloWorld");
        assert_eq!(camel_case("hello_world"), "helloWorld");
    }

    #[test]
    fn test_snake_case() {
        assert_eq!(snake_case("Hello World"), "hello_world");
        assert_eq!(snake_case("helloWorld"), "hello_world");
        assert_eq!(snake_case("myHTTPClient"), "my_h_t_t_p_client");
    }
}
