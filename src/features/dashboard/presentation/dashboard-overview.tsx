import { Button, Card, Heading, Text, Badge, StatTile, Progress } from '@/shared/ui';
import { ArrowRightIcon } from '@/shared/ui/icons';
import { ScanIcon, UploadCloudIcon, LayoutDashboardIcon, VaultIcon, SettingsIcon, MoreVerticalIcon } from '@/shared/ui/icons/dashboard-icons';
import Link from 'next/link';
import { ROUTES } from '@/shared/constants/routes';
import { CurrentTimeWidget } from './current-time-widget';

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
}

export function DashboardOverview({ user, usage }: DashboardOverviewProps) {
  const usagePercentage = Math.min(100, Math.round((usage.scansUsed / usage.scansLimit) * 100));

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      {/* ── Welcome Banner ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-primary to-brand-secondary px-8 py-10 sm:px-12 sm:py-12 shadow-xl shadow-brand-primary/20">
        <div className="absolute inset-0 bg-white/5 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/90">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              PAPERLENS ENGINE ACTIVE • SECURE LEDGER
            </div>
            <Heading level={1} className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mt-1 drop-shadow-sm">
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {user.name || user.email.split('@')[0]} 👋
            </Heading>
            <Text className="max-w-xl text-base mt-2 text-white/90 font-medium">
              {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)} Tier • Engineering & Legal Workspace
            </Text>
          </div>
          
          <div className="hidden sm:flex shrink-0">
            <div className="rounded-2xl bg-white/10 backdrop-blur-md px-8 py-4 shadow-sm border border-white/20 text-white">
              <CurrentTimeWidget />
            </div>
          </div>
        </div>
      </section>

      {/* ── Section Title ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mt-2">
        <LayoutDashboardIcon className="size-5 text-brand-primary" />
        <Heading level={2} className="text-sm font-bold uppercase tracking-wider text-text-primary">
          WORKSPACE OVERVIEW
        </Heading>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        {/* ── Left Column (Main Content) ────────────────────────────────────────── */}
        <div className="flex flex-col gap-6 lg:col-span-2 lg:gap-8">
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="relative overflow-hidden rounded-2xl bg-surface-1 shadow-sm border border-border-subtle hover:-translate-y-1 transition-transform group">
              <div className="p-5 pb-8">
                <StatTile
                  label="Documents Analyzed"
                  value={usage.scansUsed.toString()}
                  delta={{ label: '12%', intent: 'positive', direction: 'up' }}
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-primary to-brand-secondary opacity-80 group-hover:opacity-100 transition-opacity" />
            </div>
            
            <div className="relative overflow-hidden rounded-2xl bg-surface-1 shadow-sm border border-border-subtle hover:-translate-y-1 transition-transform group">
              <div className="p-5 pb-8">
                <StatTile
                  label="Critical Risks Flagged"
                  value="3"
                  delta={{ label: '2', intent: 'negative', direction: 'up' }}
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-critical to-critical-bg opacity-80 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-surface-1 shadow-sm border border-border-subtle hover:-translate-y-1 transition-transform group">
              <div className="p-5 pb-8">
                <StatTile
                  label="Pending Reviews"
                  value="5"
                  delta={{ label: '1', intent: 'neutral', direction: 'down' }}
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-caution to-caution-bg opacity-80 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Recent Documents */}
          <Card className="flex flex-col overflow-hidden shadow-sm border-border-subtle rounded-3xl">
            <div className="flex items-center justify-between border-b border-border-subtle bg-surface-2/50 px-6 py-5">
              <Heading level={2} size="sm">Recent Documents</Heading>
              <Link href={ROUTES.vault} className="inline-flex items-center text-sm font-bold text-brand-primary hover:text-brand-secondary transition-colors">
                View Vault <ArrowRightIcon className="ml-1 size-4" />
              </Link>
            </div>
            <div className="divide-y divide-border-subtle">
              {/* Mock List for now */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between px-6 py-5 transition-colors hover:bg-surface-2/50 group">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-text-tertiary group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors">
                      <ScanIcon className="size-5" />
                    </div>
                    <div>
                      <Text className="font-semibold text-[15px]">Vendor_Agreement_v{i}.pdf</Text>
                      <Text size="xs" tone="secondary" className="mt-0.5">Analyzed {i * 2} hours ago • PDF Document</Text>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge tone={i === 1 ? 'critical' : i === 2 ? 'caution' : 'safe'} className="shadow-sm">
                      {i === 1 ? 'High Risk' : i === 2 ? 'Needs Review' : 'Verified Safe'}
                    </Badge>
                    <button className="p-2 text-text-tertiary hover:text-text-primary hover:bg-surface-3 rounded-lg transition-colors" aria-label="More options">
                      <MoreVerticalIcon className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Right Column (Sidebar Widgets) ────────────────────────────────────── */}
        <div className="flex flex-col gap-6 lg:gap-8">
          
          {/* Usage Meter - Premium Gradient Card */}
          <Card className="p-6 bg-brand-ink text-surface-1 border-brand-ink shadow-2xl shadow-brand-ink/20 rounded-3xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/30 via-transparent to-brand-secondary/20 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <ScanIcon className="size-5 text-brand-primary" />
                  <Heading level={3} size="sm" className="text-surface-1 font-bold">Document Shield</Heading>
                </div>
                <Badge tone="safe" className="bg-safe-bg/20 border-safe/30 text-safe-fg shadow-inner">ACTIVE</Badge>
              </div>

              <div className="py-4 border-y border-surface-1/10 mb-6 relative">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-12 rounded-full border border-brand-primary/40 flex items-center justify-center bg-brand-ink/50 backdrop-blur-sm">
                  <div className="size-2.5 bg-brand-primary rounded-full animate-ping" />
                  <div className="size-2.5 bg-brand-primary rounded-full absolute" />
                </div>
                <div className="h-16 flex items-center justify-center">
                  <Text className="text-surface-1/60 text-xs font-bold tracking-widest uppercase text-center w-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)]">
                    Secure AI Parsing Active
                  </Text>
                </div>
              </div>

              <div className="flex items-end justify-between mb-2">
                <Heading level={2} className="text-4xl font-extrabold tracking-tight">{usage.scansUsed}</Heading>
                <Text className="pb-1 text-sm text-surface-1/60 font-mono font-medium">/ {usage.scansLimit} VOL</Text>
              </div>
              <Progress value={usagePercentage} label="Plan usage" className="h-2 bg-surface-1/20" />
              
              <Button asChild variant="primary" className="mt-8 w-full bg-brand-primary hover:bg-brand-primary-hover border-none text-white shadow-lg shadow-brand-primary/30 rounded-xl font-bold">
                <Link href={ROUTES.scan}>Initiate New Scan</Link>
              </Button>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="flex flex-col overflow-hidden shadow-sm border-border-subtle rounded-3xl">
            <div className="border-b border-border-subtle bg-surface-2/50 px-6 py-5">
              <Heading level={2} size="sm">Quick Actions</Heading>
            </div>
            <div className="p-3 flex flex-col gap-1">
              <Link href={ROUTES.scan} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-surface-2 transition-colors group">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary group-hover:scale-110 transition-transform shadow-sm">
                  <ScanIcon className="size-5" />
                </div>
                <div className="flex-1">
                  <Text className="text-sm font-bold">Analyze Document</Text>
                  <Text size="xs" tone="secondary">Upload and scan instantly</Text>
                </div>
                <ArrowRightIcon className="size-4 text-text-tertiary group-hover:translate-x-1 group-hover:text-text-primary transition-all" />
              </Link>
              <Link href={ROUTES.vault} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-surface-2 transition-colors group">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-3 text-text-primary group-hover:scale-110 transition-transform shadow-sm">
                  <VaultIcon className="size-5" />
                </div>
                <div className="flex-1">
                  <Text className="text-sm font-bold">Access Vault</Text>
                  <Text size="xs" tone="secondary">View stored contracts</Text>
                </div>
                <ArrowRightIcon className="size-4 text-text-tertiary group-hover:translate-x-1 group-hover:text-text-primary transition-all" />
              </Link>
              <Link href={ROUTES.settings} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-surface-2 transition-colors group">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-3 text-text-primary group-hover:scale-110 transition-transform shadow-sm">
                  <SettingsIcon className="size-5" />
                </div>
                <div className="flex-1">
                  <Text className="text-sm font-bold">Workspace Settings</Text>
                  <Text size="xs" tone="secondary">Manage your preferences</Text>
                </div>
                <ArrowRightIcon className="size-4 text-text-tertiary group-hover:translate-x-1 group-hover:text-text-primary transition-all" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
