import React from 'react';
import { useAuth } from '../App';

export default function RoleSwitcher() {
  const { user, setUser } = useAuth();

  if (!user || (user.role !== 'ADMINISTRATOR' && user.role !== 'Administrator')) return null;

  const roles = ['JUNIOR', 'SENIOR', 'MANAGER', 'ADMINISTRATOR'];
  const positions = ['FIRMWARE', 'HARDWARE', 'FLIGHT'];

  const handleRoleChange = (e) => {
    setUser({
      ...user,
      role: e.target.value
    });
  };

  const handlePositionChange = (e) => {
    setUser({
      ...user,
      position: e.target.value
    });
  };

  return (
    <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg shadow-inner">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-slate-400 uppercase font-medium tracking-wider">Role:</span>
        <select
          value={user.role || 'JUNIOR'}
          onChange={handleRoleChange}
          className="bg-transparent text-xs text-white focus:outline-none cursor-pointer pr-1"
        >
          {roles.map(r => (
            <option key={r} value={r} className="bg-slate-900 text-white">{r}</option>
          ))}
        </select>
      </div>

      <div className="h-4 w-px bg-white/10"></div>

      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-slate-400 uppercase font-medium tracking-wider">Domain:</span>
        <select
          value={user.position || 'FIRMWARE'}
          onChange={handlePositionChange}
          className="bg-transparent text-xs text-white focus:outline-none cursor-pointer pr-1"
        >
          {positions.map(p => (
            <option key={p} value={p} className="bg-slate-900 text-white">{p}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
