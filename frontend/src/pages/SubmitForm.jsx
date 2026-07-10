import React, { useState, useContext, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UploadCloud, CheckCircle, File, X, FileText } from 'lucide-react';
import { useAuth, LanguageContext } from '../App';
import { supabase } from '../supabaseClient';
import { translations } from '../translations';

export default function SubmitForm() {
  const { user } = useAuth();
  const { language } = useContext(LanguageContext);
  const role = user?.role;
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const t = (key) => translations[language][key] || key;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState('');

  // 1. Flight Test Pilot form states
  const [flightLocation, setFlightLocation] = useState('');
  const [droneAirframe, setDroneAirframe] = useState('');
  const [safetyChecks, setSafetyChecks] = useState({
    compass: false,
    battery: false,
    gps: false,
    props: false
  });
  const [flightBehavior, setFlightBehavior] = useState('');

  // 2. Engineer form states
  const [formData, setFormData] = useState({
    title: '',
    category: role === 'Flight Test Pilot' ? 'Troubleshooting Cases' : 'SOP & Checklist',
    knowledgeType: 'Explicit',
    tags: '',
    summary: '',
    detailedContent: '',
    severityLevel: 'Low',
    rootCause: '',
    jiraKey: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSafetyChange = (e) => {
    setSafetyChecks({ ...safetyChecks, [e.target.name]: e.target.checked });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    let finalAttachmentUrls = [];

    // Upload files to Supabase if any are selected
    if (selectedFiles.length > 0) {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setUploadProgress(`Uploading file ${i + 1}/${selectedFiles.length}...`);
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('drone-logs')
          .upload(filePath, file);

        if (uploadError) {
          alert(`Error uploading file ${file.name}: ` + uploadError.message);
          setIsSubmitting(false);
          setUploadProgress('');
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from('drone-logs')
          .getPublicUrl(filePath);

        finalAttachmentUrls.push(publicUrlData.publicUrl);
      }
    }

    const finalAttachmentUrl = finalAttachmentUrls.join(',');
    setUploadProgress('Saving to database...');

    const isAutoApproved = ['Senior Engineer', 'Administrator'].includes(role);
    
    let payload = {};

    if (isPilot) {
      // Map Flight Test Pilot specialized fields to KnowledgeAsset DB columns
      const formattedTitle = `Flight Log: ${droneAirframe || 'Quadcopter'} at ${flightLocation || 'Unknown Site'}`;
      const safetySummary = Object.keys(safetyChecks)
        .filter(key => safetyChecks[key])
        .map(key => key.toUpperCase())
        .join(', ');

      payload = {
        title: formattedTitle,
        category: 'Maintenance Logs',
        knowledgeType: 'Explicit',
        author: `${user?.username || 'Anonymous'}|${role || ''}`,
        reviewer: isAutoApproved ? user?.username : null,
        tags: ['Flight Log', droneAirframe, flightLocation].filter(Boolean),
        summary: flightBehavior || 'Submitted flight telemetry log.',
        severityLevel: 'Low',
        rootCause: safetySummary ? `Safety checks passed: ${safetySummary}` : 'Pre-flight safety checklist incomplete',
        detailedContent: `Location: ${flightLocation}\nAirframe: ${droneAirframe}\nCompass Calibrated: ${safetyChecks.compass ? 'Yes' : 'No'}\nBattery Checked: ${safetyChecks.battery ? 'Yes' : 'No'}\nGPS Locked: ${safetyChecks.gps ? 'Yes' : 'No'}\nProps Secured: ${safetyChecks.props ? 'Yes' : 'No'}\n\nFlight Notes:\n${flightBehavior}`,
        attachmentUrl: finalAttachmentUrl,
        status: isAutoApproved ? 'Approved' : 'Pending',
        reviewerNotes: isAutoApproved ? 'Auto-approved by author' : null
      };
    } else {
      // Map Engineer fields to KnowledgeAsset DB columns
      const tagList = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
      if (role === 'API Test Engineer' && formData.jiraKey) {
        tagList.push(`Jira: ${formData.jiraKey}`);
      }

      payload = {
        title: formData.title,
        category: formData.category,
        knowledgeType: formData.knowledgeType,
        author: `${user?.username || 'Anonymous'}|${role || ''}`,
        reviewer: formData.category === 'Troubleshooting Cases' ? null : (isAutoApproved ? user?.username : null),
        tags: tagList,
        summary: formData.summary,
        detailedContent: formData.category === 'Troubleshooting Cases' ? '' : formData.detailedContent,
        severityLevel: formData.severityLevel,
        rootCause: formData.category === 'Troubleshooting Cases' ? '' : (formData.rootCause || 'N/A'),
        attachmentUrl: finalAttachmentUrl,
        status: formData.category === 'Troubleshooting Cases' ? 'Investigating' : (isAutoApproved ? 'Approved' : 'Pending'),
        reviewerNotes: formData.category === 'Troubleshooting Cases' ? null : (isAutoApproved ? 'Auto-approved by author' : null)
      };
    }

    try {
      const res = await fetch('http://localhost:8080/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        navigate('/library');
      } else {
        alert('Failed to save knowledge asset to backend.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error connecting to backend.');
    } finally {
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  const isPilot = false;

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            {isPilot ? "Pre-Flight Checklist & Telemetry Submission" : t('submitTitle')}
          </h1>
          <p className="text-slate-400 mt-1">
            {isPilot ? "Upload raw telemetry logs and verify flight behavior notes." : t('submitSub')}
          </p>
        </div>
        <Link 
          to="/library?author=me"
          className="px-4 py-2.5 rounded-xl text-sm font-medium bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all flex items-center gap-2 shadow-lg backdrop-blur-md hover:-translate-y-0.5 duration-300"
        >
          <FileText size={16} className="text-primary" />
          <span>{t('mySubmissions')}</span>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface border border-white/5 p-8 rounded-2xl space-y-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full pointer-events-none"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          {isPilot ? (
            /* --- FLIGHT TEST PILOT LAYOUT --- */
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">{t('flightLocation')}</label>
                <input 
                  required 
                  type="text" 
                  value={flightLocation} 
                  onChange={(e) => setFlightLocation(e.target.value)} 
                  className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 focus:border-primary outline-none transition-colors text-white" 
                  placeholder={t('flightLocationPlaceholder')} 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">{t('droneAirframe')}</label>
                <input 
                  required 
                  type="text" 
                  value={droneAirframe} 
                  onChange={(e) => setDroneAirframe(e.target.value)} 
                  className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 focus:border-primary outline-none transition-colors text-white" 
                  placeholder={t('droneAirframePlaceholder')} 
                />
              </div>

              <div className="space-y-3 md:col-span-2 bg-white/5 border border-white/5 p-5 rounded-xl">
                <label className="text-sm font-semibold text-slate-200 block mb-2">{t('safetyToggles')}</label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      name="compass" 
                      checked={safetyChecks.compass} 
                      onChange={handleSafetyChange} 
                      className="w-4 h-4 rounded border-white/10 bg-background text-primary focus:ring-primary/50" 
                    />
                    <span>Compass Calibrated</span>
                  </label>
                  <label className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      name="battery" 
                      checked={safetyChecks.battery} 
                      onChange={handleSafetyChange} 
                      className="w-4 h-4 rounded border-white/10 bg-background text-primary focus:ring-primary/50" 
                    />
                    <span>Battery Checked & Loaded</span>
                  </label>
                  <label className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      name="gps" 
                      checked={safetyChecks.gps} 
                      onChange={handleSafetyChange} 
                      className="w-4 h-4 rounded border-white/10 bg-background text-primary focus:ring-primary/50" 
                    />
                    <span>GPS 3D Lock Confirmed</span>
                  </label>
                  <label className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      name="props" 
                      checked={safetyChecks.props} 
                      onChange={handleSafetyChange} 
                      className="w-4 h-4 rounded border-white/10 bg-background text-primary focus:ring-primary/50" 
                    />
                    <span>Props & Hardware Secured</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-300">{t('flightBehavior')}</label>
                <textarea 
                  required 
                  value={flightBehavior} 
                  onChange={(e) => setFlightBehavior(e.target.value)} 
                  rows="4" 
                  className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 focus:border-primary outline-none transition-colors resize-none text-white" 
                  placeholder="Enter telemetry observations, flight stability anomalies, or wind impacts..."
                />
              </div>

              {/* Raw Telemetry File Uploader */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-300">{t('logUploader')}</label>
                <div 
                  className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:bg-white/5 transition-colors cursor-pointer group"
                  onClick={() => fileInputRef.current.click()}
                >
                  <UploadCloud className="mx-auto text-slate-400 group-hover:text-primary transition-colors mb-2" size={32} />
                  <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Select log files (.bin, .tlog) to upload</p>
                </div>
              </div>
            </>
          ) : (
            /* --- ENGINEERING INCIDENT & SOP REGISTRATION FORM --- */
            <>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-300">{t('titleLabel')}</label>
                <input required type="text" name="title" value={formData.title} onChange={handleChange} className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 focus:border-primary outline-none transition-colors text-white" placeholder={t('titlePlaceholder')} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-300">{t('categoryLabel')}</label>
                <select name="category" value={formData.category} onChange={handleChange} disabled={role === 'Flight Test Pilot'} className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 focus:border-primary outline-none transition-colors appearance-none text-white disabled:opacity-70 disabled:cursor-not-allowed">
                  <option value="SOP & Checklist">{t('SOP & Checklist')}</option>
                  <option value="Maintenance Logs">{t('Maintenance Logs')}</option>
                  <option value="Troubleshooting Cases">{t('Troubleshooting Cases')}</option>
                  <option value="Lessons Learned">{t('Lessons Learned')}</option>
                  <option value="Training & Regulation">{t('Training & Regulation')}</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-300">{t('tagsLabel')}</label>
                <input type="text" name="tags" value={formData.tags} onChange={handleChange} className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 focus:border-primary outline-none transition-colors text-white" placeholder={t('tagsPlaceholder')} />
              </div>

              {role === 'API Test Engineer' && (
                <div className="space-y-2 md:col-span-2 animate-in slide-in-from-top-2">
                  <label className="text-sm font-medium text-slate-300">{t('jiraKey')}</label>
                  <input 
                    type="text" 
                    name="jiraKey" 
                    value={formData.jiraKey} 
                    onChange={handleChange} 
                    className="w-full bg-background border border-primary/40 focus:border-primary rounded-lg px-4 py-2.5 outline-none transition-colors text-white" 
                    placeholder={t('jiraKeyPlaceholder')} 
                  />
                </div>
              )}

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-300">
                  {formData.category === 'Troubleshooting Cases' ? t('currentFaultDescription') : t('summaryLabel')}
                </label>
                <textarea 
                  required 
                  name="summary" 
                  value={formData.summary} 
                  onChange={handleChange} 
                  rows="3" 
                  className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 focus:border-primary outline-none transition-colors resize-none text-white" 
                  placeholder={formData.category === 'Troubleshooting Cases' ? t('currentFaultPlaceholder') : t('summaryPlaceholder')}
                ></textarea>
              </div>

              {formData.category === 'Troubleshooting Cases' && (
                <div className="space-y-2 md:col-span-2 border border-amber-500/30 bg-amber-500/5 p-4 rounded-xl text-amber-400 text-sm animate-in fade-in duration-300">
                  <p className="font-semibold uppercase tracking-wider mb-1">{t('initCollabDiagThread')}</p>
                  <p className="text-xs text-slate-400">{t('investigatingWarning')}</p>
                </div>
              )}

              {formData.category !== 'Troubleshooting Cases' && (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-300">{t('detailedContent')}</label>
                  <textarea name="detailedContent" value={formData.detailedContent} onChange={handleChange} rows="6" className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 focus:border-primary outline-none transition-colors text-white" placeholder={t('detailedContentPlaceholder')}></textarea>
                </div>
              )}

              <div className="space-y-2 col-span-1">
                <label className="text-sm font-medium text-slate-300">{t('severityLabel')}</label>
                <select name="severityLevel" value={formData.severityLevel} onChange={handleChange} className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 focus:border-primary outline-none transition-colors appearance-none text-white">
                  <option value="Low">{t('Low')}</option>
                  <option value="Medium">{t('Medium')}</option>
                  <option value="High">{t('High')}</option>
                  <option value="Critical">{t('Critical')}</option>
                </select>
              </div>

              {formData.category !== 'Troubleshooting Cases' && (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-300">{t('rootCauseLabel')}</label>
                  <textarea name="rootCause" value={formData.rootCause} onChange={handleChange} rows="4" className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 focus:border-primary outline-none transition-colors resize-none text-white" placeholder={t('rootCausePlaceholder')}></textarea>
                </div>
              )}

              {/* Standard File Upload */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-300">
                  {formData.category === 'Troubleshooting Cases' ? t('rawTelemetryLabel') : t('attachmentLabel')}
                </label>
                <div 
                  className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:bg-white/5 transition-colors cursor-pointer group"
                  onClick={() => fileInputRef.current.click()}
                >
                  <UploadCloud className="mx-auto text-slate-400 group-hover:text-primary transition-colors mb-2" size={32} />
                  <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                    {formData.category === 'Troubleshooting Cases' 
                      ? t('rawTelemetryBrowse')
                      : t('clickToBrowse')}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Render files list inside either layout if selected */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2 md:col-span-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-background border border-primary/30 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <File className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white line-clamp-1">{file.name}</p>
                      <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => removeFile(index)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".bin,.tlog,.zip,.log,.doc,.docx,.xls,.xlsx,.pdf" 
            multiple
          />
        </div>

        <div className="pt-6 border-t border-white/10 flex items-center justify-between relative z-10">
          <p className="text-sm text-primary animate-pulse">{uploadProgress}</p>
          <div className="flex gap-4 ml-auto">
            <button type="button" onClick={() => navigate(-1)} className="px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-white/10 text-white transition-colors">
              {t('cancel')}
            </button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 rounded-lg text-sm font-medium bg-primary hover:bg-primary-hover text-white shadow-lg transition-all flex items-center gap-2 disabled:opacity-50">
              {isSubmitting ? 'Processing...' : (
                <>
                  <CheckCircle size={18} />
                  {t('submitForReview')}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
