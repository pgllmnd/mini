import { useState, useRef, useEffect } from 'react';
import api from '../lib/api';

interface ChatPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatPopup({ isOpen, onClose }: ChatPopupProps) {
  const [messages, setMessages] = useState<{ role: 'user'|'bot'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      // Auto scroll to bottom when messages change
      if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }
    }
  }, [isOpen, messages]);

  const send = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
  const { data } = await api.post('/chat', { message: text }, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });

      const reply = data?.reply || 'No reply';
      setMessages(prev => [...prev, { role: 'bot', text: String(reply) }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: 'Error contacting chat service' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Chat popup */}
      <div
        className={
          `fixed bottom-0 z-[9999] transition-all duration-300 ease-in-out transform ` +
          // Mobile: full-width bottom sheet; Desktop (sm+): right-side card
          `inset-x-0 sm:left-[164px] sm:bottom-0 sm:w-[380px] w-full ` +
          `h-[60vh] sm:h-[350px] flex flex-col rounded-t-lg sm:rounded-t-lg ` +
          `bg-white border border-gray-200 text-gray-800 shadow-2xl ` +
          (isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-full pointer-events-none')
        }
      >
        {/* Header avec titre */}
        <div className="flex justify-between items-center px-3 py-2 border-b border-gray-200 bg-white">
          <div className="flex items-center">
            <span className="material-symbols-outlined mr-2 text-[var(--link-color)]">smart_toy</span>
            <h3 className="text-sm font-semibold">Assistant IA</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark"
            style={{ minWidth: 44, minHeight: 44 }}
            aria-label="Close chat"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Messages */}
        <div
          ref={chatRef}
          className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-gray-50"
          style={{ paddingBottom: 12 }}
        >
          {messages.length === 0 && (
            <div className="text-center text-gray-500 text-xs py-4">
              Posez une question à l'assistant IA
            </div>
          )}
          {messages.map((message, index) => (
            <div 
              key={`${message.role}-${index}-${message.text.substring(0, 10)}`}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] px-3 py-2 text-sm rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white text-gray-800 border border-gray-200'
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="px-3 py-2 rounded-lg text-sm bg-white border border-gray-200 text-gray-600 flex items-center">
                <span className="animate-pulse mr-2">●</span>
                Assistant réfléchit...
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-3 py-2 border-t border-gray-200 bg-white">
          <div className="flex gap-2 items-center">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Votre question..."
              className="flex-1 px-3 py-3 text-sm rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
              disabled={loading}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="p-3 rounded-full disabled:opacity-50 flex items-center justify-center bg-blue-500 text-white hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
              style={{ minWidth: 44, minHeight: 44 }}
            >
              <span className="material-symbols-outlined text-lg">
                {loading ? 'more_horiz' : 'send'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}