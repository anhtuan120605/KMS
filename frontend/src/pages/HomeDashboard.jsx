import React, { useEffect, useState, useContext } from 'react';
import { BookOpen, AlertCircle, TrendingUp, CheckCircle, Clock, Users, BookMarked, FileText } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { LanguageContext, useAuth } from '../App';
import { translations } from '../translations';

export default function HomeDashboard() {
  const { language } = useContext(LanguageContext);
  const { user } = useAuth();
  const role = user?.role || 'Guest';
  const navigate = useNavigate();

  const [recentActivity, setRecentActivity] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [allData, setAllData] = useState([]);
  const [selectedModel, setSelectedModel] = useState('Model A');
  const [categoryCounts, setCategoryCounts] = useState({
    sop: 0,
    maint: 0,
    trouble: 0,
    lessons: 0,
    training: 0
  });

  const [stats, setStats] = useState({
    knowledgeActivationRate: "0%",
    knowledgeEvolutionIndex: 0,
    totalSuccessfulApplications: 0,
    expertValidationVelocity: "0%"
  });

  const t = (key) => translations[language][key] || key;

  useEffect(() => {
    // Single fetch to get all items and aggregate dynamically
    fetch('/api/knowledge')
      .then(res => res.json())
      .then(data => {
        setAllData(data);
        // 1. Calculate recent activity based on active role
        if (!['Senior Engineer', 'Project Manager', 'Administrator'].includes(role)) {
          const approved = data.filter(item => item.status === 'Approved');
          setRecentActivity(approved.slice(-5).reverse());
        } else if (role === 'Senior Engineer') {
          const pending = data.filter(item => item.status === 'Pending');
          setRecentActivity(pending.slice(-5).reverse());
        } else {
          setRecentActivity(data.slice(-5).reverse());
        }

        // 2. Calculate personal submissions for regular engineers
        const personal = data.filter(item => {
          const authorName = (item.author || '').split('|')[0];
          return authorName === user?.username;
        });
        setMySubmissions(personal);

        // 3. Category counts (Approved only for regular engineers, all for others)
        const catData = !['Senior Engineer', 'Project Manager', 'Administrator'].includes(role)
          ? data.filter(item => item.status === 'Approved')
          : data;

        setCategoryCounts({
          sop: catData.filter(item => item.category === 'SOP & Checklist').length,
          maint: catData.filter(item => item.category === 'Maintenance Logs').length,
          trouble: catData.filter(item => item.category === 'Troubleshooting Cases').length,
          lessons: catData.filter(item => item.category === 'Lessons Learned').length,
          training: catData.filter(item => item.category === 'Training & Regulation').length,
        });

        // 4. Statistics aggregation (Operational ratios)
        const approvedItems = data.filter(item => item.status === 'Approved');

        // Indicator 1: Knowledge Activation Rate
        const activatedCount = approvedItems.filter(
          item => (item.helpfulCount || item.helpful_count || 0) > 0
        ).length;
        const knowledgeActivationRate = approvedItems.length > 0
          ? Math.round((activatedCount / approvedItems.length) * 100) + "%"
          : "0%";

        // Indicator 2: Knowledge Evolution Index
        const knowledgeEvolutionIndex = approvedItems.filter(item => {
          const hasNewVersion = item.version && item.version !== 'v1.0';
          const hasApprovedUpdates = item.approvedUpdates && item.approvedUpdates.length > 0;
          return hasNewVersion || hasApprovedUpdates;
        }).length;

        // Indicator 3: Total Successful Applications (helpfulCount sum across all approved items)
        const totalSuccessfulApplications = approvedItems.reduce(
          (sum, item) => sum + (item.helpfulCount || item.helpful_count || 0),
          0
        );

        // Indicator 4: Expert Validation Velocity
        const expertValidationVelocity = data.length > 0
          ? Math.round((approvedItems.length / data.length) * 100) + "%"
          : "0%";

        setStats({
          knowledgeActivationRate,
          knowledgeEvolutionIndex,
          totalSuccessfulApplications,
          expertValidationVelocity
        });
      })
      .catch(err => console.error("Error fetching data:", err));
  }, [role, user]);

  const getSectionHeader = () => {
    if (role === 'New Engineer' || role === 'Flight Test Pilot') {
      return t('newlyPublishedKnowledge');
    }
    if (role === 'Senior Engineer') {
      return t('pendingValidationHeader');
    }
    return t('recentSubmissions');
  };

  const [bookmarkCount, setBookmarkCount] = useState(0);

  useEffect(() => {
    if (user?.username) {
      const stored = localStorage.getItem(`kms_bookmarks_${user.username}`);
      const bookmarks = stored ? JSON.parse(stored) : [];
      setBookmarkCount(bookmarks.length);
    } else {
      setBookmarkCount(0);
    }
  }, [user]);

  const renderMetrics = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard icon={<BookOpen className="text-primary" />} label={t('knowledgeActivationRate')} value={stats.knowledgeActivationRate} />
        <MetricCard icon={<CheckCircle className="text-green-400" />} label={t('knowledgeEvolutionIndex')} value={stats.knowledgeEvolutionIndex} />
        <MetricCard icon={<TrendingUp className="text-accent" />} label={t('totalSuccessfulApplications')} value={stats.totalSuccessfulApplications} />
        <MetricCard icon={<Clock className="text-orange-400" />} label={t('expertValidationVelocity')} value={stats.expertValidationVelocity} />
      </div>
    );
  };

  const renderProjectManagerDashboard = () => {
    // 1. Common Calibration Errors Metric (DYNAMIC REAL DATA)
    let imuCount = 0;
    let compassCount = 0;
    let escCount = 0;
    let gimbalCount = 0;

    allData.forEach(item => {
      const categoryMatch = item.category === 'Troubleshooting Cases';
      const tags = Array.isArray(item.tags) ? item.tags : [];
      const hasImu = tags.some(t => t.toUpperCase() === 'IMU') || (item.title || '').toUpperCase().includes('IMU') || (item.summary || '').toUpperCase().includes('IMU');
      const hasCompass = tags.some(t => t.toUpperCase() === 'COMPASS' || t.toUpperCase() === 'MAGNETOMETER') || (item.title || '').toUpperCase().includes('COMPASS') || (item.summary || '').toUpperCase().includes('MAGNETOMETER');
      const hasEsc = tags.some(t => t.toUpperCase() === 'ESC') || (item.title || '').toUpperCase().includes('ESC') || (item.summary || '').toUpperCase().includes('ESC');
      const hasGimbal = tags.some(t => t.toUpperCase() === 'GIMBAL') || (item.title || '').toUpperCase().includes('GIMBAL') || (item.summary || '').toUpperCase().includes('GIMBAL');

      if (categoryMatch || hasImu || hasCompass || hasEsc || hasGimbal) {
        if (hasImu) imuCount++;
        if (hasCompass) compassCount++;
        if (hasEsc) escCount++;
        if (hasGimbal) gimbalCount++;
      }
    });

    const totalCalibrationErrors = imuCount + compassCount + escCount + gimbalCount || 1;
    const imuPct = Math.round((imuCount / totalCalibrationErrors) * 100);
    const compassPct = Math.round((compassCount / totalCalibrationErrors) * 100);
    const escPct = Math.round((escCount / totalCalibrationErrors) * 100);
    const gimbalPct = Math.round((gimbalCount / totalCalibrationErrors) * 100);

    // 2. Center Panel: Telemetry Model A / Model B toggle
    const flightTime = selectedModel === 'Model A' ? "142.5 hrs" : "98.2 hrs";
    const sorties = selectedModel === 'Model A' ? "38 Sorties" : "22 Sorties";

    // 3. Right Panel: Dynamic data
    const pendingItems = allData.filter(item => item.status === 'Pending');
    const approvedItems = allData.filter(item => item.status === 'Approved');

    // Active Diagnostic Sessions: Troubleshooting Cases currently being investigated
    const severityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
    const investigatingItems = allData
      .filter(item => item.status === 'Investigating' && item.category === 'Troubleshooting Cases')
      .sort((a, b) => (severityOrder[a.severityLevel] ?? 4) - (severityOrder[b.severityLevel] ?? 4));

    // Recent Lessons Learned Activity Stream: 3 approved lessons learned
    const lessonsLearned = approvedItems
      .filter(item => item.category === 'Lessons Learned')
      .slice(-3)
      .reverse();

    // RCA Distribution Metric
    let firmwareCount = 0;
    let hardwareCount = 0;
    let pilotCount = 0;
    let weatherCount = 0;
    approvedItems.forEach(item => {
      const text = ((item.rootCause || '') + ' ' + (item.category || '') + ' ' + (item.summary || '') + ' ' + (item.detailedContent || '')).toLowerCase();
      if (text.includes('firmware') || text.includes('bug') || text.includes('software')) {
        firmwareCount++;
      } else if (text.includes('hardware') || text.includes('fault') || text.includes('esc') || text.includes('motor') || text.includes('sensor') || text.includes('pdb')) {
        hardwareCount++;
      } else if (text.includes('pilot') || text.includes('error') || text.includes('operator') || text.includes('manual')) {
        firmwareCount++; // Fallback or group pilot errors
      } else if (text.includes('weather') || text.includes('wind') || text.includes('rain') || text.includes('extreme')) {
        weatherCount++;
      }
    });
    // Wait, let's fix pilot count increment logic:
    pilotCount = approvedItems.filter(item => {
      const text = ((item.rootCause || '') + ' ' + (item.category || '') + ' ' + (item.summary || '') + ' ' + (item.detailedContent || '')).toLowerCase();
      return text.includes('pilot') || text.includes('error') || text.includes('operator') || text.includes('manual');
    }).length;
    
    const totalRca = firmwareCount + hardwareCount + pilotCount + weatherCount || 1;
    const firmwarePct = Math.round((firmwareCount / totalRca) * 100);
    const hardwarePct = Math.round((hardwareCount / totalRca) * 100);
    const pilotPct = Math.round((pilotCount / totalRca) * 100);
    const weatherPct = Math.round((weatherCount / totalRca) * 100);

    // Knowledge Reuse Index: total successful applications
    const globalReuseCount = approvedItems.reduce((sum, item) => sum + (item.helpfulCount || item.helpful_count || 0), 0);

    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex justify-between items-end border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              {t('operationalControlBoard')}
            </h1>
            <p className="text-slate-400 mt-1">
              {t('pmSessionActive')}
            </p>
          </div>
        </div>

        {/* 3-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column 1: Operational Safety & Compliance */}
          <div className="border border-slate-800 bg-slate-950/40 p-6 rounded-md space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest border-b border-slate-800 pb-2 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full inline-block animate-pulse"></span>
                  {t('operationalSafetyCompliance')}
                </h2>
              </div>

              {/* Drone Fleet Readiness Status Widgets */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">{t('droneReadinessStatus')}</span>
                  <span className="text-[8px] font-bold text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded border border-orange-400/20 uppercase tracking-wider select-none">{t('simBadge')}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="border border-slate-800 p-3 rounded-sm bg-black/20 text-center">
                    <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">{t('ready')}</span>
                    <span className="text-xl font-bold text-green-400">8 UAVs</span>
                  </div>
                  <div className="border border-slate-800 p-3 rounded-sm bg-black/20 text-center">
                    <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">{t('inFlight')}</span>
                    <span className="text-xl font-bold text-blue-400">2 UAVs</span>
                  </div>
                  <div className="border border-slate-800 p-3 rounded-sm bg-black/20 text-center">
                    <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">{t('maintenance')}</span>
                    <span className="text-xl font-bold text-amber-500">3 UAVs</span>
                  </div>
                </div>
              </div>

              {/* Calibration Compliance Alerts Block */}
              <div className="space-y-4 pt-2">
                <div className="border border-slate-800 p-4 rounded-sm bg-black/20 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400 uppercase tracking-wider">{t('calibrationRate')}</span>
                    <span className="text-[8px] font-bold text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded border border-orange-400/20 uppercase tracking-wider select-none w-fit mt-1">{t('simBadge')}</span>
                  </div>
                  <span className="text-2xl font-bold text-slate-100">94%</span>
                </div>

                <div className="border border-rose-500/20 bg-rose-950/10 p-3 rounded-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block">{t('overdueCalibAlerts')}</span>
                    <span className="text-[8px] font-bold text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded border border-orange-400/20 uppercase tracking-wider select-none">{t('simBadge')}</span>
                  </div>
                  <div className="space-y-1.5 text-[11px] text-slate-300">
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span>Drone-Hera-04</span>
                      <span className="text-rose-400">Compass Recalibration</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Drone-Zeus-09</span>
                      <span className="text-rose-400">IMU Calib Needed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Common Calibration Errors Metric */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-2">{t('commonCalibErrors')}</span>
              <div className="space-y-2">
                {[
                  { label: t('imuCalibration'), pct: imuPct, count: imuCount },
                  { label: t('compassInterference'), pct: compassPct, count: compassCount },
                  { label: t('escSync'), pct: escPct, count: escCount },
                  { label: t('gimbalDrift'), pct: gimbalPct, count: gimbalCount }
                ].map(item => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-300">
                      <span>{item.label}</span>
                      <span>{item.count} assets</span>
                    </div>
                    <div className="w-full bg-slate-900 border border-slate-800 rounded-sm h-2 overflow-hidden">
                      <div className="bg-primary h-full rounded-sm" style={{ width: `${item.pct}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: R&D Progress & Telemetry */}
          <div className="border border-slate-800 bg-slate-950/40 p-6 rounded-md space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest border-b border-slate-800 pb-2 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-full inline-block animate-pulse"></span>
                  {t('flightTelemetryAnalytics')}
                </h2>
              </div>

              {/* Model selection and Stats */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">{t('selectAirframe')}</span>
                  <span className="text-[8px] font-bold text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded border border-orange-400/20 uppercase tracking-wider select-none">{t('simBadge')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <select 
                    value={selectedModel} 
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded px-2.5 py-1 focus:outline-none w-full"
                  >
                    <option value="Model A">Model A (Quadcopter X-4)</option>
                    <option value="Model B">Model B (Hexacopter H-8)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="border border-slate-800 p-3 rounded-sm bg-black/20">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-0.5">{t('flightHours')}</span>
                    <span className="text-lg font-bold text-slate-200">{flightTime}</span>
                  </div>
                  <div className="border border-slate-800 p-3 rounded-sm bg-black/20">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-0.5">{t('monthlySorties')}</span>
                    <span className="text-lg font-bold text-slate-200">{sorties}</span>
                  </div>
                </div>
              </div>

              {/* Mission Success Rate stacked Progress line */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">{t('missionSuccessRate')}</span>
                  <span className="text-[8px] font-bold text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded border border-orange-400/20 uppercase tracking-wider select-none">{t('simBadge')}</span>
                </div>
                <div className="w-full bg-slate-900 border border-slate-800 rounded-sm h-4 flex overflow-hidden">
                  <div className="bg-emerald-600/60 h-full border-r border-slate-950" style={{ width: '82%' }} title="Success (82%)"></div>
                  <div className="bg-slate-600/60 h-full border-r border-slate-950" style={{ width: '10%' }} title="Terminated (10%)"></div>
                  <div className="bg-amber-600/60 h-full border-r border-slate-950" style={{ width: '5%' }} title="Anomaly (5%)"></div>
                  <div className="bg-rose-700/60 h-full" style={{ width: '3%' }} title="Crash (3%)"></div>
                </div>
                <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-[10px] text-slate-400 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-emerald-600/60 rounded-xs"></span>
                    <span>{t('success')}: 82%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-slate-600/60 rounded-xs"></span>
                    <span>{t('terminated')}: 10%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-amber-600/60 rounded-xs"></span>
                    <span>{t('anomaly')}: 5%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-rose-700/60 rounded-xs"></span>
                    <span>{t('crash')}: 3%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Component & Battery Health Ledger */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">{t('healthLedger')}</span>
                <span className="text-[8px] font-bold text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded border border-orange-400/20 uppercase tracking-wider select-none">{t('simBadge')}</span>
              </div>
              <div className="border border-slate-800 bg-black/20 p-3 rounded-sm space-y-2 text-[11px] text-slate-300">
                <div className="flex gap-2 text-amber-500">
                  <span>⚠</span>
                  <p className="leading-relaxed">{t('batteryCyclesOverused')}</p>
                </div>
                <div className="flex gap-2 text-slate-400 border-t border-slate-800/50 pt-2">
                  <span>⚙</span>
                  <p className="leading-relaxed">{t('motorRuntimeAlert')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Knowledge Governance & Quality Loops */}
          <div className="border border-slate-800 bg-slate-950/40 p-6 rounded-md space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest border-b border-slate-800 pb-2 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-purple-500 rounded-full inline-block animate-pulse"></span>
                  {t('knowledgeGovernanceLoops')}
                </h2>
              </div>

              {/* Knowledge Approval Pipeline Tracker */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">{t('approvalPipeline')}</span>
                  <span className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded">
                    {pendingItems.length} {t('Pending')}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {pendingItems.length === 0 ? (
                    <span className="text-[11px] text-slate-500 italic block">{t('allQueuesValidated')}</span>
                  ) : (
                    pendingItems.slice(0, 2).map(item => (
                      <Link 
                        key={item.id} 
                        to={`/review?id=${item.id}`} 
                        className="flex justify-between items-center text-[11px] border border-slate-800/80 p-2 bg-black/20 rounded-sm hover:border-purple-500/50 transition-colors"
                      >
                        <span className="text-slate-300 truncate max-w-[150px]">{item.title}</span>
                        <span className="text-purple-400 hover:underline">{t('reviewLink')} ↗</span>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              {/* Active Diagnostic Sessions — Troubleshooting Cases under Investigation */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">{t('activeDiagnosticSessions') || 'Phiên chẩn đoán đang mở'}</span>
                  <span className={`text-xs px-2 py-0.5 rounded border ${
                    investigatingItems.length > 0
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-slate-800/50 text-slate-500 border-slate-700/50'
                  }`}>
                    {investigatingItems.length} {t('Investigating') || 'Đang điều tra'}
                  </span>
                </div>
                <div className="space-y-2">
                  {investigatingItems.length === 0 ? (
                    <span className="text-[11px] text-slate-500 italic block">{t('noActiveInvestigations') || 'Không có sự cố nào đang điều tra'}</span>
                  ) : (
                    investigatingItems.map(item => {
                      const sevColor = {
                        'Critical': 'text-rose-400 bg-rose-500/10 border-rose-500/30',
                        'High':     'text-orange-400 bg-orange-500/10 border-orange-500/30',
                        'Medium':   'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
                        'Low':      'text-slate-400 bg-slate-500/10 border-slate-600/30'
                      }[item.severityLevel] || 'text-slate-400 bg-slate-500/10 border-slate-600/30';

                      const commentCount = (item.proposedUpdates || []).filter(p => !p.includes('||')).length;

                      return (
                        <Link
                          key={item.id}
                          to={`/item/${item.id}`}
                          className="flex items-center justify-between gap-2 text-[11px] border border-slate-800/80 p-2.5 bg-black/20 rounded-sm hover:border-amber-500/40 hover:bg-amber-500/5 transition-all group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`shrink-0 text-[9px] font-bold uppercase border px-1.5 py-0.5 rounded font-mono ${sevColor}`}>
                              {t(item.severityLevel) || item.severityLevel}
                            </span>
                            <span className="text-slate-300 truncate group-hover:text-amber-300 transition-colors">{item.title}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {commentCount > 0 && (
                              <span className="font-mono text-[9px] text-slate-500">{commentCount} góp ý</span>
                            )}
                            <span className="text-amber-500 text-[10px]">↗</span>
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* RCA Distribution & Reuse Index */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              {/* RCA Distribution Metric */}
              <div className="space-y-2.5">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-2">{t('rootCauseDistribution')}</span>
                <div className="space-y-2">
                  {[
                    { label: t('firmwareBug'), pct: firmwarePct, count: firmwareCount },
                    { label: t('hardwareFault'), pct: hardwarePct, count: hardwareCount },
                    { label: t('pilotError'), pct: pilotPct, count: pilotCount },
                    { label: t('weatherExtremes'), pct: weatherPct, count: weatherCount }
                  ].map(item => (
                    <div key={item.label} className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>{item.label}</span>
                        <span>{item.count} items</span>
                      </div>
                      <div className="w-full bg-slate-900 border border-slate-800 rounded-sm h-1.5 overflow-hidden">
                        <div className="bg-purple-500 h-full rounded-sm" style={{ width: `${item.pct}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Knowledge Reuse Index */}
              <div className="border border-slate-800 p-3 rounded-sm bg-black/25 flex justify-between items-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">{t('knowledgeReuseIndex')}</span>
                <span className="text-xl font-bold text-green-400">{globalReuseCount} {t('applications')}</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    );
  };

  if (role === 'Project Manager') {
    return renderProjectManagerDashboard();
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 mb-2">{t('welcomeBack')}</h1>
          <p className="text-slate-400">{t('overviewSub')}</p>
        </div>
      </div>

      {/* Metrics Row */}
      {renderMetrics()}

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <AlertCircle size={20} className="text-primary" />
              {getSectionHeader()}
            </h2>
            
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-slate-400 italic">{t('noRecentActivity')}</p>
              ) : (
                recentActivity.map((item) => (
                  <div key={item.id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-primary/30 transition-colors flex justify-between items-center group">
                    <div>
                      <h3 className="font-medium text-slate-200 group-hover:text-primary transition-colors">
                        <Link to={`/item/${item.id}`}>{item.title}</Link>
                      </h3>
                      <p className="text-sm text-slate-400 mt-1">{t(item.category)} • {item.knowledgeType}</p>
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap mt-2">
                          {item.tags.map((tag, tagIdx) => (
                            <button
                              key={`${item.id}-tag-${tagIdx}`}
                              onClick={() => navigate('/library', { state: { selectedTag: tag } })}
                              className="bg-slate-800/30 text-slate-300 border border-slate-700/50 hover:border-blue-500/50 hover:text-blue-400 text-[10px] px-2 py-0.5 rounded transition-all duration-150 cursor-pointer"
                            >
                              #{tag}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {role === 'Senior Engineer' && (
                        <div className="mr-2">
                          <Link 
                            to={`/review?id=${item.id}`}
                            className="px-3 py-1.5 rounded-lg text-xs bg-primary hover:bg-primary/80 text-white transition-colors font-medium"
                          >
                            {t('review')}
                          </Link>
                        </div>
                      )}
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Exception: My Submissions for regular engineers */}
          {['New Engineer', 'Flight Test Pilot', 'Firmware Engineer', 'Hardware Engineer', 'API Test Engineer'].includes(role) && mySubmissions.length > 0 && (
            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <FileText size={20} className="text-primary" />
                {t('mySubmissions')}
              </h2>
              <div className="space-y-4">
                {mySubmissions.map((item) => (
                  <div key={item.id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-primary/30 transition-colors flex justify-between items-center group">
                    <div>
                      <h3 className="font-medium text-slate-200 group-hover:text-primary transition-colors">
                        <Link to={`/item/${item.id}`}>{item.title}</Link>
                      </h3>
                      <p className="text-sm text-slate-400 mt-1">{t(item.category)} • {item.knowledgeType}</p>
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap mt-2">
                          {item.tags.map((tag, tagIdx) => (
                            <button
                              key={`${item.id}-tag-${tagIdx}`}
                              onClick={() => navigate('/library', { state: { selectedTag: tag } })}
                              className="bg-slate-800/30 text-slate-300 border border-slate-700/50 hover:border-blue-500/50 hover:text-blue-400 text-[10px] px-2 py-0.5 rounded transition-all duration-150 cursor-pointer"
                            >
                              #{tag}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Links / Taxonomy */}
        <div className="glass rounded-2xl p-6 h-fit">
          <h2 className="text-xl font-semibold mb-6">{t('taxonomyCategories')}</h2>
          <div className="space-y-3">
            <CategoryCard title="SOP & Checklist" label={t('SOP & Checklist')} count={categoryCounts.sop} color="bg-blue-500/20 text-blue-400 border-blue-500/20" />
            <CategoryCard title="Maintenance Logs" label={t('Maintenance Logs')} count={categoryCounts.maint} color="bg-orange-500/20 text-orange-400 border-orange-500/20" />
            <CategoryCard title="Troubleshooting Cases" label={t('Troubleshooting Cases')} count={categoryCounts.trouble} color="bg-red-500/20 text-red-400 border-red-500/20" />
            <CategoryCard title="Lessons Learned" label={t('Lessons Learned')} count={categoryCounts.lessons} color="bg-purple-500/20 text-purple-400 border-purple-500/20" />
            <CategoryCard title="Training & Regulation" label={t('Training & Regulation')} count={categoryCounts.training} color="bg-emerald-500/20 text-emerald-400 border-emerald-500/20" />
          </div>
        </div>

      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, trend, mockText, to }) {
  const content = (
    <>
      {mockText && (
        <span className="absolute top-2 right-2 text-[9px] font-bold text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded uppercase tracking-wider border border-orange-400/15 z-20">
          {mockText}
        </span>
      )}
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
      <div className="flex items-center gap-4 mb-4 relative z-10 pt-1">
        <div className="p-3 bg-white/5 rounded-xl border border-white/10 shadow-inner">
          {icon}
        </div>
        <h3 className="text-slate-400 text-sm font-medium">{label}</h3>
      </div>
      <div className="flex items-end gap-3 relative z-10">
        <div className="text-3xl font-bold">{value}</div>
        {trend && (
          <div className={`text-xs mb-1 px-2 py-0.5 rounded-full font-medium ${
            trend.startsWith('-')
              ? 'text-red-400 bg-red-400/10 border border-red-400/10'
              : 'text-green-400 bg-green-400/10 border border-green-400/10'
          }`}>
            {trend}
          </div>
        )}
      </div>
    </>
  );

  if (to) {
    return (
      <Link to={to} className="glass rounded-2xl p-6 relative overflow-hidden group block cursor-pointer hover:border-primary/50 hover:bg-white/5 transition-all">
        {content}
      </Link>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 relative overflow-hidden group">
      {content}
    </div>
  );
}

function CategoryCard({ title, label, count, color }) {
  return (
    <Link to={`/library?category=${title}`} className={`flex justify-between items-center p-3 rounded-xl border transition-all hover:brightness-125 ${color}`}>
      <span className="font-medium text-sm">{label}</span>
      <span className="bg-background/50 px-2.5 py-1 rounded-md text-xs font-bold">{count}</span>
    </Link>
  );
}

function StatusBadge({ status }) {
  let styles = "bg-slate-500/20 text-slate-300 border-slate-500/30";
  if (status === 'Approved') styles = "bg-green-500/20 text-green-400 border-green-500/30";
  if (status === 'Pending') styles = "bg-orange-500/20 text-orange-400 border-orange-500/30";
  if (status === 'Rejected') styles = "bg-red-500/20 text-red-400 border-red-500/30";
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles}`}>
      {status}
    </span>
  );
}
