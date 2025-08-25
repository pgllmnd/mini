import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { API_BASE } from '../lib/api';

function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="shadow-md" style={{ backgroundColor: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Mini Stack Overflow
          </Link>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2"
              aria-label="Toggle theme"
              style={{ color: 'var(--text-secondary)' }}
            >
              <span className="material-symbols-outlined">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            <Link
              to="/questions/ask"
              className="px-4 py-2 rounded"
              style={{ backgroundColor: 'var(--primary)', color: 'white' }}
            >
              Ask Question
            </Link>

            {user ? (
              <div className="flex items-center space-x-4">
                <Link 
                  to={`/users/${user.username}`} 
                  className="flex items-center hover:opacity-90"
                >
                  {user.avatar_url ? (
                    <img 
                      src={`${API_BASE}${user.avatar_url}`}
                      alt={user.username}
                      className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                      onError={(e) => {
                        console.error('Error loading avatar:', e);
                        const target = e.target as HTMLImageElement;
                        target.onerror = null; // Prevent infinite loop
                        target.style.display = 'none';
                        console.log('Avatar URL was:', `${API_BASE}${user.avatar_url}`);
                      }}
                    />
                  ) : (
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white uppercase"
                      style={{ backgroundColor: 'var(--primary)' }}
                    >
                      {user.username.charAt(0)}
                    </div>
                  )}
                  <span className="ml-2" style={{ color: 'var(--text-secondary)' }}>
                    {user.username}
                  </span>
                </Link>
                <button
                  onClick={logout}
                  className="hover:underline"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="hover:underline" style={{ color: 'var(--text-secondary)' }}>Login</Link>
                <Link to="/register" className="hover:underline" style={{ color: 'var(--text-secondary)' }}>Register</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
