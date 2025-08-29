import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import ReactMarkdown from 'react-markdown';

function AskQuestion() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formattedTags = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag);

      if (formattedTags.length > 5) {
        setError('Veuillez saisir au maximum 5 tags');
        return;
      }

      const { data } = await api.post('/questions', {
        title,
        content,
        tags: formattedTags,
      });

      navigate(`/question/${data.id}`);
    } catch (err) {
      setError("Échec de la création de la question. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Poser une question</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-gray-700 mb-2">
            Titre
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Quelle est votre question ? Soyez précis."
            required
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="content" className="text-gray-700">
              Contenu
            </label>
            <button
              type="button"
              onClick={() => setPreview(!preview)}
              className="text-sm text-[var(--link-color)] hover:opacity-90"
            >
              {preview ? 'Modifier' : 'Aperçu'}
            </button>
          </div>

          <div className="md-editor">
            <div className="editor">
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-2 border rounded h-64"
                placeholder="Décrivez votre question en détail. Vous pouvez utiliser Markdown pour le formatage."
                required
              />
            </div>
            <div className="preview">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Le formatage Markdown est pris en charge
          </p>
        </div>

        <div>
          <label htmlFor="tags" className="block text-gray-700 mb-2">
            Tags
          </label>
          <input
            id="tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Ajoutez jusqu'à 5 tags séparés par des virgules (ex : javascript, react, node.js)"
          />
          <p className="mt-1 text-sm text-gray-500">
            Ajoutez jusqu'à 5 tags pour décrire votre question
          </p>
        </div>

        <button
  type="submit"
  disabled={loading}
  className={`text-white px-4 py-2 rounded ${
    loading ? 'opacity-50 cursor-not-allowed' : ''
  }`}
  style={{
    backgroundColor: 'var(--primary)',
    transition: 'background-color 0.2s ease',
  }}
  onMouseEnter={(e) => {
    if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#9a3e28';
  }}
  onMouseLeave={(e) => {
    if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--primary)';
  }}
>
  {loading ? 'Publication en cours...' : 'Publier la question'}
</button>

      </form>
    </div>
  );
}

export default AskQuestion;
