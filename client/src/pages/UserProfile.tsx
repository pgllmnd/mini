import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { EditProfileModal } from '../components/EditProfileModal';

interface Question {
  id: number;
  title: string;
  created_at: string;
  upvotes: number;
  downvotes: number;
  answer_count: number;
}

interface Answer {
  id: number;
  question_id: number;
  question_title: string;
  created_at: string;
  upvotes: number;
  downvotes: number;
  is_accepted: boolean;
}

interface UserData {
  username: string;
  created_at: string;
  reputation: number;
  bio?: string;
  avatar_url?: string;
  questions: Question[];
  answers: Answer[];
}

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState<'questions' | 'answers' | 'activity'>('questions');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const { user } = useAuth();

  const isOwnProfile = user?.username === username;
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0]) return;

    const file = event.target.files[0];
    console.log('Selected file:', { name: file.name, type: file.type, size: file.size });

    // Vérification de la taille du fichier (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    // Vérification du type de fichier
    if (!file.type.startsWith('image/')) {
      setUploadError('Only image files are allowed');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);
    
    setIsUploading(true);
    setUploadError('');

    try {
      console.log('Starting avatar upload...');
      const token = localStorage.getItem('token');
      console.log('Token available:', !!token);
      
      const response = await axios.post('http://localhost:5000/api/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      console.log('Upload successful:', response.data);
      
      if (response.data.user) {
        // Met à jour toutes les données utilisateur, pas seulement l'avatar
        setUserData(prev => prev ? { 
          ...prev,
          ...response.data.user
        } : null);
        
        // Met à jour localStorage pour persister les changements
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({
          ...currentUser,
          avatar_url: response.data.avatarUrl
        }));
        
        console.log('User data and localStorage updated with new avatar');
      } else {
        console.warn('No user data in response:', response.data);
      }
    } catch (err: any) {
      console.error('Upload error:', err.response?.data || err.message);
      setUploadError(err.response?.data?.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const fetchUserData = useCallback(async () => {
    if (!username) {
      setError('User identifier is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching user data for:', username);
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`http://localhost:5000/api/users/${username}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      console.log('User data received:', data);
      setUserData(data);
      
      // Si c'est le profil de l'utilisateur connecté, mettre à jour le localStorage
      if (isOwnProfile && data) {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({
          ...currentUser,
          avatar_url: data.avatar_url
        }));
      }
    } catch (err: unknown) {
      // Narrow error shape for logging
      const e = err as { response?: { data?: unknown } };
      console.error('Error details:', e?.response?.data);
      console.error('Failed to fetch user data:', e);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  }, [username, setError, setLoading, setUserData, isOwnProfile]);

  useEffect(() => {
    fetchUserData();
  }, [username, fetchUserData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-xl text-[var(--text-secondary)]">Loading...</div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="text-center text-red-600 dark:text-red-400">
        {error || 'User not found'}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
  <div className="card mb-6 overflow-hidden">
        <div className="relative h-32 bg-gradient-to-r from-primary-light to-purple-500 dark:from-primary-dark dark:to-purple-600">
          {isOwnProfile && (
            <button
              onClick={() => setShowEditModal(true)}
              className="absolute top-4 right-4 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-md backdrop-blur-sm"
            >
              Edit Profile
            </button>
          )}
        </div>
        
          <div className="px-6 pb-6">
          <div className="flex items-start -mt-16">
            <div className="relative">
              {/* Image de profil */}
              <img
                src={userData.avatar_url ? `http://localhost:5000${userData.avatar_url}` : '/default-avatar.png'}
                alt={userData.username}
                className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-surface-light dark:bg-surface-dark object-cover transition-transform duration-200 hover:scale-105"
              />

              {/* Input file et bouton d'édition */}
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />

              {/* Bouton toujours visible */}
              <button
                onClick={() => document.getElementById('avatar-upload')?.click()}
                className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-full shadow-lg transition-colors"
              >
                {isUploading ? 'Uploading...' : 'Change Photo'}
              </button>

              {/* Message d'erreur */}
              {uploadError && (
                <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-3 py-1 rounded text-sm">
                  {uploadError}
                </div>
              )}
            </div>
            
            <div className="ml-6 pt-16">
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">
                {userData.username}
              </h1>
              {userData.bio && (
                <p className="mt-2 text-[var(--text-secondary)]">
                  {userData.bio}
                </p>
              )}
        <div className="flex items-center mt-4 space-x-6">
                <div>
          <div className="text-2xl font-bold text-[var(--primary)]">
                    {userData.reputation}
                  </div>
          <div className="text-[var(--text-secondary)] text-sm">reputation</div>
                </div>
                <div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">
                    {userData.questions.length}
                  </div>
          <div className="text-[var(--text-secondary)] text-sm">questions</div>
                </div>
                <div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">
                    {userData.answers.length}
                  </div>
          <div className="text-[var(--text-secondary)] text-sm">answers</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="border-b" style={{ borderColor: 'var(--border)' }}>
          <nav className="flex">
            {(['questions', 'answers', 'activity'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === tab
                    ? 'border-b-2 border-primary-light dark:border-primary-dark text-primary-light dark:text-primary-dark'
                    : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'questions' && (
            <div className="space-y-4">
              {userData.questions.map((question) => (
                <div
                  key={question.id}
                  className="p-4 rounded-lg bg-surface-light dark:bg-surface-dark hover:bg-opacity-70"
                >
                  <Link
                    to={`/questions/${question.id}`}
                    className="text-lg font-medium text-text-primary-light dark:text-text-primary-dark hover:text-primary-light dark:hover:text-primary-dark"
                  >
                    {question.title}
                  </Link>
                  <div className="mt-2 flex items-center text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    <span>{new Date(question.created_at).toLocaleDateString()}</span>
                    <span className="mx-2">•</span>
                    <span>{question.answer_count} answers</span>
                    <span className="mx-2">•</span>
                    <span>{question.upvotes - question.downvotes} votes</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'answers' && (
            <div className="space-y-4">
              {userData.answers.map((answer) => (
                <div
                  key={answer.id}
                  className="p-4 rounded-lg bg-surface-light dark:bg-surface-dark hover:bg-opacity-70"
                >
                  <Link
                    to={`/questions/${answer.question_id}`}
                    className="text-lg font-medium text-text-primary-light dark:text-text-primary-dark hover:text-primary-light dark:hover:text-primary-dark"
                  >
                    {answer.question_title}
                  </Link>
                  <div className="mt-2 flex items-center text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    <span>{new Date(answer.created_at).toLocaleDateString()}</span>
                    <span className="mx-2">•</span>
                    <span>{answer.upvotes - answer.downvotes} votes</span>
                    {answer.is_accepted && (
                      <>
                        <span className="mx-2">•</span>
                        <span className="text-green-500 dark:text-green-400">Accepted</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="text-text-secondary-light dark:text-text-secondary-dark text-center py-8">
              Activity timeline coming soon...
            </div>
          )}
        </div>
      </div>

      {showEditModal && (
        <EditProfileModal
          user={userData}
          onClose={() => setShowEditModal(false)}
          onUpdate={fetchUserData}
        />
      )}
    </div>
  );
}
