/**
 * Category-Specific Tool Executors
 * 
 * Each executor handles tools of a specific category with:
 * - Tool ID sets for identification
 * - Category-specific configurations
 * - Appropriate layout component
 * 
 * This separation ensures:
 * - Clean code organization
 * - No forced UI patterns
 * - Easy maintenance per category
 */

// Text tools (case conversion, encoding, hashing)
export { TextExecutor, TEXT_TOOL_IDS, isTextTool } from './text-executor';
export type { TextExecutorProps } from './text-executor';

// Code/Data tools (JSON/YAML converters, formatters)
export { CodeExecutor, CODE_TOOL_IDS, isCodeTool, getCodeLanguageInfo, shouldShowCssPreview } from './code-executor';
export type { CodeExecutorProps } from './code-executor';

// Generator tools (UUID, password, CSS generators)
export { GeneratorExecutor, GENERATOR_TOOL_IDS, isGeneratorTool } from './generator-executor';
export type { GeneratorExecutorProps } from './generator-executor';

// Calculator and Validator tools
export { CalculatorExecutor, CALCULATOR_TOOL_IDS, VALIDATOR_TOOL_IDS, isCalculatorTool, isValidatorTool } from './calculator-executor';
export type { CalculatorExecutorProps } from './calculator-executor';

// File converter tools (image, PDF, video, audio)
export { FileExecutor, FILE_TOOL_IDS, isFileTool } from './file-executor';
export type { FileExecutorProps } from './file-executor';

// Unit converter tools
export { UnitExecutor, UNIT_TOOL_IDS, isUnitTool, getUnitCategory } from './unit-executor';
export type { UnitExecutorProps } from './unit-executor';
