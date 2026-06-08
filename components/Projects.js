import React from 'react';
import { FolderGit2 } from 'lucide-react';

export default function Projects() {
  const projects = [
    {
      title: 'Run2Feed Marathon Platform',
      tech: 'Next.js, Node.js, Docker, VPS, Easebuzz',
      description: 'Built and deployed a full-stack charity marathon platform with event management, participant registration, Easebuzz payment integration, and an admin dashboard. Managed Dockerized VPS deployment, domain config, and SSL setup.'
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
    <section id="projects" className="container" style={{ padding: '5rem 0' }}>
      <h2>Some Things I've Built</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {projects.map((project, idx) => (
          <div key={idx} className="glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ color: 'var(--neon-violet)' }}>
                <FolderGit2 size={36} />
              </div>
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#fff' }}>{project.title}</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', flexGrow: 1 }}>{project.description}</p>
            <p style={{ color: 'var(--neon-cyan)', fontSize: '0.9rem', fontFamily: 'monospace' }}>{project.tech}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
