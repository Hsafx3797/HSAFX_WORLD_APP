'use client';

import type { ToolMetadata } from '@/lib/tools/types';
import {
  TextExecutor,
  CodeExecutor,
  GeneratorExecutor,
  CalculatorExecutor,
  FileExecutor,
  UnitExecutor,
  isTextTool,
  isCodeTool,
  isGeneratorTool,
  isCalculatorTool,
  isFileTool,
  isUnitTool,
} from '@/components/tools/executors';
import {
  TextConverterLayout,
  TextConverterUnified,
  DbSchemaVisualizerInteractive,
  FileTreeVisualizer,
  ChequeGenerator,
  AsyncIntelligenceLayout,
  ZakatCalculator,
  InheritanceCalculator,
} from '@/components/tools';
import { executeClientTool } from '@/lib/tools/executor';

interface ToolExecutorProps {
  tool: ToolMetadata;
}

// Specialized tool IDs that need custom components
const SPECIALIZED_TOOL_IDS = {
  dbSchema: 'db-schema-visualizer',
  fileTree: 'file-tree-generator',
  cheque: 'cheque-generator',
  containerTracker: 'container-tracker',
  vesselTracker: 'vessel-tracker',
  portStatus: 'port-status',
  textConverter: 'text-converter',
  zakatCalculator: 'zakat-calculator',
  inheritanceCalculator: 'inheritance-calculator',
};

export function ToolExecutor({ tool }: ToolExecutorProps) {
  const toolId = tool.id;
  
  // === Specialized Tools (custom components) ===
  if (toolId === SPECIALIZED_TOOL_IDS.dbSchema) {
    return <DbSchemaVisualizerInteractive />;
  }
  
  if (toolId === SPECIALIZED_TOOL_IDS.fileTree) {
    return <FileTreeVisualizer />;
  }
  
  if (toolId === SPECIALIZED_TOOL_IDS.cheque) {
    return <ChequeGenerator />;
  }
  
  if (toolId === SPECIALIZED_TOOL_IDS.textConverter) {
    return <TextConverterUnified />;
  }
  
  if (toolId === SPECIALIZED_TOOL_IDS.zakatCalculator) {
    return <ZakatCalculator />;
  }
  
  if (toolId === SPECIALIZED_TOOL_IDS.inheritanceCalculator) {
    return <InheritanceCalculator />;
  }
  
  // Async Intelligence Tools (container/vessel/port tracking)
  if ([SPECIALIZED_TOOL_IDS.containerTracker, SPECIALIZED_TOOL_IDS.vesselTracker, SPECIALIZED_TOOL_IDS.portStatus].includes(toolId)) {
    const processIdentifier = async (identifier: string): Promise<Record<string, unknown>> => {
      const result = await executeClientTool(tool.id, identifier);
      if (!result.success) throw new Error(result.error);
      return result.output as Record<string, unknown>;
    };
    return (
      <AsyncIntelligenceLayout
        toolId={tool.id}
        toolName={tool.name}
        description={tool.description}
        identifierLabel="Tracking Numbers"
        identifierPlaceholder="Enter tracking numbers (one per line)"
        processIdentifier={processIdentifier}
      />
    );
  }
  
  // === Category Executors ===
  // Each executor handles its own UI - no header rendering here
  
  if (isTextTool(toolId)) {
    return <TextExecutor tool={tool} />;
  }
  
  if (isCodeTool(toolId)) {
    return <CodeExecutor tool={tool} />;
  }
  
  if (isGeneratorTool(toolId)) {
    return <GeneratorExecutor tool={tool} />;
  }
  
  if (isCalculatorTool(toolId)) {
    return <CalculatorExecutor tool={tool} />;
  }
  
  if (isFileTool(toolId)) {
    return <FileExecutor tool={tool} />;
  }
  
  if (isUnitTool(toolId)) {
    return <UnitExecutor tool={tool} />;
  }
  
  // === Category Fallback ===
  // Route based on tool category if no ID match
  if (tool.category === 'Generator') {
    return <GeneratorExecutor tool={tool} />;
  }
  
  if (tool.category === 'Calculator') {
    return <CalculatorExecutor tool={tool} />;
  }
  
  if (tool.category === 'Converter') {
    return <UnitExecutor tool={tool} />;
  }
  
  if (tool.category === 'Data') {
    return <CodeExecutor tool={tool} />;
  }
  
  if (tool.execution === 'server' || tool.category === 'Media') {
    return <FileExecutor tool={tool} />;
  }
  
  // === Ultimate Fallback ===
  // Default to simple text converter
  const transform = async (text: string): Promise<string> => {
    const result = await executeClientTool(tool.id, text);
    if (!result.success) throw new Error(result.error);
    return typeof result.output === 'string' ? result.output : JSON.stringify(result.output);
  };
  
  return (
    <TextConverterLayout
      toolId={tool.id}
      toolName={tool.name}
      placeholder={`Enter input for ${tool.name}...`}
      transform={transform}
    />
  );
}

export default ToolExecutor;
