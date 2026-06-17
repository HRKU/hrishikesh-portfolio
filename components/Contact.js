'use client';
import React, { useState } from 'react';
import { MapPin, Copy, Check, ExternalLink } from 'lucide-react';
import GmailIcon from './icons/GmailIcon';
import LinkedinIcon from './icons/LinkedinIcon';
import GithubIcon from './icons/GithubIcon';
import { PUBLIC_CONTACT } from '../config/public-contact.js';

export default function Contact() {
  const [copied, setCopied] = useState(false);

  const copyEmail = () => {
    navigator.clipboard.writeText(PUBLIC_CONTACT.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const rows = [
    {
      key: 'email',
      icon: <GmailIcon size={20} />,
      value: PUBLIC_CONTACT.email,
      action: (
        <button
          onClick={copyEmail}
          title="Copy email"
          style={{ background: 'transparent', border: 'none', color: copied ? 'var(--neon-cyan)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 0.25rem' }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      ),
    },
    {
      key: 'linkedin',
      icon: <LinkedinIcon size={20} />,
      value: 'linkedin.com/in/hrishikesh-upadhyaya',
      href: PUBLIC_CONTACT.linkedin,
    },
    {
      key: 'github',
      icon: <GithubIcon size={20} />,
      value: 'github.com/hrku',
      href: PUBLIC_CONTACT.github,
    },
    {
      key: 'location',
      icon: <MapPin size={15} />,
      value: PUBLIC_CONTACT.location,
    },
    {
      key: 'status',
      icon: null,
      value: 'open_to_opportunities',
      isStatus: true,
    },
  ];

  return (
    <section id="contact" className="container section">
      <h2>Get In Touch</h2>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2.5rem' }}>
        <div className="glass" style={{ width: '100%', maxWidth: '580px', fontFamily: 'monospace', fontSize: 'clamp(0.82rem, 2.2vw, 0.95rem)' }}>

          {/* Terminal header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
            <span className="mac-btn mac-close" />
            <span className="mac-btn mac-min" />
            <span className="mac-btn mac-max" />
            <span style={{ marginLeft: '0.75rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>contact.config</span>
          </div>

          {/* Rows */}
          <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ color: 'var(--neon-cyan)', margin: 0 }}>
              <span style={{ color: 'var(--text-muted)' }}>$</span> cat contact.config
            </p>

            {rows.map(({ key, icon, value, href, action, isStatus }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {/* Icon */}
                {icon && <span style={{ color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center' }}>{icon}</span>}

                {/* Value */}
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--text-main)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    onMouseOver={e => e.currentTarget.style.color = 'var(--neon-cyan)'}
                    onMouseOut={e => e.currentTarget.style.color = 'var(--text-main)'}
                  >
                    {value}
                    <ExternalLink size={12} style={{ opacity: 0.6 }} />
                  </a>
                ) : isStatus ? (
                  <span style={{ color: 'var(--neon-cyan)', background: 'rgba(0,240,255,0.08)', padding: '0.15rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(0,240,255,0.15)' }}>
                    {value}
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-main)' }}>{value}</span>
                )}

                {/* Optional inline action (copy) */}
                {action}
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
