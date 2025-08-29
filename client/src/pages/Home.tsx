import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { API_ORIGIN } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { FiBookmark, FiLink, FiTag } from 'react-icons/fi';
// Modern Home: small inline SVG icons, improved layout and skeleton loader

interface Question {
  id: number;
  title: string;
  content: string;
  tags: string[];
  author_username: string;
  // optional avatar path returned by API (eg. '/uploads/avatars/123.png')
  author_avatar_url?: string | null;
  created_at: string;
  answer_count: number;
  upvotes: number;
  downvotes: number;
}

function Home() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'votes' | 'answers'>('newest');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(8);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const loadQuestions = useCallback(async (query?: string) => {
    try {
      setLoading(true);
  const { data } = await api.get('/questions', {
        params: {
          q: query,
          sort: sortBy,
        },
      });
      // Ensure each question has a tags array, even if empty
      const questionsWithTags = data.map((question: Question) => ({
        ...question,
        tags: question.tags || [],
      }));
      setQuestions(questionsWithTags);
      setError('');
    } catch (error) {
      console.error('Failed to load questions:', error);
      setError('Échec du chargement des questions. Veuillez réessayer plus tard.');
      // Set empty questions array on error
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [sortBy]);

  useEffect(() => {
    const query = searchParams.get('q') || '';
    loadQuestions(query);
  }, [searchParams, sortBy, loadQuestions]);

  // load bookmarks from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('bookmarkedQuestions');
      if (raw) setBookmarks(JSON.parse(raw));
    } catch (e) {
      // ignore
    }
  }, []);

  const toggleBookmark = (id: number) => {
    setBookmarks((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((x) => x !== id) : [id, ...prev];
      try { localStorage.setItem('bookmarkedQuestions', JSON.stringify(next)); } catch(e){}
      return next;
    });
  };

  const topTags = useMemo(() => {
    const counts: Record<string, number> = {};
    questions.forEach((q) => q.tags.forEach((t) => counts[t] = (counts[t] || 0) + 1));
    return Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([t])=>t);
  }, [questions]);

  // UI state for improved tag dropdown
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [tagQuery, setTagQuery] = useState('');
  const filteredTopTags = useMemo(() => {
    if (!tagQuery) return topTags;
    return topTags.filter((t) => t.toLowerCase().includes(tagQuery.toLowerCase()));
  }, [topTags, tagQuery]);

  const filteredQuestions = useMemo(() => {
    if (!filterTag) return questions;
    return questions.filter((q) => q.tags.includes(filterTag));
  }, [questions, filterTag]);

  const visibleQuestions = filteredQuestions.slice(0, visibleCount);

  const timeAgo = (iso?: string) => {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const sec = Math.floor(diff/1000);
    if (sec < 60) return `il y a ${sec}s`;
    const min = Math.floor(sec/60);
    if (min < 60) return `il y a ${min}m`;
    const h = Math.floor(min/60);
    if (h < 24) return `il y a ${h}h`;
    const d = Math.floor(h/24);
    return `il y a ${d}j`;
  };

  // small helper to create a colorful SVG avatar when user has no avatar image
  const makeInitialsAvatar = (name: string) => {
    const initials = (name || '?').split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase();
    // simple deterministic color from name
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const hue = Math.abs(hash) % 360;
    const bg = `hsl(${hue} 70% 80%)`;
    const fg = `hsl(${hue} 40% 25%)`;
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='72' height='72'><rect width='100%' height='100%' fill='${bg}' rx='12'/><text x='50%' y='55%' font-size='32' font-family='Inter, Arial, sans-serif' fill='${fg}' text-anchor='middle' dominant-baseline='middle'>${initials}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };



  // Search moved to Navbar; Home listens to URL params to load questions.

  if (loading) {
    // show a nicer skeleton grid while loading
    return (
      <div className="max-w-5xl mx-auto p-4 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-full text-sm font-medium bg-[var(--surface)] text-[var(--text-primary)]">
              — questions
            </div>
            <div className="text-sm text-[var(--text-secondary)]">Résultats</div>
          </div>

          <div>
            <div className="px-3 py-1 rounded-md text-sm shadow-sm bg-white" style={{ border: '1px solid rgba(0,0,0,0.04)' }}>
              Chargement
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card question-card animate-appear">
              <div className="flex gap-4">
                <div className="vote-column">
                  <div className="skeleton skeleton-sm" />
                  <div className="skeleton skeleton-sm mt-2" />
                </div>
                <div className="flex-1">
                  <div className="skeleton skeleton-line" />
                  <div className="skeleton skeleton-line short mt-2" />
                  <div className="mt-4 flex justify-between items-center">
                    <div className="skeleton skeleton-chip" />
                    <div className="skeleton skeleton-chip small" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      {/* Hero banner */}
      <div className="home-hero card">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold" style={{ marginBottom: 6 }}>Trouve des réponses, partage ton savoir</h1>
            <p className="text-sm text-[var(--text-secondary)]">Explore les questions récentes et populaires. Pose ta propre question en un clic.</p>
            <div className="mt-3 flex items-center gap-3">
  <Link
  to="/questions/ask"
  className="
    px-4 py-2 rounded-md font-medium border
    border-primary text-primary hover:bg-primary hover:text-white
    dark:border-primary dark:text-primary dark:hover:bg-primary dark:hover:text-black
  "
>
  Poser une question
</Link>

  <button
    className="btn-outline"
    onClick={() => { setFilterTag(null); setVisibleCount(8); window.scrollTo({ top: document.body.scrollTop + 200, behavior: 'smooth' }); }}
  >
    Explorer
  </button>
</div>

          </div>
          <div className="hidden md:block">
  <div
    className="
      w-[140px] h-[92px] rounded-xl flex items-center justify-center shadow-lg
      bg-gradient-to-br from-gray-100 to-gray-50
      dark:from-[rgba(255,255,255,0.08)] dark:to-[rgba(255,255,255,0.02)]
    "
  >
    <svg
      width="92"
      height="64"
      viewBox="0 0 92 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect
        x="2"
        y="2"
        width="88"
        height="60"
        rx="10"
        stroke="rgba(0,0,0,0.1)"
        className="dark:stroke-[rgba(255,255,255,0.06)]"
        strokeWidth="4"
      />
      <path
        d="M18 30h56M18 22h40"
        stroke="rgba(0,0,0,0.6)"
        className="dark:stroke-[rgba(255,255,255,0.7)]"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  </div>
</div>

        </div>
      </div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

        <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}>
            {questions.length} {questions.length === 1 ? 'question' : 'questions'}
          </div>
        </div>

        <div className="relative">
          <button className="filter-pill" onClick={() => setShowSortMenu(s => !s)} aria-haspopup="true" aria-expanded={showSortMenu}>{sortBy === 'newest' ? 'Les plus récentes' : sortBy === 'votes' ? 'Plus de votes' : 'Plus de réponses'} ▾</button>
          {showSortMenu && (
            <div className="card shadow-soft mt-2" style={{ position: 'absolute', right: 0, minWidth: 220, zIndex: 50 }}>
              <button className="tag-item" onClick={() => { setSortBy('newest'); setShowSortMenu(false); }}><strong>Les plus récentes</strong><div className="text-xs text-[var(--text-secondary)]">Trier par date de création</div></button>
              <button className="tag-item" onClick={() => { setSortBy('votes'); setShowSortMenu(false); }}><strong>Plus de votes</strong><div className="text-xs text-[var(--text-secondary)]">Trier par score (up - down)</div></button>
              <button className="tag-item" onClick={() => { setSortBy('answers'); setShowSortMenu(false); }}><strong>Plus de réponses</strong><div className="text-xs text-[var(--text-secondary)]">Trier par nombre de réponses</div></button>
            </div>
          )}
        </div>
      </div>

      {/* compact tag selector to reduce clutter */}
      {topTags.length > 0 && (
        <div className="flex gap-2 items-center relative">
          <div className="tag-dropdown">
            <button
              className="filter-pill"
              onClick={() => { setShowTagMenu((s) => !s); setTagQuery(''); }}
              aria-haspopup="true"
              aria-expanded={showTagMenu}
            >
              Tags populaires ▾
            </button>

            {showTagMenu && (
              <div className="tag-menu card shadow-soft" role="menu">
                <div className="p-2">
                  <input
                    value={tagQuery}
                    onChange={(e) => setTagQuery(e.target.value)}
                    placeholder="Rechercher un tag..."
                    className="px-3 py-1 rounded-md"
                    aria-label="Rechercher un tag"
                  />
                </div>
                <div className="tag-list p-2">
                  <button className={`filter-pill ${filterTag===null? 'active':''}`} onClick={()=>{ setFilterTag(null); setShowTagMenu(false); }} style={{ width: '100%', textAlign: 'left' }}>Tous</button>
                  {filteredTopTags.length === 0 && (
                    <div className="text-sm text-[var(--text-secondary)] p-2">Aucun tag trouvé</div>
                  )}
                  {filteredTopTags.map((t) => (
                    <button key={t} className={`tag-item`} onClick={() => { setFilterTag(filterTag===t? null : t); setShowTagMenu(false); }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link to="/tags" className="btn-outline" style={{ padding: '0.4rem 0.7rem' }}>
            Voir tous les tags
          </Link>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {visibleQuestions.map((question) => (
          <div key={question.id} className="card question-card group hover:shadow-soft">
            <div className="flex gap-4">
                  <div className="vote-column text-center">
                    <div className="vote-count">{question.upvotes - question.downvotes}</div>
                    <div className="text-xs text-[var(--text-secondary)]">votes</div>
                    <div className="mt-3 text-sm text-[var(--text-secondary)]">{question.answer_count} réponses</div>
                  </div>

              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <Link to={`/questions/${question.id}`} className="inline-block text-lg font-semibold mb-1 hover:underline">
                    {question.title}
                  </Link>
                  <div className="flex items-center gap-2">
                    <button className="btn-link bookmark-btn" onClick={()=>toggleBookmark(question.id)} title={bookmarks.includes(question.id)? 'Retirer des favoris' : 'Ajouter aux favoris'}>
                      {bookmarks.includes(question.id) ? <FiBookmark /> : <FiBookmark />}
                    </button>

                    <button className="btn-link" onClick={()=>{ navigator.clipboard?.writeText(window.location.origin + `/questions/${question.id}`); }} title="Copier le lien">
                      <FiLink />
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-sm text-[var(--text-secondary)] line-clamp-2">{question.content}</p>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                    <div className="author-avatar" aria-hidden>
                      {question.author_avatar_url ? (
                        <img
                          src={`${API_ORIGIN}${question.author_avatar_url}`}
                          alt={question.author_username}
                          onError={(e) => { const t = e.target as HTMLImageElement; t.onerror = null; t.src = makeInitialsAvatar(question.author_username); }}
                        />
                      ) : (
                        <img src={makeInitialsAvatar(question.author_username)} alt={question.author_username} />
                      )}
                    </div>
                    <Link to={`/users/${question.author_username}`} className="hover:underline text-sm">
                      {question.author_username}
                    </Link>
                    <span className="text-[var(--text-secondary)] text-xs">• {timeAgo(question.created_at)}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                      {question.tags.map((tag) => (
                        <Link
                          key={tag}
                          to={`/questions?tag=${tag}`}
                          className={`tag-badge small ${tag.length > 8 ? 'gray' : 'blue'} compact`}
                          title={tag}
                        >
                          <FiTag />
                          <span className="tag-text" aria-hidden>
                            {tag.length > 12 ? `${tag.slice(0, 12)}…` : tag}
                          </span>
                        </Link>
                      ))}
                    </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredQuestions.length === 0 && !error && (
          <div className="text-center py-8 text-gray-500">
            Aucun résultat. {user ? (
              <Link to="/questions/ask" className="text-[var(--link-color)] hover:opacity-90 font-semibold">
                  Posez la première question !
                </Link>
            ) : (
              <Link to="/login" className="text-[var(--link-color)] hover:opacity-90 font-semibold">
                Connectez-vous pour poser une question
              </Link>
            )}
          </div>
        )}

        {filteredQuestions.length > visibleQuestions.length && (
          <div className="col-span-full text-center mt-2">
            <button className="btn-outline" onClick={()=>setVisibleCount((v)=>v+8)}>Charger plus</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
