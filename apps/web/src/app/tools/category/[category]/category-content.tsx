'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ToolPopup } from '@/components/tools';
import { isCodeTool, getCodeLanguageInfo } from '@/components/tools/executors';
import ToolExecutor from '@/app/tools/[slug]/tool-executor';
import type { ToolMetadata } from '@/lib/tools/types';

interface CategoryConfig {
  name: string;
  emoji: string;
  description: string;
  longDescription: string;
  registryCategory: string;
  usePopup?: boolean;
}

interface CategoryContentProps {
  category: string;
  config: CategoryConfig;
  groupedTools: Record<string, ToolMetadata[]>;
  sortedGroups: string[];
}

export default function CategoryContent({ 
  category, 
  config, 
  groupedTools, 
  sortedGroups 
}: CategoryContentProps) {
  const [selectedTool, setSelectedTool] = useState<ToolMetadata | null>(null);
  const usePopup = config.usePopup ?? true; // Default to popup mode

  // Determine max width based on tool type for optimal layout
  const getPopupMaxWidth = (tool: ToolMetadata): 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' => {
    // File-based tools need more space
    if (tool.inputType === 'file' || tool.outputType === 'file') return '5xl';
    // Converters with bidirectional need wide layout
    if (tool.category === 'Data' || category === 'converters') return '4xl';
    // Media tools need space for preview
    if (category === 'media') return '5xl';
    // Calculators and generators are medium
    if (category === 'calculators' || category === 'generators') return '3xl';
    // Unit converters
    if (category === 'unit-converters') return '3xl';
    return '3xl';
  };

  return (
    <>
      <section className="py-12">
        <div className="container mx-auto px-4">
          {sortedGroups.map((group) => (
            <div key={group} className="mb-12">
              <h2 className="text-xl font-semibold mb-6 pb-2 border-b border-border">
                {group}
                <span className="text-sm font-normal text-muted-foreground ml-3">
                  ({groupedTools[group]!.length} tools)
                </span>
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {groupedTools[group]!.map((tool) => {
                  if (usePopup) {
                    // Popup trigger card
                    return (
                      <button
                        key={tool.id}
                        onClick={() => setSelectedTool(tool)}
                        className="group p-4 bg-card border border-border rounded-lg hover:border-primary/50 hover:shadow-md transition-all text-left"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium group-hover:text-primary transition-colors">
                              {tool.name}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {tool.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              {tool.tier !== 'free' && (
                                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                                  {tool.tier}
                                </span>
                              )}
                              {tool.isNew && (
                                <span className="text-xs px-2 py-0.5 bg-success/10 text-success rounded-full">
                                  New
                                </span>
                              )}
                              <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full ml-auto">
                                Click to use
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  }
                  
                  // Link card (default for non-popup categories)
                  return (
                    <Link
                      key={tool.id}
                      href={`/tools/${tool.id}`}
                      className="group p-4 bg-card border border-border rounded-lg hover:border-primary/50 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium group-hover:text-primary transition-colors">
                            {tool.name}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {tool.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            {tool.tier !== 'free' && (
                              <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                                {tool.tier}
                              </span>
                            )}
                            {tool.isNew && (
                              <span className="text-xs px-2 py-0.5 bg-success/10 text-success rounded-full">
                                New
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Popup for selected tool - uses ToolExecutor for full functionality */}
      {selectedTool && (
        <ToolPopup
          open={!!selectedTool}
          onOpenChange={(open) => !open && setSelectedTool(null)}
          title={selectedTool.name}
          description={selectedTool.description}
          tier={selectedTool.tier as 'free' | 'coin' | 'premium'}
          maxWidth={getPopupMaxWidth(selectedTool)}
          allowFullscreen={true}
          bidirectional={isCodeTool(selectedTool.id) ? getCodeLanguageInfo(selectedTool.id).bidirectional : false}
        >
          <ToolExecutor tool={selectedTool} />
        </ToolPopup>
      )}
    </>
  );
}
