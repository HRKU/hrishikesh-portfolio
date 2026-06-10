'use client';
import React, { useState, useRef, useEffect } from 'react';

export default function ChatWithMe() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Initializing neural link... \n\nHi! I'm the AI representation of Hrishikesh, powered by Groq and Llama 3. Ask me about his tech stack, projects, or experience!" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });

      if (!res.ok) {
        if (res.status === 429) throw new Error("Rate limit exceeded. Please wait a moment.");
        throw new Error('Failed to reach AI Core.');
      }

      const data = await res.json();
      setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: `[SYSTEM ERROR]: ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="chat" className="container section">
      <h2 style={{ textAlign: 'center', width: '100%' }}>Talk To My Digital Twin</h2>
      
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem' }}>
        <div className="glass" style={{ 
          width: '100%', 
          maxWidth: '800px', 
          display: 'flex', 
          flexDirection: 'column', 
          height: 'min(600px, 78svh)', 
          minHeight: '460px',
          overflow: 'hidden',
          background: 'rgba(5, 5, 8, 0.8)',
          boxShadow: '0 0 50px rgba(0, 240, 255, 0.05)'
        }}>
          {/* Terminal Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '1rem', 
            background: 'rgba(255,255,255,0.03)',
            borderBottom: '1px solid var(--glass-border)'
          }}>
            <div style={{ display: 'flex' }}>
              <span className="mac-btn mac-close"></span>
              <span className="mac-btn mac-min"></span>
              <span className="mac-btn mac-max"></span>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: 'clamp(0.72rem, 2.6vw, 0.85rem)', fontFamily: 'monospace', textAlign: 'center' }}>
              hrishikesh@ai-core ~ bash
            </span>
            <div style={{ width: '44px' }}></div> {/* Spacer for centering */}
          </div>

          {/* Chat Window */}
          <div style={{ 
            flexGrow: 1, 
            padding: 'clamp(1rem, 4vw, 2rem)', 
            overflowY: 'auto', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1.5rem',
            fontFamily: 'monospace',
            fontSize: 'clamp(0.82rem, 2.4vw, 1rem)'
          }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ 
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: 'min(85%, 620px)'
              }}>
                <div style={{ 
                  color: msg.role === 'user' ? 'var(--neon-cyan)' : 'var(--neon-pink)', 
                  marginBottom: '0.5rem', 
                  fontWeight: 'bold' 
                }}>
                  {msg.role === 'user' ? '> visitor@guest' : '> hrishikesh@ai'}
                </div>
                <div style={{ 
                  color: 'var(--text-main)', 
                  lineHeight: 1.6, 
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'anywhere'
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ color: 'var(--text-muted)' }}>
                {'>'} hrishikesh@ai is computing... <span className="animate-pulse">_</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input Area */}
          <form onSubmit={sendMessage} style={{ 
            display: 'flex', 
            padding: 'clamp(1rem, 3vw, 1.5rem)', 
            borderTop: '1px solid var(--glass-border)', 
            background: 'rgba(0,0,0,0.4)',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <span style={{ color: 'var(--neon-cyan)', fontWeight: 'bold' }}>$</span>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Execute command or ask a question..." 
              style={{ 
                flexGrow: 1, 
                minWidth: 0,
                background: 'transparent', 
                border: 'none', 
                color: 'white',
                outline: 'none',
                fontFamily: 'monospace',
                fontSize: '1rem'
              }}
            />
            <button 
              type="submit" 
              disabled={isLoading}
              style={{ 
                padding: '0.75rem clamp(1rem, 4vw, 2rem)', 
                background: 'var(--text-main)', 
                color: '#000', 
                border: 'none', 
                borderRadius: '4px', 
                fontWeight: 'bold',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontFamily: 'Space Grotesk'
              }}>
              RETURN
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
