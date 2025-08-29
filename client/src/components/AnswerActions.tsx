import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

interface VoteResponse {
  message: string;
  votes: number;
  userVote: 'up' | 'down' | null;
}

interface AcceptResponse {
  message: string;
  accepted: boolean;
}

interface VoteButtonsProps {
  answerId: string;
  votes: number;
  userVote?: 'up' | 'down' | null;
}

interface AcceptButtonProps {
  answerId: string;
  isAccepted: boolean;
  isQuestionAuthor: boolean;
}

export const VoteButtons: React.FC<VoteButtonsProps> = ({
  answerId,
  votes,
  userVote
}) => {
  const queryClient = useQueryClient();

  const { mutate: vote } = useMutation<VoteResponse, Error, 'up' | 'down'>({
    mutationFn: async (voteType) => {
      if (userVote === voteType) {
        const response = await api.delete(`/answers/${answerId}/vote`);
        return response.data;
      }
      const response = await api.post(`/answers/${answerId}/vote`, { voteType });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question'] });
    },
    onError: (error) => {
      console.error('Vote error:', error);
    }
  });

  const handleVote = (voteType: 'up' | 'down') => {
    vote(voteType);
  };

  return (
    <div className="vote-buttons">
      <button
        className={`vote-btn ${userVote === 'up' ? 'active' : ''}`}
        onClick={() => handleVote('up')}
        aria-label="Vote positif"
        type="button"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
          <path d="M12 5l7 8H5l7-8z" fill="currentColor" />
        </svg>
      </button>
      <span className="vote-count">{votes}</span>
      <button
        className={`vote-btn ${userVote === 'down' ? 'active' : ''}`}
        onClick={() => handleVote('down')}
        aria-label="Vote négatif"
        type="button"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
          <path d="M12 19l-7-8h14l-7 8z" fill="currentColor" />
        </svg>
      </button>
    </div>
  );
};

export const AcceptButton: React.FC<AcceptButtonProps> = ({
  answerId,
  isAccepted,
  isQuestionAuthor
}) => {
  const queryClient = useQueryClient();
  const [localAccepted, setLocalAccepted] = React.useState(isAccepted);

  React.useEffect(() => {
    setLocalAccepted(isAccepted);
  }, [isAccepted]);

  const { mutate: toggleAccept, status } = useMutation<AcceptResponse, Error>({
    mutationFn: async () => {
      const response = await api.post(`/answers/${answerId}/accept`, {
        accepted: !localAccepted
      });
      return response.data;
    },
    onSuccess: (data) => {
      setLocalAccepted(data.accepted);
      queryClient.invalidateQueries({ queryKey: ['question'] });
    },
    onError: (error) => {
      console.error('Accept error:', error);
      setLocalAccepted(isAccepted);
    }
  });

  if (!isQuestionAuthor) {
    if (localAccepted) {
      return (
        <div className="flex items-center text-green-500" title="Réponse acceptée">
          <span className="material-icons">check_circle</span>
          <span className="ml-2 text-sm">Réponse acceptée</span>
        </div>
      );
    }
    return null;
  }

  return (
    <button
      className={`accept-answer-btn group ${localAccepted ? 'accepted' : ''} relative`}
      onClick={() => toggleAccept()}
      aria-label={localAccepted ? 'Désaccepter la réponse' : 'Accepter la réponse'}
      type="button"
      disabled={status === 'loading'}
    >
      <span aria-hidden>
        {localAccepted ? (
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1 14l-4-4 1.41-1.41L11 13.17l5.59-5.59L18 9l-7 7z" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm3.35 7.15l-4.59 4.59a1 1 0 0 1-1.41 0L8.65 12.6a1 1 0 0 1 1.41-1.41l.75.75 3.88-3.88a1 1 0 1 1 1.41 1.41z" />
          </svg>
        )}
      </span>
      <span className="accept-tooltip">{localAccepted ? 'Désaccepter la réponse' : 'Accepter la réponse'}</span>
    </button>
  );
};
