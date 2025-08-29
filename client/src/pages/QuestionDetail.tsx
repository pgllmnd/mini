import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { MarkdownContent } from '../components/MarkdownContent';
import { useAuth } from '../hooks/useAuth';
import { CommentSection } from '../components/CommentSection';

interface Answer {
  id: number;
  content: string;
  author_username: string;
  created_at: string;
  // Optional fields returned by newer API DTOs
  createdAtIso?: string;
  createdAt?: string;
  is_accepted: boolean;
  upvotes: number;
  downvotes: number;
}

interface Question {
  id: number;
  title: string;
  content: string;
  tags: string[];
  author_username: string;
  created_at: string;
  upvotes: number;
  downvotes: number;
  answers: Answer[];
}

function QuestionDetail() {
  const { id } = useParams<{ id: string }>();
  const [question, setQuestion] = useState<Question | null>(null);
  const [newAnswer, setNewAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  type MaybeAxiosError = { response?: { data?: { message?: string } } };

  const loadQuestion = useCallback(async () => {
  try {
      setLoading(true);
  const { data } = await api.get(`/questions/${id}`);
      setQuestion(data);
    } catch (error) {
  console.error('Échec du chargement de la question :', error);
      // Try to show server-provided message when available
      const serverMessage = (error as MaybeAxiosError).response?.data?.message;
  setError(serverMessage || 'Échec du chargement de la question');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadQuestion();
  }, [loadQuestion]);

  const handleVote = async (voteType: 'up' | 'down', targetType: 'question' | 'answer', targetId: number) => {
    if (!user) {
      setError("Veuillez vous connecter pour voter");
      return;
    }

    try {
  await api.post(`/questions/${id}/vote`, {
        voteType,
        targetType,
        targetId,
      });
      loadQuestion();
    } catch (error) {
      console.error('Échec du vote :', error);
      setError("Échec du vote");
    }
  };

  const handleAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("Veuillez vous connecter pour répondre");
      return;
    }

    try {
  await api.post(`/questions/${id}/answers`, {
        content: newAnswer,
      });
      setNewAnswer('');
      loadQuestion();
    } catch (error) {
      console.error('Échec lors de la publication de la réponse :', error);
      setError('Échec lors de la publication de la réponse');
    }
  };

  const handleAcceptAnswer = async (answerId: number) => {
    try {
      // Use the answers/:id/accept endpoint (frontend uses this in AcceptButton)
      await api.post(`/answers/${answerId}/accept`, { accepted: true });
      loadQuestion();
    } catch (error) {
      console.error('Failed to accept answer:', error);
      setError('Échec lors de l\'acceptation de la réponse');
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-4 space-y-6">
        <div className="card animate-appear p-6">
          <div className="skeleton skeleton-line" style={{ height: 28, width: '60%' }} />
          <div className="mt-4">
            <div className="skeleton skeleton-line" style={{ width: '100%', height: 14 }} />
            <div className="skeleton skeleton-line short mt-2" />
            <div className="skeleton skeleton-line mt-2" />
          </div>
        </div>

        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="card p-4 animate-appear">
              <div className="flex items-start gap-4">
                <div className="skeleton skeleton-sm" style={{ width: 48, height: 48, borderRadius: 8 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton skeleton-line" />
                  <div className="skeleton skeleton-line short mt-2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="text-center text-red-600 dark:text-red-400">Question introuvable</div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {error && (
        <div className="px-4 py-3 rounded mb-4" style={{ backgroundColor: '#ffeaea', border: '1px solid #f5c2c2', color: '#991b1b' }}>
          {error}
        </div>
      )}

      <div className="p-6 rounded-lg card shadow-soft">
        <div className="flex flex-col md:flex-row md:gap-6">
          <div className="flex-shrink-0 flex flex-col items-center mr-4">
            <button className="vote-btn" onClick={() => handleVote('up', 'question', question.id)} aria-label="Upvote">
              <svg width="18" height="18" viewBox="0 0 24 24" className="text-[var(--text-secondary)]">
                <path d="M12 5l7 8H5l7-8z" fill="currentColor" />
              </svg>
            </button>
            <span className="vote-count mt-1">{question.upvotes - question.downvotes}</span>
            <button className="vote-btn mt-1" onClick={() => handleVote('down', 'question', question.id)} aria-label="Downvote">
              <svg width="18" height="18" viewBox="0 0 24 24" className="text-[var(--text-secondary)]">
                <path d="M12 19l-7-8h14l-7 8z" fill="currentColor" />
              </svg>
            </button>
          </div>

          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-4 text-[var(--text-primary)]">{question.title}</h1>
            <div className="prose max-w-none text-[var(--text-primary)]">
              <MarkdownContent content={question.content} />
            </div>

            <div className="mt-6 flex items-center justify-between border-t pt-4" style={{ borderColor: 'var(--border)' }}>
              <div className="flex gap-2 items-center">
                {question.tags.map((tag, index) => (
                  <span key={`${tag}-${index}`} className="tag-badge small" style={{ backgroundColor: 'var(--surface)' }}>{tag}</span>
                ))}
              </div>
              <div className="text-sm text-[var(--text-secondary)]">asked by {question.author_username}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
  <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          {question.answers.length} {question.answers.length === 1 ? 'réponse' : 'réponses'}
        </h2>

        <div className="space-y-6">
          {question.answers.map((answer) => (
            <div
              key={answer.id}
              className={`p-6 rounded-lg card ${answer.is_accepted ? 'accepted' : ''}`}
              style={{ border: answer.is_accepted ? '2px solid rgba(34,197,94,0.2)' : '1px solid var(--border)' }}
            >
              <div className="flex items-start space-x-4">
                <div className="flex flex-col items-center sticky top-4">
                  <button className="vote-btn" onClick={() => handleVote('up', 'answer', answer.id)} aria-label="Upvote">
                    <svg width="16" height="16" viewBox="0 0 24 24" className="text-[var(--text-secondary)]">
                      <path d="M12 5l7 8H5l7-8z" fill="currentColor" />
                    </svg>
                  </button>
                  <span className="vote-count">{answer.upvotes - answer.downvotes}</span>
                  <button className="vote-btn" onClick={() => handleVote('down', 'answer', answer.id)} aria-label="Downvote">
                    <svg width="16" height="16" viewBox="0 0 24 24" className="text-[var(--text-secondary)]">
                      <path d="M12 19l-7-8h14l-7 8z" fill="currentColor" />
                    </svg>
                  </button>
                  {/* Show accepted indicator for everyone, and show the accept button only to the question author */}
                  {answer.is_accepted ? (
                    <div className="flex items-center text-green-500 mt-2" title="Réponse acceptée">
                      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                        <path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1 14l-4-4 1.41-1.41L11 13.17l5.59-5.59L18 9l-7 7z" />
                      </svg>
                      <span className="ml-2 text-sm">Réponse acceptée</span>
                    </div>
                  ) : (
                    (user && question.author_username === user.username) ? (
                      <button
                        onClick={() => handleAcceptAnswer(answer.id)}
                        className="accept-answer-btn mt-2"
                        aria-label="Accepter la réponse"
                        type="button"
                        title="Accepter cette réponse"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                          <path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm3.35 7.15l-4.59 4.59a1 1 0 0 1-1.41 0L8.65 12.6a1 1 0 0 1 1.41-1.41l.75.75 3.88-3.88a1 1 0 1 1 1.41 1.41z" />
                        </svg>
                      </button>
                    ) : null
                  )}
                </div>

                <div className="prose max-w-none flex-1">
                  <MarkdownContent content={answer.content} />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-[var(--text-secondary)]" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <div>
                  répondu par {answer.author_username} le {new Date(answer.createdAtIso ?? answer.createdAt ?? answer.created_at).toLocaleDateString()}
                </div>
              </div>

              <CommentSection answerId={answer.id} questionId={question.id} onCommentAdded={() => loadQuestion()} />
            </div>
          ))}
        </div>

        {user ? (
        <div className="mt-8 p-6 rounded-lg card">
          <h3 className="text-xl font-bold mb-4 text-[var(--text-primary)]">Votre réponse</h3>
          <form onSubmit={handleAnswer}>
            <div className="mb-4">
              <textarea
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                className="w-full p-3 rounded-md min-h-[180px] focus:outline-none"
                style={{ backgroundColor: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                placeholder="Écrivez votre réponse ici... Le formatage Markdown est pris en charge."
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-[var(--text-secondary)]">Utilisez Markdown pour formater votre réponse</div>
           <button
  type="submit"
  className="text-white px-4 py-2 rounded btn-primary-custom"
  style={{
    backgroundColor: 'var(--primary)',
    transition: 'background-color 0.2s ease',
  }}
  onMouseEnter={(e) => {
    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#9a3e28'; // un peu plus foncé au hover
  }}
  onMouseLeave={(e) => {
    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--primary)';
  }}
>
  Publier la réponse
</button>


            </div>
          </form>
        </div>
        ) : (
          <div className="mt-8 p-6 bg-card-light dark:bg-card-dark rounded-lg shadow-card dark:shadow-card-dark text-center">
            <p className="text-text-secondary-light dark:text-text-secondary-dark">
              Veuillez{' '}
              <Link to="/login" className="text-primary-light dark:text-primary-dark hover:underline">
                vous connecter
              </Link>{' '}
              pour poster une réponse.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuestionDetail;
