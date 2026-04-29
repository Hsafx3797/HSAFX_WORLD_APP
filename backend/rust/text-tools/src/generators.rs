#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

/// URL slug generator
#[cfg_attr(feature = "wasm", wasm_bindgen)]
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
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn lorem_ipsum(paragraphs: usize) -> String {
    const LOREM: &str = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
    
    (0..paragraphs)
        .map(|_| LOREM)
        .collect::<Vec<_>>()
        .join("\n\n")
}

/// Password generator — uses CSPRNG (getrandom) for secure randomness
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn generate_password(length: usize, include_symbols: bool, include_numbers: bool) -> String {
    let mut chars = String::from("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ");
    if include_numbers {
        chars.push_str("0123456789");
    }
    if include_symbols {
        chars.push_str("!@#$%^&*()_+-=[]{}|;:,.<>?");
    }
    
    let char_vec: Vec<char> = chars.chars().collect();
    let charset_len = char_vec.len();

    // Use CSPRNG via getrandom
    let mut random_bytes = vec![0u8; length];
    getrandom::getrandom(&mut random_bytes).expect("getrandom failed");

    // Rejection sampling to avoid modulo bias
    let max_valid = (256 / charset_len) * charset_len;

    let mut result = String::with_capacity(length);
    let mut byte_idx = 0;

    while result.len() < length {
        if byte_idx >= random_bytes.len() {
            // Need more random bytes
            random_bytes.resize(length * 2, 0);
            getrandom::getrandom(&mut random_bytes[byte_idx..]).expect("getrandom failed");
        }
        let b = random_bytes[byte_idx] as usize;
        byte_idx += 1;
        if b < max_valid {
            result.push(char_vec[b % charset_len]);
        }
    }

    result
}

/// Escape regex special characters
#[cfg_attr(feature = "wasm", wasm_bindgen)]
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
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn find_replace(text: &str, find: &str, replace: &str) -> String {
    text.replace(find, replace)
}

/// Find and replace (case insensitive)
#[cfg_attr(feature = "wasm", wasm_bindgen)]
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

/// Replace with regex (native)
pub fn regex_replace_native(text: &str, pattern: &str, replacement: &str) -> Result<String, String> {
    regex::Regex::new(pattern)
        .map(|re| re.replace_all(text, replacement).to_string())
        .map_err(|e| format!("Invalid regex: {}", e))
}

/// Replace with regex (wasm)
#[cfg(feature = "wasm")]
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn regex_replace(text: &str, pattern: &str, replacement: &str) -> Result<String, JsValue> {
    regex_replace_native(text, pattern, replacement).map_err(|e| JsValue::from_str(&e))
}

/// Match regex and return all matches (native)
pub fn regex_match_native(text: &str, pattern: &str) -> Result<Vec<String>, String> {
    regex::Regex::new(pattern)
        .map(|re| re.find_iter(text).map(|m| m.as_str().to_string()).collect())
        .map_err(|e| format!("Invalid regex: {}", e))
}

/// Match regex and return all matches (wasm)
#[cfg(feature = "wasm")]
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn regex_match(text: &str, pattern: &str) -> Result<JsValue, JsValue> {
    regex_match_native(text, pattern)
        .map(|matches| serde_wasm_bindgen::to_value(&matches).unwrap())
        .map_err(|e| JsValue::from_str(&e))
}

/// Test if text matches regex (native)
pub fn regex_test_native(text: &str, pattern: &str) -> Result<bool, String> {
    regex::Regex::new(pattern)
        .map(|re| re.is_match(text))
        .map_err(|e| format!("Invalid regex: {}", e))
}

/// Test if text matches regex (wasm)
#[cfg(feature = "wasm")]
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn regex_test(text: &str, pattern: &str) -> Result<bool, JsValue> {
    regex_test_native(text, pattern).map_err(|e| JsValue::from_str(&e))
}

/// Line number wrapper with custom format
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn number_lines(text: &str, start: usize, separator: &str) -> String {
    text.lines()
        .enumerate()
        .map(|(i, line)| format!("{}{}{}", start + i, separator, line))
        .collect::<Vec<_>>()
        .join("\n")
}

/// Remove line numbers
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn remove_line_numbers(text: &str) -> String {
    let pattern = regex::Regex::new(r"^\s*\d+[\s.:|\-]+").unwrap();
    text.lines()
        .map(|line| pattern.replace(line, "").to_string())
        .collect::<Vec<_>>()
        .join("\n")
}

/// Diff two texts (simple line-by-line)
#[cfg_attr(feature = "wasm", wasm_bindgen)]
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
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn truncate_text(text: &str, max_length: usize, ellipsis: &str) -> String {
    let char_count = text.chars().count();
    if char_count <= max_length {
        text.to_string()
    } else {
        let truncate_at = max_length.saturating_sub(ellipsis.chars().count());
        let truncated: String = text.chars().take(truncate_at).collect();
        format!("{}{}", truncated, ellipsis)
    }
}

/// Center text within width
#[cfg_attr(feature = "wasm", wasm_bindgen)]
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
#[cfg_attr(feature = "wasm", wasm_bindgen)]
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
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn repeat_text(text: &str, n: usize, separator: &str) -> String {
    (0..n)
        .map(|_| text)
        .collect::<Vec<_>>()
        .join(separator)
}

// ---- New generator functions for generate-data engine ----

/// Generate a UUID v7 (timestamp-ordered, random)
pub fn generate_uuid_v7() -> String {
    // 48-bit ms timestamp + version 7 + random
    let now_ms = {
        use std::time::{SystemTime, UNIX_EPOCH};
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as u64
    };
    let mut rand_bytes = [0u8; 16];
    getrandom::getrandom(&mut rand_bytes).expect("getrandom failed");

    // Embed 48-bit timestamp in bytes 0-5
    rand_bytes[0] = ((now_ms >> 40) & 0xFF) as u8;
    rand_bytes[1] = ((now_ms >> 32) & 0xFF) as u8;
    rand_bytes[2] = ((now_ms >> 24) & 0xFF) as u8;
    rand_bytes[3] = ((now_ms >> 16) & 0xFF) as u8;
    rand_bytes[4] = ((now_ms >> 8) & 0xFF) as u8;
    rand_bytes[5] = (now_ms & 0xFF) as u8;
    // Version 7
    rand_bytes[6] = (rand_bytes[6] & 0x0F) | 0x70;
    // Variant bits
    rand_bytes[8] = (rand_bytes[8] & 0x3F) | 0x80;

    format!(
        "{:08x}-{:04x}-{:04x}-{:04x}-{:012x}",
        u32::from_be_bytes([rand_bytes[0], rand_bytes[1], rand_bytes[2], rand_bytes[3]]),
        u16::from_be_bytes([rand_bytes[4], rand_bytes[5]]),
        u16::from_be_bytes([rand_bytes[6], rand_bytes[7]]),
        u16::from_be_bytes([rand_bytes[8], rand_bytes[9]]),
        {
            let b = &rand_bytes[10..16];
            ((b[0] as u64) << 40)
                | ((b[1] as u64) << 32)
                | ((b[2] as u64) << 24)
                | ((b[3] as u64) << 16)
                | ((b[4] as u64) << 8)
                | b[5] as u64
        }
    )
}

/// Generate a UUID v1-style (Gregorian timestamp + random node)
pub fn generate_uuid_v1() -> String {
    // Use current time as Gregorian timestamp (100ns intervals since Oct 15, 1582)
    // Gregorian epoch offset from Unix epoch: 122192928000000000 * 100ns
    const GREGORIAN_OFFSET: u64 = 122192928000000000;
    let now_ns = {
        use std::time::{SystemTime, UNIX_EPOCH};
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_nanos() as u64
    };
    let timestamp = (now_ns / 100) + GREGORIAN_OFFSET;

    let time_low = (timestamp & 0xFFFF_FFFF) as u32;
    let time_mid = ((timestamp >> 32) & 0xFFFF) as u16;
    let time_hi = (((timestamp >> 48) & 0x0FFF) as u16) | 0x1000; // version 1

    let mut rand_bytes = [0u8; 8];
    getrandom::getrandom(&mut rand_bytes).expect("getrandom failed");

    let clock_seq = ((rand_bytes[0] as u16 & 0x3F) | 0x80) << 8 | rand_bytes[1] as u16;
    let node = &rand_bytes[2..8];

    format!(
        "{:08x}-{:04x}-{:04x}-{:04x}-{:02x}{:02x}{:02x}{:02x}{:02x}{:02x}",
        time_low, time_mid, time_hi, clock_seq,
        node[0], node[1], node[2], node[3], node[4], node[5]
    )
}

/// Generate a UUID v5 (SHA-1 based, namespace + name)
pub fn generate_uuid_v5(namespace: &str, name: &str) -> String {
    use sha1::Sha1;
    use sha2::Digest;

    // Predefined namespace UUIDs
    let ns_bytes: [u8; 16] = match namespace {
        "dns" => [
            0x6b, 0xa7, 0xb8, 0x10, 0x9d, 0xad, 0x11, 0xd1,
            0x80, 0xb4, 0x00, 0xc0, 0x4f, 0xd4, 0x30, 0xc8,
        ],
        "url" | _ => [
            0x6b, 0xa7, 0xb8, 0x11, 0x9d, 0xad, 0x11, 0xd1,
            0x80, 0xb4, 0x00, 0xc0, 0x4f, 0xd4, 0x30, 0xc8,
        ],
    };

    let mut hasher = Sha1::new();
    hasher.update(&ns_bytes);
    hasher.update(name.as_bytes());
    let hash = hasher.finalize();

    let mut b = [0u8; 16];
    b.copy_from_slice(&hash[..16]);
    b[6] = (b[6] & 0x0F) | 0x50; // version 5
    b[8] = (b[8] & 0x3F) | 0x80; // variant

    format!(
        "{:02x}{:02x}{:02x}{:02x}-{:02x}{:02x}-{:02x}{:02x}-{:02x}{:02x}-{:02x}{:02x}{:02x}{:02x}{:02x}{:02x}",
        b[0], b[1], b[2], b[3], b[4], b[5], b[6], b[7],
        b[8], b[9], b[10], b[11], b[12], b[13], b[14], b[15]
    )
}

/// Generate a NanoID of given size using URL-safe alphabet
pub fn generate_nanoid(size: usize) -> String {
    const ALPHABET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
    let mut rand_bytes = vec![0u8; size * 2];
    getrandom::getrandom(&mut rand_bytes).expect("getrandom failed");
    let mask = ALPHABET.len() - 1;
    rand_bytes
        .iter()
        .filter_map(|&b| {
            let idx = b as usize & mask;
            if idx < ALPHABET.len() {
                Some(ALPHABET[idx] as char)
            } else {
                None
            }
        })
        .take(size)
        .collect()
}

/// Generate a passphrase of random words
pub fn generate_passphrase(word_count: usize, separator: &str) -> String {
    const WORDS: &[&str] = &[
        "apple", "banana", "cherry", "dragon", "eagle", "forest", "galaxy",
        "harbor", "island", "jungle", "kernel", "lemon", "mountain", "nebula",
        "ocean", "panda", "quartz", "river", "sunset", "tiger", "umbrella",
        "valley", "walrus", "xenon", "yellow", "zipper", "anchor", "bridge",
        "castle", "desert", "engine", "falcon", "garden", "horizon", "igloo",
        "jasper", "knight", "lantern", "marble", "needle", "oracle", "palace",
        "quest", "rocket", "silver", "thunder", "unicorn", "violet", "winter",
    ];
    let mut rand_bytes = vec![0u8; word_count * 2];
    getrandom::getrandom(&mut rand_bytes).expect("getrandom failed");
    rand_bytes
        .chunks(2)
        .take(word_count)
        .map(|chunk| {
            let idx = (u16::from_le_bytes([chunk[0], chunk[1]]) as usize) % WORDS.len();
            WORDS[idx]
        })
        .collect::<Vec<_>>()
        .join(separator)
}

/// Generate a random person name
pub fn generate_person_name() -> String {
    const FIRST: &[&str] = &[
        "Alice", "Bob", "Carol", "David", "Emma", "Frank", "Grace", "Henry",
        "Iris", "Jack", "Karen", "Leo", "Mia", "Noah", "Olivia", "Peter",
        "Quinn", "Rose", "Sam", "Tara", "Uma", "Victor", "Wendy", "Xander",
        "Yara", "Zane",
    ];
    const LAST: &[&str] = &[
        "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
        "Davis", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson",
        "White", "Harris", "Martin", "Thompson", "Young", "Robinson",
    ];
    let mut rand_bytes = [0u8; 4];
    getrandom::getrandom(&mut rand_bytes).expect("getrandom failed");
    let fi = rand_bytes[0] as usize % FIRST.len();
    let li = rand_bytes[1] as usize % LAST.len();
    format!("{} {}", FIRST[fi], LAST[li])
}

/// Generate a random company name
pub fn generate_company_name() -> String {
    const NAMES: &[&str] = &[
        "Apex", "Bloom", "Cobalt", "Delta", "Echo", "Fusion", "Globe",
        "Harbor", "Iris", "Jade", "Kestrel", "Lynx", "Mosaic", "Nova",
        "Orbit", "Peak", "Quest", "Radiant", "Summit", "Titan",
    ];
    const SUFFIXES: &[&str] = &[
        "Inc.", "LLC", "Corp.", "Co.", "Group", "Solutions", "Technologies",
        "Systems", "Ventures", "Labs",
    ];
    let mut rand_bytes = [0u8; 4];
    getrandom::getrandom(&mut rand_bytes).expect("getrandom failed");
    let ni = rand_bytes[0] as usize % NAMES.len();
    let si = rand_bytes[1] as usize % SUFFIXES.len();
    format!("{} {}", NAMES[ni], SUFFIXES[si])
}

/// Generate a Luhn-valid fake credit card number
pub fn generate_credit_card(card_type: &str) -> String {
    let (prefix, length): (&str, usize) = match card_type {
        "mastercard" => ("5", 16),
        "amex" => ("37", 15),
        "discover" => ("6011", 16),
        _ => ("4", 16), // visa default
    };

    let mut rand_bytes = vec![0u8; length];
    getrandom::getrandom(&mut rand_bytes).expect("getrandom failed");

    let mut digits: Vec<u8> = prefix.bytes().map(|b| b - b'0').collect();
    while digits.len() < length - 1 {
        digits.push(rand_bytes[digits.len()] % 10);
    }
    let check = luhn_checksum(&digits);
    digits.push(check);

    digits.iter().map(|d| d.to_string()).collect()
}

fn luhn_checksum(digits: &[u8]) -> u8 {
    let sum: u32 = digits
        .iter()
        .rev()
        .enumerate()
        .map(|(i, &d)| {
            if i % 2 == 0 {
                let v = d as u32 * 2;
                if v > 9 { v - 9 } else { v }
            } else {
                d as u32
            }
        })
        .sum();
    ((10 - (sum % 10)) % 10) as u8
}

/// Generate a random hex color
pub fn generate_color() -> String {
    let mut rand_bytes = [0u8; 3];
    getrandom::getrandom(&mut rand_bytes).expect("getrandom failed");
    format!("#{:02X}{:02X}{:02X}", rand_bytes[0], rand_bytes[1], rand_bytes[2])
}

/// Generate N random hex colors joined by newlines
pub fn generate_color_palette(count: usize) -> String {
    (0..count)
        .map(|_| generate_color())
        .collect::<Vec<_>>()
        .join("\n")
}

/// Generate a random integer in [min, max]
pub fn generate_random_number(min: i64, max: i64) -> String {
    if min >= max {
        return min.to_string();
    }
    let range = (max - min + 1) as u64;
    let mut rand_bytes = [0u8; 8];
    getrandom::getrandom(&mut rand_bytes).expect("getrandom failed");
    let n = u64::from_le_bytes(rand_bytes) % range;
    (min + n as i64).to_string()
}

/// Generate a timestamp in the requested format
pub fn generate_timestamp(format: &str) -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let dur = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    match format {
        "unix-ms" => dur.as_millis().to_string(),
        "iso" => {
            // Manual ISO 8601 UTC without pulling in chrono formatting overhead
            let secs = dur.as_secs();
            let s = secs % 60;
            let m = (secs / 60) % 60;
            let h = (secs / 3600) % 24;
            let days = secs / 86400;
            // Simple Gregorian calendar math from Unix epoch (1970-01-01)
            let (year, month, day) = unix_days_to_ymd(days as u32);
            format!("{:04}-{:02}-{:02}T{:02}:{:02}:{:02}Z", year, month, day, h, m, s)
        }
        _ => dur.as_secs().to_string(), // "unix" default
    }
}

fn unix_days_to_ymd(days: u32) -> (u32, u32, u32) {
    // Algorithm: civil_from_days (Howard Hinnant)
    let z = days as i64 + 719468;
    let era = if z >= 0 { z } else { z - 146096 } / 146097;
    let doe = (z - era * 146097) as u32;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y = yoe as i64 + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let year = if m <= 2 { y + 1 } else { y };
    (year as u32, m, d)
}

/// Generate a random username (adjective + noun + number)
pub fn generate_username() -> String {
    const ADJ: &[&str] = &[
        "swift", "brave", "clever", "dark", "epic", "fast", "golden",
        "happy", "icy", "jolly", "keen", "lucky", "mighty", "noble",
        "odd", "proud", "quiet", "rapid", "sharp", "tough",
    ];
    const NOUN: &[&str] = &[
        "wolf", "bear", "eagle", "fox", "hawk", "lion", "panda",
        "raven", "shark", "tiger", "viper", "whale", "cobra", "crane",
        "dingo", "gecko", "hyena", "ibis", "jaguar", "koala",
    ];
    let mut rand_bytes = [0u8; 4];
    getrandom::getrandom(&mut rand_bytes).expect("getrandom failed");
    let ai = rand_bytes[0] as usize % ADJ.len();
    let ni = rand_bytes[1] as usize % NOUN.len();
    let num = rand_bytes[2] as u32 * 256 + rand_bytes[3] as u32;
    format!("{}{}{}", ADJ[ai], NOUN[ni], num % 10000)
}

/// Generate a random hex string of given length
pub fn generate_random_hash(length: usize) -> String {
    let byte_len = (length + 1) / 2;
    let mut rand_bytes = vec![0u8; byte_len];
    getrandom::getrandom(&mut rand_bytes).expect("getrandom failed");
    rand_bytes
        .iter()
        .flat_map(|b| {
            let hi = (b >> 4) as u8;
            let lo = (b & 0xF) as u8;
            [
                char::from_digit(hi as u32, 16).unwrap_or('0'),
                char::from_digit(lo as u32, 16).unwrap_or('0'),
            ]
        })
        .take(length)
        .collect()
}

/// Generate a dummy (non-cryptographically valid) JWT
pub fn generate_dummy_jwt() -> String {
    use base64::{Engine, engine::general_purpose::URL_SAFE_NO_PAD};
    let header = URL_SAFE_NO_PAD.encode(r#"{"alg":"HS256","typ":"JWT"}"#);
    let now = {
        use std::time::{SystemTime, UNIX_EPOCH};
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs()
    };
    let payload = URL_SAFE_NO_PAD.encode(format!(
        r#"{{"sub":"user_example","iat":{},"exp":{}}}"#,
        now,
        now + 3600
    ));
    // Dummy signature — not cryptographically valid
    let mut rand_bytes = [0u8; 32];
    getrandom::getrandom(&mut rand_bytes).expect("getrandom failed");
    let sig = URL_SAFE_NO_PAD.encode(&rand_bytes);
    format!("{}.{}.{}", header, payload, sig)
}
