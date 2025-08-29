import { Link } from 'react-router-dom';
import { useLanguage } from '../hooks/LanguageContext';

function ComingSoon() {
  const { t } = useLanguage();
  return (
    <div className="max-w-3xl mx-auto p-6 text-center">
      <h1 className="text-2xl font-bold mb-2">{t('comingSoonHeading')}</h1>
      <p className="text-sm text-[var(--text-secondary)] mb-4">{t('comingSoonDesc')}</p>

      <div className="space-y-2 text-left max-w-md mx-auto">
        <div className="p-3 rounded" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
          <strong>{t('blog')}</strong>
          <div className="text-xs text-[var(--text-secondary)]">Articles et conseils publiés bientôt.</div>
        </div>

        <div className="p-3 rounded" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
          <strong>{t('announcements')}</strong>
          <div className="text-xs text-[var(--text-secondary)]">Mises à jour et communications de la plateforme.</div>
        </div>

        <div className="p-3 rounded" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
          <strong>Pages et intégrations</strong>
          <div className="text-xs text-[var(--text-secondary)]">Pages supplémentaires (collectives, entreprises, etc.) prévues.</div>
        </div>
      </div>

      <div className="mt-6">
        <Link to="/" className="btn-outline">{t('backHome')}</Link>
      </div>
    </div>
  );
}

export default ComingSoon;
