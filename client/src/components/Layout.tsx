import { Outlet, Link } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useLanguage } from '../hooks/LanguageContext';

function Layout() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}>
      <Navbar />
      <div className="flex">
        {/* Sidebar hidden on small screens, available on lg and up */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <main className="flex-1 px-6 py-8 max-w-[1100px]">
          <Outlet />
        </main>
        <div className="w-[300px] hidden lg:block px-6 py-8 border-l" style={{ borderLeft: '1px solid var(--border)' }}>
          <div className="sticky top-[50px] space-y-4">
            {/* Le blog - articles utiles */}
            <div className="rounded-md p-4" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
              <h2 className="text-sm font-medium mb-2">{t('blog')}</h2>
              <ul className="text-sm space-y-2">
                <li>
                  <Link to="/blog" className="text-left block" style={{ color: 'var(--text-primary)' }}>
                    Bonnes pratiques pour commenter le code
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="text-left block" style={{ color: 'var(--text-primary)' }}>
                    Gérer la dette technique dans votre projet
                  </Link>
                </li>
                <li className="pt-2">
                  <Link to="/blog" className="text-xs text-[var(--text-secondary)]">{t('blogSeeAll')}</Link>
                </li>
              </ul>
            </div>

            {/* Annonces / Meta */}
            <div style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '1rem' }}>
              <h2 className="text-sm font-medium mb-2">{t('announcements')}</h2>
              <ul className="text-sm space-y-2">
                <li>
                  <Link to="/annonces" className="text-left block" style={{ color: 'var(--text-primary)' }}>
                    Amélioration des performances et de la fiabilité
                  </Link>
                </li>
                <li>
                  <Link to="/annonces" className="text-left block" style={{ color: 'var(--text-primary)' }}>
                    Mise à jour des workflows de la file de revue
                  </Link>
                </li>
                <li className="pt-2">
                  <Link to="/annonces" className="text-xs text-[var(--text-secondary)]">{t('announcementsSeeAll')}</Link>
                </li>
              </ul>
            </div>

            {/* Questions populaires / réseau */}
            <div style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '1rem' }}>
              <h2 className="text-sm font-medium mb-2">{t('popularQuestions')}</h2>
              <ul className="text-sm space-y-2">
                <li>
                  <Link to="/questions?sort=votes" className="text-left block" style={{ color: 'var(--primary)' }}>
                    Comment optimiser les requêtes pour de meilleures performances ?
                  </Link>
                </li>
                <li>
                  <Link to="/questions?tag=javascript" className="text-left block" style={{ color: 'var(--primary)' }}>
                    Comprendre async/await en JavaScript
                  </Link>
                </li>
                <li>
                  <Link to="/questions?tag=react" className="text-left block" style={{ color: 'var(--primary)' }}>
                    Bonnes pratiques pour la conception de composants React
                  </Link>
                </li>
                <li className="pt-2 flex items-center justify-between">
                  <Link to="/questions" className="text-xs text-[var(--text-secondary)]">{t('seeAllQuestions')}</Link>
                  <Link to="/tags" className="text-xs text-[var(--text-secondary)]">{t('tagsPopular')}</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Layout;
