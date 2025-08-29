import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

type Lang = 'fr' | 'en';

const translations: Record<Lang, Record<string, string>> = {
  fr: {
    siteTitle: 'Mini Stack Overflow',
    searchPlaceholder: 'Rechercher des questions...',
    searchButton: 'Rechercher',
    askButton: 'Poser une question',
    login: 'Connexion',
    register: 'S’inscrire',
    logout: 'Se déconnecter',
    blog: 'Le blog',
    blogSeeAll: 'Voir tous les articles →',
    announcements: 'Annonces',
    announcementsSeeAll: 'Toutes les annonces →',
    popularQuestions: 'Questions populaires',
    seeAllQuestions: 'Voir toutes les questions →',
    tagsPopular: 'Tags populaires',
    home: 'Accueil',
    questions: 'Questions',
    tags: 'Tags',
    users: 'Utilisateurs',
    companies: 'Entreprises',
    chatAssistant: 'Chat Assistant',
    comingSoonHeading: 'Fonctionnalités à venir',
    comingSoonDesc: 'Nous travaillons dessus — patience ! Vous trouverez bientôt de nouvelles fonctionnalités ici.',
    backHome: "Retour à l'accueil",
  },
  en: {
    siteTitle: 'Mini Stack Overflow',
    searchPlaceholder: 'Search questions...',
    searchButton: 'Search',
    askButton: 'Ask',
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    blog: 'The Overflow Blog',
    blogSeeAll: 'See all articles →',
    announcements: 'Featured on Meta',
    announcementsSeeAll: 'All announcements →',
    popularQuestions: 'Hot Network Questions',
    seeAllQuestions: 'See all questions →',
    tagsPopular: 'Hot Tags',
    home: 'Home',
    questions: 'Questions',
    tags: 'Tags',
    users: 'Users',
    companies: 'Companies',
    chatAssistant: 'Chat Assistant',
    comingSoonHeading: 'Coming soon',
    comingSoonDesc: 'We are working on this — stay tuned! New features will appear here soon.',
    backHome: 'Back home',
  },
};

const LanguageContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}>({ lang: 'fr', setLang: () => {}, t: (k) => k });

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      const stored = localStorage.getItem('locale');
      if (stored === 'fr' || stored === 'en') return stored;
    } catch (err) {
      // ignore localStorage read errors
      console.warn('Could not read locale from localStorage');
    }
    // infer from browser
    const nav = typeof navigator !== 'undefined' ? (navigator.language || 'fr') : 'fr';
    return nav.startsWith('en') ? 'en' : 'fr';
  });

  useEffect(() => {
    try {
      localStorage.setItem('locale', lang);
    } catch (err) {
      console.warn('Could not persist locale to localStorage');
    }
  }, [lang]);

  const t = (key: string) => translations[lang][key] ?? key;
  const value = useMemo(() => ({ lang, setLang, t }), [lang]);
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

export default LanguageContext;
