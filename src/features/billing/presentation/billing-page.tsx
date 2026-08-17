'use client';

import { useState } from 'react';
import { Button, Heading, Text, Badge, DataTable, type Column } from '@/shared/ui';
import { CheckCircleIcon, AlertTriangleIcon } from '@/shared/ui/icons';
import { CreditCardIcon, DownloadIcon } from '@/shared/ui/icons/dashboard-icons';

const PLANS = [
  { name: 'Starter', price: '$0', features: ['50 scans/mo', 'Basic Risk Analysis', 'Community Support'], isCurrent: false },
  { name: 'Professional', price: '$49', features: ['500 scans/mo', 'Advanced Contract Analysis', 'Priority Support', 'Export to PDF/Word'], isCurrent: true },
  { name: 'Enterprise', price: 'Custom', features: ['Unlimited scans', 'Custom Risk Playbooks', 'Dedicated Account Manager', 'SSO & Advanced Security'], isCurrent: false },
];

export function BillingPage({ planData, usageData, paymentMethod, invoices }: { planData: any, usageData: any, paymentMethod: string | null, invoices: any[] }) {
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = async (planName: string) => {
    if (planName === 'Enterprise') {
      window.location.assign('mailto:sales@paperlens.com');
      return;
    }
    
    try {
      setIsUpgrading(true);
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.checkout_url) {
        window.location.assign(data.checkout_url);
      } else {
        alert('Checkout failed: ' + (data.error || 'Unknown error'));
      }
    } catch (e) {
      alert('Checkout error');
    } finally {
      setIsUpgrading(false);
    }
  };

  const invoiceColumns: Column<any>[] = [
    { id: 'id', header: 'Invoice Number', cell: (inv) => <span className="font-bold text-text-primary">{inv.id}</span> },
    { id: 'date', header: 'Date', cell: (inv) => <span className="font-medium text-text-secondary">{inv.date}</span> },
    { id: 'amount', header: 'Amount', cell: (inv) => <span className="font-bold">{inv.amount}</span> },
    { 
      id: 'status', 
      header: 'Status', 
      cell: (inv) => <Badge tone="safe" className="font-bold">{inv.status}</Badge> 
    },
    {
      id: 'action',
      header: '',
      cell: (inv) => <a href={inv.downloadUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-bold text-brand-primary hover:underline"><DownloadIcon className="size-4" /> PDF</a>,
    },
  ];

  return (
    <div className="flex flex-col gap-8 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative">
        <div className="relative z-10">
          <Heading level={1} size="lg" className="tracking-tight text-text-primary">
            Billing & Usage
          </Heading>
          <Text tone="secondary" className="mt-1 text-sm font-medium">
            Manage your subscription plan, payment methods, and billing history.
          </Text>
        </div>
      </div>

      {/* Usage & Analytics Fusion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Usage Overview */}
        <div className="rounded-[1.25rem] border border-border-subtle bg-surface-1 p-5 sm:p-6 shadow-sm flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <Heading level={2} size="md" className="font-bold text-text-primary">Current Cycle Usage</Heading>
            <Badge tone="brand" className="font-bold shadow-sm">
              Resets {new Date(planData.subscription.usageResetAt).toLocaleDateString()}
            </Badge>
          </div>
          
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-end">
                <div>
                  <Text size="sm" className="font-bold text-text-primary">Document Scans</Text>
                  <Text size="xs" tone="secondary" className="font-medium mt-0.5">{planData.plan.displayName} Plan</Text>
                </div>
                <div className="text-right">
                  <Text size="sm" className="font-bold text-text-primary">{planData.subscription.scansUsed} <span className="text-text-tertiary">/ {planData.plan.quotaScansPerMonth}</span></Text>
                  <Text size="xs" tone="secondary" className="font-medium mt-0.5">{Math.round((planData.subscription.scansUsed / Math.max(1, planData.plan.quotaScansPerMonth)) * 100)}% used</Text>
                </div>
              </div>
              <div className="h-2.5 w-full bg-surface-2 rounded-full overflow-hidden">
                <div className="h-full bg-brand-primary rounded-full shadow-[0_0_8px_rgba(var(--color-brand-primary),0.6)]" style={{ width: `${Math.min(100, (planData.subscription.scansUsed / Math.max(1, planData.plan.quotaScansPerMonth)) * 100)}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex flex-col gap-1 p-3 rounded-xl bg-surface-2/50 border border-border-subtle">
                <Text size="xs" tone="secondary" className="font-medium uppercase tracking-wider">Member Since</Text>
                <Text size="sm" className="font-bold text-text-primary">
                  {new Date(usageData.memberSince).toLocaleDateString()}
                </Text>
              </div>
              <div className="flex flex-col gap-1 p-3 rounded-xl bg-surface-2/50 border border-border-subtle">
                <Text size="xs" tone="secondary" className="font-medium uppercase tracking-wider">Last Scan</Text>
                <Text size="sm" className="font-bold text-text-primary">
                  {usageData.lastScanDate ? new Date(usageData.lastScanDate).toLocaleDateString() : 'None'}
                </Text>
              </div>
            </div>
          </div>
        </div>

        {/* Vault Analytics */}
        <div className="rounded-[1.25rem] border border-border-subtle bg-surface-1 p-5 sm:p-6 shadow-sm flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <Heading level={2} size="md" className="font-bold text-text-primary">Vault Analytics</Heading>
            <Badge tone="neutral" className="font-bold shadow-sm">{usageData.totalDocuments} Total Docs</Badge>
          </div>

          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-risk-critical/20 bg-risk-critical/5">
                <Text className="text-2xl font-bold text-risk-critical">{usageData.criticalCount}</Text>
                <Text size="xs" className="font-semibold text-risk-critical/80 mt-1 uppercase tracking-wider">High Risk</Text>
              </div>
              <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-risk-caution/20 bg-risk-caution/5">
                <Text className="text-2xl font-bold text-risk-caution">{usageData.cautionCount}</Text>
                <Text size="xs" className="font-semibold text-risk-caution/80 mt-1 uppercase tracking-wider">Caution</Text>
              </div>
              <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-risk-safe/20 bg-risk-safe/5">
                <Text className="text-2xl font-bold text-risk-safe">{usageData.safeCount}</Text>
                <Text size="xs" className="font-semibold text-risk-safe/80 mt-1 uppercase tracking-wider">Safe</Text>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <div className="flex justify-between items-center">
                <Text size="sm" className="font-bold text-text-primary">Risk Distribution</Text>
              </div>
              <div className="h-3 w-full bg-surface-2 rounded-full overflow-hidden flex">
                <div className="h-full bg-risk-critical transition-all" style={{ width: `${(usageData.criticalCount / Math.max(1, usageData.totalDocuments)) * 100}%` }} />
                <div className="h-full bg-risk-caution transition-all" style={{ width: `${(usageData.cautionCount / Math.max(1, usageData.totalDocuments)) * 100}%` }} />
                <div className="h-full bg-risk-safe transition-all" style={{ width: `${(usageData.safeCount / Math.max(1, usageData.totalDocuments)) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
        {PLANS.map((p) => {
          const isCurrent = p.name.toLowerCase() === planData.plan.displayName.toLowerCase();
          return (
          <div 
            key={p.name} 
            className={`relative rounded-[1.25rem] border p-6 flex flex-col gap-6 shadow-sm overflow-hidden transition-all duration-300 ${isCurrent ? 'border-brand-primary bg-surface-1 shadow-card hover:shadow-card-hover' : 'border-border-subtle bg-surface-1 hover:border-brand-primary/30'}`}
          >
            {isCurrent && (
              <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/5 to-transparent pointer-events-none" />
            )}
            {isCurrent && (
              <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-brand-primary to-brand-secondary" />
            )}
            
            <div className="relative flex justify-between items-start">
              <div>
                <Heading level={3} size="md" className="font-bold">{p.name}</Heading>
                <div className="mt-2 flex items-baseline gap-1">
                  <Text className="text-4xl font-extrabold text-text-primary tracking-tight">{p.price}</Text>
                  {p.price !== 'Custom' && <Text tone="tertiary" className="font-medium">/month</Text>}
                </div>
              </div>
              {isCurrent ? (
                <Badge tone="brand" className="font-bold shadow-sm">Current Plan</Badge>
              ) : p.name === 'Professional' && planData.plan.displayName.toLowerCase() === 'starter' ? (
                <Badge tone="brand" className="font-bold shadow-sm bg-gradient-to-r from-brand-primary to-brand-secondary text-white border-none animate-pulse">Recommended</Badge>
              ) : null}
            </div>

            <ul className="relative flex-1 space-y-4">
              {p.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-sm font-medium text-text-secondary">
                  <div className="flex size-5 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary shrink-0 mt-0.5">
                    <CheckCircleIcon className="size-3.5" />
                  </div>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button 
              variant={isCurrent ? 'secondary' : 'primary'} 
              className={`relative font-bold h-11 ${isCurrent ? 'border-border-strong text-text-primary' : 'shadow-md'}`}
              disabled={isCurrent || isUpgrading}
              onClick={() => handleUpgrade(p.name)}
            >
              {isCurrent ? 'Current Plan' : isUpgrading ? 'Redirecting...' : p.price === 'Custom' ? 'Contact Sales' : 'Upgrade to ' + p.name}
            </Button>
          </div>
        )})}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        {/* Payment Method */}
        <div className="lg:col-span-1 rounded-[1.25rem] border border-border-subtle bg-surface-1 p-6 shadow-sm">
          <div className="mb-6 flex justify-between items-center">
            <Heading level={2} size="sm" className="font-bold uppercase tracking-wider text-text-tertiary">Payment Method</Heading>
            <Button variant="ghost" size="sm" className="text-brand-primary font-bold h-8 px-2">Update</Button>
          </div>
          
          {paymentMethod ? (
            <div className="flex items-center gap-4 p-4 rounded-xl border border-border-subtle bg-surface-2/50">
              <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-surface-1 border border-border-subtle shadow-sm">
                <CreditCardIcon className="size-6 text-brand-primary" />
              </div>
              <div>
                <Text className="font-bold text-text-primary">Managed via {paymentMethod}</Text>
                <Text size="xs" tone="secondary" className="font-medium mt-0.5">Active Subscription</Text>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 p-4 rounded-xl border border-border-subtle bg-surface-2/50">
              <Text className="font-medium text-text-secondary text-sm">No active payment method.</Text>
            </div>
          )}
          
          <div className="mt-6 rounded-xl border border-risk-caution/20 bg-risk-caution/5 p-4 flex gap-3 items-start">
            <AlertTriangleIcon className="size-5 text-risk-caution shrink-0 mt-0.5" />
            <div className="flex-1">
              <Text size="sm" className="font-bold text-text-primary">Next billing: {new Date(planData.subscription.usageResetAt).toLocaleDateString()}</Text>
              <Text size="xs" tone="secondary" className="mt-1 font-medium text-risk-caution/80">Your card will be automatically charged.</Text>
            </div>
          </div>
          
          {planData.plan.displayName.toLowerCase() !== 'starter' && (
            <div className="mt-6 border-t border-border-subtle pt-6 flex flex-col gap-3 items-start">
              <Text size="sm" className="font-bold text-text-primary">Danger Zone</Text>
              <Text size="xs" tone="secondary" className="font-medium">Cancel your subscription. You will lose access to unmetered AI scans at the end of your billing cycle.</Text>
              <Button variant="ghost" size="sm" className="text-risk-critical font-bold mt-2 hover:bg-risk-critical/10" onClick={() => window.confirm('Are you sure you want to cancel your Professional subscription? We would hate to see you go.')}>
                Cancel Subscription
              </Button>
            </div>
          )}
        </div>

        {/* Billing History */}
        <div className="lg:col-span-2 rounded-[1.25rem] border border-border-subtle bg-surface-1 p-6 shadow-sm flex flex-col">
          <div className="mb-6">
            <Heading level={2} size="sm" className="font-bold uppercase tracking-wider text-text-tertiary">Billing History</Heading>
          </div>
          <div className="flex-1 rounded-xl overflow-hidden border border-border-subtle">
            {invoices.length > 0 ? (
              <DataTable 
                data={invoices} 
                columns={invoiceColumns} 
                keyExtractor={(inv) => inv.id} 
              />
            ) : (
              <div className="flex items-center justify-center py-12 text-center bg-surface-1">
                <Text size="sm" tone="secondary" className="font-medium">No invoices available.</Text>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
