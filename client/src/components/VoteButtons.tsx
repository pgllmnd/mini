import React from 'react';

interface VoteButtonsProps {
  upvotes: number;
  downvotes: number;
  onUpvote: () => void;
  onDownvote: () => void;
  isAccepted?: boolean;
  className?: string;
}

export const VoteButtons: React.FC<VoteButtonsProps> = ({
  upvotes,
  downvotes,
  onUpvote,
  onDownvote,
  isAccepted,
  className = ''
}) => {
  const voteCount = upvotes - downvotes;

  return (
    <div className={`flex flex-col items-center space-y-1 ${className}`}>
      {/* Upvote */}
      <button
        onClick={onUpvote}
        className="w-8 h-8 flex items-center justify-center rounded transition-transform hover:scale-110 cursor-pointer"
        aria-label="Upvote"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            d="M1 12h16L9 4 1 12z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Vote count */}
      <div className="h-6 flex items-center justify-center">
        <span className="text-[1.1rem] font-medium text-gray-600 dark:text-gray-300">
          {voteCount}
        </span>
      </div>

      {/* Downvote */}
      <button
        onClick={onDownvote}
        className="w-8 h-8 flex items-center justify-center rounded transition-transform hover:scale-110 cursor-pointer"
        aria-label="Downvote"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            d="M1 6h16l-8 8-8-8z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Accepted indicator */}
      {isAccepted !== undefined && (
        <div className={`mt-1 p-1 rounded ${isAccepted ? 'text-green-500' : 'text-gray-400'}`}>
          <span className="material-symbols-outlined text-xl">
            check_circle
          </span>
        </div>
      )}
    </div>
  );
};
