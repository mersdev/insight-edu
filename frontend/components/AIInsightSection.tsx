
import React, { useState, useEffect } from 'react';
import { Sparkles, Clock, RotateCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button, Card, Skeleton } from './ui';
import { Insight } from '../types';

interface AIInsightSectionProps {
  onGenerate: () => Promise<string>;
  defaultText?: string;
  title?: string;
  lastUpdated?: string;
  isLoading?: boolean;
  insights?: Insight[];
  insightLabelMap?: Partial<Record<Insight['type'], string>>;
}

const DEFAULT_INSIGHT_LABELS: Record<Insight['type'], string> = {
  POSITIVE: 'Positive',
  NEGATIVE: 'Needs Attention',
  OVERALL: 'Summary',
};

const INSIGHT_STYLES: Record<Insight['type'], string> = {
  POSITIVE: 'border-emerald-200 bg-emerald-50',
  NEGATIVE: 'border-destructive/60 bg-destructive/10',
  OVERALL: 'border-primary/60 bg-primary/5',
};

export const AIInsightSection: React.FC<AIInsightSectionProps> = ({
  onGenerate,
  defaultText,
  title = 'Institution AI Summary',
  lastUpdated,
  isLoading = false,
  insights = [],
  insightLabelMap = {},
}) => {
  const [insight, setInsight] = useState<string | null>(defaultText || null);
  const [internalLoading, setInternalLoading] = useState(false);

  useEffect(() => {
    if (defaultText) {
      setInsight(defaultText);
    }
  }, [defaultText]);

  const handleGenerate = async () => {
    setInternalLoading(true);
    try {
      const result = await onGenerate();
      setInsight(result);
    } catch (e) {
      setInsight("Failed to generate insights.");
    } finally {
      setInternalLoading(false);
    }
  };

  const displayText =
    insight && insight !== "Click to analyze data..."
      ? insight
      : "Click 'Analyze' to generate AI insights for this data.";
  const showLoading = isLoading || internalLoading;

  // Formatting date
  const formattedTime = lastUpdated ? new Date(lastUpdated).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : 'Never';
  const resolvedLabels = { ...DEFAULT_INSIGHT_LABELS, ...insightLabelMap };

  return (
    <Card className="bg-white border shadow-sm p-0 overflow-hidden">
      <div className="p-5 border-b flex justify-between items-center bg-white">
        <div className="flex items-center gap-3">
          <div className="bg-purple-100 p-2 rounded-lg text-purple-600 hidden md:block">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              <Clock className="w-3 h-3" />
              <span>Last updated: {formattedTime}</span>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={showLoading}
          className="h-9 w-9 p-0 md:w-auto md:px-3 gap-2"
        >
          <RotateCw className={`w-3.5 h-3.5 ${showLoading ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline">{showLoading ? 'Updating...' : 'Refresh'}</span>
        </Button>
      </div>

      <div className="p-6 bg-white">
        {showLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-[95%]" />
          </div>
        ) : (
          <>
            <ReactMarkdown
              className="text-gray-600 leading-relaxed text-sm md:text-base space-y-2"
              components={{
                h3: ({ node, ...props }) => <h3 className="font-bold text-gray-900 mt-4 mb-2 block" {...props} />,
                strong: ({ node, ...props }) => <span className="font-bold text-gray-900" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1 my-2" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal pl-5 space-y-1 my-2" {...props} />,
                li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
              }}
            >
              {displayText}
            </ReactMarkdown>
            {insights.length > 0 && (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {insights.map((entry, index) => (
                  <div
                    key={`${entry.type}-${index}`}
                    className={`rounded-xl border p-4 ${INSIGHT_STYLES[entry.type]}`}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {resolvedLabels[entry.type] || entry.type}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{entry.message}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
};
