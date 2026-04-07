#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

/// Mirror text (reversed)
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn mirror_text(text: &str) -> String {
    text.chars().rev().collect()
}

/// Upside down text
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn upside_down_text(text: &str) -> String {
    const UPSIDE_DOWN: &[(&str, &str)] = &[
        ("a", "ɐ"), ("b", "q"), ("c", "ɔ"), ("d", "p"), ("e", "ǝ"),
        ("f", "ɟ"), ("g", "ƃ"), ("h", "ɥ"), ("i", "ᴉ"), ("j", "ɾ"),
        ("k", "ʞ"), ("l", "l"), ("m", "ɯ"), ("n", "u"), ("o", "o"),
        ("p", "d"), ("q", "b"), ("r", "ɹ"), ("s", "s"), ("t", "ʇ"),
        ("u", "n"), ("v", "ʌ"), ("w", "ʍ"), ("x", "x"), ("y", "ʎ"),
        ("z", "z"), ("A", "∀"), ("B", "q"), ("C", "Ɔ"), ("D", "p"),
        ("E", "Ǝ"), ("F", "Ⅎ"), ("G", "פ"), ("H", "H"), ("I", "I"),
        ("J", "ſ"), ("K", "ʞ"), ("L", "˥"), ("M", "W"), ("N", "N"),
        ("O", "O"), ("P", "Ԁ"), ("Q", "Q"), ("R", "ɹ"), ("S", "S"),
        ("T", "┴"), ("U", "∩"), ("V", "Λ"), ("W", "M"), ("X", "X"),
        ("Y", "⅄"), ("Z", "Z"), ("1", "Ɩ"), ("2", "ᄅ"), ("3", "Ɛ"),
        ("4", "ㄣ"), ("5", "ϛ"), ("6", "9"), ("7", "ㄥ"), ("8", "8"),
        ("9", "6"), ("0", "0"), (".", "˙"), (",", "'"), ("?", "¿"),
        ("!", "¡"), ("'", ","), ("\"", ",,"),
    ];
    
    text.chars()
        .rev()
        .map(|c| {
            let s = c.to_string();
            UPSIDE_DOWN.iter()
                .find(|(ch, _)| *ch == s)
                .map(|(_, flip)| flip.to_string())
                .unwrap_or(s)
        })
        .collect()
}

/// Fullwidth text (aesthetic)
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn fullwidth_text(text: &str) -> String {
    text.chars()
        .map(|c| {
            if c >= '!' && c <= '~' {
                char::from_u32((c as u32) - 0x21 + 0xFF01).unwrap_or(c)
            } else if c == ' ' {
                '\u{3000}' // Fullwidth space
            } else {
                c
            }
        })
        .collect()
}

/// Circled letters (Ⓗⓔⓛⓛⓞ)
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn circled_text(text: &str) -> String {
    text.chars()
        .map(|c| {
            if c >= 'a' && c <= 'z' {
                char::from_u32((c as u32) - ('a' as u32) + 0x24D0).unwrap_or(c)
            } else if c >= 'A' && c <= 'Z' {
                char::from_u32((c as u32) - ('A' as u32) + 0x24B6).unwrap_or(c)
            } else if c >= '1' && c <= '9' {
                char::from_u32((c as u32) - ('1' as u32) + 0x2460).unwrap_or(c)
            } else if c == '0' {
                '\u{24EA}'
            } else {
                c
            }
        })
        .collect()
}

/// Squared text
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn squared_text(text: &str) -> String {
    text.to_uppercase()
        .chars()
        .map(|c| {
            if c >= 'A' && c <= 'Z' {
                char::from_u32((c as u32) - ('A' as u32) + 0x1F130).unwrap_or(c)
            } else {
                c
            }
        })
        .collect()
}

/// Small caps
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn small_caps(text: &str) -> String {
    const SMALL: &[(&str, &str)] = &[
        ("a", "ᴀ"), ("b", "ʙ"), ("c", "ᴄ"), ("d", "ᴅ"), ("e", "ᴇ"),
        ("f", "ꜰ"), ("g", "ɢ"), ("h", "ʜ"), ("i", "ɪ"), ("j", "ᴊ"),
        ("k", "ᴋ"), ("l", "ʟ"), ("m", "ᴍ"), ("n", "ɴ"), ("o", "ᴏ"),
        ("p", "ᴘ"), ("q", "ǫ"), ("r", "ʀ"), ("s", "s"), ("t", "ᴛ"),
        ("u", "ᴜ"), ("v", "ᴠ"), ("w", "ᴡ"), ("x", "x"), ("y", "ʏ"),
        ("z", "ᴢ"),
    ];
    
    text.to_lowercase()
        .chars()
        .map(|c| {
            let s = c.to_string();
            SMALL.iter()
                .find(|(ch, _)| *ch == s)
                .map(|(_, sm)| sm.to_string())
                .unwrap_or(s)
        })
        .collect()
}

/// Superscript
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn superscript_text(text: &str) -> String {
    const SUPER: &[(&str, &str)] = &[
        ("0", "⁰"), ("1", "¹"), ("2", "²"), ("3", "³"), ("4", "⁴"),
        ("5", "⁵"), ("6", "⁶"), ("7", "⁷"), ("8", "⁸"), ("9", "⁹"),
        ("a", "ᵃ"), ("b", "ᵇ"), ("c", "ᶜ"), ("d", "ᵈ"), ("e", "ᵉ"),
        ("f", "ᶠ"), ("g", "ᵍ"), ("h", "ʰ"), ("i", "ⁱ"), ("j", "ʲ"),
        ("k", "ᵏ"), ("l", "ˡ"), ("m", "ᵐ"), ("n", "ⁿ"), ("o", "ᵒ"),
        ("p", "ᵖ"), ("r", "ʳ"), ("s", "ˢ"), ("t", "ᵗ"), ("u", "ᵘ"),
        ("v", "ᵛ"), ("w", "ʷ"), ("x", "ˣ"), ("y", "ʸ"), ("z", "ᶻ"),
        ("+", "⁺"), ("-", "⁻"), ("=", "⁼"), ("(", "⁽"), (")", "⁾"),
    ];
    
    text.to_lowercase()
        .chars()
        .map(|c| {
            let s = c.to_string();
            SUPER.iter()
                .find(|(ch, _)| *ch == s)
                .map(|(_, sup)| sup.to_string())
                .unwrap_or(s)
        })
        .collect()
}

/// Subscript
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn subscript_text(text: &str) -> String {
    const SUB: &[(&str, &str)] = &[
        ("0", "₀"), ("1", "₁"), ("2", "₂"), ("3", "₃"), ("4", "₄"),
        ("5", "₅"), ("6", "₆"), ("7", "₇"), ("8", "₈"), ("9", "₉"),
        ("a", "ₐ"), ("e", "ₑ"), ("h", "ₕ"), ("i", "ᵢ"), ("j", "ⱼ"),
        ("k", "ₖ"), ("l", "ₗ"), ("m", "ₘ"), ("n", "ₙ"), ("o", "ₒ"),
        ("p", "ₚ"), ("r", "ᵣ"), ("s", "ₛ"), ("t", "ₜ"), ("u", "ᵤ"),
        ("v", "ᵥ"), ("x", "ₓ"), ("+", "₊"), ("-", "₋"), ("=", "₌"),
        ("(", "₍"), (")", "₎"),
    ];
    
    text.to_lowercase()
        .chars()
        .map(|c| {
            let s = c.to_string();
            SUB.iter()
                .find(|(ch, _)| *ch == s)
                .map(|(_, sub)| sub.to_string())
                .unwrap_or(s)
        })
        .collect()
}

/// Sparkle text (✨ around words)
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn sparkle_text(text: &str) -> String {
    text.split_whitespace()
        .map(|word| format!("✨{}✨", word))
        .collect::<Vec<_>>()
        .join(" ")
}

/// Clap text (words 👏 separated 👏 by 👏 claps)
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn clap_text(text: &str) -> String {
    text.split_whitespace()
        .collect::<Vec<_>>()
        .join(" 👏 ")
}

/// Zalgo text (creepy glitchy text)
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn zalgo_text(text: &str, intensity: u8) -> String {
    // Combining marks above (Unicode escape to avoid multi-codepoint char literals)
    const ZALGO_UP: &[char] = &[
        '\u{030D}', '\u{030E}', '\u{0304}', '\u{0305}', '\u{033F}', '\u{0311}',
        '\u{0306}', '\u{0310}', '\u{0352}', '\u{0357}', '\u{0351}', '\u{0307}',
        '\u{0308}', '\u{030A}', '\u{0342}', '\u{0313}', '\u{0308}', '\u{034A}',
        '\u{034B}', '\u{034C}', '\u{0303}', '\u{0302}', '\u{030C}', '\u{0350}',
        '\u{0300}', '\u{0301}', '\u{030B}', '\u{030F}', '\u{0312}', '\u{0313}',
        '\u{0314}', '\u{033D}', '\u{0309}', '\u{0363}', '\u{0364}', '\u{0365}',
        '\u{0366}', '\u{0367}', '\u{0368}', '\u{0369}', '\u{036A}', '\u{036B}',
        '\u{036C}', '\u{036D}', '\u{036E}', '\u{036F}', '\u{033E}', '\u{035B}',
        '\u{0346}', '\u{031A}',
    ];
    // Combining marks below
    const ZALGO_DOWN: &[char] = &[
        '\u{0316}', '\u{0317}', '\u{0318}', '\u{0319}', '\u{031C}', '\u{031D}',
        '\u{031E}', '\u{031F}', '\u{0320}', '\u{0324}', '\u{0325}', '\u{0326}',
        '\u{0329}', '\u{032A}', '\u{032B}', '\u{032C}', '\u{032D}', '\u{032E}',
        '\u{032F}', '\u{0330}', '\u{0331}', '\u{0332}', '\u{0333}', '\u{0339}',
        '\u{033A}', '\u{033B}', '\u{033C}', '\u{0345}', '\u{0347}', '\u{0348}',
        '\u{0349}', '\u{034D}', '\u{034E}', '\u{0353}', '\u{0354}', '\u{0355}',
        '\u{0356}', '\u{0359}', '\u{035A}', '\u{0323}',
    ];
    
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    
    text.chars()
        .enumerate()
        .map(|(i, c)| {
            let mut result = c.to_string();
            let count = intensity.min(5) as usize;
            
            for j in 0..count {
                let mut hasher = DefaultHasher::new();
                (i, j, "up").hash(&mut hasher);
                let idx = (hasher.finish() as usize) % ZALGO_UP.len();
                result.push(ZALGO_UP[idx]);
                
                let mut hasher = DefaultHasher::new();
                (i, j, "down").hash(&mut hasher);
                let idx = (hasher.finish() as usize) % ZALGO_DOWN.len();
                result.push(ZALGO_DOWN[idx]);
            }
            result
        })
        .collect()
}

/// Monospace unicode text
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn monospace_text(text: &str) -> String {
    text.chars()
        .map(|c| {
            if c >= 'a' && c <= 'z' {
                char::from_u32((c as u32) - ('a' as u32) + 0x1D68A).unwrap_or(c)
            } else if c >= 'A' && c <= 'Z' {
                char::from_u32((c as u32) - ('A' as u32) + 0x1D670).unwrap_or(c)
            } else if c >= '0' && c <= '9' {
                char::from_u32((c as u32) - ('0' as u32) + 0x1D7F6).unwrap_or(c)
            } else {
                c
            }
        })
        .collect()
}

/// Bold unicode text
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn bold_unicode_text(text: &str) -> String {
    text.chars()
        .map(|c| {
            if c >= 'a' && c <= 'z' {
                char::from_u32((c as u32) - ('a' as u32) + 0x1D41A).unwrap_or(c)
            } else if c >= 'A' && c <= 'Z' {
                char::from_u32((c as u32) - ('A' as u32) + 0x1D400).unwrap_or(c)
            } else if c >= '0' && c <= '9' {
                char::from_u32((c as u32) - ('0' as u32) + 0x1D7CE).unwrap_or(c)
            } else {
                c
            }
        })
        .collect()
}

/// Italic unicode text
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn italic_unicode_text(text: &str) -> String {
    text.chars()
        .map(|c| {
            if c >= 'a' && c <= 'z' {
                char::from_u32((c as u32) - ('a' as u32) + 0x1D44E).unwrap_or(c)
            } else if c >= 'A' && c <= 'Z' {
                char::from_u32((c as u32) - ('A' as u32) + 0x1D434).unwrap_or(c)
            } else {
                c
            }
        })
        .collect()
}
