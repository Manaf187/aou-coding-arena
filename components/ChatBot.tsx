
import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, MessageSquare, Loader } from 'lucide-react';
import { askAi } from '../services/apiClient'; // Changed to use API service
import { Button } from './ui/Button';

interface ChatBotProps {
  challengeTitle: string;
  challengeDesc: string;
  currentCode: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const ChatBot: React.FC<ChatBotProps> = ({ challengeTitle, challengeDesc, currentCode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm your AI mentor. I can give you hints, but I won't solve the problem for you. Stuck on logic?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
        const hint = await askAi(challengeTitle, challengeDesc, currentCode, userMsg);
        setMessages(prev => [...prev, { role: 'assistant', content: hint }]);
    } catch (e) {
        setMessages(prev => [...prev, { role: 'assistant', content: "Connection Error: Could not reach AI server." }]);
    } finally {
        setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 bg-aou-green text-aou-darker rounded-full shadow-[0_0_15px_rgba(0,255,65,0.5)] flex items-center justify-center hover:scale-110 transition-transform z-50"
      >
        <Bot size={28} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 md:w-96 h-[500px] bg-aou-panel border border-aou-green/30 rounded-lg flex flex-col shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-aou-border flex justify-between items-center bg-aou-darker rounded-t-lg">
        <div className="flex items-center gap-2">
          <Bot size={20} className="text-aou-green" />
          <span className="font-semibold text-white">AI Mentor</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
              msg.role === 'user' 
                ? 'bg-aou-green/10 text-aou-green border border-aou-green/20' 
                : 'bg-aou-border/50 text-gray-200'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-aou-border/50 p-3 rounded-lg flex items-center gap-2">
              <Loader size={14} className="animate-spin text-aou-green" />
              <span className="text-xs text-gray-400">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-aou-border bg-aou-darker rounded-b-lg flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask for a hint..."
          className="flex-1 bg-aou-panel border border-aou-border rounded px-3 py-2 text-sm text-white focus:border-aou-green focus:outline-none"
        />
        <Button size="sm" onClick={handleSend} disabled={isLoading}>
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
};
