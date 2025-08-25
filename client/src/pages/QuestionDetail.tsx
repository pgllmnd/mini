import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import ReactMarkdown from 'react-markdown';
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
  const { data } = await api.get(`/api/questions/${id}`);
      setQuestion(data);
    } catch (error) {
      console.error('Failed to load question:', error);
      // Try to show server-provided message when available
      const serverMessage = (error as MaybeAxiosError).response?.data?.message;
      setError(serverMessage || 'Failed to load question');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadQuestion();
  }, [loadQuestion]);

  const handleVote = async (voteType: 'up' | 'down', targetType: 'question' | 'answer', targetId: number) => {
    if (!user) {
      setError('Please login to vote');
      return;
    }

    try {
  await api.post(`/api/questions/${id}/vote`, {
        voteType,
        targetType,
        targetId,
      });
      loadQuestion();
    } catch (error) {
      console.error('Failed to vote:', error);
      setError('Failed to vote');
    }
  };

  const handleAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Please login to answer');
      return;
    }

    try {
  await api.post(`/api/questions/${id}/answers`, {
        content: newAnswer,
      });
      setNewAnswer('');
      loadQuestion();
    } catch (error) {
      console.error('Failed to post answer:', error);
      setError('Failed to post answer');
    }
  };

  const handleAcceptAnswer = async (answerId: number) => {
    try {
  await api.patch(`/api/questions/${id}/answers/${answerId}/accept`);
      loadQuestion();
    } catch (error) {
      console.error('Failed to accept answer:', error);
      setError('Failed to accept answer');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-xl" style={{ color: 'var(--text-secondary)' }}>Loading...</div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="text-center text-red-600 dark:text-red-400">Question not found</div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {error && (
        <div className="px-4 py-3 rounded mb-4" style={{ backgroundColor: '#ffeaea', border: '1px solid #f5c2c2', color: '#991b1b' }}>
          {error}
        </div>
      )}

      <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow, 0 6px 18px rgba(2,6,23,0.06))' }}>
        <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>{question.title}</h1>
        
        <div className="flex items-center space-x-6">
          <div className="flex flex-col items-center">
            <button className="vote-btn" onClick={() => handleVote('up', 'question', question.id)} aria-label="Upvote">
              <span style={{fontSize: '18px'}}>↑</span>
            </button>
            <span className="vote-count">{question.upvotes - question.downvotes}</span>
            <button className="vote-btn" onClick={() => handleVote('down', 'question', question.id)} aria-label="Downvote">
              <span style={{fontSize: '18px'}}>↓</span>
            </button>
          </div>
          <div className="prose max-w-none flex-1" style={{ color: 'var(--text-primary)' }}>
            <ReactMarkdown>{question.content}</ReactMarkdown>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex gap-2">
            {question.tags.map((tag) => (
              <span key={tag} className="px-2 py-1 rounded text-sm" style={{ backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}>
                {tag}
              </span>
            ))}
          </div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            asked by {question.author_username}
          </div>
        </div>
      </div>

      <div className="mt-8">
  <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          {question.answers.length} {question.answers.length === 1 ? 'Answer' : 'Answers'}
        </h2>

        <div className="space-y-6">
          {question.answers.map((answer) => (
            <div key={answer.id} className={`p-6 rounded-lg ${answer.is_accepted ? 'border-2' : ''}`} style={{ backgroundColor: 'var(--card)', border: answer.is_accepted ? '2px solid #22c55e' : '1px solid var(--border)', boxShadow: '0 6px 18px rgba(2,6,23,0.04)' }}>
              <div className="flex items-start space-x-4">
                <div className="flex flex-col items-center sticky top-4">
                  <button onClick={() => handleVote('up', 'answer', answer.id)} style={{ color: 'var(--text-secondary)' }}>
                    <span className="material-symbols-outlined">arrow_upward</span>
                  </button>
                  <span className="my-1" style={{ color: 'var(--text-primary)' }}>{answer.upvotes - answer.downvotes}</span>
                  <button onClick={() => handleVote('down', 'answer', answer.id)} style={{ color: 'var(--text-secondary)' }}>
                    <span className="material-symbols-outlined">arrow_downward</span>
                  </button>
                  {user && 
                   question.author_username === user.username && 
                   !answer.is_accepted && (
                    <button
                      onClick={() => handleAcceptAnswer(answer.id)}
                      className="mt-2 text-sm text-green-500 dark:text-green-400 hover:text-green-600 dark:hover:text-green-300 flex items-center gap-1"
                    >
                      Accept
                    </button>
                  )}
                </div>
                <div className="prose max-w-none flex-1 md-editor">
                  <div className="editor">
                    <ReactMarkdown>{answer.content}</ReactMarkdown>
                  </div>
                  <div className="preview">
                    <ReactMarkdown>{answer.content}</ReactMarkdown>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm" style={{ color: 'var(--text-secondary)', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <div>
                  answered by {answer.author_username} on{' '}
                  {new Date(answer.createdAtIso ?? answer.createdAt ?? answer.created_at).toLocaleDateString()}
                </div>
              </div>

              <CommentSection 
                answerId={answer.id}
                questionId={question.id}
                onCommentAdded={() => loadQuestion()}
              />
            </div>
          ))}
        </div>

        {user ? (
          <div className="mt-8 p-6 rounded-lg" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Your Answer</h3>
            <form onSubmit={handleAnswer}>
              <div className="mb-4">
                <textarea
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  className="w-full p-4 rounded-md min-h-[200px] focus:outline-none"
                  style={{ backgroundColor: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                  placeholder="Write your answer here... Markdown formatting is supported."
                  required
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  Use Markdown to format your answer
                </div>
                <button type="submit" className="px-6 py-2 rounded-md" style={{ backgroundColor: 'var(--primary)', color: 'white' }}>
                  Post Your Answer
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="mt-8 p-6 bg-card-light dark:bg-card-dark rounded-lg shadow-card dark:shadow-card-dark text-center">
            <p className="text-text-secondary-light dark:text-text-secondary-dark">
              Please{' '}
              <Link to="/login" className="text-primary-light dark:text-primary-dark hover:underline">
                login
              </Link>{' '}
              to post an answer.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuestionDetail;
