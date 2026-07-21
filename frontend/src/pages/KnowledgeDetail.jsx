import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, User, Calendar, Tag, ShieldAlert, FileText, Users, Bookmark, X, MessageSquare } from 'lucide-react';
import { LanguageContext, useAuth } from '../App';
import { translations } from '../translations';
import { supabase } from '../supabaseClient';

export default function KnowledgeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { language } = useContext(LanguageContext);
  const { user } = useAuth();
  const t = (key) => translations[language][key] || key;

  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [observations, setObservations] = useState('');
  const [submittingUpdate, setSubmittingUpdate] = useState(false);

  const [newComment, setNewComment] = useState('');
  const [showEvolveModal, setShowEvolveModal] = useState(false);
  const [evolveRootCause, setEvolveRootCause] = useState('');
  const [evolveDetailedContent, setEvolveDetailedContent] = useState('');
  const [submittingEvolve, setSubmittingEvolve] = useState(false);

  useEffect(() => {
    fetch('/api/knowledge')
      .then(res => res.json())
      .then(data => {
        const found = data.find(d => d.id.toString() === id);
        setItem(found);
      })
      .catch(err => console.error(err));
  }, [id]);

  useEffect(() => {
    if (id && user?.username) {
      const stored = localStorage.getItem(`kms_bookmarks_${user.username}`);
      const bookmarks = stored ? JSON.parse(stored) : [];
      setIsBookmarked(bookmarks.includes(id));
    }
  }, [id, user]);

  const toggleBookmark = () => {
    if (!user?.username) return;
    const key = `kms_bookmarks_${user.username}`;
    const stored = localStorage.getItem(key);
    let bookmarks = stored ? JSON.parse(stored) : [];
    if (bookmarks.includes(id)) {
      bookmarks = bookmarks.filter(b => b !== id);
      setIsBookmarked(false);
    } else {
      bookmarks.push(id);
      setIsBookmarked(true);
    }
    localStorage.setItem(key, JSON.stringify(bookmarks));
  };

  const handleContributeSubmit = (e) => {
    e.preventDefault();
    if (!observations.trim()) return;
    setSubmittingUpdate(true);

    // All updates are auto-approved directly without any manual review/approval queue
    const requiresReview = false;

    const timestamp = new Date().toISOString();
    let updatedItem = { ...item };

    if (requiresReview) {
      // Goes to pending queue for manual review
      const newProposal = `${user.username}|${user.role}||${observations.trim()}||${timestamp}`;
      updatedItem = {
        ...item,
        proposedUpdates: [...(item.proposedUpdates || []), newProposal]
      };
    } else {
      // Auto-approve: calculate next version and push directly to approvedUpdates
      const currentVer = item.version || 'v1.0';
      const verNum = parseFloat(currentVer.replace('v', ''));
      const nextVer = `v${(verNum + 0.1).toFixed(1)}`;
      const approvedLogStr = `${nextVer}||${user.username}||${observations.trim()}||${timestamp}`;
      updatedItem = {
        ...item,
        approvedUpdates: [...(item.approvedUpdates || []), approvedLogStr]
      };
    }

    fetch(`/api/knowledge/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedItem)
    })
    .then(res => {
      if (res.ok) return res.json();
      throw new Error('Failed to submit contribution');
    })
    .then(serverItem => {
      setItem(serverItem);
      setObservations('');
      setShowUpdateModal(false);
      const msg = requiresReview
        ? 'Đóng góp đã gửi và đang chờ phê duyệt'
        : 'Đóng góp đã được tự động duyệt và hiển thị ngay';
      setToastMsg(msg);
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 3500);
    })
    .catch(err => alert(err.message))
    .finally(() => setSubmittingUpdate(false));
  };


  const handleConfirmSuccessfulApplication = async () => {
    try {
      const currentCount = item.helpfulCount || item.helpful_count || 0;
      const newCount = currentCount + 1;

      // Optimistically update local component state
      setItem(prev => ({ 
        ...prev, 
        helpfulCount: newCount,
        helpful_count: newCount
      }));

      // Trigger immediate async database update via Java backend proxy endpoint (to avoid Supabase PostgREST schema cache mismatch)
      const response = await fetch(`/api/knowledge/${item.id}/apply`, {
        method: 'PUT'
      });

      if (!response.ok) {
        throw new Error('Failed to update application count via server proxy');
      }

      const updatedAsset = await response.json();
      setItem(prev => ({ 
        ...prev, 
        helpfulCount: updatedAsset.helpfulCount,
        helpful_count: updatedAsset.helpfulCount
      }));

      // Show monospace inline success notification
      setToastMsg(t('applicationSessionLogged'));
      setToastVisible(true);
      
      setTimeout(() => {
        setToastVisible(false);
      }, 3000);
    } catch (err) {
      console.error("Backend proxy update error:", err);
      alert("Failed to log successful application: " + err.message);
    }
  };

  const handleSendComment = () => {
    if (!newComment.trim()) return;
    
    fetch(`/api/knowledge/${item.id}/comment`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: user?.username || 'Anonymous',
        commentText: newComment.trim()
      })
    })
    .then(res => {
      if (res.ok) return res.json();
      throw new Error('Failed to submit comment');
    })
    .then(serverItem => {
      setItem(serverItem);
      setNewComment('');
      setToastMsg(t('commentLoggedToast'));
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 3000);
    })
    .catch(err => alert(err.message));
  };

  const handleEvolveSubmit = (e) => {
    e.preventDefault();
    if (!evolveRootCause.trim() || !evolveDetailedContent.trim()) return;
    setSubmittingEvolve(true);

    const evolvedItem = {
      ...item,
      category: 'Lessons Learned',
      status: 'Approved',
      rootCause: evolveRootCause.trim(),
      detailedContent: evolveDetailedContent.trim(),
      version: 'v1.0'
    };

    fetch(`/api/knowledge/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(evolvedItem)
    })
    .then(res => {
      if (res.ok) return res.json();
      throw new Error('Failed to evolve incident session');
    })
    .then(() => {
      setShowEvolveModal(false);
      navigate('/library', { state: { evolvedSuccess: true } });
    })
    .catch(err => {
      alert(err.message);
      setSubmittingEvolve(false);
    });
  };

  if (!item) {
    return <div className="p-8 text-center text-slate-400">Loading or not found...</div>;
  }

  const authorName = item.author || 'Anonymous';
  const authorRole = item.authorRole || 'JUNIOR';
  const authorUsername = item.author || 'Anonymous';
  const isSeniorOrAbove = ['SENIOR', 'MANAGER', 'ADMINISTRATOR', 'Senior Engineer', 'Project Manager', 'Administrator'].includes(user?.role);
  const canResolve = isSeniorOrAbove;

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft size={16} /> {t('back')}
      </button>

      <div className={`glass p-8 rounded-3xl relative overflow-hidden ${
        item.category === 'Troubleshooting Cases'
          ? 'border-2 border-amber-500/50 bg-amber-950/10 shadow-[0_0_30px_rgba(245,158,11,0.1)]'
          : ''
      }`}>
        {/* Decorator Background */}
        <div className={`absolute top-[-50px] right-[-50px] w-64 h-64 rounded-full blur-3xl pointer-events-none ${
          item.category === 'Troubleshooting Cases' ? 'bg-amber-500/10' : 'bg-primary/10'
        }`}></div>

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div className="flex gap-2 items-center flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                item.category === 'Troubleshooting Cases'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-primary/20 text-primary border-primary/30'
              }`}>
                {t(item.category)}
              </span>
              {item.category === 'Troubleshooting Cases' && (
                <span className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/40 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  {language === 'vi' ? 'Đang thảo luận' : 'Under Discussion'}
                </span>
              )}
              <span className="bg-white/5 text-slate-300 px-3 py-1 rounded-full text-xs font-medium border border-white/10">
                v{item.version || '1.0'}
              </span>
              <StatusBadge status={item.status} t={t} />
            </div>
            
            <div className="flex gap-2 items-center flex-wrap">
              <button 
                onClick={toggleBookmark}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors border ${
                  isBookmarked 
                    ? 'bg-primary/20 text-primary border-primary/30 font-semibold' 
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border-white/10'
                }`}
              >
                <Bookmark size={14} className={isBookmarked ? 'fill-primary' : ''} />
                <span>{isBookmarked ? t('bookmarked') : t('bookmark')}</span>
              </button>

              {item.attachmentUrl && item.status !== 'Investigating' && item.attachmentUrl !== 'simulated-flight-log.bin' && (
                <button 
                  onClick={() => {
                    const urls = item.attachmentUrl.split(',');
                    urls.forEach((url, index) => {
                      setTimeout(() => {
                        const link = document.createElement('a');
                        link.href = url;
                        link.target = '_blank';
                        link.download = '';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }, index * 400);
                    });
                  }}
                  className="flex items-center gap-2 text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors border border-white/10 text-slate-300 hover:text-white"
                >
                  <Download size={14} />
                  <span>{t('downloadAll')} ({item.attachmentUrl.split(',').length})</span>
                </button>
              )}
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-6">{item.title}</h1>

          <div className="flex flex-wrap gap-6 mb-8 text-sm text-slate-400 pb-6 border-b border-white/10">
            <div className="flex items-center gap-2">
              <User size={16} className="text-slate-500" />
              <span>{t('author')}: <strong className="text-slate-200">{authorName || t('unknown')}</strong></span>
            </div>
            {authorRole && (
              <div className="flex items-center gap-2">
                <Users size={16} className="text-slate-500" />
                <span>{t('role')}: <strong className="text-slate-200">{t(authorRole)} - {item.authorPosition || 'FIRMWARE'}</strong></span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-slate-500" />
              <span>{t('created')}: <strong className="text-slate-200">{new Date(item.createdAt).toLocaleDateString()}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} className="text-slate-500" />
              <span>{t('severity')}: <strong className="text-slate-200">{t(item.severityLevel)}</strong></span>
            </div>
          </div>

          {/* Investigating raw flight log download block */}
          {item.status === 'Investigating' && item.attachmentUrl && (
            <div className="mb-8 border border-amber-500/30 bg-amber-500/5 p-4 rounded-xl flex items-center justify-between text-amber-400 animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
                <div>
                  <p className="font-semibold text-sm">{t('rawFlightLogAttached')}</p>
                  <p className="text-xs text-slate-400">{t('rawFlightLogSub')}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  const urls = item.attachmentUrl.split(',');
                  urls.forEach((url, index) => {
                    setTimeout(() => {
                      const link = document.createElement('a');
                      link.href = url;
                      link.target = '_blank';
                      link.download = '';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }, index * 400);
                  });
                }}
                className="flex items-center gap-2 text-xs bg-amber-500/20 hover:bg-amber-500/30 px-4 py-2 rounded-lg transition-colors border border-amber-500/30 text-amber-300 hover:text-white font-mono"
              >
                <Download size={14} />
                <span>{t('downloadFlightData')}</span>
              </button>
            </div>
          )}

          <div className="space-y-8">
            <section>
              <h2 className="text-lg font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <FileText size={20} className="text-primary" /> {item.category === 'Troubleshooting Cases' ? t('encounteredFault') : t('summaryLabel')}
              </h2>
              <div className="bg-surface/50 p-6 rounded-xl border border-white/5 text-slate-300 leading-relaxed">
                {item.summary}
              </div>
            </section>

            {item.status !== 'Investigating' && (
              <>
                <section>
                  <h2 className="text-lg font-semibold text-slate-200 mb-3 flex items-center gap-2">
                    <FileText size={20} className="text-primary" /> {t('detailedContent')}
                  </h2>
                  <div className="bg-surface/50 p-6 rounded-xl border border-white/5 text-slate-300 leading-relaxed whitespace-pre-line">
                    {item.detailedContent || t('noDetailedContent')}
                  </div>
                </section>

                {item.rootCause && (
                  <section>
                    <h2 className="text-lg font-semibold text-slate-200 mb-3 flex items-center gap-2">
                      <ShieldAlert size={20} className="text-red-400" /> {t('rootCauseLabel')}
                    </h2>
                    <div className="bg-red-500/5 p-6 rounded-xl border border-red-500/10 text-slate-300 leading-relaxed">
                      {item.rootCause}
                    </div>
                  </section>
                )}
              </>
            )}

            {item.status === 'Investigating' && (
              <section className="space-y-6">
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-slate-200 mb-3 flex items-center gap-2">
                    <MessageSquare size={20} className="text-primary" /> {t('diagFeedTitle')}
                  </h2>
                  <div className="space-y-3">
                    {(!item.proposedUpdates || item.proposedUpdates.length === 0) ? (
                      <p className="text-xs text-slate-500 italic">{t('noDiagFeedback')}</p>
                    ) : (
                      item.proposedUpdates.map((str, idx) => {
                        const parts = str.split('|');
                        const username = parts[0];
                        const timestamp = parts[1];
                        const text = parts.slice(2).join('|');
                        return (
                          <div key={idx} className="bg-slate-900/50 border border-white/5 rounded-xl p-4 space-y-2 font-mono text-xs">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-bold text-slate-300">{username}</span>
                              <span className="text-slate-500">{new Date(timestamp).toLocaleString()}</span>
                            </div>
                            <p className="text-slate-300 leading-relaxed bg-black/20 p-3 rounded-lg border border-white/5 whitespace-pre-line font-sans">
                              {text}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Inline Comment Input Box */}
                <div className="bg-slate-900/40 p-4 border border-white/5 rounded-xl space-y-3">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('leaveFeedbackHeader')}</h3>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={t('feedbackPlaceholder')}
                    rows="3"
                    className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 outline-none transition-colors text-white text-xs resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleSendComment}
                      disabled={!newComment.trim()}
                      className="bg-primary hover:bg-primary-hover text-white text-xs px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {t('submitInsightBtn')}
                    </button>
                  </div>
                </div>
              </section>
            )}

            {item.tags && item.tags.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                  <Tag size={16} /> {t('tagsLabel')}
                </h2>
                <div className="flex gap-2 flex-wrap">
                  {item.tags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => navigate('/library', { state: { selectedTag: tag } })}
                      className="bg-slate-800/30 text-slate-300 border border-slate-700/50 hover:border-blue-500/50 hover:text-blue-400 font-mono text-xs px-3 py-1 rounded-lg transition-all duration-150 cursor-pointer"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {item.reviewerNotes && (
              <section className="mt-8 pt-6 border-t border-white/10">
                <h2 className="text-sm font-semibold text-slate-400 mb-3">{t('reviewerNotes')} ({item.reviewer || 'Admin'})</h2>
                <div className="bg-white/5 p-4 rounded-lg text-sm text-slate-300 italic border-l-2 border-primary">
                  "{item.reviewerNotes}"
                </div>
              </section>
            )}



            {/* Approved Field Refinements Feed (Comments style) */}
            {item.status !== 'Investigating' && item.approvedUpdates && item.approvedUpdates.length > 0 && (
              <section className="mt-8 pt-6 border-t border-white/10 space-y-4 animate-in fade-in duration-200">
                <h2 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
                  <MessageSquare size={16} /> {t('fieldRefinements')} ({item.approvedUpdates.length})
                </h2>
                <div className="space-y-3">
                  {item.approvedUpdates.map((str, index) => {
                    const [version, author, content, timestamp] = str.split('||');
                    return (
                      <div key={index} className="bg-slate-900/50 border border-white/5 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-200">{author}</span>
                          </div>
                          <span className="text-slate-500 font-mono text-[10px]">
                            {new Date(timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-black/20 p-3 rounded-lg border border-white/5 font-mono">
                          {content}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Knowledge Evolution Action Area */}
            <div className="mt-8 pt-6 border-t border-white/10 flex gap-4 items-center">
              {item.status !== 'Investigating' ? (
                <>
                  <button 
                    onClick={handleConfirmSuccessfulApplication}
                    className="bg-slate-900/80 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-500/10 font-medium text-xs rounded-xl px-4 py-2 transition-all cursor-pointer font-mono flex items-center gap-1.5 shadow-sm"
                  >
                    {t('confirmSuccess')} ({item.helpfulCount || item.helpful_count || 0})
                  </button>

                  <button 
                    onClick={() => setShowUpdateModal(true)}
                    className="bg-slate-900 text-slate-300 border border-slate-800 hover:border-blue-500/50 hover:text-blue-400 font-medium text-xs rounded-xl px-4 py-2 transition-all duration-150 ease-in-out cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <span>{t('contributeUpdate')}</span>
                  </button>
                </>
              ) : (
                canResolve && (
                  <button 
                    onClick={() => setShowEvolveModal(true)}
                    className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs rounded-xl px-4 py-2 transition-all cursor-pointer shadow-lg hover:shadow-amber-500/20"
                  >
                    {t('resolveAndCloseWorkspace')}
                  </button>
                )
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Field Update Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{t('contributeUpdate')}</h3>
              <button 
                onClick={() => setShowUpdateModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Authenticated Read-Only Banner */}
            <div className="bg-slate-800/50 border border-slate-700/50 p-3 rounded-xl flex items-center justify-between text-xs text-slate-300">
              <span>{t('contributorIdentity')}:</span>
              <span className="font-mono text-blue-400 font-bold bg-blue-500/5 border border-blue-500/10 px-2 py-1 rounded">
                {user?.username} ({t(user?.role)})
              </span>
            </div>

            <form onSubmit={handleContributeSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  {t('additionalObservations')}
                </label>
                <textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder={t('obsPlaceholder')}
                  rows="5"
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-primary/50 text-sm resize-none"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-2 rounded-xl transition-colors text-sm"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submittingUpdate || !observations.trim()}
                  className="flex-1 bg-primary hover:bg-primary-hover text-white font-medium py-2 rounded-xl transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-primary/20"
                >
                  {submittingUpdate ? "Submitting..." : t('submitFieldUpdate')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Evolve / Resolve Modal */}
      {showEvolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white font-mono">{t('resolveAndEvolveIncident')}</h3>
              <button 
                onClick={() => setShowEvolveModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEvolveSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  {t('verifiedRootCauseLabel')}
                </label>
                <textarea
                  value={evolveRootCause}
                  onChange={(e) => setEvolveRootCause(e.target.value)}
                  placeholder={t('rootCauseDescPlaceholder')}
                  rows="3"
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-primary/50 text-sm resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  {t('officialResolutionSopLabel')}
                </label>
                <textarea
                  value={evolveDetailedContent}
                  onChange={(e) => setEvolveDetailedContent(e.target.value)}
                  placeholder={t('resolutionSopPlaceholder')}
                  rows="5"
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-primary/50 text-sm resize-none"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEvolveModal(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-2 rounded-xl transition-colors text-sm"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submittingEvolve || !evolveRootCause.trim() || !evolveDetailedContent.trim()}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-semibold py-2 rounded-xl transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-amber-500/20"
                >
                  {submittingEvolve ? "Evolving..." : t('evolveIntoLessonsLearnedBtn')}
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

function StatusBadge({ status, t }) {
  let styles = "bg-slate-500/20 text-slate-300 border-slate-500/30";
  if (status === 'Approved') styles = "bg-green-500/20 text-green-400 border-green-500/30";
  if (status === 'Pending') styles = "bg-orange-500/20 text-orange-400 border-orange-500/30";
  if (status === 'Rejected') styles = "bg-red-500/20 text-red-400 border-red-500/30";
  if (status === 'Investigating') styles = "bg-amber-500/20 text-amber-400 border-amber-500/30";
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles}`}>
      {t(status)}
    </span>
  );
}
