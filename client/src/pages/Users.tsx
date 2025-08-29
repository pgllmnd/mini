import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Link } from 'react-router-dom';

interface User {
  id: string;
  username: string;
  reputation: number;
  questionCount: number;
  answerCount: number;
}

function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
  const { data } = await api.get('/users');
        setUsers(data);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setError('Failed to load users. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card p-4">
              <div className="flex items-center gap-3">
                <div className="skeleton skeleton-sm" style={{ width: 48, height: 48, borderRadius: 999 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton skeleton-line" />
                  <div className="skeleton skeleton-line short mt-2" />
                </div>
              </div>
              <div className="mt-3 skeleton skeleton-line short" />
            </div>
          ))}
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
          <span className="material-symbols-rounded" style={{ color: 'var(--primary)' }}>group</span>
          <h1 className="text-2xl font-medium" style={{ color: 'var(--text-primary)' }}>Utilisateurs</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {users.map((user) => (
          <div
            key={user.id}
            className="rounded-lg p-4 transition-shadow hover:shadow-md"
            style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)'
            }}
          >
            <Link
              to={`/users/${user.username}`}
              className="flex items-center space-x-3"
            >
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--primary-soft)' }}
              >
                <span style={{ color: 'var(--primary)' }} className="text-lg font-medium">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="font-medium hover:underline" style={{ color: 'var(--primary)' }}>
                  {user.username}
                </h3>
                <div className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                  <span className="material-symbols-rounded text-sm">workspace_premium</span>
                  <span className="text-sm">{user.reputation}</span>
                </div>
              </div>
            </Link>
            
            <div className="mt-3 flex gap-4" style={{ color: 'var(--text-secondary)' }}>
              <div className="flex items-center gap-1 text-sm">
                <span className="material-symbols-rounded text-sm">help</span>
                <span>{user.questionCount}</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <span className="material-symbols-rounded text-sm">comment</span>
                <span>{user.answerCount}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Users;