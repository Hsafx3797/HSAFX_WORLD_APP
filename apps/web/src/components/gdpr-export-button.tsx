'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';

export function GdprExportButton() {
  const [isExporting, setIsExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const exportMutation = trpc.user.requestDataExport.useMutation({
    onSuccess(data) {
      // Trigger download of the JSON data
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hsafx-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExported(true);
      setIsExporting(false);
    },
    onError() {
      setIsExporting(false);
    },
  });

  const handleExport = () => {
    setIsExporting(true);
    setExported(false);
    exportMutation.mutate();
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isExporting ? 'Preparing export...' : 'Export My Data'}
      </button>
      {exported && (
        <span className="text-sm text-success">Download started!</span>
      )}
      {exportMutation.isError && (
        <span className="text-sm text-destructive">
          Export failed. Please try again.
        </span>
      )}
    </div>
  );
}
