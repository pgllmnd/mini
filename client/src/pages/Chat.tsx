import { useState, useRef } from 'react';
import api from '../lib/api';

export default function Chat() {
  const [messages, setMessages] = useState<{ role: 'user'|'bot'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

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

      // scroll
      setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 50);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: 'Error contacting chat service' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Assistant</h2>
      <div className="rounded-md p-4 h-96 overflow-auto" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
        {messages.map((m, i) => (
          <div key={`${m.role}-${i}-${m.text.substring(0, 10)}`} className={`mb-3 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block px-3 py-2 rounded`} style={m.role === 'user' ? { backgroundColor: 'var(--primary)', color: 'white' } : { backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}>
              {m.text}
            </div>
          </div>
        ))}
        <div ref={ref} />
      </div>

      <div className="flex mt-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 rounded px-3 py-2 mr-2"
          style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--text-primary)' }}
          placeholder="Posez votre question..."
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
        />
        <button className="px-4 py-2 rounded" onClick={send} disabled={loading} style={{ backgroundColor: 'var(--primary)', color: 'white' }}>
          {loading ? '...' : 'Envoyer'}
        </button>
      </div>
    </div>
  );
}
