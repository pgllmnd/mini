import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import ChatPopup from './ChatPopup';

function Sidebar() {
  const location = useLocation();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/', label: 'Home', icon: 'home' },
    { path: '/questions', label: 'Questions', icon: 'help_center' },
    { path: '/tags', label: 'Tags', icon: 'sell' },
    { path: '/users', label: 'Users', icon: 'group' },
    { path: '/companies', label: 'Companies', icon: 'business' },
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
