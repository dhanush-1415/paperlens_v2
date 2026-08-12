'use client';

import { Button, Heading, Text, Badge, DataTable, type Column } from '@/shared/ui';
import { CheckCircleIcon, AlertTriangleIcon } from '@/shared/ui/icons';
import { CreditCardIcon, DownloadIcon } from '@/shared/ui/icons/dashboard-icons';

const PLANS = [
  { name: 'Starter', price: '$0', features: ['50 scans/mo', 'Basic Risk Analysis', 'Community Support'], isCurrent: false },
  { name: 'Professional', price: '$49', features: ['500 scans/mo', 'Advanced Contract Analysis', 'Priority Support', 'Export to PDF/Word'], isCurrent: true },
  { name: 'Enterprise', price: 'Custom', features: ['Unlimited scans', 'Custom Risk Playbooks', 'Dedicated Account Manager', 'SSO & Advanced Security'], isCurrent: false },
];

const INVOICES = [
  { id: 'INV-2026-003', date: 'Aug 1, 2026', amount: '$49.00', status: 'Paid', downloadUrl: '#' },
  { id: 'INV-2026-002', date: 'Jul 1, 2026', amount: '$49.00', status: 'Paid', downloadUrl: '#' },
  { id: 'INV-2026-001', date: 'Jun 1, 2026', amount: '$49.00', status: 'Paid', downloadUrl: '#' },
];

export function BillingPage() {
  const invoiceColumns: Column<typeof INVOICES[0]>[] = [
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
      cell: () => <button className="flex items-center gap-2 text-sm font-bold text-brand-primary hover:underline"><DownloadIcon className="size-4" /> PDF</button>,
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

      {/* Usage Overview */}
      <div className="rounded-[1.25rem] border border-border-subtle bg-surface-1 p-5 sm:p-6 shadow-sm flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <Heading level={2} size="md" className="font-bold text-text-primary">Current Cycle Usage</Heading>
          <Badge tone="brand" className="font-bold shadow-sm">Resets in 18 days</Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-end">
              <div>
                <Text size="sm" className="font-bold text-text-primary">Document Scans</Text>
                <Text size="xs" tone="secondary" className="font-medium mt-0.5">Professional Plan</Text>
              </div>
              <div className="text-right">
                <Text size="sm" className="font-bold text-text-primary">42 <span className="text-text-tertiary">/ 500</span></Text>
                <Text size="xs" tone="secondary" className="font-medium mt-0.5">8% used</Text>
              </div>
            </div>
            <div className="h-2.5 w-full bg-surface-2 rounded-full overflow-hidden">
              <div className="h-full bg-brand-primary rounded-full shadow-[0_0_8px_rgba(var(--color-brand-primary),0.6)]" style={{ width: '8%' }} />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-end">
              <div>
                <Text size="sm" className="font-bold text-text-primary">Vault Storage</Text>
                <Text size="xs" tone="secondary" className="font-medium mt-0.5">Professional Plan</Text>
              </div>
              <div className="text-right">
                <Text size="sm" className="font-bold text-text-primary">2.4 GB <span className="text-text-tertiary">/ 10 GB</span></Text>
                <Text size="xs" tone="secondary" className="font-medium mt-0.5">24% used</Text>
              </div>
            </div>
            <div className="h-2.5 w-full bg-surface-2 rounded-full overflow-hidden">
              <div className="h-full bg-brand-secondary rounded-full shadow-[0_0_8px_rgba(var(--color-brand-secondary),0.6)]" style={{ width: '24%' }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
        {PLANS.map((plan) => (
          <div 
            key={plan.name} 
            className={`relative rounded-[1.25rem] border p-6 flex flex-col gap-6 shadow-sm overflow-hidden transition-all duration-300 ${plan.isCurrent ? 'border-brand-primary bg-surface-1 shadow-card hover:shadow-card-hover' : 'border-border-subtle bg-surface-1 hover:border-brand-primary/30'}`}
          >
            {plan.isCurrent && (
              <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/5 to-transparent pointer-events-none" />
            )}
            {plan.isCurrent && (
              <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-brand-primary to-brand-secondary" />
            )}
            
            <div className="relative flex justify-between items-start">
              <div>
                <Heading level={3} size="md" className="font-bold">{plan.name}</Heading>
                <div className="mt-2 flex items-baseline gap-1">
                  <Text className="text-4xl font-extrabold text-text-primary tracking-tight">{plan.price}</Text>
                  {plan.price !== 'Custom' && <Text tone="tertiary" className="font-medium">/month</Text>}
                </div>
              </div>
              {plan.isCurrent && <Badge tone="brand" className="font-bold shadow-sm">Current Plan</Badge>}
            </div>

            <ul className="relative flex-1 space-y-4">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-sm font-medium text-text-secondary">
                  <div className="flex size-5 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary shrink-0 mt-0.5">
                    <CheckCircleIcon className="size-3.5" />
                  </div>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button 
              variant={plan.isCurrent ? 'secondary' : 'primary'} 
              className={`relative font-bold h-11 ${plan.isCurrent ? 'border-border-strong text-text-primary' : 'shadow-md'}`}
              disabled={plan.isCurrent}
            >
              {plan.isCurrent ? 'Current Plan' : plan.price === 'Custom' ? 'Contact Sales' : 'Upgrade to ' + plan.name}
            </Button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        {/* Payment Method */}
        <div className="lg:col-span-1 rounded-[1.25rem] border border-border-subtle bg-surface-1 p-6 shadow-sm">
          <div className="mb-6 flex justify-between items-center">
            <Heading level={2} size="sm" className="font-bold uppercase tracking-wider text-text-tertiary">Payment Method</Heading>
            <Button variant="ghost" size="sm" className="text-brand-primary font-bold h-8 px-2">Update</Button>
          </div>
          
          <div className="flex items-center gap-4 p-4 rounded-xl border border-border-subtle bg-surface-2/50">
            <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-surface-1 border border-border-subtle shadow-sm">
              <CreditCardIcon className="size-6 text-brand-primary" />
            </div>
            <div>
              <Text className="font-bold text-text-primary">Visa ending in 4242</Text>
              <Text size="xs" tone="secondary" className="font-medium mt-0.5">Expires 12/2028</Text>
            </div>
          </div>
          
          <div className="mt-6 rounded-xl border border-risk-caution/20 bg-risk-caution/5 p-4 flex gap-3 items-start">
            <AlertTriangleIcon className="size-5 text-risk-caution shrink-0 mt-0.5" />
            <div>
              <Text size="sm" className="font-bold text-text-primary">Next billing: Sep 1, 2026</Text>
              <Text size="xs" tone="secondary" className="mt-1 font-medium text-risk-caution/80">Your card will be automatically charged $49.00.</Text>
            </div>
          </div>
        </div>

        {/* Billing History */}
        <div className="lg:col-span-2 rounded-[1.25rem] border border-border-subtle bg-surface-1 p-6 shadow-sm flex flex-col">
          <div className="mb-6">
            <Heading level={2} size="sm" className="font-bold uppercase tracking-wider text-text-tertiary">Billing History</Heading>
          </div>
          <div className="flex-1 rounded-xl overflow-hidden border border-border-subtle">
            <DataTable 
              data={INVOICES} 
              columns={invoiceColumns} 
              keyExtractor={(inv) => inv.id} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
