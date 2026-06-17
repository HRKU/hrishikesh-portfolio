'use client';
import { useState } from 'react';
import Hero from '@/components/Hero';
import Skills from '@/components/Skills';
import Experience from '@/components/Experience';
import Projects from '@/components/Projects';
import Arsenal from '@/components/Arsenal';
import Contact from '@/components/Contact';
import FloatingChat from '@/components/FloatingChat';

export default function Home() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <main style={{ paddingTop: '64px' }}>
      <Hero onOpenChat={() => setChatOpen(true)} />
      <Skills />
      <Experience />
      <Projects />
      <Arsenal />
      <Contact />
      <FloatingChat isOpen={chatOpen} setIsOpen={setChatOpen} />
    </main>
  );
}
