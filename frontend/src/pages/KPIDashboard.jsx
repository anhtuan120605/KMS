import React, { useState, useEffect, useContext } from 'react';
import { BarChart2, TrendingUp, Users, Target } from 'lucide-react';
import { LanguageContext } from '../App';
import { translations } from '../translations';

export default function KPIDashboard() {
  const { language } = useContext(LanguageContext);
  const t = (key) => translations[language][key] || key;

  const [data, setData] = useState([]);
  const [stats, setStats] = useState({
    knowledgeActivationRate: "0%",
    knowledgeEvolutionIndex: 0,
    totalSuccessfulApplications: 0,
    totalRegisteredAuthors: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/knowledge')
      .then(res => res.json())
      .then(data => {
        setData(data);
        const approved = data.filter(item => item.status === 'Approved');

        // Indicator 1: Knowledge Activation Rate
        const activatedCount = approved.filter(
          item => (item.helpfulCount || item.helpful_count || 0) > 0
        ).length;
        const knowledgeActivationRate = approved.length > 0
          ? Math.round((activatedCount / approved.length) * 100) + "%"
          : "0%";

        // Indicator 2: Knowledge Evolution Index
        const knowledgeEvolutionIndex = approved.filter(item => {
          const hasNewVersion = item.version && item.version !== 'v1.0';
          const hasApprovedUpdates = item.approvedUpdates && item.approvedUpdates.length > 0;
          return hasNewVersion || hasApprovedUpdates;
        }).length;

        // Indicator 3: Total Successful Applications (helpfulCount sum across all approved items)
        const totalSuccessfulApplications = approved.reduce(
          (sum, item) => sum + (item.helpfulCount || item.helpful_count || 0),
          0
        );

        // Indicator 4: Total Registered Corporate Authors
        const totalRegisteredAuthors = new Set(
          data.map(item => (item.author || '').split('|')[0]).filter(Boolean)
        ).size;

        setStats({
          knowledgeActivationRate,
          knowledgeEvolutionIndex,
          totalSuccessfulApplications,
          totalRegisteredAuthors
        });

        setLoading(false);
      })
      .catch(err => {
        console.error("Error in KPIDashboard fetch:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-12 text-center text-slate-400">
        <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto mb-4"></div>
        <p className="text-sm">Loading dynamic metrics...</p>
      </div>
    );
  }

  const approvedCount = data.filter(item => item.status === 'Approved').length;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">{t('kpiMetrics')}</h1>
        <p className="text-slate-400 mt-1">{t('kpiSub')}</p>
      </div>

      {/* KPI Cards (100% Dynamic data based on new math calculations) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title={t('knowledgeActivationRate')} value={stats.knowledgeActivationRate} icon={<TrendingUp />} color="text-green-400" />
        <KPICard title={t('knowledgeEvolutionIndex')} value={stats.knowledgeEvolutionIndex} icon={<Target />} color="text-blue-400" />
        <KPICard title={t('totalSuccessfulApplications')} value={stats.totalSuccessfulApplications} icon={<BarChart2 />} color="text-purple-400" />
        <KPICard title={t('totalRegisteredAuthors')} value={stats.totalRegisteredAuthors} icon={<Users />} color="text-orange-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* LEFT: Knowledge Distribution (kept intact) */}
        <div className="glass p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50"></div>
          <div className="z-10 w-full space-y-4">
            <h2 className="text-lg font-semibold text-slate-200 mb-4">{t('knowledgeDist')}</h2>
            <div className="space-y-4">
              {['SOP & Checklist', 'Maintenance Logs', 'Troubleshooting Cases', 'Lessons Learned', 'Training & Regulation'].map(cat => {
                const categoryCount = data.filter(item => item.status === 'Approved' && item.category === cat).length;
                const percentage = approvedCount > 0 ? Math.round((categoryCount / approvedCount) * 100) : 0;
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>{t(cat) || cat}</span>
                      <span>{categoryCount} {categoryCount === 1 ? 'asset' : 'assets'} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-white/5 border border-white/10 rounded-full h-3.5 overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT 2-ROW COLUMN */}
        <div className="flex flex-col gap-6">

          {/* PANEL A: Incident Conversion Pipeline */}
          {(() => {
            const total = data.length || 1;
            const investigatingCount = data.filter(item => item.status === 'Investigating').length;
            const evolvedCount = data.filter(item => item.status === 'Approved' && item.category === 'Lessons Learned').length;
            const investigatingPct = Math.round((investigatingCount / total) * 100);
            const evolvedPct = Math.round((evolvedCount / total) * 100);

            return (
              <div className="glass p-6 rounded-2xl relative overflow-hidden flex-1">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-60"></div>
                <div className="z-10 relative space-y-5">
                  <div className="border-b border-white/5 pb-3">
                    <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 bg-amber-400 rounded-full inline-block animate-pulse"></span>
                      {t('incidentConversionPipeline') || 'Incident Conversion Pipeline'}
                    </h2>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1 font-mono">
                      LIFECYCLE STAGE DISTRIBUTION — {total} TOTAL ASSETS INDEXED
                    </p>
                  </div>

                  {/* Meter A: Active Diagnostic Sessions */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">
                        Active Diagnostic Sessions
                      </span>
                      <span className="font-mono text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                        [ {investigatingCount} UNDER INVESTIGATION ]
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 border border-slate-800 rounded-sm h-3 overflow-hidden">
                      <div
                        className="bg-amber-500/70 h-full transition-all duration-700"
                        style={{ width: `${investigatingPct}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-slate-600">
                      <span>0</span>
                      <span className="text-amber-500/80">{investigatingPct}% of corpus</span>
                      <span>{total}</span>
                    </div>
                  </div>

                  {/* Meter B: Institutionalized Capital */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">
                        Institutionalized Capital
                      </span>
                      <span className="font-mono text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                        [ {evolvedCount} LESSONS LEARNED ]
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 border border-slate-800 rounded-sm h-3 overflow-hidden">
                      <div
                        className="bg-emerald-500/70 h-full transition-all duration-700"
                        style={{ width: `${evolvedPct}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-slate-600">
                      <span>0</span>
                      <span className="text-emerald-500/80">{evolvedPct}% of corpus</span>
                      <span>{total}</span>
                    </div>
                  </div>

                  {/* Conversion ratio footer */}
                  <div className="border-t border-white/5 pt-3 flex justify-between items-center">
                    <span className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">Incident → Lesson Conversion Rate</span>
                    <span className="font-mono text-sm font-bold text-slate-200">
                      {investigatingCount + evolvedCount > 0
                        ? Math.round((evolvedCount / (investigatingCount + evolvedCount)) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* PANEL B: High-Priority Hot Diagnostic Threads */}
          {(() => {
            const hotThreads = data
              .filter(item => item.status === 'Investigating')
              .map(item => ({
                ...item,
                commentCount: (item.proposedUpdates || []).filter(p => !p.includes('||')).length
              }))
              .sort((a, b) => b.commentCount - a.commentCount)
              .slice(0, 3);

            return (
              <div className="glass p-6 rounded-2xl relative overflow-hidden flex-1">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-60"></div>
                <div className="z-10 relative space-y-4">
                  <div className="border-b border-white/5 pb-3">
                    <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 bg-rose-400 rounded-full inline-block animate-pulse"></span>
                      {t('hotDiagnosticThreads') || 'Hot Diagnostic Threads'}
                    </h2>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1 font-mono">
                      TOP-3 MOST DEBATED ACTIVE INCIDENTS — RANKED BY ENGINEERING INSIGHTS
                    </p>
                  </div>

                  {hotThreads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
                      <span className="text-2xl">✓</span>
                      <p className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                        No active diagnostic sessions
                      </p>
                      <p className="text-[10px] text-slate-600 font-mono">All incidents resolved or not yet opened</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {hotThreads.map((item, idx) => {
                        const maxComments = hotThreads[0].commentCount || 1;
                        const barPct = Math.round((item.commentCount / maxComments) * 100);
                        const rankColors = ['text-amber-400', 'text-slate-300', 'text-orange-600'];
                        return (
                          <div key={item.id} className="space-y-1.5 border border-slate-800 bg-black/20 p-3 rounded-sm">
                            <div className="flex justify-between items-start gap-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`font-mono text-xs font-bold shrink-0 ${rankColors[idx] || 'text-slate-500'}`}>
                                  #{idx + 1}
                                </span>
                                <span className="text-[11px] text-slate-300 font-medium truncate leading-tight">
                                  {item.title}
                                </span>
                              </div>
                              <span className="font-mono text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded shrink-0 whitespace-nowrap">
                                [ {item.commentCount} Engineering Insights ]
                              </span>
                            </div>
                            <div className="w-full bg-slate-900 border border-slate-800 rounded-sm h-1.5 overflow-hidden">
                              <div
                                className="bg-rose-500/60 h-full transition-all duration-700"
                                style={{ width: `${barPct}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-[9px] font-mono text-slate-600">
                              <span>{(item.author || '').split('|')[0] || 'Unknown'}</span>
                              <span className="text-rose-500/60 uppercase">INVESTIGATING</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, icon, color }) {
  return (
    <div className="glass p-6 rounded-2xl border-t-4 hover:-translate-y-1 transition-transform cursor-default relative overflow-hidden" style={{ borderTopColor: 'currentColor' }}>
      <div className="flex justify-between items-start mb-4 pt-1">
        <div className={`p-3 rounded-xl bg-white/5 border border-white/5 ${color}`}>
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-bold mb-1">{value}</h3>
        <p className="text-sm text-slate-400 font-medium">{title}</p>
      </div>
    </div>
  );
}
