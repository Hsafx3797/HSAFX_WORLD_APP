use crate::ExecuteResponse;
use serde_json::json;

/// Unicode engine — zalgo, fullwidth, upside-down, etc.
/// Options: style, intensity (for zalgo)
pub fn execute(input: &str, options: &serde_json::Value) -> Result<ExecuteResponse, String> {
    let style = options
        .get("style")
        .and_then(|v| v.as_str())
        .ok_or("Missing required option: style")?;

    let output = match style {
        "fullwidth" => text_tools::fullwidth_text(input),
        "smallcaps" => text_tools::small_caps(input),
        "superscript" => text_tools::superscript_text(input),
        "subscript" => text_tools::subscript_text(input),
        "strikethrough" => text_tools::strikethrough_html(input),
        "underline" => text_tools::underline_html(input),
        "zalgo" => {
            let intensity = options
                .get("intensity")
                .and_then(|v| v.as_str())
                .unwrap_or("medium");
            let level = match intensity {
                "low" | "light" => 1,
                "high" | "heavy" => 3,
                _ => 2, // medium
            };
            text_tools::zalgo_text(input, level)
        }
        "circled" => text_tools::circled_text(input),
        "squared" => text_tools::squared_text(input),
        "bold" => text_tools::bold_unicode_text(input),
        "italic" => text_tools::italic_unicode_text(input),
        "monospace" => text_tools::monospace_text(input),
        "upside-down" | "flip" => text_tools::upside_down_text(input),
        "mirror" => text_tools::mirror_text(input),
        "clap" => text_tools::clap_text(input),
        "sparkle" => text_tools::sparkle_text(input),
        _ => return Err(format!("Unknown unicode style: {}", style)),
    };

    Ok(ExecuteResponse {
        output: json!(output),
        metadata: None,
    })
}
