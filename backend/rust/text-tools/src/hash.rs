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

/// Generate SHA-1 hash
pub fn sha1_hash(text: &str) -> String {
    use sha1::Sha1;
    let mut hasher = Sha1::new();
    hasher.update(text.as_bytes());
    format!("{:x}", hasher.finalize())
}

/// Generate CRC32 checksum (IEEE polynomial)
pub fn crc32_hash(text: &str) -> String {
    let crc = crc32_ieee(text.as_bytes());
    format!("{:08x}", crc)
}

fn crc32_ieee(data: &[u8]) -> u32 {
    let mut crc: u32 = 0xFFFFFFFF;
    for &byte in data {
        let index = ((crc ^ byte as u32) & 0xFF) as usize;
        crc = CRC32_TABLE[index] ^ (crc >> 8);
    }
    crc ^ 0xFFFFFFFF
}

static CRC32_TABLE: [u32; 256] = generate_crc32_table();

const fn generate_crc32_table() -> [u32; 256] {
    let mut table = [0u32; 256];
    let mut i = 0usize;
    while i < 256 {
        let mut c = i as u32;
        let mut j = 0;
        while j < 8 {
            if c & 1 != 0 {
                c = 0xEDB88320 ^ (c >> 1);
            } else {
                c >>= 1;
            }
            j += 1;
        }
        table[i] = c;
        i += 1;
    }
    table
}

/// Generate DJB2 hash
pub fn djb2_hash(text: &str) -> String {
    let mut hash: u64 = 5381;
    for byte in text.bytes() {
        hash = hash.wrapping_mul(33).wrapping_add(byte as u64);
    }
    format!("{:016x}", hash)
}

/// Generate FNV-1a hash (32-bit)
pub fn fnv1a_hash(text: &str) -> String {
    const FNV_OFFSET: u32 = 2166136261;
    const FNV_PRIME: u32 = 16777619;
    let mut hash = FNV_OFFSET;
    for byte in text.bytes() {
        hash ^= byte as u32;
        hash = hash.wrapping_mul(FNV_PRIME);
    }
    format!("{:08x}", hash)
}

/// Generate Adler-32 checksum
pub fn adler32_hash(text: &str) -> String {
    const MOD_ADLER: u32 = 65521;
    let mut a: u32 = 1;
    let mut b: u32 = 0;
    for byte in text.bytes() {
        a = (a + byte as u32) % MOD_ADLER;
        b = (b + a) % MOD_ADLER;
    }
    let checksum = (b << 16) | a;
    format!("{:08x}", checksum)
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
