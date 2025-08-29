import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function Register() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    try {
      await register(email, password, username);
      navigate('/');
    } catch (err) {
      setError("L'inscription a échoué. Vérifiez vos informations.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-6">Inscription</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="form">
        <div>
          <label htmlFor="email" className="block text-gray-700 mb-2">
            Adresse e-mail
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
          <label htmlFor="username" className="block text-gray-700 mb-2">
            Nom d'utilisateur
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-gray-700 mb-2">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
            minLength={6}
          />
          <p className="text-xs text-gray-500 mt-1">Doit contenir au moins 6 caractères</p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-gray-700 mb-2">
            Confirmer le mot de passe
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div className="form-footer">
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
  {loading ? 'Création du compte...' : "S'inscrire"}
</button>

        </div>
      </form>
    </div>
  );
}

export default Register;
