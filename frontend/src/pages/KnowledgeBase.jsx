import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Filter, FileText, Search, Edit2, Trash2, X, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { useAuth, LanguageContext } from '../App';
import { translations } from '../translations';

export default function KnowledgeBase() {
  const { user } = useAuth();
  const { language } = useContext(LanguageContext);
  const t = (key) => translations[language][key] || key;
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(0);
  const [mySubmissionsOnly, setMySubmissionsOnly] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const [searchVal, setSearchVal] = useState(() => {
    const queryParams = new URLSearchParams(location.search);
    return queryParams.get('search') || '';
  });

  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    summary: '',
    category: '',
    status: '',
    knowledgeType: 'Explicit',
    severityLevel: 'Low',
    rootCause: '',
    tags: ''
  });

  const fetchItems = () => {
    const queryParams = new URLSearchParams(location.search);
    const categoryQuery = queryParams.get('category');
    const searchQuery = queryParams.get('search');
    const statusQuery = queryParams.get('status');

    let url = '/api/knowledge';
    const params = [];

    if (categoryQuery && categoryQuery !== 'All') {
      params.push(`category=${encodeURIComponent(categoryQuery)}`);
    }
    if (searchQuery) {
      params.push(`search=${encodeURIComponent(searchQuery)}`);
    }
    if (statusQuery) {
      params.push(`status=${encodeURIComponent(statusQuery)}`);
    } else {
      // Automatically append status=Approved parameter for regular engineer/pilot roles to safeguard data governance
      if (!['SENIOR', 'MANAGER', 'ADMINISTRATOR', 'Senior Engineer', 'Project Manager', 'Administrator'].includes(user?.role)) {
        params.push('status=Approved');
      }
    }

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (['ADMINISTRATOR', 'MANAGER', 'SENIOR', 'Administrator', 'Project Manager', 'Senior Engineer'].includes(user?.role)) {
          setItems(data);
        } else {
          // Users see Approved/Investigating assets OR items they authored (Pending, Rejected)
          const visibleData = data.filter(item => {
            const authorName = item.author || '';
            return item.status === 'Approved' || item.status === 'Investigating' || authorName === user?.username;
          });
          setItems(visibleData);
        }
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    if (location.state?.evolvedSuccess) {
      setToastMsg('Sự cố đã được đóng và nâng cấp thành Bài học kinh nghiệm v1.0 thành công!');
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 4000);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    let categoryQuery = queryParams.get('category');
    let searchQuery = queryParams.get('search');
    const authorQuery = queryParams.get('author');

    if (location.state && location.state.selectedTag) {
      const incomingTag = location.state.selectedTag;
      searchQuery = incomingTag;
      categoryQuery = null;
      setFilter(null);
      queryParams.delete('category');
      queryParams.set('search', incomingTag);
      navigate({ search: queryParams.toString() }, { replace: true, state: {} });
    }

    if (categoryQuery) {
      setFilter(categoryQuery);
    } else {
      setFilter(null);
    }

    setSearchVal(searchQuery || '');
    setMySubmissionsOnly(authorQuery === 'me');
    fetchItems();
  }, [location, user]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const queryParams = new URLSearchParams(location.search);
    if (searchVal.trim()) {
      queryParams.set('search', searchVal.trim());
    } else {
      queryParams.delete('search');
    }
    navigate({ search: queryParams.toString() });
  };

  const categories = [
    'SOP & Checklist',
    'Maintenance Logs',
    'Troubleshooting Cases',
    'Lessons Learned',
    'Training & Regulation'
  ];
  const queryParams = new URLSearchParams(location.search);
  const showBookmarksOnly = queryParams.get('bookmarks') === 'true';
  const positionFilter = queryParams.get('position');

  const filteredItems = items.filter(item => {
    if (positionFilter && item.authorPosition !== positionFilter) {
      return false;
    }
    if (searchVal.trim()) {
      const cleanedKeyword = searchVal.trim().toLowerCase();
      const matchesSearch =
        item.title.toLowerCase().includes(cleanedKeyword) ||
        item.summary.toLowerCase().includes(cleanedKeyword) ||
        (item.tags && item.tags.some(t => t.toLowerCase().includes(cleanedKeyword)));
      if (!matchesSearch) return false;
    }

    if (showBookmarksOnly) {
      if (!user?.username) return false;
      const stored = localStorage.getItem(`kms_bookmarks_${user.username}`);
      const bookmarks = stored ? JSON.parse(stored) : [];
      return bookmarks.includes(item.id.toString());
    }
    if (mySubmissionsOnly) {
      const authorName = item.author || '';
      return authorName === user?.username;
    }
    return true;
  });

  // Pagination
  const PAGE_SIZE = 6;
  const totalPages = Math.ceil(filteredItems.length / PAGE_SIZE);
  // Auto-reset page when filters/search change
  useEffect(() => { setCurrentPage(0); }, [searchVal, filter, mySubmissionsOnly, showBookmarksOnly]);
  const paginatedItems = filteredItems.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const handleDelete = async (e, id) => {
    e.preventDefault(); // Prevent navigating to item detail
    if (!window.confirm('Are you sure you want to delete this knowledge asset?')) return;

    try {
      const response = await fetch(`/api/knowledge/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchItems();
      } else {
        alert('Error deleting knowledge asset');
      }
    } catch (err) {
      alert('Unable to connect to server');
    }
  };

  const openEditModal = (e, item) => {
    e.preventDefault(); // Prevent navigating to item detail
    setEditingItem(item);
    setEditForm({
      title: item.title || '',
      summary: item.summary || '',
      category: item.category || 'SOP & Checklist',
      status: item.status || 'Pending',
      knowledgeType: item.knowledgeType || 'Explicit',
      severityLevel: item.severityLevel || 'Low',
      rootCause: item.rootCause || '',
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || ''),
      detailedContent: item.detailedContent || ''
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    // Automatically reset status to Pending for non-admins to trigger resubmission
    const payload = {
      ...editForm,
      status: user?.role === 'Administrator' ? editForm.status : 'Pending',
      tags: typeof editForm.tags === 'string' ? editForm.tags.split(',').map(t => t.trim()).filter(t => t) : editForm.tags
    };

    try {
      const response = await fetch(`/api/knowledge/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setEditingItem(null);
        fetchItems();
      } else {
        alert('Error updating knowledge asset');
      }
    } catch (err) {
      alert('Unable to connect to server');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            {showBookmarksOnly ? t('bookmarkedItems') : t('library')}
          </h1>
          <p className="text-slate-400 mt-1">
            {showBookmarksOnly ? t('bookmarkedItemsSub') : t('librarySub')}
          </p>
        </div>
      </div>

      {/* Unified Search & Filters Panel */}
      <div className="glass p-6 rounded-2xl space-y-4">
        {/* Search Input Row */}
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full bg-background/50 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
            />
            {searchVal && (
              <button
                type="button"
                onClick={() => {
                  setSearchVal('');
                  const queryParams = new URLSearchParams(location.search);
                  queryParams.delete('search');
                  navigate({ search: queryParams.toString() });
                }}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-medium rounded-xl text-sm transition-all shadow-lg hover:shadow-primary/20"
          >
            {t('Tìm kiếm') || 'Search'}
          </button>
        </form>

        {/* Filter Buttons Row */}
        <div className="flex flex-wrap gap-3 items-center pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 text-slate-400 text-sm font-medium mr-2">
            <Filter size={16} className="text-primary" />
            <span>{language === 'vi' ? 'Bộ lọc danh mục:' : 'Category Filters:'}</span>
          </div>
          {categories.map(cat => {
            const isSelected = filter === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  const queryParams = new URLSearchParams(location.search);
                  if (isSelected) {
                    setFilter(null);
                    queryParams.delete('category');
                  } else {
                    setFilter(cat);
                    queryParams.set('category', cat);
                  }
                  navigate({ search: queryParams.toString() });
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all cursor-pointer ${isSelected
                  ? 'bg-primary text-white shadow-[0_0_10px_rgba(59,130,246,0.5)] border-primary'
                  : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                  }`}
              >
                {t(cat)}
              </button>
            );
          })}
        </div>

        {/* Position Filter Row */}
        <div className="flex flex-wrap gap-3 items-center pt-3 mt-2 border-t border-white/5">
          <div className="flex items-center gap-2 text-slate-400 text-sm font-medium mr-2">
            <Users size={16} className="text-pink-500" />
            <span>{language === 'vi' ? 'Chuyên môn:' : 'Domain:'}</span>
          </div>
          {['FIRMWARE', 'HARDWARE', 'FLIGHT'].map(pos => {
            const isSelected = positionFilter === pos;
            return (
              <button
                key={pos}
                onClick={() => {
                  const queryParams = new URLSearchParams(location.search);
                  if (isSelected) {
                    queryParams.delete('position');
                  } else {
                    queryParams.set('position', pos);
                  }
                  navigate({ search: queryParams.toString() });
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all cursor-pointer ${isSelected
                  ? 'bg-pink-500 text-white shadow-[0_0_10px_rgba(236,72,153,0.5)] border-pink-500'
                  : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                  }`}
              >
                {pos}
              </button>
            );
          })}
        </div>
      </div>

      {/* Item Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500">
            <FileText size={48} className="mx-auto mb-4 opacity-20" />
            <p>{t('noRecentActivity')}</p>
          </div>
        ) : (
          paginatedItems.map(item => {
            const isTroubleshooting = item.category === 'Troubleshooting Cases';
            return (
              <div key={item.id} className="relative group">
                <Link 
                  to={`/item/${item.id}`} 
                  className={`glass p-6 rounded-2xl transition-all block h-full flex flex-col ${
                    isTroubleshooting 
                      ? 'bg-amber-950/20 border-2 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.12)] hover:border-amber-400' 
                      : 'hover:border-primary/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4 gap-2">
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                        isTroubleshooting
                          ? 'text-amber-400 bg-amber-500/20 border border-amber-500/40'
                          : 'text-primary bg-primary/10'
                      }`}>
                        {t(item.category)}
                      </span>
                      {isTroubleshooting && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md text-amber-400 bg-amber-500/20 border border-amber-500/40 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                          {language === 'vi' ? 'Đang thảo luận' : 'Under Discussion'}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</span>
                      {(['ADMINISTRATOR', 'Administrator'].includes(user?.role) || (item.author || '').split('|')[0] === user?.username) && item.status !== 'Approved' && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${item.status === 'Pending' ? 'text-yellow-500 bg-yellow-500/10' : 'text-red-500 bg-red-500/10'
                          }`}>{t(item.status)}</span>
                      )}
                    </div>
                  </div>
                  <h3 className={`text-lg font-semibold mb-2 transition-colors ${isTroubleshooting ? 'group-hover:text-amber-400' : 'group-hover:text-primary'}`}>{item.title}</h3>
                  <p className="text-slate-400 text-sm line-clamp-2 mb-4 flex-1">{item.summary}</p>
                {item.tags && item.tags.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap mb-4 relative z-10">
                    {item.tags.map(tag => (
                      <button
                        key={tag}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          navigate('/library', { state: { selectedTag: tag } });
                        }}
                        className="bg-slate-800/30 text-slate-300 border border-slate-700/50 hover:border-blue-500/50 hover:text-blue-400 font-mono text-[10px] px-2 py-0.5 rounded transition-all duration-150 cursor-pointer"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-slate-500 border-t border-white/5 pt-4 mt-auto">
                  <span>By {(item.author || '').split('|')[0] || 'Unknown'}</span>
                  <span>v{item.versionControl}</span>
                </div>
              </Link>

              {/* Actions Overlay: Admin OR the original author */}
              {(['ADMINISTRATOR', 'Administrator'].includes(user?.role) || (item.author || '').split('|')[0] === user?.username) && (
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => openEditModal(e, item)}
                    className="p-1.5 bg-surface border border-white/10 text-slate-300 hover:text-primary hover:border-primary/50 rounded shadow-lg backdrop-blur-md transition-all z-10"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, item.id)}
                    className="p-1.5 bg-surface border border-white/10 text-slate-300 hover:text-red-400 hover:border-red-500/50 rounded shadow-lg backdrop-blur-md transition-all z-10"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-500 font-mono">
            {language === 'vi'
              ? `Hiển thị ${currentPage * PAGE_SIZE + 1}–${Math.min((currentPage + 1) * PAGE_SIZE, filteredItems.length)} / ${filteredItems.length} bài`
              : `Showing ${currentPage * PAGE_SIZE + 1}–${Math.min((currentPage + 1) * PAGE_SIZE, filteredItems.length)} of ${filteredItems.length}`}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`w-8 h-8 rounded-lg text-xs font-mono font-bold border transition-all ${
                  i === currentPage
                    ? 'bg-primary border-primary text-white shadow-[0_0_8px_rgba(59,130,246,0.4)]'
                    : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
              className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Edit Knowledge Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-2xl shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Edit Knowledge Asset</h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">{t('titleLabel')}</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary/50"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">{t('categoryLabel')}</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full bg-background border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary/50"
                  >
                    <option value="SOP & Checklist">{t('SOP & Checklist')}</option>
                    <option value="Maintenance Logs">{t('Maintenance Logs')}</option>
                    <option value="Troubleshooting Cases">{t('Troubleshooting Cases')}</option>
                    {['SENIOR', 'MANAGER', 'ADMINISTRATOR', 'Senior Engineer', 'Project Manager', 'Administrator'].includes(user?.role) && (
                      <option value="Lessons Learned">{t('Lessons Learned')}</option>
                    )}
                    <option value="Training & Regulation">{t('Training & Regulation')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">{t('kbTypeLabel')}</label>
                  <select
                    value={editForm.knowledgeType}
                    onChange={(e) => setEditForm({ ...editForm, knowledgeType: e.target.value })}
                    className="w-full bg-background border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary/50"
                  >
                    <option value="Explicit">{t('Explicit')}</option>
                    <option value="Tacit">{t('Tacit')}</option>
                    <option value="Mixed">{t('Mixed')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">{t('severityLabel')}</label>
                  <select
                    value={editForm.severityLevel}
                    onChange={(e) => setEditForm({ ...editForm, severityLevel: e.target.value })}
                    className="w-full bg-background border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary/50"
                  >
                    <option value="Low">{t('Low')}</option>
                    <option value="Medium">{t('Medium')}</option>
                    <option value="High">{t('High')}</option>
                    <option value="Critical">{t('Critical')}</option>
                  </select>
                </div>
                {user?.role === 'Administrator' ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">{t('role')}</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full bg-background border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary/50"
                    >
                      <option value="Pending">{t('Pending')}</option>
                      <option value="Approved">{t('Approved')}</option>
                      <option value="Rejected">{t('Rejected')}</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">{t('tagsLabel')}</label>
                    <input
                      type="text"
                      value={editForm.tags}
                      onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                      className="w-full bg-background border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary/50"
                    />
                  </div>
                )}
              </div>

              {user?.role === 'Administrator' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">{t('tagsLabel')}</label>
                  <input
                    type="text"
                    value={editForm.tags}
                    onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                    className="w-full bg-background border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary/50"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">{t('summaryLabel')}</label>
                <textarea
                  value={editForm.summary}
                  onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary/50 min-h-[60px]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">{t('detailedContent')}</label>
                <textarea
                  value={editForm.detailedContent}
                  onChange={(e) => setEditForm({ ...editForm, detailedContent: e.target.value })}
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary/50 min-h-[100px]"
                  placeholder={t('detailedContentPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">{t('rootCauseLabel')}</label>
                <textarea
                  value={editForm.rootCause}
                  onChange={(e) => setEditForm({ ...editForm, rootCause: e.target.value })}
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary/50 min-h-[60px]"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
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
      {toastVisible && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950/90 border border-emerald-500/40 text-emerald-400 px-4 py-3 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] font-mono text-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
