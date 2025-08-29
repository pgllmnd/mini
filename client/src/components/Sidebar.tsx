import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import ChatPopup from './ChatPopup';
import { useLanguage } from '../hooks/LanguageContext';

function Sidebar() {
  const location = useLocation();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  const { lang, setLang } = useLanguage();

  const { t } = useLanguage();

  const navItems = [
    { path: '/', label: t('home'), icon: 'home' },
    { path: '/questions', label: t('questions'), icon: 'help_center' },
    { path: '/tags', label: t('tags'), icon: 'sell' },
    { path: '/users', label: t('users'), icon: 'group' },
    { path: '/companies', label: t('companies'), icon: 'business' },
  ];

  return (
    <nav className="sticky top-[50px] w-[164px] h-[calc(100vh-50px)] overflow-y-auto relative"
         style={{ backgroundColor: 'var(--card)', borderRight: '1px solid var(--border)' }}>
      <div className="px-2 py-8 pb-20">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center px-4 py-2 text-sm rounded-md w-full mb-1 ${
              isActivePath(item.path)
                ? 'font-medium'
                : 'hover:bg-[var(--surface)]'
            }`}
          >
            <span className="material-symbols-outlined mr-2 text-[20px]">{item.icon}</span>
            {item.label}
          </Link>
        ))}

        <div className="mt-8">
          <div className="text-xs font-medium text-gray-500 px-4 py-2 mb-2">COLLECTIVES</div>
          <Link
            to="/collectives/explore"
            className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-md w-full hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <span className="material-symbols-outlined mr-2 text-[20px]">explore</span>
            Explore Collectives
          </Link>
        </div>
        
        {/* Language selector placed in sidebar */}
        <div className="sidebar-locale-container mt-6 px-4">
          <label htmlFor="sidebar-locale" className="text-xs text-[var(--text-secondary)] block mb-2">Langue</label>
          <div className="locale-wrapper">
            <span className="locale-icon" aria-hidden>🌐</span>
            <select
              id="sidebar-locale"
              value={lang}
              onChange={(e) => setLang(e.target.value as 'fr' | 'en')}
              className="locale-select"
              aria-label="Sélection de la langue"
            >
              <option value="fr">🇫🇷 Français</option>
              <option value="en">EN English</option>
            </select>
          </div>
        </div>
      </div>
      {/* Assistant Chat Button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pt-16">
        <button
          onClick={() => setIsChatOpen(true)}
          className={`flex items-center justify-center w-full px-4 py-2 text-sm rounded-md transition-all`}
          style={{ backgroundColor: 'var(--primary)', color: 'white' }}
        >
          <span className="material-symbols-outlined mr-2">chat</span>
          Chat Assistant
        </button>
      </div>

      {/* Chat Popup */}
      <ChatPopup 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />
    </nav>
  );
}

export default Sidebar;
