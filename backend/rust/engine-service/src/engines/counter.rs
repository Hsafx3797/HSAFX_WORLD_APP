use crate::ExecuteResponse;
use serde_json::json;

/// Counter engine — word/char/line/frequency counts.
pub fn execute(input: &str, options: &serde_json::Value) -> Result<ExecuteResponse, String> {
    let stats = text_tools::text_stats_native(input);

    let metrics = options
        .get("metrics")
        .and_then(|v| v.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|v| v.as_str().map(|s| s.to_string()))
                .collect::<Vec<_>>()
        })
        .unwrap_or_else(|| vec!["all".into()]);

    let mut result = serde_json::Map::new();

    for metric in &metrics {
        match metric.as_str() {
            "characters" | "chars" => {
                result.insert("characters".into(), json!(stats.char_count));
            }
            "characters-no-spaces" => {
                result.insert("charactersNoSpaces".into(), json!(stats.char_count_no_spaces));
            }
            "words" => {
                result.insert("words".into(), json!(stats.word_count));
            }
            "lines" => {
                result.insert("lines".into(), json!(stats.line_count));
            }
            "sentences" => {
                result.insert("sentences".into(), json!(stats.sentence_count));
            }
            "paragraphs" => {
                result.insert("paragraphs".into(), json!(stats.paragraph_count));
            }
            "avg-word-length" => {
                result.insert("avgWordLength".into(), json!(stats.avg_word_length));
            }
            "all" => {
                result.insert("characters".into(), json!(stats.char_count));
                result.insert("charactersNoSpaces".into(), json!(stats.char_count_no_spaces));
                result.insert("words".into(), json!(stats.word_count));
                result.insert("lines".into(), json!(stats.line_count));
                result.insert("sentences".into(), json!(stats.sentence_count));
                result.insert("paragraphs".into(), json!(stats.paragraph_count));
                result.insert("avgWordLength".into(), json!(stats.avg_word_length));
            }
            _ => {}
        }
    }

    Ok(ExecuteResponse {
        output: serde_json::Value::Object(result),
        metadata: Some(json!({ "metrics": metrics })),
    })
}
