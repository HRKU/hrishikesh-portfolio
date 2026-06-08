import Hero from '@/components/Hero';
import Skills from '@/components/Skills';
import Experience from '@/components/Experience';
import Projects from '@/components/Projects';
import FloatingChat from '@/components/FloatingChat';

export default function Home() {
  return (
    <main>
      <Hero />
      <Skills />
      <Experience />
      <Projects />
      <FloatingChat />
    </main>
  );
}
