import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

function QuickAsk() {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      // Quick ask from header intentionally doesn't accept tags (use Ask Question page for full options)
      const { data } = await api.post('/questions', {
        title,
        content: '',
        tags: [],
      });

      navigate(`/questions/${data.id}`);
    } catch (err) {
      console.error('Quick ask failed', err);
    } finally {
      setLoading(false);
      setTitle('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="quick-ask-form" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input
        type="text"
        placeholder="Ask a short question..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="p-2 border rounded text-sm"
        style={{ minWidth: 240 }}
        required
      />
  {/* tags removed from header quick form - use full Ask Question page to add tags */}
      <button type="submit" disabled={loading || !title.trim()} className="px-3 py-2 rounded bg-[var(--primary)] text-white text-sm">
        {loading ? 'Posting...' : 'Ask'}
      </button>
    </form>
  );
}

export default QuickAsk;
