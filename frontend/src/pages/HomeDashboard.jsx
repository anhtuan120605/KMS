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
        
        const managerAdminRoles = ['Administrator', 'ADMINISTRATOR', 'Project Manager', 'PROJECT_MANAGER', 'MANAGER'];
        const seniorRoles = ['Senior Engineer', 'SENIOR_FIRMWARE_ENGINEER', 'SENIOR_HARDWARE_ENGINEER', 'SENIOR_FLIGHT_PILOT', 'SENIOR'];
        const isStaffOrPMOrAdmin = [...managerAdminRoles, ...seniorRoles].includes(role);

        // 1. Calculate recent activity based on active role
        if (!isStaffOrPMOrAdmin) {
          const approved = data.filter(item => item.status === 'Approved' || item.status === 'Investigating');
          setRecentActivity(approved.slice(-5).reverse());
        } else if (seniorRoles.includes(role)) {
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

        // 3. Category counts (Approved & Investigating for regular engineers, all for others)
        const catData = !isStaffOrPMOrAdmin
          ? data.filter(item => item.status === 'Approved' || item.status === 'Investigating')
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
    const juniorRoles = ['New Engineer', 'Flight Test Pilot', 'JUNIOR_FIRMWARE_ENGINEER', 'JUNIOR_HARDWARE_ENGINEER', 'JUNIOR_FLIGHT_PILOT'];
    const seniorRoles = ['Senior Engineer', 'SENIOR_FIRMWARE_ENGINEER', 'SENIOR_HARDWARE_ENGINEER', 'SENIOR_FLIGHT_PILOT'];
    
    if (juniorRoles.includes(role)) {
      return t('newlyPublishedKnowledge');
    }
    if (seniorRoles.includes(role)) {
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
    const data = allData;

    // Process data to resolve authorRole and authorPosition dynamically (read directly or defaults)
    const processedData = data.map(item => {
      return {
        ...item,
        authorRole: item.authorRole || 'JUNIOR',
        authorPosition: item.authorPosition || 'FIRMWARE'
      };
    });

    // Calculations for Column 1
    const pendingCount = processedData.filter(item => item.status === 'Pending').length;
    const investigatingCount = processedData.filter(item => item.status === 'Investigating').length;

    const fwCount = processedData.filter(item => item.authorPosition === 'FIRMWARE').length;
    const hwCount = processedData.filter(item => item.authorPosition === 'HARDWARE').length;
    const flCount = processedData.filter(item => item.authorPosition === 'FLIGHT').length;
    const totalPositionCount = (fwCount + hwCount + flCount) || 1;

    // Calculations for Column 3
    const approvedAssets = processedData.filter(item => item.status === 'Approved');
    const activeAssetsCount = approvedAssets.filter(item => (Number(item.helpfulCount) || 0) > 0).length;
    const activationRate = approvedAssets.length > 0 ? ((activeAssetsCount / approvedAssets.length) * 100).toFixed(1) : "0.0";
    const totalHelpfulVolume = processedData.reduce((acc, curr) => acc + (Number(curr.helpfulCount) || 0), 0);

    // Intrasystem Search Efficiency Optimization
    const timeSaved = (((180 - 45) / 180) * 100).toFixed(0);
    const searchEfficiencyVal = `+${timeSaved}% ${language === 'vi' ? 'Tốc độ truy vấn' : 'Query Velocity'}`;

    // Junior Onboarding Autonomy Rate: Count total successful helpful triggers exclusively by junior roles
    const juniorRoles = ['JUNIOR_FIRMWARE_ENGINEER', 'JUNIOR_HARDWARE_ENGINEER', 'JUNIOR_FLIGHT_PILOT', 'JUNIOR', 'New Engineer'];
    const juniorHelpfulTotal = processedData
      .filter(item => (juniorRoles.includes(item.authorRole) || item.authorRole === 'JUNIOR') && item.status === 'Approved')
      .reduce((acc, curr) => acc + (Number(curr.helpfulCount) || 0), 0);

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

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Column 1: QUẢN TRỊ & KIỂM SOÁT CHẤT LƯỢNG TRI THỨC */}
          <div className="border border-slate-800 bg-slate-950/40 p-6 rounded-md space-y-6 flex flex-col justify-between">
            <div className="space-y-6 w-full">
              <div>
                <h2 className="text-base font-extrabold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-purple-500 rounded-full inline-block animate-pulse"></span>
                  {t('kmGovernance')}
                </h2>
              </div>

              {/* Status Boxes */}
              <div className="grid grid-cols-2 gap-4">
                <div 
                  onClick={() => navigate('/library?status=Pending')}
                  className="border border-slate-800 p-4 rounded-md bg-black/20 cursor-pointer hover:bg-black/40 hover:border-slate-600 transition-all"
                >
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    {t('approvalQueue')}
                  </span>
                  <span className="font-mono text-3xl font-extrabold text-white">
                    {pendingCount}
                  </span>
                </div>
                <div 
                  onClick={() => navigate('/library?status=Investigating')}
                  className="border border-slate-800 p-4 rounded-md bg-black/20 cursor-pointer hover:bg-black/40 hover:border-slate-600 transition-all"
                >
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    {t('activeDiagnosticSessions')}
                  </span>
                  <span className="font-mono text-3xl font-extrabold text-amber-500">
                    {investigatingCount}
                  </span>
                </div>
              </div>

              {/* Total Knowledge Box */}
              <div 
                onClick={() => navigate('/library')}
                className="border border-slate-800 p-4 rounded-md bg-black/20 cursor-pointer hover:bg-black/40 hover:border-slate-600 transition-all"
              >
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  {language === 'vi' ? 'Tổng số tri thức trong hệ thống' : 'Total Knowledge Assets'}
                </span>
                <span className="font-mono text-3xl font-extrabold text-primary">
                  {processedData.length}
                </span>
              </div>

              {/* Chart Section: Mật độ phân bổ kho tri thức theo Taxonomy Categories */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <span className="text-xs text-slate-400 uppercase tracking-wider block font-bold">
                  {t('taxonomyDistribution')}
                </span>
                <div className="space-y-3">
                  {[
                    { label: "FIRMWARE", count: fwCount, pct: Math.round((fwCount / totalPositionCount) * 100) },
                    { label: "HARDWARE", count: hwCount, pct: Math.round((hwCount / totalPositionCount) * 100) },
                    { label: "FLIGHT", count: flCount, pct: Math.round((flCount / totalPositionCount) * 100) }
                  ].map(cat => (
                    <div 
                      key={cat.label} 
                      onClick={() => navigate(`/library?position=${cat.label}`)}
                      className="space-y-1 cursor-pointer hover:opacity-80 transition-opacity group/item"
                    >
                      <div className="flex justify-between text-xs font-bold text-slate-300 font-mono group-hover/item:text-primary transition-colors">
                        <span>{cat.label}</span>
                        <span className="font-mono text-sm">{cat.count} {language === 'vi' ? 'bài' : 'items'} ({cat.pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-900 border border-slate-800 rounded-sm h-2 overflow-hidden">
                        <div className="bg-purple-500 group-hover/item:bg-primary transition-colors h-full rounded-sm" style={{ width: `${cat.pct}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: HIỆU NĂNG VẬN HÀNH & VÒNG LẶP KCS */}
          <div className="border border-slate-800 bg-slate-950/40 p-6 rounded-md space-y-6 flex flex-col justify-between">
            <div className="space-y-6 w-full">
              <div>
                <h2 className="text-base font-extrabold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block animate-pulse"></span>
                  {t('kcsOpsPerformance')}
                </h2>
              </div>

              <div className="border border-slate-800 bg-black/25 rounded-md p-4 space-y-4">
                {/* Total Reuse Volume */}
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    {t('totalHelpfulVolume')}
                  </span>
                  <div className="font-mono text-3xl font-extrabold text-white">
                    {totalHelpfulVolume}
                  </div>
                </div>

                {/* Process Reuse Rate */}
                <div className="space-y-1.5">
                  <span className="text-xs text-slate-400 uppercase tracking-wider block font-bold mb-1">
                    {t('processReuseRate')}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-900 border border-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${activationRate}%` }}
                      ></div>
                    </div>
                    <span className="font-mono text-emerald-400 text-base font-bold shrink-0">
                      {activationRate}%
                    </span>
                  </div>
                </div>

                {/* Onboarding Autonomy */}
                <div className="space-y-1 pt-2 border-t border-slate-800/60">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    {t('onboardingAutonomy')}
                  </span>
                  <div className="font-mono text-white text-2xl font-extrabold">
                    {juniorHelpfulTotal} {t('onboardingAutonomyValue')}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  };


  if (role === 'Project Manager' || role === 'PROJECT_MANAGER' || role === 'MANAGER') {
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
                  <div key={item.id} className={`p-4 rounded-xl transition-colors flex justify-between items-center group ${
                    item.category === 'Troubleshooting Cases'
                      ? 'bg-amber-950/20 border border-amber-500/40 hover:border-amber-400'
                      : 'bg-white/5 border border-white/5 hover:border-primary/30'
                  }`}>
                    <div>
                      <h3 className={`font-medium transition-colors ${item.category === 'Troubleshooting Cases' ? 'text-slate-200 group-hover:text-amber-400' : 'text-slate-200 group-hover:text-primary'}`}>
                        <Link to={`/item/${item.id}`}>{item.title}</Link>
                      </h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-xs ${item.category === 'Troubleshooting Cases' ? 'text-amber-400 font-semibold' : 'text-slate-400'}`}>{t(item.category)}</span>
                        {item.category === 'Troubleshooting Cases' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded text-amber-400 bg-amber-500/20 border border-amber-500/40 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                            {language === 'vi' ? 'Đang thảo luận' : 'Under Discussion'}
                          </span>
                        )}
                        <span className="text-sm text-slate-400">• {item.knowledgeType}</span>
                      </div>
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
                  <div key={item.id} className={`p-4 rounded-xl transition-colors flex justify-between items-center group ${
                    item.category === 'Troubleshooting Cases'
                      ? 'bg-amber-950/20 border border-amber-500/40 hover:border-amber-400'
                      : 'bg-white/5 border border-white/5 hover:border-primary/30'
                  }`}>
                    <div>
                      <h3 className={`font-medium transition-colors ${item.category === 'Troubleshooting Cases' ? 'text-slate-200 group-hover:text-amber-400' : 'text-slate-200 group-hover:text-primary'}`}>
                        <Link to={`/item/${item.id}`}>{item.title}</Link>
                      </h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-xs ${item.category === 'Troubleshooting Cases' ? 'text-amber-400 font-semibold' : 'text-slate-400'}`}>{t(item.category)}</span>
                        {item.category === 'Troubleshooting Cases' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded text-amber-400 bg-amber-500/20 border border-amber-500/40 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                            {language === 'vi' ? 'Đang thảo luận' : 'Under Discussion'}
                          </span>
                        )}
                        <span className="text-sm text-slate-400">• {item.knowledgeType}</span>
                      </div>
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
          <div className={`text-xs mb-1 px-2 py-0.5 rounded-full font-medium ${trend.startsWith('-')
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
