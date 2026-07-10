import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { Lock, User, AlertCircle } from 'lucide-react';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [usersList, setUsersList] = useState([]);

  useEffect(() => {
    fetch('/api/users')
      .then(res => {
        if (res.ok) return res.json();
        return [];
      })
      .then(data => {
        const seededList = [
          { username: 'admin', role: 'Administrator' },
          { username: 'senior', role: 'Senior Engineer' },
          { username: 'manager', role: 'Project Manager' },
          { username: 'pilot', role: 'Flight Test Pilot' }
        ];
        
        const combined = [...data];
        seededList.forEach(seeded => {
          if (!combined.some(u => u.username === seeded.username)) {
            combined.push(seeded);
          }
        });
        setUsersList(combined);
      })
      .catch(() => {
        setUsersList([
          { username: 'admin', role: 'Administrator' },
          { username: 'senior', role: 'Senior Engineer' },
          { username: 'manager', role: 'Project Manager' },
          { username: 'pilot', role: 'Flight Test Pilot' }
        ]);
      });
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (response.ok) {
        const userObj = await response.json();
        setUser({
          username: userObj.username,
          role: userObj.role
        });
        navigate('/'); // Redirect to dashboard
      } else {
        const errData = await response.json();
        setError(errData.message || 'Invalid username or password');
      }
    } catch (err) {
      setError('Unable to connect to the server. Is the backend running?');
    }
  };

  const handleQuickLogin = (selectedUser) => {
    setUser({
      username: selectedUser.username,
      role: selectedUser.role
    });
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
      {/* Decorative background blur */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 bg-surface border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl z-10 p-8">
        <div>
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/30">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">KMS Drone</h2>
            <p className="text-slate-400">Knowledge Management System</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-primary/25"
            >
              Sign In
            </button>
          </form>
        </div>

        <div className="flex flex-col justify-between border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-8">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Prototype Accounts</h3>
            <p className="text-sm text-slate-400 mb-6">Select a profile to bypass authentication and sign in directly.</p>
            
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {usersList.map((u, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickLogin(u)}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/50 text-left p-4 rounded-xl transition-all duration-200 flex items-center justify-between group"
                >
                  <div>
                    <p className="font-semibold text-white group-hover:text-primary transition-colors text-sm">{u.username}</p>
                    <p className="text-xs text-slate-400">{u.role}</p>
                  </div>
                  <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-mono uppercase">
                    Quick Access
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-400 leading-relaxed font-mono">
            <strong>PROTOTYPE MODE ACTIVE:</strong> Direct local session injection is enabled for debugging convenience.
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
