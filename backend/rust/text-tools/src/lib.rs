use wasm_bindgen::prelude::*;

pub mod case;
pub mod case_extended;
pub mod hash;
pub mod encoding;
pub mod encoding_extended;
pub mod format;
pub mod counter;
pub mod wrapper;
pub mod manipulation;
pub mod unicode;
pub mod generators;

// Re-export all tools
pub use case::*;
pub use case_extended::*;
pub use hash::*;
pub use encoding::*;
pub use encoding_extended::*;
pub use format::*;
pub use counter::*;
pub use wrapper::*;
pub use manipulation::*;
pub use unicode::*;
pub use generators::*;

/// Initialize WASM module
#[wasm_bindgen(start)]
pub fn init() {
    // Setup panic hook for better error messages
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

/// Get list of all available tools
#[wasm_bindgen]
pub fn get_available_tools() -> JsValue {
    let tools = vec![
        "uppercase",
        "lowercase",
        "title_case",
        "camel_case",
        "snake_case",
        "kebab_case",
        "md5_hash",
        "sha256_hash",
        "base64_encode",
        "base64_decode",
        "hex_encode",
        "hex_decode",
        "url_encode",
        "url_decode",
        "trim_whitespace",
        "remove_extra_spaces",
        "word_count",
        "char_count",
        "line_count",
    ];

    serde_wasm_bindgen::to_value(&tools).unwrap()
}
