'use client';
import { useState, useEffect, useRef } from 'react';
import { Bot, Globe, Wrench, Shield, Cpu, Layers } from 'lucide-react';

const CATEGORIES = ['All', 'AI / LLM', 'Full Stack', 'Internal Tools', 'Enterprise'];

const CATEGORY_META = {
  'AI / LLM':       { color: '#00f0ff', shadow: 'rgba(0,240,255,0.35)',  bg: 'rgba(0,240,255,0.08)'   },
  'Full Stack':     { color: '#8a2be2', shadow: 'rgba(138,43,226,0.35)', bg: 'rgba(138,43,226,0.08)' },
  'Internal Tools': { color: '#ff007f', shadow: 'rgba(255,0,127,0.35)',  bg: 'rgba(255,0,127,0.08)'  },
  'Enterprise':     { color: '#00e5ff', shadow: 'rgba(0,229,255,0.35)',  bg: 'rgba(0,229,255,0.06)'  },
};

const CATEGORY_ICONS = {
  'AI / LLM':       Bot,
  'Full Stack':     Globe,
  'Internal Tools': Wrench,
  'Enterprise':     Shield,
};

const TECH_COLORS = {
  'Next.js':       '#ffffff',
  'React':         '#61dafb',
  'React.js':      '#61dafb',
  'Node.js':       '#68d391',
  'TypeScript':    '#3b82f6',
  'Python':        '#fbbf24',
  'Docker':        '#38bdf8',
  'MongoDB':       '#4ade80',
  'Azure OpenAI':  '#00f0ff',
  'AutoGen':       '#00f0ff',
  'Azure':         '#60a5fa',
  'Ollama':        '#a78bfa',
  'Groq':          '#f472b6',
  'Llama':         '#fb923c',
  'Tailwind':      '#38bdf8',
  'Tailwind CSS':  '#38bdf8',
  'Zod':           '#818cf8',
  'Easebuzz':      '#34d399',
  'VPS':           '#94a3b8',
  'Teams':         '#818cf8',
  'Discord':       '#a78bfa',
  'RAG':           '#00f0ff',
  '.NET':          '#818cf8',
  'PowerShell':    '#60a5fa',
  'CI/CD':         '#fb923c',
  'Vercel':        '#ffffff',
  'Cloudflare':    '#f97316',
  'Azure AI Search': '#38bdf8',
  'Azure DevOps':  '#60a5fa',
  'JWT':           '#fbbf24',
  'REST APIs':     '#4ade80',
};

const projects = [
  {
    title: 'AI Scrum Assistant',
    category: 'AI / LLM',
    description: 'Self-hosted LLM-powered Scrum assistant integrated into team collaboration channels for sprint planning, standups, and retrospectives.',
    tech: ['Ollama', 'Node.js', 'Teams', 'Discord'],
    metrics: ['Teams + Discord', 'Locally-hosted LLM', 'Real-time updates'],
  },
  {
    title: 'Portfolio AI Chatbot',
    category: 'AI / LLM',
    description: 'Intelligent conversational agent on this portfolio with Groq-powered Llama inference, adaptive rate-limiting, and built-in security detection.',
    tech: ['Groq', 'Llama', 'Node.js', 'Next.js'],
    metrics: ['Security detection', 'Rate limiting', 'Sub-100ms response'],
  },
  {
    title: 'Run2Feed Marathon Platform',
    category: 'Full Stack',
    description: 'End-to-end charity marathon platform with participant registration, event management, payment integration, and a full admin dashboard.',
    tech: ['Next.js', 'Node.js', 'Docker', 'VPS', 'Easebuzz'],
    metrics: ['Deployed on VPS', 'Docker + SSL', 'Live payments'],
  },
  {
    title: 'Ticketing System',
    category: 'Full Stack',
    description: 'Role-based enterprise ticketing platform with reusable component library, structured state management, and secure REST APIs for full ticket lifecycle.',
    tech: ['React.js', 'TypeScript', 'Node.js', 'MongoDB', 'JWT'],
    metrics: ['Role-based access', 'Full lifecycle', 'REST APIs'],
  },
  {
    title: 'Modern Business Website',
    category: 'Full Stack',
    description: 'Production business site with server-side validation, Cloudflare Turnstile CAPTCHA, custom domain configuration, and optimized Core Web Vitals.',
    tech: ['Next.js', 'Tailwind CSS', 'Zod', 'Cloudflare', 'Vercel'],
    metrics: ['90+ Lighthouse', 'Custom domain', 'Turnstile CAPTCHA'],
  },
  {
    title: 'Cbell CMS Platform',
    category: 'Full Stack',
    description: 'Content management system built with a React frontend and .NET backend, enabling editors to manage structured content with a MongoDB data layer.',
    tech: ['React.js', '.NET', 'MongoDB', 'REST APIs'],
    metrics: ['Content management', '.NET + React', 'Structured CMS'],
  },
  {
    title: 'Appraisal Management System',
    category: 'Internal Tools',
    description: 'Internal HR tool streamlining employee performance appraisal cycles with configurable review workflows and management dashboards.',
    tech: ['Next.js', 'Node.js', 'MongoDB'],
    metrics: ['HR workflow automation', 'Manager dashboards', 'Configurable cycles'],
  },
  {
    title: 'Event Management System',
    category: 'Internal Tools',
    description: 'Full-stack internal event coordination platform supporting registration, scheduling, venue management, and attendee tracking at scale.',
    tech: ['React.js', 'Node.js', 'MongoDB', 'REST APIs'],
    metrics: ['Multi-event support', 'Attendee tracking', 'Admin panel'],
  },
  {
    title: 'Fintech Banking Modules',
    category: 'Internal Tools',
    description: 'Suite of 13+ React dashboard modules for a banking client, covering core financial operations, reporting, and customer-facing self-service portals.',
    tech: ['React.js', 'TypeScript', 'REST APIs'],
    metrics: ['13+ UI modules', 'Banking domain', 'Complex data viz'],
  },
  {
    title: 'Cybersecurity AI Platform',
    category: 'Enterprise',
    description: 'End-to-end enterprise cybersecurity platform built on Azure. A multi-agent AI chatbot (AutoGen + GPT-4o) queries a RAG pipeline backed by Azure AI Search to answer security queries over proprietary knowledge bases. Paired with a Python infrastructure scanner, a Next.js analyst dashboard, and fully automated Azure DevOps CI/CD — covering detection, analysis, and triage in one integrated system.',
    tech: ['AutoGen', 'Azure OpenAI', 'RAG', 'Azure AI Search', 'Python', 'Next.js', 'Azure DevOps', 'CI/CD', 'PowerShell'],
    metrics: ['Multi-agent orchestration', 'RAG-powered retrieval', 'Infra scanner + dashboard', 'Azure DevOps pipeline'],
  },
];

function TechBadge({ tech }) {
  const color = TECH_COLORS[tech] || 'rgba(255,255,255,0.55)';
  return (
    <span style={{
      display: 'inline-block',
      padding: '0.2rem 0.65rem',
      borderRadius: '999px',
      fontSize: '0.72rem',
      fontFamily: 'monospace',
      fontWeight: 600,
      color,
      background: `${color}18`,
      border: `1px solid ${color}40`,
      whiteSpace: 'nowrap',
    }}>
      {tech}
    </span>
  );
}

function MetricPill({ text }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.3rem',
      padding: '0.15rem 0.55rem',
      borderRadius: '999px',
      fontSize: '0.7rem',
      color: 'rgba(240,240,245,0.65)',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.07)',
    }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--neon-cyan)', flexShrink: 0 }} />
      {text}
    </span>
  );
}

function ProjectCard({ project, index }) {
  const meta = CATEGORY_META[project.category];
  const Icon = CATEGORY_ICONS[project.category];
  const cardRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'rgba(14, 14, 22, 0.55)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        border: `1px solid ${hovered ? meta.color + '55' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: '18px',
        padding: '1.6rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
        transition: 'transform 0.3s cubic-bezier(0.22,1,0.36,1), border-color 0.3s ease, box-shadow 0.3s ease',
        transform: hovered ? 'translateY(-6px) scale(1.015)' : visible ? 'translateY(0) scale(1)' : 'translateY(28px) scale(0.97)',
        opacity: visible ? 1 : 0,
        boxShadow: hovered
          ? `0 16px 48px ${meta.shadow}, 0 0 0 1px ${meta.color}20`
          : '0 4px 24px rgba(0,0,0,0.45)',
        animationDelay: `${index * 60}ms`,
      }}
    >
      {/* Ambient glow orb */}
      <div style={{
        position: 'absolute',
        top: '-40px',
        right: '-40px',
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        background: meta.color,
        opacity: hovered ? 0.12 : 0.04,
        filter: 'blur(40px)',
        transition: 'opacity 0.4s ease',
        pointerEvents: 'none',
      }} />

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: meta.bg,
          border: `1px solid ${meta.color}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: meta.color,
          flexShrink: 0,
        }}>
          <Icon size={20} />
        </div>
        <span style={{
          fontSize: '0.68rem',
          fontWeight: 700,
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          color: meta.color,
          background: meta.bg,
          border: `1px solid ${meta.color}30`,
          borderRadius: '999px',
          padding: '0.2rem 0.7rem',
        }}>
          {project.category}
        </span>
      </div>

      {/* Title */}
      <h3 style={{
        fontSize: '1.1rem',
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 700,
        color: '#fff',
        lineHeight: 1.3,
        margin: 0,
      }}>
        {project.title}
      </h3>

      {/* Description */}
      <p style={{
        fontSize: '0.85rem',
        color: 'rgba(240,240,245,0.58)',
        lineHeight: 1.65,
        margin: 0,
        flexGrow: 1,
      }}>
        {project.description}
      </p>

      {/* Tech badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
        {project.tech.map(t => <TechBadge key={t} tech={t} />)}
      </div>

      {/* Metrics */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.35rem',
        paddingTop: '0.5rem',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        {project.metrics.map(m => <MetricPill key={m} text={m} />)}
      </div>
    </div>
  );
}

export default function Arsenal() {
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = activeCategory === 'All'
    ? projects
    : projects.filter(p => p.category === activeCategory);

  return (
    <section id="arsenal" className="container" style={{ padding: '5rem 0' }}>
      {/* Section heading */}
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>Technical Arsenal</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '560px', marginTop: '1.2rem' }}>
          A collection of production systems, AI workflows, and full-stack platforms built end-to-end.
        </p>
      </div>

      {/* Category filters */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.6rem',
        marginBottom: '2.5rem',
      }}>
        {CATEGORIES.map(cat => {
          const meta = cat === 'All' ? null : CATEGORY_META[cat];
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '0.45rem 1.2rem',
                borderRadius: '999px',
                border: isActive
                  ? `1px solid ${meta ? meta.color : 'var(--neon-cyan)'}88`
                  : '1px solid rgba(255,255,255,0.08)',
                background: isActive
                  ? (meta ? meta.bg : 'rgba(0,240,255,0.08)')
                  : 'transparent',
                color: isActive
                  ? (meta ? meta.color : 'var(--neon-cyan)')
                  : 'var(--text-muted)',
                fontSize: '0.82rem',
                fontWeight: 600,
                letterSpacing: '0.5px',
                cursor: 'pointer',
                transition: 'all 0.22s ease',
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              {cat}
              <span style={{
                marginLeft: '0.4rem',
                fontSize: '0.7rem',
                opacity: 0.7,
              }}>
                {cat === 'All' ? projects.length : projects.filter(p => p.category === cat).length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Project grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1.5rem',
      }}
        className="arsenal-grid"
      >
        {filtered.map((project, idx) => (
          <ProjectCard key={project.title} project={project} index={idx} />
        ))}
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .arsenal-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .arsenal-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
