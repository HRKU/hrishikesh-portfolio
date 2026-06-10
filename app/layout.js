import './globals.css'
import TechBackground from '@/components/TechBackground';

export const metadata = {
  title: 'Hrishikesh Upadhyaya | Full Stack & AI Developer',
  description: 'Portfolio of Hrishikesh Upadhyaya, showcasing Full Stack Engineering and AI/GenAI expertise.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <TechBackground />
        <div style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </div>
      </body>
    </html>
  )
}
