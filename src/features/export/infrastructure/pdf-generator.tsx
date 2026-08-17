import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register standard fonts
Font.register({
  family: 'Inter',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyeMZhrib2Bg-4.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf',
      fontWeight: 600,
    },
    {
      src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYMZhrib2Bg-4.ttf',
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Inter',
  },
  header: {
    marginBottom: 30,
    borderBottom: '1 solid #e5e7eb',
    paddingBottom: 20,
  },
  logo: {
    fontSize: 24,
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 600,
    color: '#1e293b',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  section: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#334155',
    marginBottom: 10,
    borderBottom: '1 solid #f1f5f9',
    paddingBottom: 5,
  },
  text: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 1.6,
  },
  flagItem: {
    marginBottom: 8,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
  },
  flagHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  flagTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#0f172a',
  },
  flagRisk: {
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  flagRiskCritical: {
    color: '#ef4444',
  },
  flagRiskCaution: {
    color: '#f59e0b',
  },
  flagRiskSafe: {
    color: '#10b981',
  },
  actionItem: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  bullet: {
    width: 15,
    fontSize: 11,
    color: '#64748b',
  },
});

export function AnalysisReportPDF({ data }: { data: any }) {
  const flags = Array.isArray(data.flags) ? data.flags : [];
  const actionPlan = Array.isArray(data.actionPlan) ? data.actionPlan : [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.logo}>PaperLens</Text>
          <Text style={styles.title}>{data.title || 'Document Analysis Report'}</Text>
          <Text style={styles.subtitle}>
            Analyzed on {new Date(data.analyzedAt).toLocaleDateString()} • {data.documentType}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <Text style={styles.text}>{data.summary || 'No summary available.'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identified Risks & Flags</Text>
          {flags.length > 0 ? (
            flags.map((flag: any, i: number) => {
              const isCritical =
                flag.severity?.toLowerCase() === 'critical' ||
                flag.severity?.toLowerCase() === 'high';
              const isCaution =
                flag.severity?.toLowerCase() === 'caution' ||
                flag.severity?.toLowerCase() === 'medium';
              const riskStyle = isCritical
                ? styles.flagRiskCritical
                : isCaution
                  ? styles.flagRiskCaution
                  : styles.flagRiskSafe;
              return (
                <View key={i} style={styles.flagItem}>
                  <View style={styles.flagHeader}>
                    <Text style={styles.flagTitle}>
                      {flag.title || flag.category || 'Observation'}
                    </Text>
                    <Text style={[styles.flagRisk, riskStyle]}>{flag.severity || 'Notice'}</Text>
                  </View>
                  <Text style={styles.text}>{flag.description}</Text>
                </View>
              );
            })
          ) : (
            <Text style={styles.text}>No significant risks identified.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended Action Plan</Text>
          {actionPlan.length > 0 ? (
            actionPlan.map((action: string, i: number) => (
              <View key={i} style={styles.actionItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.text}>{action}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.text}>No specific actions required.</Text>
          )}
        </View>
      </Page>
    </Document>
  );
}
