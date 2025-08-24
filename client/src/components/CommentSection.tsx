import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

interface CommentProps {
  answerId: number;
  questionId: number;
  onCommentAdded: () => void;
}

interface Comment {
  id: number;
  content: string;
  author_username: string;
  created_at: string;
}

export function CommentSection({ answerId, questionId, onCommentAdded }: CommentProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const { user } = useAuth();

  const loadComments = async () => {
    try {
      setIsLoading(true);
      const { data } = await axios.get(`http://localhost:5000/api/questions/${questionId}/answers/${answerId}/comments`);
      setComments(Array.isArray(data) ? data : []);
      setShowComments(true);
    } catch (error) {
      console.error('Failed to load comments:', error);
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setIsLoading(true);
      await axios.post(`http://localhost:5000/api/questions/${questionId}/answers/${answerId}/comments`, {
        content: newComment,
      });
      setNewComment('');
      loadComments();
      onCommentAdded();
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4 border-t border-border-light dark:border-border-dark pt-4">
      {!showComments ? (
        <button
          onClick={loadComments}
          className="text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark text-sm"
        >
          Show comments
        </button>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="flex items-start space-x-2 text-sm"
              >
                <span className="text-text-secondary-light dark:text-text-secondary-dark">
                  {comment.author_username}:
                </span>
                <p className="text-text-primary-light dark:text-text-primary-dark flex-1">
                  {comment.content}
                </p>
                <span className="text-text-secondary-light dark:text-text-secondary-dark text-xs">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>

          {user && (
            <form onSubmit={handleAddComment} className="flex items-center space-x-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-3 py-1 text-sm rounded-md bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark border border-border-light dark:border-border-dark focus:outline-none focus:ring-1 focus:ring-primary-light dark:focus:ring-primary-dark"
              />
              <button
                type="submit"
                disabled={isLoading || !newComment.trim()}
                className="px-3 py-1 text-sm bg-primary-light dark:bg-primary-dark text-white rounded-md hover:bg-opacity-90 disabled:opacity-50"
              >
                {isLoading ? '...' : 'Add'}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
