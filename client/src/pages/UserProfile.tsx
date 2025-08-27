import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { API_ORIGIN } from '../lib/api';
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
  id?: number;
  username: string;
  email?: string;
  created_at: string;
  reputation: number;
  bio?: string;
  avatar_url?: string;
  questions: Question[];
  answers: Answer[];
}

export default function UserProfile() {
  const { username: paramUsername } = useParams<{ username: string }>();
  const routeUsername = (paramUsername || '').replace(/^@/, '');

  const [userData, setUserData] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState<'questions' | 'answers' | 'activity'>('questions');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showImagePreview, setShowImagePreview] = useState(false);
  const { user } = useAuth();

  const emailMatch = userData?.email && user?.email && userData.email === user.email;
  const usernameMatch = userData?.username && user?.username && 
    userData.username.toLowerCase() === user.username.toLowerCase();
  
  const isOwnProfile = Boolean(emailMatch || usernameMatch);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0]) return;

    const file = event.target.files[0];
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setUploadError('Only image files are allowed');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);
    
    setIsUploading(true);
    setUploadError('');

    try {
      const token = localStorage.getItem('token');
  const response = await api.post('/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.user) {
        setUserData(prev => prev ? { 
          ...prev,
          ...response.data.user
        } : null);
        
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({
          ...currentUser,
          avatar_url: response.data.avatarUrl
        }));
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setUploadError(e.response?.data?.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const fetchUserData = useCallback(async () => {
    if (!routeUsername) {
      setError('User identifier is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
  const { data } = await api.get(`/users/${routeUsername}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      
      setUserData(data);
      
      if (isOwnProfile && data) {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({
          ...currentUser,
          avatar_url: data.avatar_url
        }));
      }
    } catch {
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  }, [routeUsername, isOwnProfile]);

  // Fetch detailed activity (including votes) when Activity tab selected
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState('');
  const [serverActivity, setServerActivity] = useState<any | null>(null);

  const fetchActivity = useCallback(async () => {
    if (!routeUsername) return;
    try {
      setActivityLoading(true);
      setActivityError('');
      const token = localStorage.getItem('token');
      const { data } = await api.get(`/users/${routeUsername}/activity`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setServerActivity(data);
    } catch (err: unknown) {
      setActivityError('Failed to load activity');
    } finally {
      setActivityLoading(false);
    }
  }, [routeUsername]);

  useEffect(() => {
    if (activeTab === 'activity') {
      fetchActivity();
    }
  }, [activeTab, fetchActivity]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

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

  const bioContent = userData.bio && userData.bio !== 'null' && userData.bio.trim().length > 0
    ? userData.bio
    : isOwnProfile
    ? "Vous n'avez pas encore ajouté de bio. Cliquez sur Edit Profile pour en ajouter une."
    : "Cet utilisateur n'a pas encore renseigné de bio.";

  // Normalize activity items including questions, answers, comments, votes made and votes received
  interface ActivityItem {
    id: string;
    kind: 'question' | 'answer' | 'comment' | 'vote_made' | 'vote_received';
    title: string;
    date: string;
    meta?: string;
    link?: string;
    voteType?: 'UP' | 'DOWN';
  }

  const toActivityItems = (): ActivityItem[] => {
    const items: ActivityItem[] = [];

    const questionsSrc = (serverActivity?.questions && serverActivity.questions.length > 0) ? serverActivity.questions : userData.questions;
    (questionsSrc || []).forEach((q: any) => {
      items.push({
        id: `q-${q.id}`,
        kind: 'question',
        title: q.title,
        date: q.created_at,
        meta: `${q.answer_count ?? 0} answers • ${((q.upvotes ?? 0) - (q.downvotes ?? 0))} votes`,
        link: `/questions/${q.id}`,
      });
    });

    const answersSrc = (serverActivity?.answers && serverActivity.answers.length > 0) ? serverActivity.answers : userData.answers;
    (answersSrc || []).forEach((a: any) => {
      items.push({
        id: `a-${a.id}`,
        kind: 'answer',
        title: a.question_title,
        date: a.created_at,
        meta: `${((a.upvotes ?? 0) - (a.downvotes ?? 0))} votes${a.is_accepted ? ' • accepted' : ''}`,
        link: `/questions/${a.question_id}`,
      });
    });

    // comments (made by the user)
    (serverActivity?.comments || []).forEach((c: any) => {
      items.push({
        id: `c-${c.id}`,
        kind: 'comment',
        title: `Commented on: ${c.target_title}`,
        date: c.created_at,
        meta: c.content ? (c.content.length > 120 ? c.content.slice(0, 117) + '...' : c.content) : undefined,
        link: c.link,
      });
    });

    // votes made by the user
    (serverActivity?.votes_made || []).forEach((v: any) => {
      items.push({
        id: `vm-${v.id}`,
        kind: 'vote_made',
        title: `${v.type === 'UP' ? 'You upvoted' : 'You downvoted'}: ${v.target_title}`,
        date: v.created_at,
        voteType: v.type,
        link: v.target_type === 'question' ? `/questions/${v.target_id}` : `/questions/${v.target_id}`,
      });
    });

    // votes received on user's posts
    (serverActivity?.votes_received || []).forEach((v: any) => {
      items.push({
        id: `vr-${v.id}`,
        kind: 'vote_received',
        title: `${v.type === 'UP' ? 'Upvote received' : 'Downvote received'} on: ${v.post_title}`,
        date: v.created_at,
        voteType: v.type,
        link: v.post_type === 'question' ? `/questions/${v.post_id}` : `/questions/${v.post_id}`,
      });
    });

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const activityItems = toActivityItems();

  // Group by date: Today / Yesterday / Earlier
  const isSameDay = (d1Str: string, d2: Date) => {
    const d1 = new Date(d1Str);
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  };

  const grouped: { today: ActivityItem[]; yesterday: ActivityItem[]; earlier: ActivityItem[] } = { today: [], yesterday: [], earlier: [] };
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  activityItems.forEach((it) => {
    if (isSameDay(it.date, now)) grouped.today.push(it);
    else if (isSameDay(it.date, yesterday)) grouped.yesterday.push(it);
    else grouped.earlier.push(it);
  });

  function ActivityRow({ item }: { item: ActivityItem }) {
    const icon = () => {
      switch (item.kind) {
        case 'question':
          return <span className="material-symbols-outlined">help</span>;
        case 'answer':
          return <span className="material-symbols-outlined">chat_bubble</span>;
        case 'comment':
          return <span className="material-symbols-outlined">comment</span>;
        case 'vote_made':
        case 'vote_received':
          return item.voteType === 'UP' ? <span className="material-symbols-outlined">thumb_up</span> : <span className="material-symbols-outlined">thumb_down</span>;
        default:
          return <span className="material-symbols-outlined">history</span>;
      }
    };

    const bgClass = item.kind === 'question' ? 'bg-blue-500' : item.kind === 'answer' ? 'bg-green-500' : item.kind === 'comment' ? 'bg-gray-500' : (item.voteType === 'UP' ? 'bg-teal-500' : 'bg-red-500');

    return (
      <div className="p-4 rounded-lg bg-surface-light dark:bg-surface-dark hover:bg-opacity-70 flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-1">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white ${bgClass}`}>
              {icon()}
            </div>
          </div>

          <div className="text-left">
            <Link
              to={item.link ?? '#'}
              className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark hover:text-primary-light dark:hover:text-primary-dark"
            >
              {item.title}
            </Link>

            <div className="mt-1 text-xs text-text-secondary-light dark:text-text-secondary-dark">
              <span>{new Date(item.date).toLocaleString()}</span>
              {item.meta && (
                <><span className="mx-2">•</span><span>{item.meta}</span></>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 md:mt-0 text-xs text-text-secondary-light dark:text-text-secondary-dark">
          <span className="hidden md:inline">{item.kind.replace('_', ' ')}</span>
        </div>
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
        <div className="flex flex-col items-center md:items-start md:flex-row mt-2 md:-mt-16 space-y-4 md:space-y-0 md:space-x-6">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowImagePreview(true)}
              aria-label="Open profile photo preview"
              className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark p-0"
              style={{ background: 'transparent' }}
            >
              <img
                src={userData.avatar_url ? `${API_ORIGIN}${userData.avatar_url}` : '/default-avatar.png'}
                alt={`${userData.username} avatar`}
                className="w-24 h-24 md:w-32 md:h-32 rounded-full border-0 sm:border-2 md:border-4 border-white shadow-none md:shadow-lg bg-surface-light dark:bg-surface-dark object-cover transition-transform duration-200 hover:scale-105"
                loading="lazy"
                decoding="async"
                width={128}
                height={128}
              />
            </button>

            {isOwnProfile && (
              <>
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />

                {/* small circular change button at bottom-right of avatar, 44x44 touch target */}
                <button
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                  aria-label="Change profile photo"
                  className="absolute -right-1 -bottom-1 w-11 h-11 min-w-[44px] min-h-[44px] bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark"
                  disabled={isUploading}
                >
                  <span className="material-symbols-outlined">photo_camera</span>
                </button>

                {/* upload error shown below avatar for mobile readability */}
                {uploadError && (
                  <div className="mt-2 text-sm text-center text-red-500" role="alert">
                    {uploadError}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="text-center md:text-left pt-0 md:pt-6">
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">
                {userData.username}
              </h1>

              {/* Dedicated About / Bio section */}
              <div className="mt-3 bg-surface-light dark:bg-surface-dark p-4 rounded">
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">À propos</h3>
                <p className="text-[var(--text-secondary)] text-sm">
                  {bioContent}
                </p>
              </div>

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
            <div className="space-y-4">
              {activityLoading && (
                <div className="text-text-secondary-light dark:text-text-secondary-dark text-center py-8">Loading activity...</div>
              )}

              {activityError && (
                <div className="text-red-600 dark:text-red-400 text-center py-4">{activityError}</div>
              )}

              {!activityLoading && activityItems.length === 0 && (
                <div className="text-text-secondary-light dark:text-text-secondary-dark text-center py-8">
                  No recent activity.
                </div>
              )}

              <div className="space-y-6">
                {grouped.today.length > 0 && (
                  <section>
                    <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">Today</h4>
                    <div className="space-y-3">
                      {grouped.today.map((item) => (
                        <ActivityRow key={item.id} item={item} />
                      ))}
                    </div>
                  </section>
                )}

                {grouped.yesterday.length > 0 && (
                  <section>
                    <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">Yesterday</h4>
                    <div className="space-y-3">
                      {grouped.yesterday.map((item) => (
                        <ActivityRow key={item.id} item={item} />
                      ))}
                    </div>
                  </section>
                )}

                {grouped.earlier.length > 0 && (
                  <section>
                    <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">Earlier</h4>
                    <div className="space-y-3">
                      {grouped.earlier.map((item) => (
                        <ActivityRow key={item.id} item={item} />
                      ))}
                    </div>
                  </section>
                )}
              </div>
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
      
      {/* Image preview modal */}
      {showImagePreview && (
        <dialog open className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-0 m-0 border-0">
          <button
            onClick={() => setShowImagePreview(false)}
            aria-label="Close image preview"
            className="absolute top-4 right-4 p-3 text-white bg-black/30 rounded-full focus:outline-none"
            style={{ minWidth: 44, minHeight: 44 }}
          >
            <span className="material-symbols-outlined">close</span>
          </button>

          <img
            src={userData.avatar_url ? `${API_ORIGIN}${userData.avatar_url}` : '/default-avatar.png'}
            alt={`${userData.username} preview`}
            className="max-w-full max-h-full rounded-lg object-contain"
            loading="lazy"
          />
        </dialog>
      )}
    </div>
  );
}