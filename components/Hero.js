'use client';
import React from 'react';

export default function Hero({ onOpenChat }) {
  return (
    <section className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: '5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center', width: '100%' }}>
        
        {/* Left Column - Text */}
        <div className="animate-fade-in-up">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '40px', height: '2px', background: 'var(--neon-cyan)' }}></div>
            <p style={{ color: 'var(--neon-cyan)', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: '600' }}>
              Full Stack & AI Engineer
            </p>
          </div>
          
          <h1 style={{ fontSize: '5.5rem', lineHeight: '1.1', marginBottom: '1.5rem', fontWeight: 800 }}>
            Building the <br />
            <span className="glowing-text">future of web</span>
          </h1>
          
          <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '3rem', maxWidth: '500px', lineHeight: '1.8' }}>
            Hi, I'm <strong>Hrishikesh Upadhyaya</strong>. I architect scalable Next.js applications and engineer multi-agent AI workflows.
          </p>
          
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <button onClick={onOpenChat} style={{
              padding: '1.2rem 2.5rem',
              background: 'var(--text-main)',
              color: 'var(--bg-color)',
              borderRadius: '50px',
              fontWeight: '700',
              letterSpacing: '1px',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(255,255,255,0.1)',
              border: 'none',
              cursor: 'pointer'
            }}>
              Chat with my AI
            </button>
            <a href="#projects" style={{ 
              padding: '1.2rem 2.5rem', 
              background: 'transparent', 
              border: '2px solid rgba(255,255,255,0.1)', 
              color: 'var(--text-main)', 
              borderRadius: '50px', 
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--neon-cyan)'; e.currentTarget.style.color = 'var(--neon-cyan)'; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-main)'; }}>
              View Projects
            </a>
          </div>
        </div>

        {/* Right Column - Visual Graphic */}
        <div className="animate-float" style={{ position: 'relative', height: '500px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ 
            position: 'absolute', 
            width: '350px', 
            height: '350px', 
            background: 'linear-gradient(45deg, var(--neon-cyan), var(--neon-violet))',
            borderRadius: '50%',
            filter: 'blur(80px)',
            opacity: 0.5,
            animation: 'pulseGlow 4s infinite'
          }}></div>
          
          <div className="glass" style={{ 
            width: '380px', 
            height: '450px', 
            position: 'relative', 
            zIndex: 10,
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'rgba(10, 10, 15, 0.7)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex' }}>
                <span className="mac-btn mac-close"></span>
                <span className="mac-btn mac-min"></span>
                <span className="mac-btn mac-max"></span>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'monospace' }}>server.js</span>
            </div>
            
            <div style={{ fontFamily: 'monospace', color: 'var(--neon-cyan)', fontSize: '0.95rem', lineHeight: '1.8' }}>
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
