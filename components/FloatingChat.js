'use client';
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Defined outside component so it's not recreated on every render
const INITIAL_MESSAGE = {
  role: 'assistant',
  content: "Hi! I'm the AI representation of Hrishikesh. I can answer questions about his experience, tech stack, and why he'd be a great fit for your team!"
};

export default function FloatingChat({ isOpen, setIsOpen }) {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Track whether the user has ever sent a message (controls starter chip visibility)
  const [hasInteracted, setHasInteracted] = useState(false);
  const messagesEndRef = useRef(null);

  const starterQuestions = [
    "Why should we hire Hrishikesh?",
    "What is his core tech stack?",
    "Tell me about his AI experience."
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Only scroll when messages or loading state changes — not when the panel opens/closes
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const clearChat = () => {
    setMessages([INITIAL_MESSAGE]);
    setHasInteracted(false);
  };

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    const userMessage = { role: 'user', content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setHasInteracted(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });

      if (res.status === 429) {
        setMessages([...newMessages, { role: 'assistant', content: "I'm getting too many requests right now. Please wait a moment before trying again." }]);
        return;
      }

      if (!res.ok) {
        setMessages([...newMessages, { role: 'assistant', content: "Something went wrong on my end. Please try again shortly." }]);
        return;
      }

      const data = await res.json();
      const reply = data.reply?.trim() || "I couldn't generate a response. Please try again.";
      setMessages([...newMessages, { role: 'assistant', content: reply }]);
    } catch {
      // Don't expose raw error messages — they can contain server internals
      setMessages([...newMessages, { role: 'assistant', content: "Connection issue. Please check your network and try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(45deg, var(--neon-cyan), var(--neon-violet))',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0, 240, 255, 0.4)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          transition: 'transform 0.3s ease',
          transform: isOpen ? 'rotate(90deg) scale(0.9)' : 'rotate(0deg) scale(1)'
        }}
      >
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
      </button>

      {/* Sidebar Panel */}
      <div className="glass" style={{
        position: 'fixed',
        bottom: '5.5rem',
        right: '2rem',
        width: '400px',
        maxWidth: 'calc(100vw - 4rem)',
        height: '600px',
        maxHeight: 'calc(100vh - 8rem)',
        background: 'rgba(10, 10, 15, 0.95)',
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'auto' : 'none',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '1rem', 
          background: 'rgba(255,255,255,0.03)',
          borderBottom: '1px solid var(--glass-border)'
        }}>
          <div style={{ display: 'flex' }}>
            <span className="mac-btn mac-close" onClick={() => setIsOpen(false)} style={{cursor: 'pointer'}}></span>
            <span className="mac-btn mac-min"></span>
            <span className="mac-btn mac-max"></span>
          </div>
          <span style={{ color: 'var(--text-main)', fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: 'bold' }}>
            Digital Twin
          </span>
          <button 
            onClick={clearChat}
            title="Clear Chat"
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <Trash2 size={18} />
          </button>
        </div>

        {/* Chat Window */}
        <div style={{ 
          flexGrow: 1, 
          padding: '1.5rem', 
          overflowY: 'auto', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1.2rem',
          fontFamily: 'monospace',
          fontSize: '0.9rem'
        }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{ 
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '90%'
            }}>
              <div style={{ 
                color: msg.role === 'user' ? 'var(--neon-cyan)' : 'var(--neon-pink)', 
                marginBottom: '0.3rem', 
                fontWeight: 'bold',
                fontSize: '0.8rem'
              }}>
                {msg.role === 'user' ? '> visitor' : '> hrishikesh@ai'}
              </div>
              <div style={{ 
                color: 'var(--text-main)', 
                lineHeight: 1.5,
                background: msg.role === 'user' ? 'rgba(0, 240, 255, 0.05)' : 'transparent',
                padding: msg.role === 'user' ? '0.5rem 1rem' : '0',
                borderRadius: '8px'
              }}>
                {msg.role === 'user' ? (
                  <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                ) : (
                  <ReactMarkdown
                    components={{
                      code({node, inline, className, children, ...props}) {
                        return !inline ? (
                          <pre style={{ background: 'rgba(0,0,0,0.5)', padding: '1rem', borderRadius: '4px', overflowX: 'auto', marginTop: '0.5rem', border: '1px solid var(--glass-border)' }}>
                            <code className={className} {...props}>{children}</code>
                          </pre>
                        ) : (
                          <code style={{ background: 'rgba(255,255,255,0.1)', padding: '0.1rem 0.3rem', borderRadius: '3px' }} {...props}>{children}</code>
                        )
                      }
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div style={{ color: 'var(--neon-pink)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 'bold' }}>&gt; computing</span> 
              <span className="animate-pulse" style={{ background: 'var(--neon-pink)', width: '8px', height: '14px', display: 'inline-block' }}></span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Starter Questions — shown only until the user sends their first message */}
        {!isLoading && !hasInteracted && (
          <div style={{ padding: '0 1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
            {starterQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(q)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--neon-cyan)',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  fontFamily: 'Inter'
                }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <form onSubmit={handleSubmit} style={{ 
          display: 'flex', 
          padding: '1rem', 
          borderTop: '1px solid var(--glass-border)', 
          background: 'rgba(0,0,0,0.4)',
          alignItems: 'center'
        }}>
          <span style={{ color: 'var(--neon-cyan)', marginRight: '0.5rem', fontWeight: 'bold' }}>$</span>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..." 
            style={{ 
              flexGrow: 1, 
              background: 'transparent', 
              border: 'none', 
              color: 'white',
              outline: 'none',
              fontFamily: 'monospace',
              fontSize: '0.9rem'
            }}
          />
          <button 
            type="submit" 
            disabled={isLoading}
            style={{ 
              padding: '0.5rem 1rem', 
              marginLeft: '0.5rem', 
              background: 'var(--text-main)', 
              color: '#000', 
              border: 'none', 
              borderRadius: '4px', 
              fontWeight: 'bold',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontFamily: 'Space Grotesk',
              fontSize: '0.8rem'
            }}>
            ↵
          </button>
        </form>
      </div>
    </>
  );
}
