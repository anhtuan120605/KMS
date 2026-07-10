import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '../App';
import { UserPlus, Users, Search, Shield, User, Edit2, Trash2, X } from 'lucide-react';

function UserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Firmware Engineer');

  // Edit Form states
  const [editingUser, setEditingUser] = useState(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState('');

  const roles = [
    'Administrator',
    'Project Manager',
    'Senior Engineer',
    'Firmware Engineer',
    'Hardware Engineer',
    'API Test Engineer',
    'Flight Test Pilot',
    'New Engineer'
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        throw new Error('Failed to fetch users');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role })
      });

      if (response.ok) {
        setUsername('');
        setPassword('');
        setRole('Firmware Engineer');
        fetchUsers();
      } else {
        const errData = await response.json();
        alert(errData.message || 'Error creating user');
      }
    } catch (err) {
      alert('Unable to connect to server');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchUsers();
      } else {
        alert('Error deleting user');
      }
    } catch (err) {
      alert('Unable to connect to server');
    }
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setEditUsername(u.username);
    setEditRole(u.role);
    setEditPassword('');
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: editUsername, 
          role: editRole,
          password: editPassword 
        })
      });

      if (response.ok) {
        setEditingUser(null);
        fetchUsers();
      } else {
        const errData = await response.json();
        alert(errData.message || 'Error updating user');
      }
    } catch (err) {
      alert('Unable to connect to server');
    }
  };

  if (user?.role !== 'Administrator') {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-xl text-red-400">Access Denied. Administrators only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <header>
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">User Management</h1>
        <p className="text-slate-400 text-lg">Create and manage accounts for the system.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create User Form */}
        <div className="bg-surface border border-white/5 rounded-2xl p-6 shadow-xl h-fit">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-white">Create Account</h2>
          </div>

          <form onSubmit={handleCreateUser} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-background border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-background border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-background border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary/50"
              >
                {roles.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-2 px-4 rounded-xl transition-colors mt-4"
            >
              Create User
            </button>
          </form>
        </div>

        {/* User List */}
        <div className="lg:col-span-2 bg-surface border border-white/5 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center border border-accent/30">
                <Users className="w-5 h-5 text-accent" />
              </div>
              <h2 className="text-xl font-semibold text-white">System Users</h2>
            </div>
            <div className="relative w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search users..." 
                className="w-full bg-background border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-sm border-b border-white/5">
                  <th className="pb-3 font-medium">Username</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {loading ? (
                  <tr><td colSpan="3" className="py-4 text-center text-slate-400">Loading users...</td></tr>
                ) : error ? (
                  <tr><td colSpan="3" className="py-4 text-center text-red-400">{error}</td></tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                            <User className="w-4 h-4 text-slate-400" />
                          </div>
                          <span className="text-slate-200">{u.username}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
                          u.role === 'Admin' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          u.role === 'Reviewer' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {u.role === 'Admin' && <Shield className="w-3 h-3" />}
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => openEditModal(u)}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Edit User</h3>
              <button 
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary/50"
                >
                  {roles.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Password (Leave blank to keep current)</label>
                <input
                  type="text"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary/50"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-2 px-4 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary-hover text-white font-medium py-2 px-4 rounded-xl transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
