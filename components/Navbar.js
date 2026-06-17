'use client';
import React, { useState, useEffect } from 'react';
import GmailIcon from './icons/GmailIcon';
import LinkedinIcon from './icons/LinkedinIcon';
import GithubIcon from './icons/GithubIcon';
import { PUBLIC_CONTACT } from '../config/public-contact.js';

const NAV_LINKS = [
  { label: 'Experience', href: '#experience' },
  { label: 'Projects', href: '#projects' },
  { label: 'Contact', href: '#contact' },
];

const SOCIAL_LINKS = [
  { icon: <GmailIcon size={20} />, href: `mailto:${PUBLIC_CONTACT.email}`, label: 'Email' },
  { icon: <LinkedinIcon size={20} />, href: PUBLIC_CONTACT.linkedin, label: 'LinkedIn' },
  { icon: <GithubIcon size={20} />, href: PUBLIC_CONTACT.github, label: 'GitHub' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNavClick = (e, href) => {
    e.preventDefault();
    setMenuOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 var(--page-pad)',
        transition: 'background 0.35s ease, backdrop-filter 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease',
        background: scrolled ? 'rgba(5, 5, 14, 0.65)' : 'transparent',
        backdropFilter: scrolled ? 'blur(24px)' : 'blur(0px)',
        WebkitBackdropFilter: scrolled ? 'blur(24px)' : 'blur(0px)',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
        boxShadow: scrolled ? '0 1px 40px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(0,240,255,0.04)' : 'none',
      }}>

        {/* Left — name */}
        <a
          href="#"
          onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: '1rem',
            color: 'var(--text-main)',
            letterSpacing: '0.3px',
            flexShrink: 0,
            textDecoration: 'none',
          }}
        >
          Hrishikesh<span style={{ color: 'var(--neon-cyan)' }}>.</span>
        </a>

        {/* Center — nav links (desktop only) */}
        <div className="navbar-links" style={{
          display: 'flex',
          gap: '2.5rem',
          alignItems: 'center',
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
        }}>
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              onClick={e => handleNavClick(e, href)}
              className="navbar-link"
              style={{
                fontSize: '0.83rem',
                fontWeight: 500,
                color: 'var(--text-muted)',
                letterSpacing: '0.4px',
                transition: 'color 0.2s',
              }}
            >
              {label}
            </a>
          ))}
        </div>

        {/* Right — social icons + hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: 'auto' }}>

          {/* Social icons — hidden on mobile */}
          <div className="navbar-socials" style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            {SOCIAL_LINKS.map(({ icon, href, label }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith('mailto') ? undefined : '_blank'}
                rel="noopener noreferrer"
                aria-label={label}
                className="navbar-icon-link"
                style={{
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  minWidth: 32,
                  minHeight: 32,
                  justifyContent: 'center',
                  transition: 'color 0.2s',
                }}
              >
                {icon}
              </a>
            ))}
          </div>

          {/* Hamburger — mobile only */}
          <button
            className="navbar-hamburger"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              display: 'none',
              flexDirection: 'column',
              gap: '5px',
              alignItems: 'center',
            }}
          >
            <span style={{ width: 20, height: 2, background: menuOpen ? 'var(--neon-cyan)' : 'currentColor', borderRadius: 2, display: 'block', transition: 'all 0.2s', transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
            <span style={{ width: 20, height: 2, background: menuOpen ? 'var(--neon-cyan)' : 'currentColor', borderRadius: 2, display: 'block', transition: 'all 0.2s', opacity: menuOpen ? 0 : 1 }} />
            <span style={{ width: 20, height: 2, background: menuOpen ? 'var(--neon-cyan)' : 'currentColor', borderRadius: 2, display: 'block', transition: 'all 0.2s', transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      <div style={{
        position: 'fixed',
        top: menuOpen ? '60px' : '50px',
        left: 0,
        right: 0,
        zIndex: 199,
        background: 'rgba(5, 5, 14, 0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: menuOpen ? '1.25rem var(--page-pad) 1.5rem' : '0 var(--page-pad)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        overflow: 'hidden',
        maxHeight: menuOpen ? '300px' : '0',
        opacity: menuOpen ? 1 : 0,
        transition: 'max-height 0.3s ease, opacity 0.3s ease, top 0.3s ease, padding 0.3s ease',
        pointerEvents: menuOpen ? 'all' : 'none',
      }}>
        {NAV_LINKS.map(({ label, href }) => (
          <a
            key={href}
            href={href}
            onClick={e => handleNavClick(e, href)}
            style={{ color: 'var(--text-main)', fontWeight: 500, fontSize: '1rem' }}
          >
            {label}
          </a>
        ))}
        <div style={{ display: 'flex', gap: '1.25rem', paddingTop: '0.25rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {SOCIAL_LINKS.map(({ icon, href, label }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith('mailto') ? undefined : '_blank'}
              rel="noopener noreferrer"
              aria-label={label}
              style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
            >
              {icon}
              <span>{label}</span>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
