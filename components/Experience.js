import React from 'react';
import { ChevronRight } from 'lucide-react';

const EXPERIENCE_BULLETS = [
  'Collaborated with stakeholders to gather business requirements, present UI/UX prototypes for approval, and facilitate requirement discussions. Provided effort estimates, pushed back on scope where needed, and defined phased delivery plans to ensure critical features shipped on time. Maintained MoMs and communication records to keep projects transparent and accountable across teams.',
  'Led the implementation of the AI-powered scoring and findings pipeline on the PQC cybersecurity platform, translating business requirements into scalable logic, handling edge cases, and maintaining comprehensive technical documentation to support long-term product evolution and serve as the point of accountability for team and client queries.',
  'Developed a multi-agent chatbot with a RAG pipeline and integrated REST APIs, asynchronous services, and RabbitMQ-based event-driven workflows, collaborating across a cross-functional team of frontend, backend, and AI developers to deliver scalable and well-integrated solutions.',
  'Implemented and maintained CI/CD pipelines using Azure DevOps, Azure Container Registry, App Services, and PowerShell to streamline application deployments. Supported production environments by monitoring releases, troubleshooting deployment issues, and coordinating timely resolutions to ensure service reliability.',
  'Led development efforts on a derailed Creative Media Management platform, rapidly understanding the scope, prioritising tasks, and coordinating junior developers to bring the project to 80% completion within the first month. Presented client demos, gathered feedback, and translated requirements into actionable development tasks to keep delivery on track.',
  'Spearheaded the design and end-to-end delivery of 13+ banking modules and dashboards in Next.js, driving the full lifecycle from requirements analysis and UX design through stakeholder reviews, developer handoffs, and production support. Established a standardised design system covering typography, branding, and reusable UI components to improve consistency and accelerate delivery across the team.',
];

export default function Experience() {
  return (
    <section id="experience" className="container section">
      <h2>Where I've Worked</h2>
      <div className="glass experience-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', gap: '1rem' }}>
          <div>
            <h3 className="experience-title">Full Stack Software Developer <span style={{ color: 'var(--neon-cyan)' }}>@ Candent Technologies</span></h3>
            <p style={{ color: 'var(--text-muted)' }}>Mar 2023 - Present | Pune, IN</p>
          </div>
        </div>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {EXPERIENCE_BULLETS.map((bullet, idx) => (
            <li key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--neon-cyan)', marginTop: '0.2rem', flexShrink: 0 }}>
                <ChevronRight size={18} />
              </span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
