'use client';
import React from 'react';
import { MapPin } from 'lucide-react';
import GmailIcon from './icons/GmailIcon';
import LinkedinIcon from './icons/LinkedinIcon';
import GithubIcon from './icons/GithubIcon';
import { PUBLIC_CONTACT } from '../config/public-contact.js';

const links = [
  { icon: <GmailIcon size={22} />, href: `mailto:${PUBLIC_CONTACT.email}`, label: 'Email' },
  { icon: <LinkedinIcon size={22} />, href: PUBLIC_CONTACT.linkedin, label: 'LinkedIn' },
  { icon: <GithubIcon size={22} />, href: PUBLIC_CONTACT.github, label: 'GitHub' },
];

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--glass-border)',
      padding: '1.5rem var(--page-pad)',
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      color: 'var(--text-muted)',
      fontSize: '0.82rem',
      fontFamily: 'Inter, sans-serif',
    }}>

      {/* Icon links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {links.map(({ icon, href, label }) => (
          <a
            key={label}
            href={href}
            target={href.startsWith('mailto') ? undefined : '_blank'}
            rel="noopener noreferrer"
            aria-label={label}
            title={label}
            style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
            onMouseOver={e => e.currentTarget.style.color = 'var(--neon-cyan)'}
            onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            {icon}
          </a>
        ))}

        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <MapPin size={14} />
          {PUBLIC_CONTACT.location}
        </span>
      </div>

      {/* Copyright */}
      <span>© {new Date().getFullYear()} Hrishikesh Upadhyaya</span>

    </footer>
  );
}
