import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, BookOpen, Plus, CheckSquare, BarChart2, Users } from 'lucide-react';
import { useAuth, LanguageContext } from '../App';
import { translations } from '../translations';

export default function Sidebar() {
  const { user } = useAuth();
  const { language } = useContext(LanguageContext);
  const role = user?.role;

  const t = (key) => translations[language][key] || key;

  return (
    <div className="w-64 glass border-r border-white/5 flex flex-col z-20">
      <div className="p-6 flex items-center gap-3 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]">
          K
        </div>
        <span className="font-bold text-lg tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">DroneKMS</span>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <NavItem to="/" icon={<Home size={20} />} label={t('dashboard')} />
        <NavItem to="/library" icon={<BookOpen size={20} />} label={t('library')} />
        
        {/* Submit Case conditional rendering based on specific roles */}
        {role === 'Flight Test Pilot' && (
          <NavItem to="/submit" icon={<Plus size={20} />} label={t('submitFlightIncident')} />
        )}
        
        {['Firmware Engineer', 'Hardware Engineer', 'API Test Engineer'].includes(role) && (
          <NavItem to="/submit" icon={<Plus size={20} />} label={t('submitEngineeringCase')} />
        )}

        {role === 'Administrator' && (
          <NavItem to="/submit" icon={<Plus size={20} />} label={t('submitCase')} />
        )}
        
        {/* Expert Review Portal */}
        {['Senior Engineer', 'Administrator'].includes(role) && (
          <NavItem to="/review" icon={<CheckSquare size={20} />} label={t('expertReviewPortal')} />
        )}
        
        {/* User Account Management */}
        {role === 'Administrator' && (
          <NavItem to="/users" icon={<Users size={20} />} label={t('userAccountManagement')} />
        )}
      </nav>
      
      <div className="p-4 border-t border-white/5 text-xs text-slate-500 text-center">
        v1.0.0 Prototype
      </div>
    </div>
  );
}

function NavItem({ to, icon, label }) {
  const location = useLocation();
  const isActive = location.pathname + location.search === to || 
    (to === '/library' && location.pathname === '/library' && !location.search.includes('author='));

  return (
    <NavLink 
      to={to} 
      className={
        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
          isActive 
            ? 'bg-primary/20 text-primary font-medium border border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}
