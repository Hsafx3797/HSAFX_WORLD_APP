// TODO [G6]: Rust WASM coverage is partial — only text case, hash, encoding,
//   format, counter, unicode, manipulation, and generators are implemented.
//   Node.js fallback exists via @hsafx/tools (TypeScript). Remaining coverage:
//   validators, calculators, data converters, and specialized tools are NOT
//   compiled to WASM yet. See: docs/PLANNING/11_TECHNOLOGY_STACK.md

#[cfg(feature = "wasm")]
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
#[cfg_attr(feature = "wasm", wasm_bindgen(start))]
pub fn init() {
    // Setup panic hook for better error messages
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

/// Get list of all available tools
#[cfg(feature = "wasm")]
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn get_available_tools() -> JsValue {
    let tools = vec![
        // case.rs
        "uppercase", "lowercase", "title_case", "camel_case",
        "snake_case", "kebab_case", "constant_case", "pascal_case",
        // case_extended.rs
        "dot_case", "path_case", "train_case", "swap_case",
        "sentence_case", "alternating_case", "inverse_case",
        "screaming_snake_case", "flat_case", "capitalized_case",
        "spongebob_case", "leet_speak", "studly_case",
        // encoding.rs
        "base64_encode", "base64_decode", "hex_encode", "hex_decode",
        "url_encode", "url_decode", "url_encode_alt", "url_decode_alt",
        // encoding_extended.rs
        "base32_encode", "base32_decode", "binary_encode", "binary_decode",
        "octal_encode", "octal_decode", "rot13", "rot47",
        "caesar_cipher", "atbash_cipher", "morse_encode", "morse_decode",
        "html_escape", "html_unescape", "ascii_decode", "ascii_encode",
        "nato_encode", "pig_latin", "json_escape", "xml_escape",
        // hash.rs
        "md5_hash", "sha256_hash", "sha512_hash", "generate_uuid",
        // counter.rs
        "word_count", "char_count", "line_count", "text_stats",
        "count_occurrences",
        // format.rs
        "trim_whitespace", "remove_extra_spaces", "remove_all_whitespace",
        "add_line_numbers", "reverse_text", "reverse_words",
        "sort_lines", "remove_duplicate_lines", "wrap_text",
        // wrapper.rs
        "wrap_backticks", "wrap_single_quotes", "wrap_double_quotes",
        "wrap_triple_single_quotes", "wrap_triple_double_quotes",
        "wrap_parentheses", "wrap_square_brackets", "wrap_curly_braces",
        "wrap_angle_brackets", "wrap_double_angle_brackets",
        "wrap_html_tag", "wrap_md_code_block", "wrap_md_inline_code",
        "prefix_lines", "suffix_lines", "line_comment", "block_comment",
        "bold_html", "italic_html", "underline_html",
        "strikethrough_html", "highlight_html",
        "bold_md", "italic_md", "strikethrough_md",
        "blockquote", "heading_h1", "heading_h2", "heading_h3",
        "heading_h4", "heading_h5", "heading_h6",
        // unicode.rs
        "mirror_text", "upside_down_text", "fullwidth_text",
        "circled_text", "squared_text", "small_caps",
        "superscript_text", "subscript_text",
        "sparkle_text", "clap_text", "zalgo_text",
        "monospace_text", "bold_unicode_text", "italic_unicode_text",
        // manipulation.rs
        "remove_vowels", "remove_consonants", "remove_numbers",
        "remove_symbols", "remove_empty_lines", "remove_leading_zeros",
        "keep_only_letters", "keep_only_numbers",
        "extract_emails", "extract_urls", "extract_numbers",
        "extract_hashtags", "extract_mentions",
        "trim_lines", "pad_lines", "dedent_text", "indent_text",
        "replace_line_breaks", "split_lines_by_length",
        "shuffle_lines", "scramble_words", "pick_random_line",
        // generators.rs
        "url_slug", "lorem_ipsum", "generate_password",
        "escape_regex", "find_replace", "find_replace_case_insensitive",
        "regex_replace", "regex_match", "regex_test",
        "number_lines", "remove_line_numbers", "simple_diff",
        "truncate_text", "center_text", "right_align_text", "repeat_text",
    ];

    serde_wasm_bindgen::to_value(&tools).unwrap()
}
