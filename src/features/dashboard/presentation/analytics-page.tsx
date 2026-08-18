'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Heading, Text, Badge } from '@/shared/ui';
import {
  BarChartIcon,
  ScanIcon,
  VaultIcon,
  TrendingUpIcon,
  CalendarIcon,
  DownloadIcon,
} from '@/shared/ui/icons/dashboard-icons';
import { ShieldIcon } from '@/shared/ui/icons';
import { AnalyticsSkeleton } from '@/shared/ui/patterns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
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
  recentActivity: {
    file: string;
    time: string;
    status: string;
    risk: 'safe' | 'caution' | 'critical';
  }[];
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
    endDate: new Date().toISOString(),
  }));

  const analytics = data || defaultAnalytics;

  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(analytics.startDate),
      endDate: new Date(analytics.endDate),
      key: 'selection',
    },
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
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative z-10">
          <Heading level={1} size="lg" className="tracking-tight text-text-primary">
            Workspace Analytics
          </Heading>
          <Text tone="secondary" className="mt-1 text-sm font-medium">
            Monitor document processing metrics and workspace usage trends.
          </Text>
        </div>
        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <div className="bg-safe/10 text-safe mr-2 hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold sm:inline-flex">
            <TrendingUpIcon className="size-4" /> Systems Nominal
          </div>

          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex h-9 items-center gap-2 rounded-xl border border-border-subtle bg-surface-1 px-3 text-sm font-semibold text-text-secondary shadow-sm transition-all hover:border-brand-primary/30 hover:text-brand-primary"
            >
              <CalendarIcon className="size-4" />
              <span>
                {dateRange[0] ? format(dateRange[0].startDate, 'MMM d, yyyy') : 'Start Date'} -{' '}
                {dateRange[0] ? format(dateRange[0].endDate, 'MMM d, yyyy') : 'End Date'}
              </span>
            </button>

            {showDatePicker && (
              <div className="absolute top-12 right-0 z-50 overflow-hidden rounded-xl border border-border-subtle bg-surface-1 p-2 shadow-xl">
                <DateRangePicker
                  ranges={dateRange}
                  onChange={handleSelect}
                  rangeColors={['#8b5cf6']}
                  moveRangeOnFirstSelection={false}
                  direction="horizontal"
                />
                <div className="flex justify-end gap-2 border-t border-border-subtle p-2 pt-4">
                  <button
                    onClick={() => setShowDatePicker(false)}
                    className="px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:text-text-primary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={applyDateRange}
                    className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-brand-primary-hover"
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
            className="flex h-9 items-center gap-2 rounded-xl border border-border-strong/50 bg-surface-2 px-3 text-sm font-semibold text-text-primary shadow-sm transition-all hover:border-brand-primary hover:bg-brand-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <DownloadIcon className="size-4" />
            <span className="hidden sm:inline">
              {isExporting ? 'Generating...' : 'Export Report'}
            </span>
          </button>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border-subtle bg-surface-1 p-5 shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent opacity-50" />
          <div className="relative flex items-center justify-between">
            <div className="flex size-12 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
              <ScanIcon className="size-6" />
            </div>
            <Badge tone="safe" className="font-bold">
              {analytics.totalScansGrowth}
            </Badge>
          </div>
          <div className="relative">
            <Heading level={2} size="md" className="text-3xl font-extrabold">
              {analytics.totalScans.toLocaleString()}
            </Heading>
            <Text size="sm" tone="secondary" className="mt-1 font-medium">
              Total Scans Performed
            </Text>
          </div>
        </div>

        <div className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border-subtle bg-surface-1 p-5 shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-secondary/5 to-transparent opacity-50" />
          <div className="relative flex items-center justify-between">
            <div className="flex size-12 items-center justify-center rounded-xl bg-brand-secondary/10 text-brand-secondary">
              <VaultIcon className="size-6" />
            </div>
            <Badge tone="neutral" className="font-bold">
              Active
            </Badge>
          </div>
          <div className="relative">
            <Heading level={2} size="md" className="text-3xl font-extrabold">
              {analytics.vaultDocs.toLocaleString()}
            </Heading>
            <Text size="sm" tone="secondary" className="mt-1 font-medium">
              Documents in Vault
            </Text>
          </div>
        </div>

        <div className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border-subtle bg-surface-1 p-5 shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-50" />
          <div className="relative flex items-center justify-between">
            <div className="flex size-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
              <ShieldIcon className="size-6" />
            </div>
            <Badge tone="critical" className="font-bold">
              Attention
            </Badge>
          </div>
          <div className="relative">
            <Heading level={2} size="md" className="text-3xl font-extrabold">
              {analytics.highRisk}
            </Heading>
            <Text size="sm" tone="secondary" className="mt-1 font-medium">
              High Risk Contracts
            </Text>
          </div>
        </div>

        <div className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border-subtle bg-surface-1 p-5 shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-50" />
          <div className="relative flex items-center justify-between">
            <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <BarChartIcon className="size-6" />
            </div>
          </div>
          <div className="relative">
            <Heading level={2} size="md" className="text-3xl font-extrabold">
              {analytics.avgProcessingTime}
            </Heading>
            <Text size="sm" tone="secondary" className="mt-1 font-medium">
              Avg. Processing Time
            </Text>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex min-h-[400px] flex-col rounded-[1.25rem] border border-border-subtle bg-surface-1 p-6 shadow-sm lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <Heading
              level={2}
              size="sm"
              className="font-bold tracking-wider text-text-tertiary uppercase"
            >
              Processing Volume
            </Heading>
          </div>
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border-strong bg-surface-2/30 p-4">
            {analytics.processingVolume.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={analytics.processingVolume}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(150, 150, 150, 0.2)"
                  />
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
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid rgba(150, 150, 150, 0.2)',
                      backgroundColor: 'var(--color-surface-1)',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                      color: 'var(--color-text-primary)',
                      fontWeight: 'bold',
                    }}
                    itemStyle={{ color: '#8b5cf6', fontWeight: 'bold' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Scans"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorCount)"
                    activeDot={{ r: 6, fill: '#8b5cf6', stroke: 'white', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Text tone="tertiary" className="font-medium">
                No activity recorded for this period
              </Text>
            )}
          </div>
        </div>

        <div className="flex flex-col rounded-[1.25rem] border border-border-subtle bg-surface-1 p-6 shadow-sm lg:col-span-1">
          <div className="mb-6">
            <Heading
              level={2}
              size="sm"
              className="font-bold tracking-wider text-text-tertiary uppercase"
            >
              Risk Distribution
            </Heading>
          </div>
          <div className="flex flex-1 flex-col justify-center gap-6">
            <div>
              <div className="mb-2 flex justify-between text-sm font-bold text-text-secondary">
                <span>Verified Safe</span>
                <span className="text-emerald-500">
                  {analytics.riskDistribution.safePercentage}%
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-surface-2 shadow-inner">
                <div
                  className="h-full rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000"
                  style={{ width: `${analytics.riskDistribution.safePercentage}%` }}
                />
              </div>
            </div>
            <div>
              <div className="mb-2 flex justify-between text-sm font-bold text-text-secondary">
                <span>Needs Review</span>
                <span className="text-amber-500">
                  {analytics.riskDistribution.cautionPercentage}%
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-surface-2 shadow-inner">
                <div
                  className="h-full rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all duration-1000"
                  style={{ width: `${analytics.riskDistribution.cautionPercentage}%` }}
                />
              </div>
            </div>
            <div>
              <div className="mb-2 flex justify-between text-sm font-bold text-text-secondary">
                <span>High Risk</span>
                <span className="text-rose-500">
                  {analytics.riskDistribution.criticalPercentage}%
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-surface-2 shadow-inner">
                <div
                  className="h-full rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)] transition-all duration-1000"
                  style={{ width: `${analytics.riskDistribution.criticalPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1">
        {/* Recent Activity */}
        <div className="flex flex-col rounded-[1.25rem] border border-border-subtle bg-surface-1 p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <Heading
              level={2}
              size="sm"
              className="font-bold tracking-wider text-text-tertiary uppercase"
            >
              Recent Scan Activity
            </Heading>
            <button className="text-xs font-bold text-brand-primary hover:underline">
              View All
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {analytics.recentActivity.length > 0 ? (
              <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-border-subtle bg-surface-2/10 text-xs tracking-wider text-text-tertiary uppercase">
                      <th className="px-4 py-3 font-bold">Document</th>
                      <th className="px-4 py-3 font-bold">Date</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {analytics.recentActivity.slice(0, 5).map((activity, i) => (
                      <tr
                        key={i}
                        className="group cursor-pointer transition-colors hover:bg-surface-2"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
                                activity.risk === 'safe'
                                  ? 'bg-emerald-500/10 text-emerald-500'
                                  : activity.risk === 'caution'
                                    ? 'bg-amber-500/10 text-amber-500'
                                    : 'bg-rose-500/10 text-rose-500'
                              }`}
                            >
                              <ScanIcon className="size-5" />
                            </div>
                            <Text
                              size="sm"
                              className="max-w-[200px] truncate font-bold text-text-primary transition-colors group-hover:text-brand-primary sm:max-w-xs md:max-w-md lg:max-w-xl"
                            >
                              {activity.file}
                            </Text>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Text
                            size="sm"
                            tone="secondary"
                            className="font-medium whitespace-nowrap"
                          >
                            {activity.time}
                          </Text>
                        </td>
                        <td className="px-4 py-4">
                          <Badge
                            tone={activity.risk as 'safe' | 'caution' | 'critical'}
                            className="font-bold"
                          >
                            {activity.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border-strong bg-surface-2/30 p-8 text-center text-text-tertiary">
                No recent activity found for this period.
              </div>
            )}
          </div>
        </div>
      </div>

      <EnterpriseReportTemplate
        ref={reportRef}
        data={analytics}
        dateRange={{
          startDate: dateRange[0]?.startDate || new Date(),
          endDate: dateRange[0]?.endDate || new Date(),
        }}
      />
    </div>
  );
}
