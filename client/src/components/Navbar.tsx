import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

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
                <Link to={`/users/${user.id}`} className="hover:underline" style={{ color: 'var(--text-secondary)' }}>
                  {user.username}
                </Link>
                <button
                  onClick={logout}
                  className=""
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
