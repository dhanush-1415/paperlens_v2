import { Button, Card, Heading, Text, Badge, StatTile, Progress } from '@/shared/ui';
import { ArrowRightIcon, DocumentIcon, AlertCircleIcon, CheckCircleIcon } from '@/shared/ui/icons';
import {
  ScanIcon,
  UploadCloudIcon,
  LayoutDashboardIcon,
  VaultIcon,
  SettingsIcon,
  MoreVerticalIcon,
  TrendingUpIcon,
} from '@/shared/ui/icons/dashboard-icons';
import Link from 'next/link';
import { ROUTES } from '@/shared/constants/routes';
import { CurrentTimeWidget } from './current-time-widget';
import { ActivityChart } from './activity-chart';

interface DashboardOverviewProps {
  user: {
    name?: string;
    email: string;
    plan: string;
  };
  usage: {
    scansUsed: number;
    scansLimit: number;
  };
  dashboardData: {
    totalScans: number;
    activeDocuments: number;
    criticalRisks: number;
    recentDocuments: { id: string; name: string; risk: string; analyzedAt: string }[];
    scanActivityData: { label: string; value: number }[];
  };
}

export function DashboardOverview({ user, usage, dashboardData }: DashboardOverviewProps) {
  const usagePercentage = Math.min(100, Math.round((usage.scansUsed / usage.scansLimit) * 100));
  const isLimitReached = usage.scansUsed >= usage.scansLimit;
  const isNearLimit = !isLimitReached && usagePercentage >= 80;

  const scanActivityData = dashboardData.scanActivityData;

  return (
    <div className="flex flex-col gap-6 pb-12 lg:gap-8">
      {/* ── Welcome Banner ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-r from-brand-primary via-[#A855F7] to-brand-secondary px-6 py-6 shadow-lg shadow-brand-primary/10 sm:px-8 sm:py-8">
        <div
          className="pointer-events-none absolute inset-0 bg-white/10"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
            opacity: 0.2,
          }}
        />
        <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-white/20 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="mb-1 inline-flex w-max items-center gap-2 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold tracking-widest text-white uppercase shadow-sm backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
                <span className="relative m-[1px] inline-flex h-1.5 w-1.5 rounded-full bg-white"></span>
              </span>
              Engine Active • Secure Ledger
            </div>
            <Heading
              level={1}
              className="text-3xl font-extrabold tracking-tight text-white drop-shadow-sm sm:text-4xl"
            >
              Good{' '}
              <span suppressHydrationWarning>
                {new Date().getHours() < 12
                  ? 'Morning'
                  : new Date().getHours() < 18
                    ? 'Afternoon'
                    : 'Evening'}
              </span>
              , {user.name || user.email.split('@')[0]} 👋
            </Heading>
            <Text className="max-w-xl text-sm font-medium tracking-wide text-white/90 sm:text-base">
              {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)} Tier • Personal Workspace
            </Text>
          </div>

          <div className="hidden shrink-0 md:flex">
            <Link
              href={ROUTES.scan}
              className="group relative flex cursor-pointer items-center gap-4 overflow-hidden rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-white shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-white/40 hover:bg-white/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
            >
              <div className="absolute inset-0 -translate-x-[150%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-in-out group-hover:translate-x-[150%]" />

              <div className="relative flex size-10 items-center justify-center rounded-xl border border-white/30 bg-white/20 shadow-inner transition-colors group-hover:bg-white/30">
                <UploadCloudIcon className="size-5 text-white transition-transform group-hover:-translate-y-0.5" />
              </div>

              <div className="flex flex-col">
                <Text className="text-[10px] font-bold tracking-widest text-white/70 uppercase transition-colors group-hover:text-white/90">
                  Fast-Track Analysis
                </Text>
                <Heading level={3} className="text-sm font-extrabold tracking-tight text-white">
                  Upload Contract
                </Heading>
              </div>

              <div className="ml-2 flex size-6 items-center justify-center rounded-full bg-white/10 text-white transition-colors group-hover:bg-white group-hover:text-brand-primary">
                <ArrowRightIcon className="size-3 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        {/* ── Left Column (Main Content) ────────────────────────────────────────── */}
        <div className="flex flex-col gap-6 lg:col-span-2 lg:gap-8">
          {dashboardData.totalScans === 0 ? (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-3xl border border-border-subtle bg-surface-1 p-12 text-center shadow-sm">
              <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary ring-8 ring-brand-primary/5">
                <UploadCloudIcon className="size-10" />
              </div>
              <Heading level={2} className="mb-2 text-2xl font-extrabold tracking-tight">
                Welcome to your Workspace
              </Heading>
              <Text tone="secondary" className="mx-auto mb-8 max-w-md">
                You haven't uploaded any documents yet. Drop your first contract, notice, or lease
                to let our AI engine instantly identify risks and extract key deadlines.
              </Text>
              <Button
                asChild
                size="lg"
                className="h-12 rounded-xl bg-brand-primary px-8 font-bold text-white shadow-lg shadow-brand-primary/20 transition-transform hover:scale-105 hover:bg-brand-primary-hover"
              >
                <Link href={ROUTES.scan}>Analyze Your First Document</Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="group relative overflow-hidden rounded-3xl border border-border-subtle bg-surface-1 p-6 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.15)]">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                      <ScanIcon className="size-5" />
                    </div>
                    <Badge
                      tone="safe"
                      className="bg-positive-bg text-positive-fg border-none font-bold shadow-sm"
                    >
                      <TrendingUpIcon className="mr-1 size-3" /> 12%
                    </Badge>
                  </div>
                  <Text
                    size="sm"
                    tone="secondary"
                    className="mb-1 font-semibold tracking-wider uppercase"
                  >
                    Total Scans
                  </Text>
                  <Heading level={2} className="text-4xl font-extrabold">
                    {usage.scansUsed}
                  </Heading>
                  <div className="absolute right-0 bottom-0 left-0 h-1.5 origin-left scale-x-0 bg-brand-primary transition-transform duration-300 group-hover:scale-x-100" />
                </div>

                <div className="group relative overflow-hidden rounded-3xl border border-border-subtle bg-surface-1 p-6 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.15)]">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="bg-critical-bg text-critical flex size-10 items-center justify-center rounded-xl">
                      <AlertCircleIcon className="size-5" />
                    </div>
                    <Badge tone="critical" className="border-none font-bold shadow-sm">
                      <TrendingUpIcon className="mr-1 size-3" /> {dashboardData.criticalRisks}
                    </Badge>
                  </div>
                  <Text
                    size="sm"
                    tone="secondary"
                    className="mb-1 font-semibold tracking-wider uppercase"
                  >
                    Critical Risks
                  </Text>
                  <Heading level={2} className="text-4xl font-extrabold">
                    {dashboardData.criticalRisks}
                  </Heading>
                  <div className="bg-critical absolute right-0 bottom-0 left-0 h-1.5 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
                </div>

                <div className="group relative overflow-hidden rounded-3xl border border-border-subtle bg-surface-1 p-6 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.15)]">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="bg-caution-bg text-caution flex size-10 items-center justify-center rounded-xl">
                      <DocumentIcon className="size-5" />
                    </div>
                    <Badge tone="caution" className="border-none font-bold shadow-sm">
                      Active
                    </Badge>
                  </div>
                  <Text
                    size="sm"
                    tone="secondary"
                    className="mb-1 font-semibold tracking-wider uppercase"
                  >
                    Pending Reviews
                  </Text>
                  <Heading level={2} className="text-4xl font-extrabold">
                    {dashboardData.activeDocuments}
                  </Heading>
                  <div className="bg-caution absolute right-0 bottom-0 left-0 h-1.5 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
                </div>
              </div>

              {/* Activity Graph Section */}
              <Card className="flex flex-col rounded-[2rem] border-border-subtle p-6 shadow-[0_4px_30px_-10px_rgba(0,0,0,0.1)] lg:p-8">
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <Heading level={2} size="md" className="font-extrabold tracking-tight">
                      Activity Overview
                    </Heading>
                    <Text size="sm" tone="secondary" className="mt-1 font-medium">
                      Document scans over the last 7 days
                    </Text>
                  </div>
                  <Badge
                    tone="neutral"
                    className="border-border-subtle bg-surface-2 px-3 py-1.5 font-bold shadow-sm"
                  >
                    This Week
                  </Badge>
                </div>

                <div className="mt-2 h-64 w-full">
                  <ActivityChart data={scanActivityData} color="primary" />
                </div>
              </Card>

              {/* Recent Documents Table */}
              <Card className="flex flex-col overflow-hidden rounded-[2rem] border-border-subtle shadow-[0_4px_30px_-10px_rgba(0,0,0,0.1)]">
                <div className="flex items-center justify-between border-b border-border-subtle bg-surface-2/30 px-6 py-6">
                  <div>
                    <Heading level={2} size="md" className="font-extrabold tracking-tight">
                      Recent Documents
                    </Heading>
                    <Text size="sm" tone="secondary" className="mt-1 font-medium">
                      Latest contracts processed by the engine
                    </Text>
                  </div>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="hover:bg-surface-3 hidden items-center gap-2 sm:flex"
                  >
                    <Link href={ROUTES.vault}>
                      View All <ArrowRightIcon className="size-4" />
                    </Link>
                  </Button>
                </div>

                <div className="w-full overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-border-subtle bg-surface-2/10 text-xs tracking-wider text-text-tertiary uppercase">
                        <th className="px-6 py-4 font-bold">Document Name</th>
                        <th className="px-6 py-4 font-bold">Status</th>
                        <th className="hidden px-6 py-4 font-bold sm:table-cell">Analyzed</th>
                        <th className="px-6 py-4 text-right font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {dashboardData.recentDocuments.length > 0 ? (
                        dashboardData.recentDocuments.map((doc) => (
                          <tr
                            key={doc.id}
                            className="group transition-colors hover:bg-surface-2/30"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-text-tertiary transition-colors group-hover:bg-brand-primary/10 group-hover:text-brand-primary">
                                  <DocumentIcon className="size-5" />
                                </div>
                                <div>
                                  <Link
                                    href={ROUTES.document(doc.id)}
                                    className="block cursor-pointer text-[14px] font-bold text-text-primary transition-colors group-hover:text-brand-primary"
                                  >
                                    {doc.name}
                                  </Link>
                                  <Text
                                    size="xs"
                                    tone="tertiary"
                                    className="mt-0.5 font-medium sm:hidden"
                                    suppressHydrationWarning
                                  >
                                    Analyzed {new Date(doc.analyzedAt).toLocaleDateString()}
                                  </Text>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge tone={doc.risk as any} className="font-bold shadow-sm">
                                {doc.risk === 'critical'
                                  ? 'High Risk'
                                  : doc.risk === 'caution'
                                    ? 'Needs Review'
                                    : 'Verified Safe'}
                              </Badge>
                            </td>
                            <td className="hidden px-6 py-4 sm:table-cell">
                              <Text size="sm" tone="secondary" className="font-medium" suppressHydrationWarning>
                                {new Date(doc.analyzedAt).toLocaleDateString()}
                              </Text>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Link
                                href={ROUTES.document(doc.id)}
                                className="hover:bg-surface-3 inline-flex rounded-xl p-2 text-text-tertiary transition-colors hover:text-text-primary"
                                aria-label="More options"
                              >
                                <ArrowRightIcon className="size-4" />
                              </Link>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-text-tertiary">
                            No recent documents found. Upload one to get started!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-border-subtle bg-surface-2/20 px-6 py-4 sm:hidden">
                  <Button asChild variant="ghost" className="w-full justify-center">
                    <Link href={ROUTES.vault}>View All Documents</Link>
                  </Button>
                </div>
              </Card>
            </>
          )}
        </div>

        {/* ── Right Column (Sidebar Widgets) ────────────────────────────────────── */}
        <div className="flex flex-col gap-6 lg:gap-8">
          {/* Usage Meter - Premium Dark Card */}
          <Card
            className={`force-dark group relative overflow-hidden rounded-[2rem] border-border-strong bg-canvas p-1 text-text-primary shadow-2xl ${isLimitReached ? 'ring-2 ring-brand-primary/50' : isNearLimit ? 'ring-caution ring-1' : ''}`}
          >
            <div
              className={`absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] ${isLimitReached ? 'from-brand-primary/40' : isNearLimit ? 'from-caution/20' : 'from-brand-primary/20'} pointer-events-none via-transparent to-transparent opacity-50 transition-colors duration-500`}
            />

            <div className="relative z-10 flex h-full flex-col rounded-[1.8rem] border border-border-strong bg-surface-1/90 p-6 backdrop-blur-xl sm:p-8">
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-10 items-center justify-center rounded-xl ${isLimitReached ? 'bg-brand-primary/30 text-brand-primary shadow-[0_0_20px_rgba(var(--color-brand-primary),0.5)] ring-1 ring-brand-primary/50' : isNearLimit ? 'bg-caution/20 text-caution ring-caution/50 ring-1' : 'bg-brand-primary/20 text-brand-primary shadow-[0_0_15px_rgba(var(--color-brand-primary),0.3)] ring-1 ring-brand-primary/30'}`}
                  >
                    <ScanIcon className="size-5" />
                  </div>
                  <Heading
                    level={3}
                    size="sm"
                    className="font-bold tracking-tight text-text-primary"
                  >
                    Scanner
                  </Heading>
                </div>
                <Badge
                  tone={isLimitReached ? 'critical' : isNearLimit ? 'caution' : 'safe'}
                  className="font-bold tracking-wider shadow-inner"
                >
                  {isLimitReached ? 'LIMIT REACHED' : isNearLimit ? 'RUNNING LOW' : 'ACTIVE'}
                </Badge>
              </div>

              <div className="relative mb-2 flex flex-1 flex-col items-center justify-center py-4">
                {/* Radar/Pulse effect */}
                <div className="relative mb-6 flex size-24 items-center justify-center">
                  <div
                    className={`absolute inset-0 rounded-full border ${isLimitReached ? 'border-brand-primary/40' : isNearLimit ? 'border-caution/30' : 'border-brand-primary/20'}`}
                  />
                  <div
                    className={`absolute inset-2 rounded-full border ${isLimitReached ? 'border-brand-primary/50' : isNearLimit ? 'border-caution/40' : 'border-brand-primary/30'}`}
                  />
                  <div
                    className={`absolute inset-4 rounded-full border ${isLimitReached ? 'border-brand-primary/60 border-t-brand-primary' : isNearLimit ? 'border-caution/50 border-t-caution animate-[spin_4s_linear_infinite]' : 'animate-[spin_4s_linear_infinite] border-brand-primary/40 border-t-brand-primary'}`}
                  />

                  <div
                    className={`relative flex size-12 items-center justify-center rounded-full border backdrop-blur-md transition-transform duration-500 group-hover:scale-110 ${isLimitReached ? 'border-brand-primary/70 bg-brand-primary/30 shadow-[0_0_40px_rgba(var(--color-brand-primary),0.6)]' : isNearLimit ? 'bg-caution/20 border-caution/50 shadow-[0_0_30px_rgba(var(--color-caution),0.4)]' : 'border-brand-primary/50 bg-brand-primary/20 shadow-[0_0_30px_rgba(var(--color-brand-primary),0.4)]'}`}
                  >
                    <ScanIcon
                      className={`size-6 ${isNearLimit && !isLimitReached ? 'text-caution' : 'text-brand-primary'}`}
                    />
                  </div>
                </div>

                {isLimitReached ? (
                  <div className="animate-in fade-in slide-in-from-bottom-2 w-full text-center duration-500">
                    <Text className="mb-1 text-xs font-black tracking-widest text-brand-primary uppercase">
                      Engine Locked
                    </Text>
                    <Text className="px-2 text-sm leading-relaxed font-medium text-text-secondary">
                      Don't lose your momentum. Upgrade to{' '}
                      <strong className="text-text-primary">Professional</strong> to instantly
                      unlock unmetered AI intelligence.
                    </Text>
                  </div>
                ) : isNearLimit ? (
                  <div className="animate-in fade-in w-full text-center duration-500">
                    <Text className="text-caution mb-1 text-xs font-black tracking-widest uppercase">
                      Capacity Low
                    </Text>
                    <Text className="px-2 text-sm leading-relaxed font-medium text-text-secondary">
                      Only {usage.scansLimit - usage.scansUsed} scans remaining.{' '}
                      <Link
                        href={ROUTES.billing}
                        className="font-bold text-text-primary underline hover:text-brand-primary"
                      >
                        Upgrade now
                      </Link>{' '}
                      to prevent disruption.
                    </Text>
                  </div>
                ) : (
                  <Text className="w-full text-center text-xs font-bold tracking-widest text-text-secondary uppercase">
                    Secure Engine Online
                  </Text>
                )}
              </div>

              <div className="mt-auto">
                <div className="mb-3 flex items-end justify-between">
                  <div className="flex flex-col">
                    <Text className="mb-1 text-xs font-bold tracking-widest text-text-secondary uppercase">
                      Volume Used
                    </Text>
                    <div className="flex items-baseline gap-1.5">
                      <Heading
                        level={2}
                        className={`text-4xl font-extrabold tracking-tight ${isLimitReached ? 'text-brand-primary' : isNearLimit ? 'text-caution' : 'text-text-primary'}`}
                      >
                        {usage.scansUsed}
                      </Heading>
                      <Text className="text-sm font-medium text-text-secondary">
                        / {usage.scansLimit}
                      </Text>
                    </div>
                  </div>
                  <Text
                    className={`${isLimitReached ? 'text-brand-primary' : isNearLimit ? 'text-caution' : 'text-brand-primary'} font-bold`}
                  >
                    {usagePercentage}%
                  </Text>
                </div>

                <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-surface-2 shadow-inner">
                  <div
                    className={`absolute relative top-0 left-0 h-full overflow-hidden rounded-full ${isLimitReached ? 'bg-brand-primary' : isNearLimit ? 'bg-caution' : 'bg-gradient-to-r from-brand-primary to-brand-secondary'}`}
                    style={{ width: `${usagePercentage}%` }}
                  >
                    {!isLimitReached ? (
                      <div className="absolute inset-0 animate-[progress_1s_linear_infinite] bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem]" />
                    ) : (
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0.2)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.2)_50%,rgba(0,0,0,0.2)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem]" />
                    )}
                  </div>
                </div>

                {isLimitReached ? (
                  <Button
                    asChild
                    variant="premium"
                    className="group mt-8 h-12 w-full text-sm font-black shadow-[0_0_20px_-5px_rgba(var(--brand-primary-rgb),0.6)] transition-transform hover:scale-[1.02]"
                  >
                    <Link href={ROUTES.billing}>
                      Upgrade & Resume Scans{' '}
                      <ArrowRightIcon className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                ) : (
                  <div className="mt-8 flex flex-col gap-3">
                    <Button
                      asChild
                      variant="primary"
                      className="h-12 w-full rounded-xl bg-brand-primary text-sm font-bold text-text-on-brand shadow-md transition-all hover:scale-[1.02] hover:bg-brand-primary-hover"
                    >
                      <Link href={ROUTES.scan}>Initiate New Scan</Link>
                    </Button>
                    {isNearLimit && (
                      <Button
                        asChild
                        variant="secondary"
                        className="border-caution/40 text-caution hover:bg-caution/10 h-10 w-full text-xs font-bold"
                      >
                        <Link href={ROUTES.billing}>Increase Capacity</Link>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="flex flex-col overflow-hidden rounded-[2rem] border-border-subtle shadow-[0_4px_30px_-10px_rgba(0,0,0,0.1)]">
            <div className="border-b border-border-subtle bg-surface-2/30 px-5 py-5 sm:px-6 sm:py-6">
              <Heading level={2} size="md" className="font-extrabold tracking-tight">
                Quick Actions
              </Heading>
              <Text size="sm" tone="secondary" className="mt-1 font-medium">
                Common tasks and shortcuts
              </Text>
            </div>
            <div className="flex flex-col gap-2 p-2 sm:p-4">
              <Link
                href={ROUTES.scan}
                className="group flex items-center gap-3 rounded-[1.25rem] border border-transparent bg-surface-1 p-3 transition-all hover:border-border-strong/20 hover:bg-surface-2 hover:shadow-md sm:gap-4 sm:p-4"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary shadow-sm ring-1 ring-brand-primary/20 transition-transform group-hover:scale-110 sm:size-12 sm:rounded-2xl">
                  <UploadCloudIcon className="size-5 sm:size-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <Text className="truncate text-[14px] font-bold text-text-primary transition-colors group-hover:text-brand-primary sm:text-[15px]">
                    Upload Document
                  </Text>
                  <Text size="xs" tone="secondary" className="mt-0.5 truncate">
                    Parse a new contract
                  </Text>
                </div>
                <div className="bg-surface-3 flex hidden size-8 shrink-0 -translate-x-4 items-center justify-center rounded-full opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 sm:flex">
                  <ArrowRightIcon className="size-4 text-text-primary" />
                </div>
              </Link>

              <Link
                href={ROUTES.vault}
                className="group flex items-center gap-3 rounded-[1.25rem] border border-transparent bg-surface-1 p-3 transition-all hover:border-border-strong/20 hover:bg-surface-2 hover:shadow-md sm:gap-4 sm:p-4"
              >
                <div className="bg-surface-3 flex size-10 shrink-0 items-center justify-center rounded-xl text-text-primary shadow-sm ring-1 ring-border-strong/10 transition-transform group-hover:scale-110 sm:size-12 sm:rounded-2xl">
                  <VaultIcon className="size-5 sm:size-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <Text className="truncate text-[14px] font-bold text-text-primary transition-colors group-hover:text-brand-primary sm:text-[15px]">
                    Document Vault
                  </Text>
                  <Text size="xs" tone="secondary" className="mt-0.5 truncate">
                    Access archived files
                  </Text>
                </div>
                <div className="bg-surface-3 flex hidden size-8 shrink-0 -translate-x-4 items-center justify-center rounded-full opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 sm:flex">
                  <ArrowRightIcon className="size-4 text-text-primary" />
                </div>
              </Link>

              <Link
                href={ROUTES.settings}
                className="group flex items-center gap-3 rounded-[1.25rem] border border-transparent bg-surface-1 p-3 transition-all hover:border-border-strong/20 hover:bg-surface-2 hover:shadow-md sm:gap-4 sm:p-4"
              >
                <div className="bg-surface-3 flex size-10 shrink-0 items-center justify-center rounded-xl text-text-primary shadow-sm ring-1 ring-border-strong/10 transition-transform group-hover:scale-110 sm:size-12 sm:rounded-2xl">
                  <SettingsIcon className="size-5 sm:size-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <Text className="truncate text-[14px] font-bold text-text-primary transition-colors group-hover:text-brand-primary sm:text-[15px]">
                    Account Settings
                  </Text>
                  <Text size="xs" tone="secondary" className="mt-0.5 truncate">
                    Manage your preferences
                  </Text>
                </div>
                <div className="bg-surface-3 flex hidden size-8 shrink-0 -translate-x-4 items-center justify-center rounded-full opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 sm:flex">
                  <ArrowRightIcon className="size-4 text-text-primary" />
                </div>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
