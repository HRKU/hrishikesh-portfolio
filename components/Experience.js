import React from 'react';
import { ChevronRight } from 'lucide-react';

export default function Experience() {
  return (
    <section id="experience" className="container" style={{ padding: '5rem 0' }}>
      <h2>Where I've Worked</h2>
      <div className="glass" style={{ padding: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Full Stack Software Developer <span style={{ color: 'var(--neon-cyan)' }}>@ Candent Technologies</span></h3>
            <p style={{ color: 'var(--text-muted)' }}>Mar 2023 - Present | Pune, IN</p>
          </div>
        </div>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <li style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--neon-cyan)', marginTop: '0.2rem' }}>
              <ChevronRight size={18} />
            </span>
            <span>Built a multi-agent AI chatbot using AutoGen and Azure OpenAI (GPT-4o) for an enterprise cybersecurity platform focused on infrastructure asset analysis.</span>
          </li>
          <li style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--neon-cyan)', marginTop: '0.2rem' }}>
              <ChevronRight size={18} />
            </span>
            <span>Architected a separate RAG pipeline using Azure OpenAI text-embedding-3 and Azure AI Search for grounded, context-aware responses.</span>
          </li>
          <li style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--neon-cyan)', marginTop: '0.2rem' }}>
              <ChevronRight size={18} />
            </span>
            <span>Dockerized services and managed deployment workflows using Azure Container Registry (ACR), Azure DevOps, and App Services.</span>
          </li>
          <li style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--neon-cyan)', marginTop: '0.2rem' }}>
              <ChevronRight size={18} />
            </span>
            <span>Built an AI-powered Scrum assistant using Ollama and Node.js to automate standup data collection and summaries via Discord/Teams webhooks.</span>
          </li>
          <li style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--neon-cyan)', marginTop: '0.2rem' }}>
              <ChevronRight size={18} />
            </span>
            <span>Collaborated directly with stakeholders to deliver 13+ fintech modules and dashboards in Next.js.</span>
          </li>
        </ul>
      </div>
    </section>
  );
}
