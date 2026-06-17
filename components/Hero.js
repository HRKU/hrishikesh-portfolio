'use client';
import React from 'react';
import GmailIcon from './icons/GmailIcon';
import LinkedinIcon from './icons/LinkedinIcon';
import GithubIcon from './icons/GithubIcon';
import { PUBLIC_CONTACT } from '../config/public-contact.js';

export default function Hero({ onOpenChat }) {
  return (
    <section className="container hero-section">
      <div className="hero-grid">
        
        {/* Left Column - Text */}
        <div className="animate-fade-in-up">
          <div className="hero-kicker">
            <div className="hero-kicker-line"></div>
            <p style={{ color: 'var(--neon-cyan)', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: '600', fontSize: '0.82rem' }}>
              Full Stack & AI Engineer
            </p>
          </div>
          
          <h1 className="hero-title">
            Building the <br />
            <span className="glowing-text">future of web</span>
          </h1>
          
          <p className="hero-copy">
            Hi, I'm <strong>Hrishikesh Upadhyaya</strong>. I architect scalable Next.js applications and engineer multi-agent AI workflows.
          </p>

          {/* Social badge strip */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.65rem', margin: '1.4rem 0' }}>
            {[
              { icon: <GmailIcon size={22} />, href: `mailto:${PUBLIC_CONTACT.email}`, label: 'Email me' },
              { icon: <LinkedinIcon size={22} />, href: PUBLIC_CONTACT.linkedin, label: 'LinkedIn' },
              { icon: <GithubIcon size={22} />, href: PUBLIC_CONTACT.github, label: 'GitHub' },
            ].map(({ icon, href, label }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith('mailto') ? undefined : '_blank'}
                rel="noopener noreferrer"
                className="hero-social-badge"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.45rem 1rem',
                  borderRadius: '999px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'var(--text-main)',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  letterSpacing: '0.2px',
                  transition: 'border-color 0.2s, background 0.2s, color 0.2s, box-shadow 0.2s',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {icon}
                {label}
              </a>
            ))}
          </div>

          <div className="hero-actions">
            <button onClick={onOpenChat} className="pill-action" style={{
              background: 'var(--text-main)',
              color: 'var(--bg-color)',
              boxShadow: '0 4px 15px rgba(255,255,255,0.1)',
              border: 'none'
            }}>
              Chat with my AI
            </button>
            <a href="#projects" className="pill-action" style={{ 
              background: 'transparent', 
              border: '2px solid rgba(255,255,255,0.1)', 
              color: 'var(--text-main)', 
              fontWeight: '600'
            }}
            onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--neon-cyan)'; e.currentTarget.style.color = 'var(--neon-cyan)'; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-main)'; }}>
              View Projects
            </a>
            <a href="#contact" className="pill-action" style={{
              background: 'transparent',
              border: '2px solid rgba(0,240,255,0.25)',
              color: 'var(--neon-cyan)',
              fontWeight: '600'
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(0,240,255,0.08)'; e.currentTarget.style.borderColor = 'var(--neon-cyan)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(0,240,255,0.25)'; }}>
              Get In Touch
            </a>
          </div>
        </div>

        {/* Right Column - Visual Graphic */}
        <div className="animate-float hero-visual">
          <div className="hero-glow"></div>
          
          <div className="glass hero-terminal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex' }}>
                <span className="mac-btn mac-close"></span>
                <span className="mac-btn mac-min"></span>
                <span className="mac-btn mac-max"></span>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'monospace' }}>server.js</span>
            </div>
            
            <div className="terminal-code">
              <p><span style={{color: 'var(--neon-pink)'}}>const</span> developer = {'{'}</p>
              <p style={{paddingLeft: '1rem'}}>name: <span style={{color: '#e6db74'}}>'Hrishikesh'</span>,</p>
              <p style={{paddingLeft: '1rem'}}>skills: [<span style={{color: '#e6db74'}}>'Next.js'</span>, <span style={{color: '#e6db74'}}>'Azure'</span>, <span style={{color: '#e6db74'}}>'AI'</span>],</p>
              <p style={{paddingLeft: '1rem'}}>status: <span style={{color: '#e6db74'}}>'Building awesome stuff'</span></p>
              <p>{'};'}</p>
              <br/>
              <p><span style={{color: 'var(--neon-pink)'}}>await</span> developer.initialize();</p>
              <p style={{color: 'var(--text-muted)'}}>// System ready. Awaiting connection...</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
