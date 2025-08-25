import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Link } from 'react-router-dom';

interface Tag {
  id: string;
  name: string;
  description: string | null;
  questionCount: number;
}

function Tags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTags = async () => {
      try {
  const { data } = await api.get('/api/tags');
        setTags(data);
      } catch (err) {
        console.error('Failed to fetch tags:', err);
        setError('Failed to load tags. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <span className="material-symbols-rounded animate-spin">progress_activity</span>
          <span style={{ color: 'var(--text-secondary)' }}>Loading tags...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg" 
        style={{ 
          backgroundColor: 'var(--error-bg)',
          color: 'var(--error)',
          border: '1px solid var(--error-border)'
        }}
      >
        <span className="material-symbols-rounded">error</span>
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-medium" style={{ color: 'var(--text-primary)' }}>Tags</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
          A tag is a keyword or label that categorizes your question with other, similar questions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tags.map((tag) => (
          <div
            key={tag.id}
            className="rounded-lg p-4 transition-shadow hover:shadow-md"
            style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)'
            }}
          >
            <Link
              to={`/questions?tag=${tag.name}`}
              className="tag-badge small"
              aria-label={`View questions tagged ${tag.name}`}
            >
              {tag.name}
            </Link>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {tag.description || 'No description available.'}
            </p>
            <div className="mt-2 flex items-center gap-1">
              <span className="material-symbols-rounded text-sm" style={{ color: 'var(--text-secondary)' }}>help</span>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {tag.questionCount} questions
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Tags;
