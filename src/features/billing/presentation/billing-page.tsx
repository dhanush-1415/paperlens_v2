'use client';

import { Button, Heading, Text, Card, Badge, DataTable, type Column } from '@/shared/ui';
import { CheckCircleIcon, AlertTriangleIcon } from '@/shared/ui/icons';
import { CreditCardIcon } from '@/shared/ui/icons/dashboard-icons';

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
    { id: 'id', header: 'Invoice Number', cell: (inv) => <span className="font-medium">{inv.id}</span> },
    { id: 'date', header: 'Date', cell: (inv) => inv.date },
    { id: 'amount', header: 'Amount', cell: (inv) => inv.amount },
    { 
      id: 'status', 
      header: 'Status', 
      cell: (inv) => <Badge tone="safe">{inv.status}</Badge> 
    },
    {
      id: 'action',
      header: '',
      cell: () => <Button variant="ghost" size="sm">Download</Button>,
    },
  ];

  return (
    <div className="flex flex-col gap-8 w-full">
      <div>
        <Heading level={1} size="lg">Billing & Usage</Heading>
        <Text tone="secondary" className="mt-1">
          Manage your subscription plan and billing history.
        </Text>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => (
          <Card 
            key={plan.name} 
            interactive
            className={`relative p-6 flex flex-col gap-4 overflow-hidden ${plan.isCurrent ? 'border-brand-primary shadow-lg bg-brand-primary/5' : 'hover:border-border-strong'}`}
          >
            {plan.isCurrent && (
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-brand" />
            )}
            <div className="flex justify-between items-start">
              <div>
                <Heading level={3} size="sm">{plan.name}</Heading>
                <div className="mt-2 flex items-baseline gap-1">
                  <Text className="text-3xl font-bold">{plan.price}</Text>
                  {plan.price !== 'Custom' && <Text tone="tertiary">/month</Text>}
                </div>
              </div>
              {plan.isCurrent && <Badge tone="brand">Current Plan</Badge>}
            </div>

            <ul className="flex-1 space-y-3 mt-4">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                  <CheckCircleIcon className="size-4 text-brand-primary shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button 
              variant={plan.isCurrent ? 'secondary' : 'primary'} 
              className="mt-6 w-full"
              disabled={plan.isCurrent}
            >
              {plan.isCurrent ? 'Current Plan' : plan.price === 'Custom' ? 'Contact Sales' : 'Upgrade'}
            </Button>
          </Card>
        ))}
      </div>

      <Card interactive className="p-6 transition-colors hover:bg-surface-2/30">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2">
            <CreditCardIcon className="size-6 text-text-secondary" />
          </div>
          <div>
            <Heading level={3} size="sm">Payment Method</Heading>
            <Text tone="secondary" className="mt-1">Visa ending in 4242 (Expires 12/28)</Text>
          </div>
          <Button variant="secondary" className="ml-auto">Update Method</Button>
        </div>
        
        <div className="rounded-card border border-border-subtle bg-surface-2/30 p-4 flex gap-3 items-start">
          <AlertTriangleIcon className="size-5 text-text-secondary shrink-0 mt-0.5" />
          <div>
            <Text className="font-medium text-text-primary">Next billing date is September 1, 2026</Text>
            <Text size="sm" tone="secondary" className="mt-1">Your card will be automatically charged $49.00.</Text>
          </div>
        </div>
      </Card>

      <div>
        <Heading level={2} size="md" className="mb-4">Billing History</Heading>
        <DataTable 
          data={INVOICES} 
          columns={invoiceColumns} 
          keyExtractor={(inv) => inv.id} 
        />
      </div>
    </div>
  );
}
