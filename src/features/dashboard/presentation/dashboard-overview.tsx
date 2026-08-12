import { Button, Card, Heading, Text, Badge, StatTile, Progress } from '@/shared/ui';
import { ArrowRightIcon, DocumentIcon, AlertCircleIcon, CheckCircleIcon } from '@/shared/ui/icons';
import { ScanIcon, UploadCloudIcon, LayoutDashboardIcon, VaultIcon, SettingsIcon, MoreVerticalIcon, TrendingUpIcon } from '@/shared/ui/icons/dashboard-icons';
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

  const scanActivityData = dashboardData.scanActivityData;

  return (
    <div className="flex flex-col gap-6 lg:gap-8 pb-12">
      {/* ── Welcome Banner ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-r from-brand-primary via-[#A855F7] to-brand-secondary px-6 py-6 sm:px-8 sm:py-8 shadow-lg shadow-brand-primary/10">
        <div className="absolute inset-0 bg-white/10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px', opacity: 0.2 }} />
        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-white/20 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md w-max border border-white/20 shadow-sm mb-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white m-[1px]"></span>
              </span>
              Engine Active • Secure Ledger
            </div>
            <Heading level={1} className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {user.name || user.email.split('@')[0]} 👋
            </Heading>
            <Text className="max-w-xl text-sm sm:text-base text-white/90 font-medium tracking-wide">
              {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)} Tier • Engineering & Legal Workspace
            </Text>
          </div>
          
          <div className="hidden md:flex shrink-0">
            <Link 
              href={ROUTES.scan}
              className="group relative flex items-center gap-4 rounded-2xl bg-white/10 backdrop-blur-xl px-5 py-4 shadow-2xl border border-white/20 text-white overflow-hidden transition-all duration-300 hover:bg-white/20 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:border-white/40 cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out" />
              
              <div className="relative flex size-10 items-center justify-center rounded-xl bg-white/20 border border-white/30 shadow-inner group-hover:bg-white/30 transition-colors">
                <UploadCloudIcon className="size-5 text-white group-hover:-translate-y-0.5 transition-transform" />
              </div>
              
              <div className="flex flex-col">
                <Text className="text-[10px] font-bold uppercase tracking-widest text-white/70 group-hover:text-white/90 transition-colors">
                  Fast-Track Analysis
                </Text>
                <Heading level={3} className="text-sm font-extrabold tracking-tight text-white">
                  Upload Contract
                </Heading>
              </div>
              
              <div className="ml-2 flex size-6 items-center justify-center rounded-full bg-white/10 group-hover:bg-white text-white group-hover:text-brand-primary transition-colors">
                <ArrowRightIcon className="size-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        
        {/* ── Left Column (Main Content) ────────────────────────────────────────── */}
        <div className="flex flex-col gap-6 lg:col-span-2 lg:gap-8">
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="relative overflow-hidden rounded-3xl bg-surface-1 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.1)] border border-border-subtle hover:-translate-y-1 hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.15)] transition-all duration-300 group p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex size-10 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                  <ScanIcon className="size-5" />
                </div>
                <Badge tone="safe" className="bg-positive-bg text-positive-fg border-none font-bold shadow-sm">
                  <TrendingUpIcon className="size-3 mr-1" /> 12%
                </Badge>
              </div>
              <Text size="sm" tone="secondary" className="font-semibold uppercase tracking-wider mb-1">Total Scans</Text>
              <Heading level={2} className="text-4xl font-extrabold">{usage.scansUsed}</Heading>
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-brand-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
            </div>
            
            <div className="relative overflow-hidden rounded-3xl bg-surface-1 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.1)] border border-border-subtle hover:-translate-y-1 hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.15)] transition-all duration-300 group p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex size-10 items-center justify-center rounded-xl bg-critical-bg text-critical">
                  <AlertCircleIcon className="size-5" />
                </div>
                <Badge tone="critical" className="border-none font-bold shadow-sm">
                  <TrendingUpIcon className="size-3 mr-1" /> {dashboardData.criticalRisks}
                </Badge>
              </div>
              <Text size="sm" tone="secondary" className="font-semibold uppercase tracking-wider mb-1">Critical Risks</Text>
              <Heading level={2} className="text-4xl font-extrabold">{dashboardData.criticalRisks}</Heading>
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-critical scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
            </div>

            <div className="relative overflow-hidden rounded-3xl bg-surface-1 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.1)] border border-border-subtle hover:-translate-y-1 hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.15)] transition-all duration-300 group p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex size-10 items-center justify-center rounded-xl bg-caution-bg text-caution">
                  <DocumentIcon className="size-5" />
                </div>
                <Badge tone="caution" className="border-none font-bold shadow-sm">
                  Active
                </Badge>
              </div>
              <Text size="sm" tone="secondary" className="font-semibold uppercase tracking-wider mb-1">Pending Reviews</Text>
              <Heading level={2} className="text-4xl font-extrabold">{dashboardData.activeDocuments}</Heading>
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-caution scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
            </div>
          </div>

          {/* Activity Graph Section */}
          <Card className="flex flex-col shadow-[0_4px_30px_-10px_rgba(0,0,0,0.1)] border-border-subtle rounded-[2rem] p-6 lg:p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <Heading level={2} size="md" className="font-extrabold tracking-tight">Activity Overview</Heading>
                <Text size="sm" tone="secondary" className="mt-1 font-medium">Document scans over the last 7 days</Text>
              </div>
              <Badge tone="neutral" className="px-3 py-1.5 font-bold shadow-sm bg-surface-2 border-border-subtle">
                This Week
              </Badge>
            </div>
            
            <div className="h-64 w-full mt-2">
              <ActivityChart data={scanActivityData} color="primary" />
            </div>
          </Card>

          {/* Enterprise Data Table: Recent Documents */}
          <Card className="flex flex-col overflow-hidden shadow-[0_4px_30px_-10px_rgba(0,0,0,0.1)] border-border-subtle rounded-[2rem]">
            <div className="flex items-center justify-between border-b border-border-subtle bg-surface-2/30 px-6 py-6">
              <div>
                <Heading level={2} size="md" className="font-extrabold tracking-tight">Recent Documents</Heading>
                <Text size="sm" tone="secondary" className="mt-1 font-medium">Latest contracts processed by the engine</Text>
              </div>
              <Button asChild variant="ghost" size="sm" className="hidden sm:flex items-center gap-2 hover:bg-surface-3">
                <Link href={ROUTES.vault}>
                  View All <ArrowRightIcon className="size-4" />
                </Link>
              </Button>
            </div>
            
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle bg-surface-2/10 text-xs uppercase tracking-wider text-text-tertiary">
                    <th className="px-6 py-4 font-bold">Document Name</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold hidden sm:table-cell">Analyzed</th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {dashboardData.recentDocuments.length > 0 ? dashboardData.recentDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-surface-2/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-text-tertiary group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors">
                            <DocumentIcon className="size-5" />
                          </div>
                          <div>
                            <Link href={ROUTES.document(doc.id)} className="font-bold text-[14px] text-text-primary group-hover:text-brand-primary transition-colors cursor-pointer block">
                              {doc.name}
                            </Link>
                            <Text size="xs" tone="tertiary" className="mt-0.5 font-medium sm:hidden">Analyzed {new Date(doc.analyzedAt).toLocaleDateString()}</Text>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge tone={doc.risk as any} className="shadow-sm font-bold">
                          {doc.risk === 'critical' ? 'High Risk' : doc.risk === 'caution' ? 'Needs Review' : 'Verified Safe'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <Text size="sm" tone="secondary" className="font-medium">
                          {new Date(doc.analyzedAt).toLocaleDateString()}
                        </Text>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={ROUTES.document(doc.id)} className="p-2 inline-flex text-text-tertiary hover:text-text-primary hover:bg-surface-3 rounded-xl transition-colors" aria-label="More options">
                          <ArrowRightIcon className="size-4" />
                        </Link>
                      </td>
                    </tr>
                  )) : (
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
        </div>

        {/* ── Right Column (Sidebar Widgets) ────────────────────────────────────── */}
        <div className="flex flex-col gap-6 lg:gap-8">
          
          {/* Usage Meter - Premium Dark Card */}
          <Card className="p-1 force-dark bg-canvas text-text-primary border-border-strong shadow-2xl rounded-[2rem] overflow-hidden relative group">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-primary/20 via-transparent to-transparent opacity-50 pointer-events-none" />
            
            <div className="bg-surface-1/90 backdrop-blur-xl border border-border-strong rounded-[1.8rem] p-6 sm:p-8 relative z-10 h-full flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-brand-primary/20 text-brand-primary ring-1 ring-brand-primary/30 shadow-[0_0_15px_rgba(var(--color-brand-primary),0.3)]">
                    <ScanIcon className="size-5" />
                  </div>
                  <Heading level={3} size="sm" className="text-text-primary font-bold tracking-tight">Scanner</Heading>
                </div>
                <Badge tone="safe" className="shadow-inner font-bold tracking-wider">
                  ACTIVE
                </Badge>
              </div>

              <div className="py-6 mb-4 relative flex-1 flex flex-col items-center justify-center">
                {/* Radar/Pulse effect */}
                <div className="relative size-24 flex items-center justify-center mb-6">
                  <div className="absolute inset-0 rounded-full border border-brand-primary/20" />
                  <div className="absolute inset-2 rounded-full border border-brand-primary/30" />
                  <div className="absolute inset-4 rounded-full border border-brand-primary/40 animate-[spin_4s_linear_infinite] border-t-brand-primary" />
                  
                  <div className="relative size-12 rounded-full bg-brand-primary/20 backdrop-blur-md border border-brand-primary/50 flex items-center justify-center shadow-[0_0_30px_rgba(var(--color-brand-primary),0.4)] group-hover:scale-110 transition-transform duration-500">
                    <ScanIcon className="size-6 text-brand-primary" />
                  </div>
                </div>
                
                <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase text-center w-full">
                  Secure Engine Online
                </Text>
              </div>

              <div className="mt-auto">
                <div className="flex items-end justify-between mb-3">
                  <div className="flex flex-col">
                    <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase mb-1">Volume Used</Text>
                    <div className="flex items-baseline gap-1.5">
                      <Heading level={2} className="text-4xl font-extrabold tracking-tight text-text-primary">{usage.scansUsed}</Heading>
                      <Text className="text-sm text-text-secondary font-medium">/ {usage.scansLimit}</Text>
                    </div>
                  </div>
                  <Text className="text-brand-primary font-bold">{usagePercentage}%</Text>
                </div>
                
                <div className="h-2.5 w-full bg-surface-2 rounded-full overflow-hidden shadow-inner relative">
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full relative overflow-hidden" 
                    style={{ width: `${usagePercentage}%` }}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[progress_1s_linear_infinite]" />
                  </div>
                </div>
                
                <Button asChild variant="primary" className="mt-8 w-full bg-brand-primary hover:bg-brand-primary-hover text-text-on-brand shadow-md rounded-xl font-bold h-12 text-sm transition-all hover:scale-[1.02]">
                  <Link href={ROUTES.scan}>Initiate New Scan</Link>
                </Button>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="flex flex-col overflow-hidden shadow-[0_4px_30px_-10px_rgba(0,0,0,0.1)] border-border-subtle rounded-[2rem]">
            <div className="border-b border-border-subtle bg-surface-2/30 px-6 py-6">
              <Heading level={2} size="md" className="font-extrabold tracking-tight">Quick Actions</Heading>
              <Text size="sm" tone="secondary" className="mt-1 font-medium">Common tasks and shortcuts</Text>
            </div>
            <div className="p-4 flex flex-col gap-2">
              <Link href={ROUTES.scan} className="flex items-center gap-4 p-4 rounded-[1.25rem] bg-surface-1 border border-transparent hover:border-border-strong/20 hover:bg-surface-2 hover:shadow-md transition-all group">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary group-hover:scale-110 transition-transform shadow-sm ring-1 ring-brand-primary/20">
                  <UploadCloudIcon className="size-6" />
                </div>
                <div className="flex-1">
                  <Text className="text-[15px] font-bold text-text-primary group-hover:text-brand-primary transition-colors">Upload Document</Text>
                  <Text size="xs" tone="secondary" className="mt-0.5">Parse a new contract</Text>
                </div>
                <div className="flex size-8 items-center justify-center rounded-full bg-surface-3 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                  <ArrowRightIcon className="size-4 text-text-primary" />
                </div>
              </Link>
              
              <Link href={ROUTES.vault} className="flex items-center gap-4 p-4 rounded-[1.25rem] bg-surface-1 border border-transparent hover:border-border-strong/20 hover:bg-surface-2 hover:shadow-md transition-all group">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-surface-3 text-text-primary group-hover:scale-110 transition-transform shadow-sm ring-1 ring-border-strong/10">
                  <VaultIcon className="size-6" />
                </div>
                <div className="flex-1">
                  <Text className="text-[15px] font-bold text-text-primary group-hover:text-brand-primary transition-colors">Document Vault</Text>
                  <Text size="xs" tone="secondary" className="mt-0.5">Access archived files</Text>
                </div>
                <div className="flex size-8 items-center justify-center rounded-full bg-surface-3 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                  <ArrowRightIcon className="size-4 text-text-primary" />
                </div>
              </Link>
              
              <Link href={ROUTES.settings} className="flex items-center gap-4 p-4 rounded-[1.25rem] bg-surface-1 border border-transparent hover:border-border-strong/20 hover:bg-surface-2 hover:shadow-md transition-all group">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-surface-3 text-text-primary group-hover:scale-110 transition-transform shadow-sm ring-1 ring-border-strong/10">
                  <SettingsIcon className="size-6" />
                </div>
                <div className="flex-1">
                  <Text className="text-[15px] font-bold text-text-primary group-hover:text-brand-primary transition-colors">Workspace Settings</Text>
                  <Text size="xs" tone="secondary" className="mt-0.5">Manage team preferences</Text>
                </div>
                <div className="flex size-8 items-center justify-center rounded-full bg-surface-3 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
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
