import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Check, X, FileText } from 'lucide-react';
import { useAuth } from '../App';

export default function ReviewPage() {
  const { user } = useAuth();
  const role = user?.role;
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [pendingUpdates, setPendingUpdates] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null); // Can be a submission object, or a composite update object
  const [parentAsset, setParentAsset] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [activeTab, setActiveTab] = useState('submissions'); // 'submissions' or 'updates'

  useEffect(() => {
    fetchPending();
  }, [location.search]);

  const fetchPending = () => {
    fetch('/api/knowledge')
      .then(res => res.json())
      .then(data => {
        // 1. New Submissions: assets with status "Pending"
        const submissions = data.filter(item => item.status === 'Pending');

        // 2. Proposed Updates: nested inside parent assets
        const updatesList = [];
        data.forEach(parent => {
          if (parent.proposedUpdates && parent.proposedUpdates.length > 0) {
            parent.proposedUpdates.forEach((proposalStr, idx) => {
              if (!proposalStr.includes('||')) {
                // Ignore comments / diagnostic workspace discussions
                return;
              }
              const [authorMeta, content, timestamp] = proposalStr.split('||');
              
              updatesList.push({
                id: `${parent.id}-proposal-${idx}`,
                parentAsset: parent,
                proposalIndex: idx,
                title: `Cập nhật: ${parent.title}`,
                category: parent.category,
                author: authorMeta,
                detailedContent: content,
                createdAt: timestamp || parent.createdAt,
                status: 'Pending'
              });
            });
          }
        });

        setPendingSubmissions(submissions);
        setPendingUpdates(updatesList);

        const queryParams = new URLSearchParams(location.search);
        const idQuery = queryParams.get('id');
        if (idQuery) {
          let found = submissions.find(item => item.id.toString() === idQuery);
          if (found) {
            setSelectedItem(found);
            setActiveTab('submissions');
          } else {
            found = updatesList.find(item => item.id === idQuery);
            if (found) {
              setSelectedItem(found);
              setParentAsset(found.parentAsset);
              setActiveTab('updates');
            }
          }
        }
      })
      .catch(err => console.error(err));
  };

  const handleReview = async (status) => {
    if (!selectedItem) return;

    try {
      if (selectedItem.id.toString().includes('-proposal-')) {
        // Merging proposed updates directly inside the parent asset
        const parent = selectedItem.parentAsset;

        let updatedProposedUpdates = parent.proposedUpdates.filter((_, idx) => idx !== selectedItem.proposalIndex);
        let updatedApprovedUpdates = [...(parent.approvedUpdates || [])];
        let updatedDetailedContent = parent.detailedContent;
        let nextVer = parent.version || "v1.0";

        if (status === 'Approved') {
          // Calculate version
          const currentVer = parent.version || "v1.0";
          const verNum = parseFloat(currentVer.replace('v', ''));
          nextVer = `v${(verNum + 0.1).toFixed(1)}`;

          // Store in approvedUpdates list only (displayed as a separate comments feed)
          // Do NOT append to detailedContent to keep the original article body clean
          const contributorName = (selectedItem.author || '').split('|')[0] || 'Unknown';
          const approvedLogStr = `${nextVer}||${contributorName}||${selectedItem.detailedContent}||${new Date().toISOString()}`;
          updatedApprovedUpdates.push(approvedLogStr);
        }

        // Trigger PUT request to update the parent knowledge asset
        const response = await fetch(`/api/knowledge/${parent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...parent,
            detailedContent: updatedDetailedContent,
            version: nextVer,
            approvedUpdates: updatedApprovedUpdates,
            proposedUpdates: updatedProposedUpdates,
            reviewer: role,
            reviewerNotes: reviewNotes
          })
        });

        if (response.ok) {
          setSelectedItem(null);
          setParentAsset(null);
          setReviewNotes('');
          fetchPending();
        } else {
          throw new Error('Failed to update parent asset');
        }
      } else {
        // Standard submissions review
        const response = await fetch(`/api/knowledge/${selectedItem.id}/review`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: status,
            reviewer: role,
            reviewerNotes: reviewNotes
          })
        });

        if (response.ok) {
          setSelectedItem(null);
          setParentAsset(null);
          setReviewNotes('');
          fetchPending();
        } else {
          throw new Error('Failed to submit review');
        }
      }
    } catch (err) {
      alert(err.message);
    }
  };

  if (!['Senior Engineer', 'Administrator'].includes(role)) {
    return <div className="p-8 text-center text-slate-400">Access Denied. You need Senior Engineer or Administrator privileges.</div>;
  }

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto animate-in fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Review & Approval</h1>
        <p className="text-slate-400 mt-1">Validate submitted knowledge items before publishing.</p>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        
        {/* Left List */}
        <div className="w-1/3 glass rounded-2xl p-4 flex flex-col min-h-0">
          {/* Navigation Tabs */}
          <div className="flex border-b border-white/5 mb-4">
            <button
              onClick={() => { setActiveTab('submissions'); setSelectedItem(null); }}
              className={`flex-1 pb-2 text-xs font-semibold text-center transition-colors border-b-2 ${
                activeTab === 'submissions'
                  ? 'border-primary text-white font-bold'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              New ({pendingSubmissions.length})
            </button>
            <button
              onClick={() => { setActiveTab('updates'); setSelectedItem(null); }}
              className={`flex-1 pb-2 text-xs font-semibold text-center transition-colors border-b-2 ${
                activeTab === 'updates'
                  ? 'border-primary text-white font-bold'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Updates ({pendingUpdates.length})
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {(activeTab === 'submissions' ? pendingSubmissions : pendingUpdates).length === 0 ? (
              <div className="text-center p-8 text-slate-500">No items pending validation.</div>
            ) : (
              (activeTab === 'submissions' ? pendingSubmissions : pendingUpdates).map(item => (
                <div 
                  key={item.id} 
                  onClick={() => setSelectedItem(item)}
                  className={`p-4 rounded-xl cursor-pointer border transition-all ${
                    selectedItem?.id === item.id 
                      ? 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                      : 'bg-white/5 border-white/5 hover:border-white/20'
                  }`}
                >
                  <h3 className="font-medium text-sm text-slate-200 line-clamp-1">{item.title}</h3>
                  <div className="flex justify-between items-center mt-2 text-xs text-slate-400">
                    <span>{item.category}</span>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Detail Pane */}
        <div className="w-2/3 glass rounded-2xl p-6 flex flex-col min-h-0">
          {selectedItem ? (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-orange-500/20 text-orange-400 px-2.5 py-1 rounded-md text-xs font-bold border border-orange-500/30">
                      {selectedItem.id.toString().includes('-proposal-') ? "Proposed Field Refinement" : "New Knowledge Submission"}
                    </span>
                    <span className="text-xs text-slate-400">ID: #{selectedItem.id}</span>
                  </div>
                  <h2 className="text-2xl font-bold">{selectedItem.title}</h2>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar flex flex-col min-h-0">
                {selectedItem.id.toString().includes('-proposal-') && parentAsset ? (
                  /* Side-by-Side Comparison Layout */
                  <div className="grid grid-cols-2 gap-6 flex-1 min-h-0 overflow-y-auto">
                    {/* Left Column: Parent Asset Content */}
                    <div className="space-y-4 border-r border-white/5 pr-6 overflow-y-auto max-h-[350px]">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Parent Asset Content ({parentAsset.version || "v1.0"})</h3>
                      <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
                        <div>
                          <span className="text-slate-500 text-[10px] block">Title</span>
                          <span className="text-sm font-semibold">{parentAsset.title}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">Summary</span>
                          <span className="text-sm text-slate-300 leading-relaxed">{parentAsset.summary}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">Detailed Content</span>
                          <span className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">{parentAsset.detailedContent}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Proposed Field Update */}
                    <div className="space-y-4 overflow-y-auto max-h-[350px]">
                      <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Proposed Observations</h3>
                      <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/10 space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-500 text-[10px] block">Contributor</span>
                            <span className="font-mono">{selectedItem.author?.split('|')[0] || 'Unknown'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[10px] block">Role</span>
                            <span className="font-mono text-slate-300">{selectedItem.author?.split('|')[1] || 'Guest'}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">Proposed Details</span>
                          <span className="text-sm text-slate-200 whitespace-pre-line leading-relaxed">{selectedItem.detailedContent}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Standard Details Layout */
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                      <div>
                        <span className="text-slate-500 text-xs block mb-1">Author</span>
                        <span className="text-sm">{(selectedItem.author || '').split('|')[0] || 'Unknown'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs block mb-1">Role</span>
                        <span className="text-sm">{(selectedItem.author || '').split('|')[1] || 'Guest'}</span>
                      </div>
                      <div><span className="text-slate-500 text-xs block mb-1">Category</span><span className="text-sm">{selectedItem.category}</span></div>
                      <div><span className="text-slate-500 text-xs block mb-1">Severity</span><span className="text-sm">{selectedItem.severityLevel}</span></div>
                      <div><span className="text-slate-500 text-xs block mb-1">Knowledge Type</span><span className="text-sm">{selectedItem.knowledgeType}</span></div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-slate-300 mb-2">Summary</h3>
                      <p className="text-sm text-slate-400 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">{selectedItem.summary}</p>
                    </div>

                    {selectedItem.detailedContent && (
                      <div>
                        <h3 className="text-sm font-semibold text-slate-300 mb-2">Detailed Description</h3>
                        <p className="text-sm text-slate-400 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5 whitespace-pre-line">{selectedItem.detailedContent}</p>
                      </div>
                    )}

                    {selectedItem.rootCause && (
                      <div>
                        <h3 className="text-sm font-semibold text-slate-300 mb-2">Root Cause Analysis</h3>
                        <p className="text-sm text-slate-400 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">{selectedItem.rootCause}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Review Action Area */}
                <div className="mt-auto pt-6 border-t border-white/10 space-y-4 bg-surface/40">
                  <h3 className="text-sm font-semibold text-slate-300">Reviewer Notes</h3>
                  <textarea 
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add comments or feedback before approving/rejecting..."
                    rows="2"
                    className="w-full bg-surface border border-white/10 rounded-lg px-4 py-3 focus:border-primary outline-none transition-colors resize-none text-sm"
                  ></textarea>
                  
                  <div className="flex justify-end gap-4 pt-2">
                    <button 
                      onClick={() => handleReview('Rejected')}
                      className="px-6 py-2 rounded-lg text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
                    >
                      <X size={16} /> Reject
                    </button>
                    <button 
                      onClick={() => handleReview('Approved')}
                      className="px-6 py-2 rounded-lg text-sm font-medium bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)] hover:bg-green-400 transition-all flex items-center gap-2"
                    >
                      <Check size={16} /> Approve & Publish
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <FileText size={64} className="opacity-20 mb-4" />
              <p>Select an item from the queue to review.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
