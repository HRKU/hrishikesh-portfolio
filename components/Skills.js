import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function Skills() {
  const skills = [
    { category: 'Languages', items: ['JavaScript', 'TypeScript', 'Python', 'Java', 'HTML', 'CSS'] },
    { category: 'AI / GenAI', items: ['Multi-agent Systems (AutoGen)', 'Azure OpenAI', 'RAG Pipelines', 'Vector Search', 'LLM Tool-calling', 'Ollama'] },
    { category: 'Frontend & Backend', items: ['React.js', 'Next.js', 'Node.js', 'Express', 'React Native', 'REST APIs'] },
    { category: 'Cloud & DevOps', items: ['Azure (Container Registry, App Services, DevOps)', 'Docker', 'PowerShell', 'CI/CD', 'VPS', 'MongoDB', 'SQL', 'Git'] }
  ];

  return (
    <section id="skills" className="container section">
      <h2>Technical Arsenal</h2>
      <div className="responsive-grid">
        {skills.map((skillGroup, idx) => (
          <div key={idx} className="glass card-pad">
            <h3 style={{ color: 'var(--neon-violet)', marginBottom: '1rem', fontSize: '1.2rem' }}>{skillGroup.category}</h3>
            <ul style={{ listStyle: 'none' }}>
              {skillGroup.items.map((item, i) => (
                <li key={i} style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center' }}>
                    <CheckCircle2 size={16} />
                  </span> {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
