'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Heading, Text, Badge } from '@/shared/ui';
import { BarChartIcon, ScanIcon, VaultIcon, TrendingUpIcon, CalendarIcon, DownloadIcon } from '@/shared/ui/icons/dashboard-icons';
import { ShieldIcon } from '@/shared/ui/icons';
import { AnalyticsSkeleton } from '@/shared/ui/patterns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { DateRangePicker } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { EnterpriseReportTemplate } from './enterprise-report-template';

export interface AnalyticsData {
  totalScans: number;
  totalScansGrowth: string;
  vaultDocs: number;
  highRisk: number;
  avgProcessingTime: string;
  recentActivity: { file: string; time: string; status: string; risk: 'safe' | 'caution' | 'critical' }[];
  processingVolume: { date: string; count: number }[];
  riskDistribution: {
    safePercentage: number;
    cautionPercentage: number;
    criticalPercentage: number;
  };
  startDate: string;
  endDate: string;
}

export function AnalyticsPage({ data }: { data?: AnalyticsData }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [defaultAnalytics] = useState(() => ({
    totalScans: 0,
    totalScansGrowth: '0% this period',
    vaultDocs: 0,
    highRisk: 0,
    avgProcessingTime: '0.0s',
    recentActivity: [],
    processingVolume: [],
    riskDistribution: { safePercentage: 100, cautionPercentage: 0, criticalPercentage: 0 },
    startDate: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString()
  }));

  const analytics = data || defaultAnalytics;

  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(analytics.startDate),
      endDate: new Date(analytics.endDate),
      key: 'selection'
    }
  ]);

  const handleSelect = (ranges: any) => {
    setDateRange([ranges.selection]);
  };

  const applyDateRange = () => {
    setShowDatePicker(false);
    if (!dateRange[0]) return;
    const start = dateRange[0].startDate.toISOString();
    const end = dateRange[0].endDate.toISOString();
    const params = new URLSearchParams(searchParams.toString());
    params.set('start', start);
    params.set('end', end);
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  const exportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = pdfHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`ClearCut-Enterprise-Report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (isPending) {
    return <AnalyticsSkeleton />;
  }

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
          
          <div className="relative">
            <button 
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex h-9 items-center gap-2 rounded-xl border border-border-subtle bg-surface-1 px-3 text-sm font-semibold text-text-secondary shadow-sm hover:border-brand-primary/30 hover:text-brand-primary transition-all"
            >
              <CalendarIcon className="size-4" />
              <span>{format(dateRange[0]!.startDate, 'MMM d, yyyy')} - {format(dateRange[0]!.endDate, 'MMM d, yyyy')}</span>
            </button>
            
            {showDatePicker && (
              <div className="absolute top-12 right-0 z-50 bg-surface-1 border border-border-subtle rounded-xl shadow-xl overflow-hidden p-2">
                <DateRangePicker
                  ranges={dateRange}
                  onChange={handleSelect}
                  rangeColors={['#8b5cf6']}
                  moveRangeOnFirstSelection={false}
                  direction="horizontal"
                />
                <div className="flex justify-end gap-2 p-2 pt-4 border-t border-border-subtle">
                  <button 
                    onClick={() => setShowDatePicker(false)}
                    className="px-4 py-2 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={applyDateRange}
                    className="px-4 py-2 text-sm font-bold bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover shadow-md transition-all hover:-translate-y-0.5"
                  >
                    Apply Filter
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <button 
            onClick={exportPDF}
            disabled={isExporting}
            className="flex h-9 items-center gap-2 rounded-xl border border-border-strong/50 bg-surface-2 px-3 text-sm font-semibold text-text-primary shadow-sm hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <DownloadIcon className="size-4" />
            <span className="hidden sm:inline">{isExporting ? 'Generating...' : 'Export Report'}</span>
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
            <Badge tone="safe" className="font-bold">{analytics.totalScansGrowth}</Badge>
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
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-50" />
          <div className="relative flex items-center justify-between">
            <div className="flex size-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
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
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-50" />
          <div className="relative flex items-center justify-between">
            <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <BarChartIcon className="size-6" />
            </div>
          </div>
          <div className="relative">
            <Heading level={2} size="md" className="font-extrabold text-3xl">{analytics.avgProcessingTime}</Heading>
            <Text size="sm" tone="secondary" className="font-medium mt-1">Avg. Processing Time</Text>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        <div className="lg:col-span-2 rounded-[1.25rem] border border-border-subtle bg-surface-1 p-6 shadow-sm flex flex-col min-h-[400px]">
          <div className="mb-6 flex justify-between items-center">
            <Heading level={2} size="sm" className="font-bold uppercase tracking-wider text-text-tertiary">Processing Volume</Heading>
          </div>
          <div className="flex-1 flex items-center justify-center rounded-xl border border-dashed border-border-strong bg-surface-2/30 p-4">
            {analytics.processingVolume.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.processingVolume} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150, 150, 150, 0.2)" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#888888', fontSize: 12, fontWeight: 500 }}
                    minTickGap={30}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#888888', fontSize: 12, fontWeight: 500 }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid rgba(150, 150, 150, 0.2)', backgroundColor: 'var(--color-surface-1)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', color: 'var(--color-text-primary)', fontWeight: 'bold' }}
                    itemStyle={{ color: '#8b5cf6', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="count" name="Scans" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" activeDot={{ r: 6, fill: '#8b5cf6', stroke: 'white', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Text tone="tertiary" className="font-medium">No activity recorded for this period</Text>
            )}
          </div>
        </div>
        
        <div className="lg:col-span-1 rounded-[1.25rem] border border-border-subtle bg-surface-1 p-6 shadow-sm flex flex-col">
          <div className="mb-6">
            <Heading level={2} size="sm" className="font-bold uppercase tracking-wider text-text-tertiary">Risk Distribution</Heading>
          </div>
          <div className="flex-1 flex flex-col gap-6 justify-center">
            <div>
              <div className="flex justify-between text-sm font-bold text-text-secondary mb-2">
                <span>Verified Safe</span>
                <span className="text-emerald-500">{analytics.riskDistribution.safePercentage}%</span>
              </div>
              <div className="h-3 w-full bg-surface-2 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000" style={{ width: `${analytics.riskDistribution.safePercentage}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm font-bold text-text-secondary mb-2">
                <span>Needs Review</span>
                <span className="text-amber-500">{analytics.riskDistribution.cautionPercentage}%</span>
              </div>
              <div className="h-3 w-full bg-surface-2 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all duration-1000" style={{ width: `${analytics.riskDistribution.cautionPercentage}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm font-bold text-text-secondary mb-2">
                <span>High Risk</span>
                <span className="text-rose-500">{analytics.riskDistribution.criticalPercentage}%</span>
              </div>
              <div className="h-3 w-full bg-surface-2 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-rose-500 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.5)] transition-all duration-1000" style={{ width: `${analytics.riskDistribution.criticalPercentage}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 mt-4">
        {/* Recent Activity */}
        <div className="rounded-[1.25rem] border border-border-subtle bg-surface-1 p-6 shadow-sm flex flex-col">
          <div className="mb-6 flex justify-between items-center">
            <Heading level={2} size="sm" className="font-bold uppercase tracking-wider text-text-tertiary">Recent Scan Activity</Heading>
            <button className="text-xs font-bold text-brand-primary hover:underline">View All</button>
          </div>
          <div className="flex flex-col gap-4">
            {analytics.recentActivity.length > 0 ? (
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border-subtle bg-surface-2/10 text-xs uppercase tracking-wider text-text-tertiary">
                      <th className="px-4 py-3 font-bold">Document</th>
                      <th className="px-4 py-3 font-bold">Date</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {analytics.recentActivity.slice(0, 5).map((activity, i) => (
                      <tr key={i} className="hover:bg-surface-2 transition-colors cursor-pointer group">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
                              activity.risk === 'safe' ? 'bg-emerald-500/10 text-emerald-500' : 
                              activity.risk === 'caution' ? 'bg-amber-500/10 text-amber-500' : 
                              'bg-rose-500/10 text-rose-500'
                            }`}>
                              <ScanIcon className="size-5" />
                            </div>
                            <Text size="sm" className="font-bold text-text-primary group-hover:text-brand-primary transition-colors max-w-[200px] sm:max-w-xs md:max-w-md lg:max-w-xl truncate">{activity.file}</Text>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Text size="sm" tone="secondary" className="font-medium whitespace-nowrap">{activity.time}</Text>
                        </td>
                        <td className="px-4 py-4">
                          <Badge tone={activity.risk as 'safe' | 'caution' | 'critical'} className="font-bold">
                            {activity.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-text-tertiary rounded-xl border border-dashed border-border-strong bg-surface-2/30">
                No recent activity found for this period.
              </div>
            )}
          </div>
        </div>
      </div>
      
      <EnterpriseReportTemplate 
        ref={reportRef} 
        data={analytics} 
        dateRange={{ startDate: dateRange[0]!.startDate, endDate: dateRange[0]!.endDate }} 
      />
    </div>
  );
}
