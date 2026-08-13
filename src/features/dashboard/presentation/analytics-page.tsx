'use client';

import { Heading, Text, Badge } from '@/shared/ui';
import { BarChartIcon, ScanIcon, VaultIcon, TrendingUpIcon, CalendarIcon, DownloadIcon } from '@/shared/ui/icons/dashboard-icons';
import { ShieldIcon } from '@/shared/ui/icons';

export interface AnalyticsData {
  totalScans: number;
  vaultDocs: number;
  highRisk: number;
  recentActivity: { file: string; time: string; status: string; risk: 'safe' | 'caution' | 'critical' }[];
  processingVolume: number[]; // 12 values
}

export function AnalyticsPage({ data }: { data?: AnalyticsData }) {
  // Fallback to empty if not provided yet, but the page route will provide it
  const analytics = data || {
    totalScans: 0,
    vaultDocs: 0,
    highRisk: 0,
    recentActivity: [],
    processingVolume: Array(12).fill(0)
  };

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative">
        <div className="relative z-10">
          <Heading level={1} size="lg" className="tracking-tight text-text-primary">
            Workspace Analytics
          </Heading>
          <Text tone="secondary" className="mt-1 text-sm font-medium">
            Monitor document processing metrics and workspace usage trends.
          </Text>
        </div>
        <div className="flex items-center gap-3 relative z-10 flex-wrap">
          <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-safe/10 px-3 py-1.5 text-xs font-bold text-safe mr-2">
            <TrendingUpIcon className="size-4" /> Systems Nominal
          </div>
          
          <button className="flex h-9 items-center gap-2 rounded-xl border border-border-subtle bg-surface-1 px-3 text-sm font-semibold text-text-secondary shadow-sm hover:border-brand-primary/30 hover:text-brand-primary transition-all">
            <CalendarIcon className="size-4" />
            <span>Last 30 Days</span>
          </button>
          
          <button className="flex h-9 items-center gap-2 rounded-xl border border-border-strong/50 bg-surface-2 px-3 text-sm font-semibold text-text-primary shadow-sm hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all">
            <DownloadIcon className="size-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
        <div className="relative flex flex-col gap-4 rounded-2xl border border-border-subtle bg-surface-1 p-5 shadow-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent opacity-50" />
          <div className="relative flex items-center justify-between">
            <div className="flex size-12 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
              <ScanIcon className="size-6" />
            </div>
            <Badge tone="safe" className="font-bold">+12% this week</Badge>
          </div>
          <div className="relative">
            <Heading level={2} size="md" className="font-extrabold text-3xl">{analytics.totalScans.toLocaleString()}</Heading>
            <Text size="sm" tone="secondary" className="font-medium mt-1">Total Scans Performed</Text>
          </div>
        </div>

        <div className="relative flex flex-col gap-4 rounded-2xl border border-border-subtle bg-surface-1 p-5 shadow-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-secondary/5 to-transparent opacity-50" />
          <div className="relative flex items-center justify-between">
            <div className="flex size-12 items-center justify-center rounded-xl bg-brand-secondary/10 text-brand-secondary">
              <VaultIcon className="size-6" />
            </div>
            <Badge tone="neutral" className="font-bold">Active</Badge>
          </div>
          <div className="relative">
            <Heading level={2} size="md" className="font-extrabold text-3xl">{analytics.vaultDocs.toLocaleString()}</Heading>
            <Text size="sm" tone="secondary" className="font-medium mt-1">Documents in Vault</Text>
          </div>
        </div>

        <div className="relative flex flex-col gap-4 rounded-2xl border border-border-subtle bg-surface-1 p-5 shadow-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-risk-critical/5 to-transparent opacity-50" />
          <div className="relative flex items-center justify-between">
            <div className="flex size-12 items-center justify-center rounded-xl bg-risk-critical/10 text-risk-critical">
              <ShieldIcon className="size-6" />
            </div>
            <Badge tone="critical" className="font-bold">Attention</Badge>
          </div>
          <div className="relative">
            <Heading level={2} size="md" className="font-extrabold text-3xl">{analytics.highRisk}</Heading>
            <Text size="sm" tone="secondary" className="font-medium mt-1">High Risk Contracts</Text>
          </div>
        </div>

        <div className="relative flex flex-col gap-4 rounded-2xl border border-border-subtle bg-surface-1 p-5 shadow-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-risk-safe/5 to-transparent opacity-50" />
          <div className="relative flex items-center justify-between">
            <div className="flex size-12 items-center justify-center rounded-xl bg-safe/10 text-safe">
              <BarChartIcon className="size-6" />
            </div>
          </div>
          <div className="relative">
            <Heading level={2} size="md" className="font-extrabold text-3xl">1.2s</Heading>
            <Text size="sm" tone="secondary" className="font-medium mt-1">Avg. Processing Time</Text>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        <div className="lg:col-span-2 rounded-[1.25rem] border border-border-subtle bg-surface-1 p-6 shadow-sm flex flex-col min-h-[400px]">
          <div className="mb-6">
            <Heading level={2} size="sm" className="font-bold uppercase tracking-wider text-text-tertiary">Processing Volume (30 Days)</Heading>
          </div>
          <div className="flex-1 flex items-center justify-center rounded-xl border border-dashed border-border-strong bg-surface-2/50 relative overflow-hidden">
             <div className="absolute inset-0 flex items-end justify-between px-6 pt-10 pb-6 opacity-30">
                {analytics.processingVolume.map((h, i) => (
                  <div key={i} className="w-[6%] bg-brand-primary rounded-t-sm" style={{ height: `${Math.max(5, Math.min(100, h * 10))}%` }} />
                ))}
             </div>
             <Text tone="tertiary" className="font-medium relative z-10 bg-surface-1 px-4 py-1.5 rounded-full border border-border-subtle shadow-sm">Chart Data Loading...</Text>
          </div>
        </div>
        
        <div className="lg:col-span-1 rounded-[1.25rem] border border-border-subtle bg-surface-1 p-6 shadow-sm flex flex-col">
          <div className="mb-6">
            <Heading level={2} size="sm" className="font-bold uppercase tracking-wider text-text-tertiary">Risk Distribution</Heading>
          </div>
          <div className="flex-1 flex flex-col gap-5">
            <div>
              <div className="flex justify-between text-sm font-bold text-text-secondary mb-2">
                <span>Verified Safe</span>
                <span className="text-safe">65%</span>
              </div>
              <div className="h-2.5 w-full bg-surface-2 rounded-full overflow-hidden">
                <div className="h-full bg-safe rounded-full shadow-[0_0_8px_rgba(var(--color-safe),0.6)]" style={{ width: '65%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm font-bold text-text-secondary mb-2">
                <span>Needs Review</span>
                <span className="text-risk-caution">25%</span>
              </div>
              <div className="h-2.5 w-full bg-surface-2 rounded-full overflow-hidden">
                <div className="h-full bg-risk-caution rounded-full shadow-[0_0_8px_rgba(var(--color-risk-caution),0.6)]" style={{ width: '25%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm font-bold text-text-secondary mb-2">
                <span>High Risk</span>
                <span className="text-risk-critical">10%</span>
              </div>
              <div className="h-2.5 w-full bg-surface-2 rounded-full overflow-hidden">
                <div className="h-full bg-risk-critical rounded-full shadow-[0_0_8px_rgba(var(--color-risk-critical),0.6)]" style={{ width: '10%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        {/* Recent Activity */}
        <div className="rounded-[1.25rem] border border-border-subtle bg-surface-1 p-6 shadow-sm flex flex-col">
          <div className="mb-6 flex justify-between items-center">
            <Heading level={2} size="sm" className="font-bold uppercase tracking-wider text-text-tertiary">Recent Scan Activity</Heading>
            <button className="text-xs font-bold text-brand-primary hover:underline">View All</button>
          </div>
          <div className="flex flex-col gap-4">
            {analytics.recentActivity.length > 0 ? analytics.recentActivity.map((activity, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border-subtle hover:bg-surface-2 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className={`flex size-10 items-center justify-center rounded-lg ${
                    activity.risk === 'safe' ? 'bg-safe/10 text-safe' : 
                    activity.risk === 'caution' ? 'bg-risk-caution/10 text-risk-caution' : 
                    'bg-risk-critical/10 text-risk-critical'
                  }`}>
                    <ScanIcon className="size-5" />
                  </div>
                  <div>
                    <Text size="sm" className="font-bold text-text-primary group-hover:text-brand-primary transition-colors">{activity.file}</Text>
                    <Text size="xs" tone="secondary" className="font-medium mt-0.5">{activity.time}</Text>
                  </div>
                </div>
                <Badge tone={activity.risk as 'safe' | 'caution' | 'critical'} className="font-bold">
                  {activity.status}
                </Badge>
              </div>
            )) : (
              <div className="p-4 text-center text-text-tertiary">No recent activity</div>
            )}
          </div>
        </div>

        {/* Storage Breakdown */}
        <div className="rounded-[1.25rem] border border-border-subtle bg-surface-1 p-6 shadow-sm flex flex-col">
          <div className="mb-6">
            <Heading level={2} size="sm" className="font-bold uppercase tracking-wider text-text-tertiary">Storage Breakdown</Heading>
          </div>
          
          <div className="flex-1 flex flex-col justify-center gap-8">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full bg-brand-primary" />
                  <Text size="sm" className="font-bold text-text-primary">Legal Contracts</Text>
                </div>
                <Text size="sm" className="font-bold text-text-secondary">1.2 GB (50%)</Text>
              </div>
              <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden">
                <div className="h-full bg-brand-primary rounded-full shadow-[0_0_8px_rgba(var(--color-brand-primary),0.6)]" style={{ width: '50%' }} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full bg-brand-secondary" />
                  <Text size="sm" className="font-bold text-text-primary">Financial Reports</Text>
                </div>
                <Text size="sm" className="font-bold text-text-secondary">0.7 GB (30%)</Text>
              </div>
              <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden">
                <div className="h-full bg-brand-secondary rounded-full shadow-[0_0_8px_rgba(var(--color-brand-secondary),0.6)]" style={{ width: '30%' }} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full bg-border-strong" />
                  <Text size="sm" className="font-bold text-text-primary">Other Documents</Text>
                </div>
                <Text size="sm" className="font-bold text-text-secondary">0.5 GB (20%)</Text>
              </div>
              <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden">
                <div className="h-full bg-border-strong rounded-full" style={{ width: '20%' }} />
              </div>
            </div>
            
            <div className="mt-4 p-4 rounded-xl bg-surface-2/50 border border-border-subtle flex justify-between items-center">
              <div>
                <Text size="sm" className="font-bold text-text-primary">Total Capacity</Text>
                <Text size="xs" tone="secondary" className="font-medium">Professional Plan Limit</Text>
              </div>
              <Heading level={3} size="sm" className="text-brand-primary">10 GB</Heading>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
