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
        setError('Please enter no more than 5 tags');
        return;
      }

  const { data } = await api.post('/api/questions', {
        title,
        content,
        tags: formattedTags,
      });

      navigate(`/question/${data.id}`);
    } catch (err) {
      setError('Failed to create question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Ask a Question</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

  <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-gray-700 mb-2">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="What's your question? Be specific."
            required
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="content" className="text-gray-700">
              Content
            </label>
            <button
              type="button"
              onClick={() => setPreview(!preview)}
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              {preview ? 'Edit' : 'Preview'}
            </button>
          </div>

          <div className="md-editor">
            <div className="editor">
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-2 border rounded h-64"
                placeholder="Describe your question in detail. You can use Markdown for formatting."
                required
              />
            </div>
            <div className="preview">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Markdown formatting is supported
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
            placeholder="Add up to 5 tags separated by commas (e.g., javascript, react, node.js)"
          />
          <p className="mt-1 text-sm text-gray-500">
            Add up to 5 tags to describe what your question is about
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Posting...' : 'Post Your Question'}
        </button>
      </form>
    </div>
  );
}

export default AskQuestion;
