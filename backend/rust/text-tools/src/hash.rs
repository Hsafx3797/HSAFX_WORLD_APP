#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;
use sha2::{Sha256, Sha512, Digest};

/// Generate MD5 hash
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn md5_hash(text: &str) -> String {
    use md5::Md5;
    let mut hasher = Md5::new();
    hasher.update(text.as_bytes());
    format!("{:x}", hasher.finalize())
}

/// Generate SHA-256 hash
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn sha256_hash(text: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(text.as_bytes());
    format!("{:x}", hasher.finalize())
}

/// Generate SHA-512 hash
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn sha512_hash(text: &str) -> String {
    let mut hasher = Sha512::new();
    hasher.update(text.as_bytes());
    format!("{:x}", hasher.finalize())
}

/// Generate UUID v4
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn generate_uuid() -> String {
    uuid::Uuid::new_v4().to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_md5() {
        let result = md5_hash("hello");
        assert_eq!(result.len(), 32); // MD5 is 32 hex characters
    }

    #[test]
    fn test_sha256() {
        let result = sha256_hash("hello");
        assert_eq!(result.len(), 64); // SHA-256 is 64 hex characters
    }

    #[test]
    fn test_uuid() {
        let uuid = generate_uuid();
        assert_eq!(uuid.len(), 36); // UUID format: 8-4-4-4-12
    }
}
