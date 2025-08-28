import React from 'react';
import { Link } from 'react-router-dom';

interface UserCardProps {
  username: string;
  reputation?: number;
  timestamp: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const UserCard: React.FC<UserCardProps> = ({ 
  username, 
  reputation, 
  timestamp, 
  size = 'medium',
  className = ''
}) => {
  const sizeClasses = {
    small: {
      avatar: 'w-6 h-6',
      username: 'text-xs',
      reputation: 'text-xs',
    },
    medium: {
      avatar: 'w-8 h-8',
      username: 'text-sm',
      reputation: 'text-xs',
    },
    large: {
      avatar: 'w-10 h-10',
      username: 'text-base',
      reputation: 'text-sm',
    },
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`${sizeClasses[size].avatar} rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white font-medium`}>
        {username.charAt(0).toUpperCase()}
      </div>
      <div className="flex flex-col">
        <Link 
          to={`/users/${username}`}
          className={`${sizeClasses[size].username} text-[var(--text-primary)] hover:text-[var(--primary)] font-medium`}
        >
          {username}
        </Link>
        {reputation !== undefined && (
          <span className={`${sizeClasses[size].reputation} text-[var(--text-secondary)]`}>
            {reputation.toLocaleString()} rep
          </span>
        )}
        <span className={`${sizeClasses[size].reputation} text-[var(--text-secondary)]`}>
          {new Date(timestamp).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </span>
      </div>
    </div>
  );
};
