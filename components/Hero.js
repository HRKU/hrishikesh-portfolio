'use client';
import React from 'react';

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
