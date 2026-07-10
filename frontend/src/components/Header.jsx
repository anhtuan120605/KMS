import React, { useContext } from 'react';
import { Bell, User, LogOut } from 'lucide-react';
import { useAuth, LanguageContext } from '../App';
import { useNavigate } from 'react-router-dom';
import { translations } from '../translations';

function Header() {
  const { user, logout } = useAuth();
  const { language, setLanguage } = useContext(LanguageContext);
  const navigate = useNavigate();

  const t = (key) => translations[language][key] || key;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-20 glass border-b border-white/5 flex items-center justify-between px-8 z-10">
      <div className="flex-1"></div>

      <div className="flex items-center gap-6">
        {/* Language Toggler */}
        <button 
          onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 hover:border-primary/50 text-slate-300 hover:text-white rounded-lg transition-all text-xs font-semibold uppercase shadow-inner"
        >
          🌐 {language === 'vi' ? 'EN' : 'VI'}
        </button>

        <button className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/5">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border border-surface"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-6 border-l border-white/10">
          <div className="text-right">
            <p className="text-sm font-medium text-white">{user?.username || 'User'}</p>
            <p className="text-xs text-primary">{user?.role || 'Guest'}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent p-0.5">
            <div className="w-full h-full bg-surface rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="ml-2 p-2 text-slate-400 hover:text-red-400 transition-colors rounded-full hover:bg-red-500/10"
            title={t('logout')}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
