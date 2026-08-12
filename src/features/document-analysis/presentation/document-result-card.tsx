import { Card, Heading, Text, Badge } from '@/shared/ui';
import { ShieldIcon, InfoIcon, AlertTriangleIcon } from 'lucide-react';

export interface DocumentResultCardProps {
  readonly summary: string;
  readonly urgency: 'low' | 'medium' | 'high' | 'critical';
  readonly confidenceScore: number;
  readonly actionPlan: string[];
}

const URGENCY_CONFIG = {
  low: { color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20', label: 'Low Urgency' },
  medium: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', label: 'Medium Urgency' },
  high: { color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', label: 'High Urgency' },
  critical: { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Critical Action Required' },
};

export function DocumentResultCard({
  summary,
  urgency,
  confidenceScore,
  actionPlan
}: DocumentResultCardProps) {
  const config = URGENCY_CONFIG[urgency];

  return (
    <Card className="overflow-hidden border-border-strong/50 shadow-lg bg-surface-1/50 backdrop-blur-xl relative">
      <div className={`absolute top-0 left-0 w-1 h-full ${config.bg.replace('/10', '')}`} />
      
      <div className="p-6 md:p-8 flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex flex-col gap-2 flex-1">
            <div className="flex items-center gap-3">
              <Heading level={2} size="lg" className="font-geist font-extrabold tracking-tight text-text-primary">
                Executive Summary
              </Heading>
              <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${config.color} ${config.bg} ${config.border}`}>
                {config.label}
              </div>
            </div>
            <Text size="md" tone="secondary" className="font-inter leading-relaxed max-w-3xl">
              {summary}
            </Text>
          </div>
          
          <div className="flex flex-col items-end shrink-0">
            <div className="flex items-center gap-2 mb-1">
              <ShieldIcon className="w-4 h-4 text-brand-primary" />
              <Text size="sm" weight="semibold" className="text-text-primary uppercase tracking-wider">
                AI Confidence
              </Text>
            </div>
            <div className="text-3xl font-black font-geist text-brand-primary tracking-tighter">
              {confidenceScore}%
            </div>
          </div>
        </div>

        <div className="w-full h-px bg-border-subtle/50 my-2" />

        {/* Action Plan (Copilot UI) */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <AlertTriangleIcon className="w-5 h-5 text-text-primary" />
            <Heading level={3} size="sm" className="font-geist font-bold text-text-primary">
              Recommended Action Plan
            </Heading>
          </div>
          
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {actionPlan.map((action, idx) => (
              <li key={idx} className="flex items-start gap-3 p-4 rounded-xl bg-surface-2 border border-border-subtle shadow-sm">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <Text size="sm" className="font-inter text-text-secondary leading-relaxed">
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
