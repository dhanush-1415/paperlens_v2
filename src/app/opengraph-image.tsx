import { ImageResponse } from 'next/og';
import { resolveTenant } from '@/config/tenant';
import { serverEnv } from '@/config/env.server';

// Route segment config
// export const runtime = 'edge';

// Image metadata
export const alt = 'PaperLens - Enterprise Document Analysis';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

const tenant = resolveTenant(serverEnv.TENANT_ID);

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#030712', // text-canvas dark
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'sans-serif',
      }}
    >
      {/* Background Gradients */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '-10%',
          width: '60%',
          height: '80%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, rgba(3, 7, 18, 0) 70%)',
          borderRadius: '50%',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-20%',
          right: '-10%',
          width: '60%',
          height: '80%',
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.2) 0%, rgba(3, 7, 18, 0) 70%)',
          borderRadius: '50%',
        }}
      />

      {/* Grid Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          opacity: 0.8,
        }}
      />

      {/* Floating UI Elements (Glassmorphic Badges) */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          display: 'flex',
          alignItems: 'center',
          padding: '12px 24px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '999px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: '#10b981',
            marginRight: 12,
          }}
        />
        <span style={{ color: '#fff', fontSize: 20, fontWeight: 600 }}>AI Analysis Complete</span>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '25%',
          right: '12%',
          display: 'flex',
          alignItems: 'center',
          padding: '12px 24px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '999px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: '#ef4444',
            marginRight: 12,
          }}
        />
        <span style={{ color: '#fff', fontSize: 20, fontWeight: 600 }}>
          2 Critical Risks Flagged
        </span>
      </div>

      {/* Main Content Box */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          background: 'rgba(3, 7, 18, 0.6)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          padding: '60px 80px',
          borderRadius: '32px',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.4)',
          maxWidth: '80%',
          zIndex: 10,
        }}
      >
        {/* Logo Mark (Simplified SVG for Satori) */}
        <div style={{ display: 'flex', marginBottom: 24, alignItems: 'center' }}>
          <svg
            width="64"
            height="64"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M38 18L86 18C91.5228 18 96 22.4772 96 28L96 172C96 177.523 91.5228 182 86 182L38 182C32.4772 182 28 177.523 28 172L28 28C28 22.4772 32.4772 18 38 18ZM148 70C148 98.7188 124.719 122 96 122C67.2812 122 44 98.7188 44 70C44 41.2812 67.2812 18 96 18C124.719 18 148 41.2812 148 70ZM142 70C142 95.4051 121.405 116 96 116C70.5949 116 50 95.4051 50 70C50 44.5949 70.5949 24 96 24C121.405 24 142 44.5949 142 70Z"
              fill="#8b5cf6"
            />
          </svg>
          <span
            style={{
              fontSize: 48,
              fontWeight: 800,
              color: '#fff',
              marginLeft: 16,
              letterSpacing: '-0.05em',
            }}
          >
            {tenant.productName}
          </span>
        </div>

        {/* Headline */}
        <h1
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: '#fff',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            marginTop: 0,
            marginBottom: 24,
          }}
        >
          Turn complex documents
          <br />
          into clear answers.
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 28,
            color: 'rgba(255, 255, 255, 0.7)',
            margin: 0,
            maxWidth: 600,
            lineHeight: 1.4,
          }}
        >
          Enterprise-grade AI analysis for contracts, compliance, and policies.
        </p>
      </div>
    </div>,
    {
      ...size,
    },
  );
}
