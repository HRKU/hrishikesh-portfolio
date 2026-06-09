'use client';
import { useState } from 'react';
import Hero from '@/components/Hero';
import Skills from '@/components/Skills';
import Experience from '@/components/Experience';
import Projects from '@/components/Projects';
import FloatingChat from '@/components/FloatingChat';

export default function Home() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <main>
      <Hero onOpenChat={() => setChatOpen(true)} />
      <Skills />
      <Experience />
      <Projects />
      <FloatingChat isOpen={chatOpen} setIsOpen={setChatOpen} />
    </main>
  );
}
