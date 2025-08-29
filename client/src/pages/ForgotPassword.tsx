import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });

      setSuccess('Les instructions de réinitialisation ont été envoyées à votre e-mail');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Échec de l'envoi de l'e-mail de réinitialisation. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-6">Mot de passe oublié</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
          <p className="text-sm text-gray-500 mt-1">
            Entrez votre adresse e-mail et nous vous enverrons les instructions pour réinitialiser votre mot de passe.
          </p>
        </div>

        <div className="form-footer">
          <button
            type="submit"
            disabled={loading}
            className={`btn btn-primary w-full ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Envoi en cours...' : "Envoyer les instructions"}
          </button>
        </div>

        <div className="mt-4 text-center">
          <button type="button" onClick={() => navigate('/login')} className="btn-link">
            Retour à la connexion
          </button>
        </div>
      </form>
    </div>
  );
}

export default ForgotPassword;
