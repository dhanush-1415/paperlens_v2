import React from 'react';
import { AnalyticsData } from './analytics-page';
import { format } from 'date-fns';
import { ShieldIcon } from '@/shared/ui/icons';
import { ScanIcon, VaultIcon, BarChartIcon } from '@/shared/ui/icons/dashboard-icons';

interface EnterpriseReportTemplateProps {
  data: AnalyticsData;
  dateRange: { startDate: Date; endDate: Date };
}

export const EnterpriseReportTemplate = React.forwardRef<HTMLDivElement, EnterpriseReportTemplateProps>(
  ({ data, dateRange }, ref) => {
    return (
      <div 
        ref={ref} 
        style={{ 
          width: '800px', 
          padding: '40px', 
          backgroundColor: '#ffffff', 
          color: '#1a1a1a', 
          fontFamily: 'sans-serif',
          position: 'absolute',
          top: '-9999px',
          left: '-9999px',
          zIndex: -1
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f3f4f6', paddingBottom: '20px', marginBottom: '30px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', color: '#111827', fontWeight: 800 }}>Workspace Intelligence Report</h1>
            <p style={{ margin: '8px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
              Period: {format(dateRange.startDate, 'MMM d, yyyy')} — {format(dateRange.endDate, 'MMM d, yyyy')}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: 0, fontSize: '18px', color: '#8b5cf6', fontWeight: 800 }}>ClearCut Enterprise</h2>
            <p style={{ margin: '4px 0 0 0', color: '#9ca3af', fontSize: '12px' }}>Generated: {format(new Date(), 'PPpp')}</p>
          </div>
        </div>

        {/* Executive Summary Stats */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
          {[
            { label: 'Total Scans', value: data.totalScans, bg: '#f5f3ff', color: '#8b5cf6' },
            { label: 'Vault Documents', value: data.vaultDocs, bg: '#f0fdfa', color: '#14b8a6' },
            { label: 'High Risk Items', value: data.highRisk, bg: '#fff1f2', color: '#f43f5e' },
            { label: 'Avg Processing Time', value: data.avgProcessingTime, bg: '#ecfdf5', color: '#10b981' }
          ].map((stat, i) => (
            <div key={i} style={{ flex: 1, padding: '20px', borderRadius: '12px', backgroundColor: stat.bg, border: `1px solid ${stat.color}30` }}>
              <p style={{ margin: 0, fontSize: '12px', color: '#4b5563', textTransform: 'uppercase', fontWeight: 700 }}>{stat.label}</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '28px', color: stat.color, fontWeight: 900 }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Risk Distribution & Processing Volume (Mocked Visually for PDF) */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
          <div style={{ flex: 2, padding: '24px', borderRadius: '12px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#374151' }}>Processing Volume (Selected Period)</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', height: '150px', gap: '4px' }}>
              {data.processingVolume.map((vol, i) => (
                <div key={i} style={{ flex: 1, backgroundColor: '#8b5cf6', opacity: 0.8, borderRadius: '4px 4px 0 0', height: `${Math.max(5, (vol.count / Math.max(1, ...data.processingVolume.map(v => v.count))) * 100)}%` }} />
              ))}
            </div>
          </div>
          
          <div style={{ flex: 1, padding: '24px', borderRadius: '12px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#374151' }}>Risk Profile</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                <span style={{ color: '#4b5563' }}>Verified Safe</span><span style={{ color: '#10b981' }}>{data.riskDistribution.safePercentage}%</span>
              </div>
              <div style={{ height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px' }}>
                <div style={{ height: '100%', backgroundColor: '#10b981', borderRadius: '4px', width: `${data.riskDistribution.safePercentage}%` }} />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                <span style={{ color: '#4b5563' }}>Needs Review</span><span style={{ color: '#f59e0b' }}>{data.riskDistribution.cautionPercentage}%</span>
              </div>
              <div style={{ height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px' }}>
                <div style={{ height: '100%', backgroundColor: '#f59e0b', borderRadius: '4px', width: `${data.riskDistribution.cautionPercentage}%` }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                <span style={{ color: '#4b5563' }}>High Risk</span><span style={{ color: '#f43f5e' }}>{data.riskDistribution.criticalPercentage}%</span>
              </div>
              <div style={{ height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px' }}>
                <div style={{ height: '100%', backgroundColor: '#f43f5e', borderRadius: '4px', width: `${data.riskDistribution.criticalPercentage}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Table */}
        <div style={{ padding: '24px', borderRadius: '12px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#374151' }}>Recent Security Audit Logs</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb', color: '#6b7280', textAlign: 'left' }}>
                <th style={{ padding: '12px 0' }}>Document Identified</th>
                <th style={{ padding: '12px 0' }}>Timestamp</th>
                <th style={{ padding: '12px 0' }}>Status Designation</th>
              </tr>
            </thead>
            <tbody>
              {data.recentActivity.slice(0, 8).map((act, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px 0', color: '#111827', fontWeight: 600 }}>{act.file}</td>
                  <td style={{ padding: '12px 0', color: '#6b7280' }}>{act.time}</td>
                  <td style={{ padding: '12px 0' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '12px', 
                      fontWeight: 700,
                      backgroundColor: act.risk === 'safe' ? '#ecfdf5' : act.risk === 'caution' ? '#fffbeb' : '#fff1f2',
                      color: act.risk === 'safe' ? '#10b981' : act.risk === 'caution' ? '#f59e0b' : '#f43f5e'
                    }}>
                      {act.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.recentActivity.length === 0 && (
            <p style={{ textAlign: 'center', color: '#6b7280', padding: '20px 0', margin: 0 }}>No activity logged in this period.</p>
          )}
        </div>
      </div>
    );
  }
);
EnterpriseReportTemplate.displayName = 'EnterpriseReportTemplate';
