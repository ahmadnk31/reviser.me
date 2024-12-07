"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Document } from '@/lib/types';
import { Brain, Loader2 } from 'lucide-react';

interface DocumentSummaryProps {
  document: Document;
}

export function DocumentSummary({ document }: DocumentSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateSummary = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: document.id }),
      });

      if (!response.ok) throw new Error('Failed to generate summary');

      const data = await response.json();
      setSummary(data.summary);
    } catch (error) {
      console.error('Summary generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!summary && (
        <Button
          onClick={handleGenerateSummary}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Summary...
            </>
          ) : (
            <>
              <Brain className="mr-2 h-4 w-4" />
              Generate Summary
            </>
          )}
        </Button>
      )}

      {summary && (
        <Card className="p-4">
          <p className="text-sm leading-relaxed">{summary}</p>
        </Card>
      )}
    </div>
  );
}