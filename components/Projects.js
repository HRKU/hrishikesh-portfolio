import React from 'react';
import { FolderGit2 } from 'lucide-react';
import CardSlider, { CardSliderSlide } from './CardSlider';

export default function Projects() {
  const projects = [
    {
      title: 'Run2Feed Marathon Platform',
      tech: 'Next.js, Node.js, Docker, VPS, Easebuzz',
      badge: 'Volunteer · ISKCON Temple',
      description: 'Built and deployed a full-stack charity marathon platform as volunteer work for ISKCON Temple (Pune area), with event management, participant registration, Easebuzz payment integration, and an admin dashboard. Managed Dockerized VPS deployment, domain config, and SSL setup.'
    },
    {
      title: 'Ticketing System Web App',
      tech: 'React.js, TypeScript, Node.js, MongoDB',
      description: 'Role-based ticketing platform with reusable components, structured state management, and secure REST APIs for authentication and ticket lifecycle workflows.'
    },
    {
      title: 'Modern Business Website',
      tech: 'Next.js, Tailwind CSS, TypeScript, Vercel',
      description: 'Responsive production website with Zod validation, Cloudflare Turnstile CAPTCHA, custom domain, and 90+ Lighthouse scores for performance and SEO.'
    }
  ];

  return (
    <section id="projects" className="container section">
      <h2>Some Things I've Built</h2>
      <CardSlider ariaLabel="Some things I've built project cards">
        {projects.map((project, idx) => (
          <CardSliderSlide key={idx}>
            <div className="glass card-pad" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ color: 'var(--neon-violet)' }}>
                  <FolderGit2 size={36} />
                </div>
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: project.badge ? '0.5rem' : '1rem', color: '#fff' }}>{project.title}</h3>
              {project.badge && (
                <span className="project-volunteer-badge">{project.badge}</span>
              )}
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', flexGrow: 1 }}>{project.description}</p>
              <p style={{ color: 'var(--neon-cyan)', fontSize: '0.9rem', fontFamily: 'monospace', overflowWrap: 'anywhere' }}>{project.tech}</p>
            </div>
          </CardSliderSlide>
        ))}
      </CardSlider>
    </section>
  );
}
