'use client';

import { useState } from 'react';
import Link from 'next/link';

// ── Markov Chain state-transition diagram ─────────────────────────────────────
interface MNode {
  id: string; cx: number; cy: number; r: number;
  stroke: string; fill: string; label: string; abbr: string; pb: string;
}
interface MEdge {
  id: string; d: string; stroke: string; dim: boolean;
  prob: string; mx: number; my: number;
}
interface MParticle {
  path: string; fill: string; dur: string; begin: string; r: number;
}

function MarkovChain() {
  const nodes: MNode[] = [
    { id: 'S',   cx: 70,  cy: 90,  r: 25, stroke: '#ffb300', fill: 'rgba(255,179,0,0.08)',   label: 'SCREENING',  abbr: 'S',  pb: '0s'   },
    { id: 'E',   cx: 200, cy: 90,  r: 25, stroke: '#22d3ee', fill: 'rgba(34,211,238,0.08)',  label: 'ENROLLED',   abbr: 'E',  pb: '0.6s' },
    { id: 'A',   cx: 335, cy: 90,  r: 25, stroke: '#b7ff61', fill: 'rgba(183,255,97,0.08)',  label: 'ACTIVE',     abbr: 'A',  pb: '1.2s' },
    { id: 'X',   cx: 70,  cy: 200, r: 20, stroke: '#5b8a9a', fill: 'rgba(91,138,154,0.05)',  label: 'DECLINED',   abbr: '✕',  pb: '1.8s' },
    { id: 'C',   cx: 335, cy: 200, r: 25, stroke: '#b7ff61', fill: 'rgba(183,255,97,0.12)',  label: 'COMPLETE',   abbr: 'C',  pb: '2.4s' },
    { id: 'DR',  cx: 460, cy: 200, r: 25, stroke: '#b7ff61', fill: 'rgba(183,255,97,0.20)',  label: 'DATA READY', abbr: '◆',  pb: '3.0s' },
  ];

  const edges: MEdge[] = [
    { id: 'se',   d: 'M 97 90 L 173 90',    stroke: '#22d3ee', dim: false, prob: '0.78', mx: 135, my: 80  },
    { id: 'ea',   d: 'M 227 90 L 308 90',   stroke: '#b7ff61', dim: false, prob: '0.94', mx: 268, my: 80  },
    { id: 'ac',   d: 'M 335 117 L 335 173', stroke: '#b7ff61', dim: false, prob: '0.88', mx: 348, my: 145 },
    { id: 'cdr',  d: 'M 362 200 L 433 200', stroke: '#b7ff61', dim: false, prob: '1.0',  mx: 398, my: 190 },
    { id: 'sdec', d: 'M 70 117 L 70 178',   stroke: '#5b8a9a', dim: true,  prob: '0.22', mx: 83,  my: 148 },
  ];

  const particles: MParticle[] = [
    { path: 'se',   fill: '#22d3ee', dur: '1.8s', begin: '0s',   r: 4 },
    { path: 'ea',   fill: '#b7ff61', dur: '1.8s', begin: '0.9s', r: 4 },
    { path: 'ac',   fill: '#b7ff61', dur: '1.4s', begin: '1.8s', r: 4 },
    { path: 'cdr',  fill: '#b7ff61', dur: '1.6s', begin: '2.6s', r: 4 },
    { path: 'sdec', fill: '#5b8a9a', dur: '2.2s', begin: '5.5s', r: 3 },
  ];

  return (
    <svg viewBox="0 0 520 270" style={{ width: '100%', height: 'auto' }}>
      <defs>
        <marker id="mch-cyan"  markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto" markerUnits="userSpaceOnUse">
          <path d="M0,0 L8,4 L0,8 Z" fill="#22d3ee" opacity="0.8" />
        </marker>
        <marker id="mch-green" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto" markerUnits="userSpaceOnUse">
          <path d="M0,0 L8,4 L0,8 Z" fill="#b7ff61" opacity="0.8" />
        </marker>
        <marker id="mch-dim"   markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto" markerUnits="userSpaceOnUse">
          <path d="M0,0 L8,4 L0,8 Z" fill="#5b8a9a" opacity="0.6" />
        </marker>
      </defs>

      {/* Background grid */}
      {[0, 1, 2, 3, 4, 5].map(i => (
        <line key={`vg${i}`} x1={i * 104} y1={0} x2={i * 104} y2={270} stroke="rgba(255,255,255,0.025)" strokeWidth={1} />
      ))}
      {[0, 1, 2, 3].map(i => (
        <line key={`hg${i}`} x1={0} y1={i * 90} x2={520} y2={i * 90} stroke="rgba(255,255,255,0.025)" strokeWidth={1} />
      ))}

      {/* Diagram label */}
      <text x="260" y="17" textAnchor="middle" fill="rgba(91,138,154,0.6)" fontSize="8"
        style={{ fontFamily: 'var(--font-mono)', letterSpacing: '2px' }}>
        MARKOV CHAIN — PARTICIPANT STATE TRANSITIONS
      </text>

      {/* Edges */}
      {edges.map(e => {
        const marker = e.dim ? 'mch-dim' : e.stroke === '#22d3ee' ? 'mch-cyan' : 'mch-green';
        return (
          <g key={e.id}>
            <path
              id={`mch-${e.id}`}
              d={e.d}
              stroke={e.stroke}
              strokeWidth={e.dim ? 1 : 1.5}
              strokeOpacity={e.dim ? 0.35 : 0.55}
              fill="none"
              strokeDasharray={e.dim ? '4 3' : undefined}
              markerEnd={`url(#${marker})`}
            />
            <text
              x={e.mx} y={e.my}
              textAnchor="middle"
              fill={e.dim ? 'rgba(91,138,154,0.7)' : 'rgba(183,255,97,0.55)'}
              fontSize="8"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {e.prob}
            </text>
          </g>
        );
      })}

      {/* Nodes */}
      {nodes.map(n => (
        <g key={n.id}>
          {/* Pulse ring */}
          <circle cx={n.cx} cy={n.cy} r={n.r} fill="none" stroke={n.stroke} strokeWidth={0.5} opacity={0}>
            <animate attributeName="r"       values={`${n.r};${n.r + 10};${n.r}`} dur="3s" repeatCount="indefinite" begin={n.pb} />
            <animate attributeName="opacity" values="0.4;0;0.4"                   dur="3s" repeatCount="indefinite" begin={n.pb} />
          </circle>
          {/* Node circle */}
          <circle cx={n.cx} cy={n.cy} r={n.r} fill={n.fill} stroke={n.stroke} strokeWidth={1.5} />
          {/* Abbreviation inside */}
          <text
            x={n.cx} y={n.cy + 4}
            textAnchor="middle"
            fill={n.stroke}
            fontSize={n.r === 20 ? 11 : 12}
            style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}
          >
            {n.abbr}
          </text>
          {/* Label below */}
          <text
            x={n.cx} y={n.cy + n.r + 14}
            textAnchor="middle"
            fill={n.stroke}
            fontSize="7"
            style={{ fontFamily: 'var(--font-mono)', letterSpacing: '1px', opacity: 0.8 }}
          >
            {n.label}
          </text>
        </g>
      ))}

      {/* Animated particles */}
      {particles.map((p, i) => (
        <circle key={i} r={p.r} fill={p.fill} opacity={0.9}>
          <animateMotion dur={p.dur} repeatCount="indefinite" begin={p.begin}>
            <mpath href={`#mch-${p.path}`} />
          </animateMotion>
        </circle>
      ))}

      {/* Corner label */}
      <text x="506" y="264" textAnchor="end" fill="rgba(91,138,154,0.3)" fontSize="7"
        style={{ fontFamily: 'var(--font-mono)', letterSpacing: '1px' }}>
        // STATE_TRANSITION_DIAGRAM
      </text>
    </svg>
  );
}

// ── Hero section ──────────────────────────────────────────────────────────────
export function HomeHero() {
  const [hoverRun,         setHoverRun]         = useState(false);
  const [hoverParticipate, setHoverParticipate] = useState(false);

  return (
    <section
      style={{
        paddingTop:    'clamp(60px, 9vh, 100px)',
        paddingBottom: 'clamp(60px, 9vh, 100px)',
        maxWidth:      1200,
        margin:        '0 auto',
        position:      'relative',
        zIndex:        2,
      }}
      className="px-4 sm:px-6 lg:px-10"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

        {/* Left: text content */}
        <div>
          <p style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      10,
            letterSpacing: '3px',
            color:         '#b7ff61',
            textTransform: 'uppercase',
            marginBottom:  20,
            lineHeight:    1,
          }}>
            // OPERATIONS_LAYER
          </p>

          <h1 style={{
            fontFamily:    'var(--font-heading)',
            fontWeight:    700,
            fontSize:      'clamp(28px, 4.5vw, 52px)',
            lineHeight:    1.1,
            marginBottom:  0,
            letterSpacing: '-0.01em',
          }}>
            <span style={{ color: '#f2faf4', display: 'block' }}>The operations layer</span>
            <span style={{ color: '#22d3ee', display: 'block' }}>for decentralized human studies.</span>
          </h1>

          <p style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      'clamp(12px, 1.4vw, 14px)',
            color:         '#aab8b1',
            letterSpacing: '0.5px',
            lineHeight:    1.7,
            marginTop:     24,
            marginBottom:  36,
            maxWidth:      480,
          }}>
            Recruitment. Sample logistics. Compliance. Payouts.<br />
            Protocol to data, without a CRO.
          </p>

          <div className="flex flex-col sm:flex-row" style={{ gap: 12 }}>
            <Link
              href="/run-a-study"
              style={{
                fontFamily:     'var(--font-mono)',
                fontSize:       12,
                letterSpacing:  '1.5px',
                textTransform:  'uppercase',
                color:          hoverRun ? '#050709' : '#b7ff61',
                background:     hoverRun ? '#b7ff61' : 'transparent',
                border:         '1px solid #b7ff61',
                padding:        '0 28px',
                minHeight:      46,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                textDecoration: 'none',
                transition:     'background 150ms ease, color 150ms ease',
                borderRadius:   2,
              }}
              onMouseEnter={() => setHoverRun(true)}
              onMouseLeave={() => setHoverRun(false)}
            >
              Run a study
            </Link>
            <Link
              href="/participate"
              style={{
                fontFamily:     'var(--font-mono)',
                fontSize:       12,
                letterSpacing:  '1.5px',
                textTransform:  'uppercase',
                color:          hoverParticipate ? '#22d3ee' : '#aab8b1',
                background:     'transparent',
                border:         `1px solid ${hoverParticipate ? '#22d3ee' : 'rgba(255,255,255,0.15)'}`,
                padding:        '0 28px',
                minHeight:      46,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                textDecoration: 'none',
                transition:     'border-color 150ms ease, color 150ms ease',
                borderRadius:   2,
              }}
              onMouseEnter={() => setHoverParticipate(true)}
              onMouseLeave={() => setHoverParticipate(false)}
            >
              Participate in research
            </Link>
          </div>
        </div>

        {/* Right: Markov Chain diagram */}
        <div style={{
          background:   'rgba(255,255,255,0.018)',
          border:       '1px solid rgba(255,255,255,0.06)',
          borderRadius: 4,
          padding:      '24px 16px 16px',
          position:     'relative',
          overflow:     'hidden',
        }}>
          {/* Corner brackets */}
          {[
            { top: 10, left: 10,  borderTop: '1px solid rgba(183,255,97,0.25)', borderLeft:  '1px solid rgba(183,255,97,0.25)' },
            { top: 10, right: 10, borderTop: '1px solid rgba(183,255,97,0.25)', borderRight: '1px solid rgba(183,255,97,0.25)' },
            { bottom: 10, left: 10,  borderBottom: '1px solid rgba(183,255,97,0.25)', borderLeft:  '1px solid rgba(183,255,97,0.25)' },
            { bottom: 10, right: 10, borderBottom: '1px solid rgba(183,255,97,0.25)', borderRight: '1px solid rgba(183,255,97,0.25)' },
          ].map((s, i) => (
            <div key={i} style={{ position: 'absolute', width: 14, height: 14, ...s }} />
          ))}
          <MarkovChain />
        </div>
      </div>
    </section>
  );
}
