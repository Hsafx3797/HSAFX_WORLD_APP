mod case;
mod counter;
mod encode;
mod filter;
mod generate_data;
mod hash;
mod transform;
mod unicode;
mod wrap;

use crate::ExecuteResponse;

pub const SUPPORTED_ENGINES: &[&str] = &[
    "case",
    "counter",
    "encode",
    "filter",
    "generate-data",
    "hash",
    "transform",
    "unicode",
    "wrap",
];

pub fn dispatch(
    engine: &str,
    input: &str,
    options: &serde_json::Value,
) -> Result<ExecuteResponse, String> {
    match engine {
        "case" => case::execute(input, options),
        "counter" => counter::execute(input, options),
        "encode" => encode::execute(input, options),
        "filter" => filter::execute(input, options),
        "generate-data" => generate_data::execute(input, options),
        "hash" => hash::execute(input, options),
        "transform" => transform::execute(input, options),
        "unicode" => unicode::execute(input, options),
        "wrap" => wrap::execute(input, options),
        _ => Err(format!("Unknown engine: {}", engine)),
    }
}
