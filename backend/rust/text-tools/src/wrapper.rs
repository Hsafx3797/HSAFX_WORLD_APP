#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

/// Wrap text with prefix and suffix
fn wrap_with(text: &str, prefix: &str, suffix: &str) -> String {
    format!("{}{}{}", prefix, text, suffix)
}

/// Wrap with backticks
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn wrap_backticks(text: &str) -> String {
    wrap_with(text, "`", "`")
}

/// Wrap with single quotes
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn wrap_single_quotes(text: &str) -> String {
    wrap_with(text, "'", "'")
}

/// Wrap with double quotes
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn wrap_double_quotes(text: &str) -> String {
    wrap_with(text, "\"", "\"")
}

/// Wrap with triple single quotes
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn wrap_triple_single_quotes(text: &str) -> String {
    wrap_with(text, "'''", "'''")
}

/// Wrap with triple double quotes
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn wrap_triple_double_quotes(text: &str) -> String {
    wrap_with(text, "\"\"\"", "\"\"\"")
}

/// Wrap with parentheses
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn wrap_parentheses(text: &str) -> String {
    wrap_with(text, "(", ")")
}

/// Wrap with square brackets
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn wrap_square_brackets(text: &str) -> String {
    wrap_with(text, "[", "]")
}

/// Wrap with curly braces
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn wrap_curly_braces(text: &str) -> String {
    wrap_with(text, "{", "}")
}

/// Wrap with angle brackets
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn wrap_angle_brackets(text: &str) -> String {
    wrap_with(text, "<", ">")
}

/// Wrap with double angle brackets
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn wrap_double_angle_brackets(text: &str) -> String {
    wrap_with(text, "<<", ">>")
}

/// Wrap with HTML tag
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn wrap_html_tag(text: &str, tag: &str) -> String {
    format!("<{}>{}</{}>", tag, text, tag)
}

/// Wrap with markdown code block
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn wrap_md_code_block(text: &str, language: &str) -> String {
    format!("```{}\n{}\n```", language, text)
}

/// Wrap with markdown inline code
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn wrap_md_inline_code(text: &str) -> String {
    wrap_with(text, "`", "`")
}

/// Prefix each line
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn prefix_lines(text: &str, prefix: &str) -> String {
    text.lines()
        .map(|line| format!("{}{}", prefix, line))
        .collect::<Vec<_>>()
        .join("\n")
}

/// Suffix each line
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn suffix_lines(text: &str, suffix: &str) -> String {
    text.lines()
        .map(|line| format!("{}{}", line, suffix))
        .collect::<Vec<_>>()
        .join("\n")
}

/// Line comment style
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn line_comment(text: &str) -> String {
    prefix_lines(text, "// ")
}

/// Block comment style
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn block_comment(text: &str) -> String {
    format!("/* {} */", text)
}

/// Bold HTML
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn bold_html(text: &str) -> String {
    wrap_html_tag(text, "strong")
}

/// Italic HTML
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn italic_html(text: &str) -> String {
    wrap_html_tag(text, "em")
}

/// Underline HTML
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn underline_html(text: &str) -> String {
    wrap_html_tag(text, "u")
}

/// Strikethrough HTML
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn strikethrough_html(text: &str) -> String {
    wrap_html_tag(text, "s")
}

/// Highlight HTML
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn highlight_html(text: &str) -> String {
    wrap_html_tag(text, "mark")
}

/// Bold Markdown
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn bold_md(text: &str) -> String {
    wrap_with(text, "**", "**")
}

/// Italic Markdown
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn italic_md(text: &str) -> String {
    wrap_with(text, "*", "*")
}

/// Strikethrough Markdown
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn strikethrough_md(text: &str) -> String {
    wrap_with(text, "~~", "~~")
}

/// Blockquote style
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn blockquote(text: &str) -> String {
    prefix_lines(text, "> ")
}

/// Heading H1
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn heading_h1(text: &str) -> String {
    format!("# {}", text)
}

/// Heading H2
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn heading_h2(text: &str) -> String {
    format!("## {}", text)
}

/// Heading H3
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn heading_h3(text: &str) -> String {
    format!("### {}", text)
}

/// Heading H4
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn heading_h4(text: &str) -> String {
    format!("#### {}", text)
}

/// Heading H5
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn heading_h5(text: &str) -> String {
    format!("##### {}", text)
}

/// Heading H6
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn heading_h6(text: &str) -> String {
    format!("###### {}", text)
}
