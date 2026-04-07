#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

/// Base32 encode
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn base32_encode(text: &str) -> String {
    const ALPHABET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let bytes = text.as_bytes();
    let mut result = String::new();
    let mut bits = 0u32;
    let mut bit_count = 0;
    
    for &byte in bytes {
        bits = (bits << 8) | (byte as u32);
        bit_count += 8;
        while bit_count >= 5 {
            bit_count -= 5;
            result.push(ALPHABET[((bits >> bit_count) & 0x1F) as usize] as char);
        }
    }
    
    if bit_count > 0 {
        bits <<= 5 - bit_count;
        result.push(ALPHABET[(bits & 0x1F) as usize] as char);
    }
    
    while result.len() % 8 != 0 {
        result.push('=');
    }
    
    result
}

/// Base32 decode (native)
pub fn base32_decode_native(encoded: &str) -> Result<String, String> {
    let alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let encoded = encoded.trim_end_matches('=').to_uppercase();
    let mut bits = 0u32;
    let mut bit_count = 0;
    let mut result = Vec::new();
    
    for c in encoded.chars() {
        let val = alphabet.find(c).ok_or_else(|| "Invalid character".to_string())?;
        bits = (bits << 5) | (val as u32);
        bit_count += 5;
        if bit_count >= 8 {
            bit_count -= 8;
            result.push((bits >> bit_count) as u8);
        }
    }
    
    String::from_utf8(result).map_err(|e| e.to_string())
}

/// Base32 decode (wasm)
#[cfg(feature = "wasm")]
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn base32_decode(encoded: &str) -> Result<String, JsValue> {
    base32_decode_native(encoded).map_err(|e| JsValue::from_str(&e))
}

/// Binary encode (space-separated bytes)
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn binary_encode(text: &str) -> String {
    text.bytes()
        .map(|b| format!("{:08b}", b))
        .collect::<Vec<_>>()
        .join(" ")
}

/// Binary decode (native)
pub fn binary_decode_native(encoded: &str) -> Result<String, String> {
    encoded.split_whitespace()
        .map(|s| u8::from_str_radix(s, 2).map_err(|e| e.to_string()))
        .collect::<Result<Vec<u8>, _>>()
        .and_then(|bytes| String::from_utf8(bytes).map_err(|e| e.to_string()))
}

/// Binary decode (wasm)
#[cfg(feature = "wasm")]
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn binary_decode(encoded: &str) -> Result<String, JsValue> {
    binary_decode_native(encoded).map_err(|e| JsValue::from_str(&e))
}

/// Octal encode (space-separated)
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn octal_encode(text: &str) -> String {
    text.bytes()
        .map(|b| format!("{:03o}", b))
        .collect::<Vec<_>>()
        .join(" ")
}

/// Octal decode (native)
pub fn octal_decode_native(encoded: &str) -> Result<String, String> {
    encoded.split_whitespace()
        .map(|s| u8::from_str_radix(s, 8).map_err(|e| e.to_string()))
        .collect::<Result<Vec<u8>, _>>()
        .and_then(|bytes| String::from_utf8(bytes).map_err(|e| e.to_string()))
}

/// Octal decode (wasm)
#[cfg(feature = "wasm")]
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn octal_decode(encoded: &str) -> Result<String, JsValue> {
    octal_decode_native(encoded).map_err(|e| JsValue::from_str(&e))
}

/// ROT13 cipher
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn rot13(text: &str) -> String {
    text.chars()
        .map(|c| {
            if c.is_ascii_alphabetic() {
                let base = if c.is_ascii_lowercase() { b'a' } else { b'A' };
                ((((c as u8) - base + 13) % 26) + base) as char
            } else {
                c
            }
        })
        .collect()
}

/// ROT47 cipher
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn rot47(text: &str) -> String {
    text.chars()
        .map(|c| {
            let code = c as u8;
            if code >= 33 && code <= 126 {
                (((code - 33 + 47) % 94) + 33) as char
            } else {
                c
            }
        })
        .collect()
}

/// Caesar cipher
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn caesar_cipher(text: &str, shift: i32) -> String {
    let shift = ((shift % 26) + 26) % 26;
    text.chars()
        .map(|c| {
            if c.is_ascii_alphabetic() {
                let base = if c.is_ascii_lowercase() { b'a' } else { b'A' };
                ((((c as u8) - base + shift as u8) % 26) + base) as char
            } else {
                c
            }
        })
        .collect()
}

/// Atbash cipher (A=Z, B=Y, etc.)
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn atbash_cipher(text: &str) -> String {
    text.chars()
        .map(|c| {
            if c.is_ascii_alphabetic() {
                let base = if c.is_ascii_lowercase() { b'a' } else { b'A' };
                ((25 - ((c as u8) - base)) + base) as char
            } else {
                c
            }
        })
        .collect()
}

/// Morse code encode
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn morse_encode(text: &str) -> String {
    const MORSE: &[(&str, &str)] = &[
        ("a", ".-"), ("b", "-..."), ("c", "-.-."), ("d", "-.."), ("e", "."),
        ("f", "..-."), ("g", "--."), ("h", "...."), ("i", ".."), ("j", ".---"),
        ("k", "-.-"), ("l", ".-.."), ("m", "--"), ("n", "-."), ("o", "---"),
        ("p", ".--."), ("q", "--.-"), ("r", ".-."), ("s", "..."), ("t", "-"),
        ("u", "..-"), ("v", "...-"), ("w", ".--"), ("x", "-..-"), ("y", "-.--"),
        ("z", "--.."), ("1", ".----"), ("2", "..---"), ("3", "...--"),
        ("4", "....-"), ("5", "....."), ("6", "-...."), ("7", "--..."),
        ("8", "---.."), ("9", "----."), ("0", "-----"), (" ", "/"),
    ];
    
    text.to_lowercase()
        .chars()
        .filter_map(|c| {
            let s = c.to_string();
            MORSE.iter().find(|(ch, _)| *ch == s).map(|(_, code)| *code)
        })
        .collect::<Vec<_>>()
        .join(" ")
}

/// Morse code decode
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn morse_decode(encoded: &str) -> String {
    const MORSE: &[(&str, &str)] = &[
        (".-", "a"), ("-...", "b"), ("-.-.", "c"), ("-..", "d"), (".", "e"),
        ("..-.", "f"), ("--.", "g"), ("....", "h"), ("..", "i"), (".---", "j"),
        ("-.-", "k"), (".-..", "l"), ("--", "m"), ("-.", "n"), ("---", "o"),
        (".--.", "p"), ("--.-", "q"), (".-.", "r"), ("...", "s"), ("-", "t"),
        ("..-", "u"), ("...-", "v"), (".--", "w"), ("-..-", "x"), ("-.--", "y"),
        ("--..", "z"), (".----", "1"), ("..---", "2"), ("...--", "3"),
        ("....-", "4"), (".....", "5"), ("-....", "6"), ("--...", "7"),
        ("---..", "8"), ("----.", "9"), ("-----", "0"), ("/", " "),
    ];
    
    encoded.split(' ')
        .map(|code| {
            MORSE.iter()
                .find(|(c, _)| *c == code)
                .map(|(_, ch)| *ch)
                .unwrap_or("")
        })
        .collect()
}

/// HTML escape
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn html_escape(text: &str) -> String {
    text.chars()
        .map(|c| match c {
            '&' => "&amp;".to_string(),
            '<' => "&lt;".to_string(),
            '>' => "&gt;".to_string(),
            '"' => "&quot;".to_string(),
            '\'' => "&#39;".to_string(),
            _ => c.to_string(),
        })
        .collect()
}

/// HTML unescape
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn html_unescape(text: &str) -> String {
    text.replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&#39;", "'")
        .replace("&nbsp;", " ")
}

/// ASCII to text (native)
pub fn ascii_decode_native(encoded: &str) -> Result<String, String> {
    encoded.split_whitespace()
        .map(|s| s.parse::<u8>().map_err(|e| e.to_string()))
        .collect::<Result<Vec<u8>, _>>()
        .and_then(|bytes| String::from_utf8(bytes).map_err(|e| e.to_string()))
}

/// ASCII to text (wasm)
#[cfg(feature = "wasm")]
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn ascii_decode(encoded: &str) -> Result<String, JsValue> {
    ascii_decode_native(encoded).map_err(|e| JsValue::from_str(&e))
}

/// Text to ASCII codes
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn ascii_encode(text: &str) -> String {
    text.bytes()
        .map(|b| b.to_string())
        .collect::<Vec<_>>()
        .join(" ")
}

/// NATO phonetic alphabet
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn nato_encode(text: &str) -> String {
    const NATO: &[(&str, &str)] = &[
        ("a", "Alpha"), ("b", "Bravo"), ("c", "Charlie"), ("d", "Delta"),
        ("e", "Echo"), ("f", "Foxtrot"), ("g", "Golf"), ("h", "Hotel"),
        ("i", "India"), ("j", "Juliet"), ("k", "Kilo"), ("l", "Lima"),
        ("m", "Mike"), ("n", "November"), ("o", "Oscar"), ("p", "Papa"),
        ("q", "Quebec"), ("r", "Romeo"), ("s", "Sierra"), ("t", "Tango"),
        ("u", "Uniform"), ("v", "Victor"), ("w", "Whiskey"), ("x", "X-ray"),
        ("y", "Yankee"), ("z", "Zulu"), ("0", "Zero"), ("1", "One"),
        ("2", "Two"), ("3", "Three"), ("4", "Four"), ("5", "Five"),
        ("6", "Six"), ("7", "Seven"), ("8", "Eight"), ("9", "Nine"),
    ];
    
    text.to_lowercase()
        .chars()
        .filter_map(|c| {
            if c == ' ' {
                Some("[space]".to_string())
            } else {
                let s = c.to_string();
                NATO.iter().find(|(ch, _)| *ch == s).map(|(_, word)| word.to_string())
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}

/// Pig Latin
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn pig_latin(text: &str) -> String {
    text.split_whitespace()
        .map(|word| {
            let first = word.chars().next().unwrap_or(' ');
            if "aeiouAEIOU".contains(first) {
                format!("{}way", word)
            } else {
                let consonants: String = word.chars().take_while(|c| !"aeiouAEIOU".contains(*c)).collect();
                let rest: String = word.chars().skip(consonants.len()).collect();
                format!("{}{}ay", rest, consonants.to_lowercase())
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}

/// JSON string escape
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn json_escape(text: &str) -> String {
    text.chars()
        .map(|c| match c {
            '"' => "\\\"".to_string(),
            '\\' => "\\\\".to_string(),
            '\n' => "\\n".to_string(),
            '\r' => "\\r".to_string(),
            '\t' => "\\t".to_string(),
            c if c.is_control() => format!("\\u{:04x}", c as u32),
            _ => c.to_string(),
        })
        .collect()
}

/// XML escape
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn xml_escape(text: &str) -> String {
    text.chars()
        .map(|c| match c {
            '&' => "&amp;".to_string(),
            '<' => "&lt;".to_string(),
            '>' => "&gt;".to_string(),
            '"' => "&quot;".to_string(),
            '\'' => "&apos;".to_string(),
            _ => c.to_string(),
        })
        .collect()
}
