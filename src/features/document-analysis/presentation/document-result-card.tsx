import { Card, Heading, Text, Badge } from '@/shared/ui';
import { ShieldIcon, InfoIcon, AlertTriangleIcon } from 'lucide-react';

export interface DocumentResultCardProps {
  readonly summary: string;
  readonly urgency: 'low' | 'medium' | 'high' | 'critical';
  readonly confidenceScore: number;
  readonly actionPlan: string[];
}

const URGENCY_CONFIG = {
  low: {
    color: 'text-risk-safe',
    bg: 'bg-risk-safe/10',
    border: 'border-risk-safe/20',
    label: 'Low Urgency',
  },
  medium: {
    color: 'text-risk-caution',
    bg: 'bg-risk-caution/10',
    border: 'border-risk-caution/20',
    label: 'Medium Urgency',
  },
  high: {
    color: 'text-risk-critical',
    bg: 'bg-risk-critical/10',
    border: 'border-risk-critical/20',
    label: 'High Urgency',
  },
  critical: {
    color: 'text-risk-critical',
    bg: 'bg-risk-critical/10',
    border: 'border-risk-critical/20',
    label: 'Critical Action Required',
  },
};

export function DocumentResultCard({
  summary,
  urgency,
  confidenceScore,
  actionPlan,
}: DocumentResultCardProps) {
  const config = URGENCY_CONFIG[urgency];

  return (
    <Card className="relative overflow-hidden border-border-strong/50 bg-surface-1/50 shadow-lg backdrop-blur-xl">
      <div className={`absolute top-0 left-0 h-full w-1 ${config.bg.replace('/10', '')}`} />

      <div className="flex flex-col gap-6 p-6 md:p-8">
        {/* Header Section */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex items-center gap-3">
              <Heading
                level={2}
                size="lg"
                className="font-geist font-extrabold tracking-tight text-text-primary"
              >
                Executive Summary
              </Heading>
              <div
                className={`rounded-full border px-3 py-1 text-xs font-bold tracking-widest uppercase ${config.color} ${config.bg} ${config.border}`}
              >
                {config.label}
              </div>
            </div>
            <Text size="md" tone="secondary" className="font-inter max-w-3xl leading-relaxed">
              {summary}
            </Text>
          </div>

          <div className="flex shrink-0 flex-col items-end">
            <div className="mb-1 flex items-center gap-2">
              <ShieldIcon className="h-4 w-4 text-brand-primary" />
              <Text
                size="sm"
                weight="semibold"
                className="tracking-wider text-text-primary uppercase"
              >
                AI Confidence
              </Text>
            </div>
            <div className="font-geist text-3xl font-black tracking-tighter text-brand-primary">
              {confidenceScore}%
            </div>
          </div>
        </div>

        <div className="my-2 h-px w-full bg-border-subtle/50" />

        {/* Action Plan (Copilot UI) */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <AlertTriangleIcon className="h-5 w-5 text-text-primary" />
            <Heading level={3} size="sm" className="font-geist font-bold text-text-primary">
              Recommended Action Plan
            </Heading>
          </div>

          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {actionPlan.map((action, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 rounded-xl border border-border-subtle bg-surface-2 p-4 shadow-sm"
              >
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-xs font-bold text-brand-primary">
                  {idx + 1}
                </div>
                <Text size="sm" className="font-inter leading-relaxed text-text-secondary">
                  {action}
                </Text>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
