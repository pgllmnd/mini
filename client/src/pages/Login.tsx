import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-6">Login</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-gray-700 mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-gray-700 mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
          <div className="flex justify-end mt-1">
            <button 
              type="button" 
              onClick={() => navigate('/forgot-password')}
              className="text-blue-500 text-sm hover:text-blue-600"
            >
              Forgot Password?
            </button>
          </div>
        </div>

        <button
  type="submit"
  disabled={loading}
  className={`w-full text-white p-2 rounded ${
    loading ? 'opacity-50 cursor-not-allowed' : ''
  }`}
  style={{
    backgroundColor: 'var(--primary)',
    transition: 'background-color 0.2s ease',
  }}
  onMouseEnter={(e) => {
    if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#9a3e28'; // un peu plus foncé au hover
  }}
  onMouseLeave={(e) => {
    if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--primary)';
  }}
>
  {loading ? 'Logging in...' : 'Login'}
</button>

      </form>
    </div>
  );
}

export default Login;
