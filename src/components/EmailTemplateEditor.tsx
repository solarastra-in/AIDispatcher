import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Mail, 
  Send, 
  Code, 
  Eye, 
  RefreshCw, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Smartphone, 
  Monitor, 
  Copy, 
  Check, 
  FileText, 
  Zap, 
  DollarSign, 
  Shield, 
  UserPlus, 
  Activity,
  Layers,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { 
  EmailTemplateConfig, 
  saveEmailTemplateToFirestore, 
  saveAllEmailTemplatesToFirestore, 
  loadEmailTemplatesFromFirestore,
  recordAuditLogToFirestore,
  logEmailToFirestore
} from '../lib/firebase';
import { 
  DEFAULT_EMAIL_TEMPLATES, 
  SAMPLE_TEMPLATE_VARIABLES, 
  interpolateTemplate 
} from '../lib/defaultTemplates';

interface EmailTemplateEditorProps {
  currentUserEmail?: string;
  smtpConfig?: {
    host: string;
    port: number;
    user: string;
    fromEmail: string;
    fromName: string;
    isVerified: boolean;
  };
  onSendTestNotification?: (templateId: string, subject: string, html: string, recipient: string) => Promise<any>;
}

export const EmailTemplateEditor: React.FC<EmailTemplateEditorProps> = ({
  currentUserEmail = 'solarastra.in@gmail.com',
  smtpConfig,
  onSendTestNotification,
}) => {
  // Active templates state dictionary
  const [templates, setTemplates] = useState<Record<string, EmailTemplateConfig>>(DEFAULT_EMAIL_TEMPLATES);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('quota_alert');
  const [activeEditorTab, setActiveEditorTab] = useState<'html' | 'text' | 'preview'>('html');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [useSampleData, setUseSampleData] = useState<boolean>(true);
  
  // Custom test send recipient
  const [testRecipient, setTestRecipient] = useState<string>(currentUserEmail);
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusNotification, setStatusNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  const htmlTextareaRef = useRef<HTMLTextAreaElement>(null);
  const subjectInputRef = useRef<HTMLInputElement>(null);

  // Load custom templates from Firestore / Server on initial mount
  useEffect(() => {
    async function loadTemplates() {
      setIsLoading(true);
      try {
        // Try loading from Firestore first
        const firestoreTemplates = await loadEmailTemplatesFromFirestore();
        if (firestoreTemplates && Object.keys(firestoreTemplates).length > 0) {
          setTemplates({
            ...DEFAULT_EMAIL_TEMPLATES,
            ...firestoreTemplates,
          });
        } else {
          // Fallback to server endpoint
          const res = await fetch('/api/admin/smtp/templates');
          if (res.ok) {
            const data = await res.json();
            if (data.templates && Object.keys(data.templates).length > 0) {
              setTemplates({
                ...DEFAULT_EMAIL_TEMPLATES,
                ...data.templates,
              });
            }
          }
        }
      } catch (err) {
        console.warn('Using default email templates due to load error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadTemplates();
  }, []);

  // Update test recipient when current user changes
  useEffect(() => {
    if (currentUserEmail) {
      setTestRecipient(currentUserEmail);
    }
  }, [currentUserEmail]);

  const currentTemplate = useMemo(() => {
    return templates[selectedTemplateId] || DEFAULT_EMAIL_TEMPLATES[selectedTemplateId] || DEFAULT_EMAIL_TEMPLATES.quota_alert;
  }, [templates, selectedTemplateId]);

  // Handle template field updates
  const handleUpdateTemplateField = (field: 'subject' | 'htmlBody' | 'textBody', value: string) => {
    setTemplates((prev) => ({
      ...prev,
      [selectedTemplateId]: {
        ...currentTemplate,
        [field]: value,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUserEmail,
      },
    }));
    setHasUnsavedChanges(true);
  };

  // Insert variable token into the active editor
  const handleInsertVariable = (variableToken: string) => {
    if (activeEditorTab === 'html' && htmlTextareaRef.current) {
      const textarea = htmlTextareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = currentTemplate.htmlBody;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const newText = before + variableToken + after;
      
      handleUpdateTemplateField('htmlBody', newText);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variableToken.length, start + variableToken.length);
      }, 50);
    } else {
      // Copy to clipboard with visual confirmation
      navigator.clipboard.writeText(variableToken);
      setCopiedVariable(variableToken);
      setTimeout(() => setCopiedVariable(null), 2000);
    }
  };

  // Reset current template to factory default
  const handleResetToDefault = () => {
    const defaultTemplate = DEFAULT_EMAIL_TEMPLATES[selectedTemplateId];
    if (!defaultTemplate) return;

    setTemplates((prev) => ({
      ...prev,
      [selectedTemplateId]: {
        ...defaultTemplate,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUserEmail,
      },
    }));
    setHasUnsavedChanges(true);
    setStatusNotification({
      type: 'info',
      message: `Template "${defaultTemplate.name}" reset to factory default layout. Click "Save to Firestore" to persist.`,
    });
  };

  // Save all templates to Firestore & sync with Server
  const handleSaveTemplates = async () => {
    setIsSaving(true);
    setStatusNotification(null);

    try {
      // 1. Save to Firestore
      await saveAllEmailTemplatesToFirestore(templates);

      // 2. Sync to Server memory vault
      await fetch('/api/admin/smtp/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templates }),
      });

      // 3. Record Audit Log
      await recordAuditLogToFirestore(
        'Email Templates Saved',
        'smtp',
        currentUserEmail,
        `Updated email template configurations for [${Object.keys(templates).join(', ')}] in Firestore`
      );

      setHasUnsavedChanges(false);
      setStatusNotification({
        type: 'success',
        message: 'All email & notification templates successfully saved to Firestore & synced with mail server!',
      });
    } catch (err: any) {
      setStatusNotification({
        type: 'error',
        message: `Failed to save email templates: ${err.message}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Send a real-time trial email using the customized template
  const handleSendTrialWithTemplate = async () => {
    setIsSendingTest(true);
    setStatusNotification(null);

    const recipient = testRecipient.trim() || currentUserEmail;
    
    // Prepare interpolated test payload
    const dynamicVariables = {
      ...SAMPLE_TEMPLATE_VARIABLES,
      '{{recipient_name}}': recipient.split('@')[0],
      '{{recipient_email}}': recipient,
      '{{timestamp}}': new Date().toLocaleString(),
    };

    const renderedSubject = interpolateTemplate(currentTemplate.subject, dynamicVariables);
    const renderedHtml = interpolateTemplate(currentTemplate.htmlBody, dynamicVariables);
    const renderedText = currentTemplate.textBody ? interpolateTemplate(currentTemplate.textBody, dynamicVariables) : undefined;

    try {
      let data: any;

      if (onSendTestNotification) {
        data = await onSendTestNotification(selectedTemplateId, renderedSubject, renderedHtml, recipient);
      } else {
        const res = await fetch('/api/admin/smtp/send-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: recipient,
            subject: renderedSubject,
            templateType: selectedTemplateId,
            customHtml: renderedHtml,
            customText: renderedText,
            sentBy: `SuperAdmin (${currentUserEmail})`,
          }),
        });
        data = await res.json();
      }

      if (data.success) {
        setStatusNotification({
          type: 'success',
          message: `Custom template test email delivered to ${recipient}! (Latency: ${data.durationMs || 120}ms, Message-ID: ${data.messageId || 'simulated'})`,
        });

        await logEmailToFirestore({
          to: recipient,
          from: smtpConfig ? `${smtpConfig.fromName} <${smtpConfig.fromEmail}>` : `WhyOr Dispatch AI <${currentUserEmail}>`,
          subject: renderedSubject,
          emailType: selectedTemplateId,
          status: 'sent',
          messageId: data.messageId,
          sentBy: currentUserEmail,
        });
      } else {
        setStatusNotification({
          type: 'error',
          message: `Test Send Failed: ${data.error || 'Unknown error'}. ${data.recommendation || ''}`,
        });
      }
    } catch (err: any) {
      setStatusNotification({
        type: 'error',
        message: `Error sending trial email: ${err.message}`,
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  // Interpolate HTML for live interactive preview
  const previewHtml = useMemo(() => {
    if (useSampleData) {
      return interpolateTemplate(currentTemplate.htmlBody, {
        ...SAMPLE_TEMPLATE_VARIABLES,
        '{{recipient_email}}': testRecipient || currentUserEmail,
      });
    }
    return currentTemplate.htmlBody;
  }, [currentTemplate.htmlBody, useSampleData, testRecipient, currentUserEmail]);

  const previewSubject = useMemo(() => {
    if (useSampleData) {
      return interpolateTemplate(currentTemplate.subject, {
        ...SAMPLE_TEMPLATE_VARIABLES,
        '{{recipient_email}}': testRecipient || currentUserEmail,
      });
    }
    return currentTemplate.subject;
  }, [currentTemplate.subject, useSampleData, testRecipient, currentUserEmail]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'billing':
        return <DollarSign className="w-3.5 h-3.5 text-amber-400" />;
      case 'system':
        return <Zap className="w-3.5 h-3.5 text-rose-400" />;
      case 'security':
        return <Shield className="w-3.5 h-3.5 text-sky-400" />;
      case 'onboarding':
        return <UserPlus className="w-3.5 h-3.5 text-indigo-400" />;
      case 'verification':
      default:
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'billing':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
      case 'system':
        return 'bg-rose-500/10 text-rose-300 border-rose-500/20';
      case 'security':
        return 'bg-sky-500/10 text-sky-300 border-sky-500/20';
      case 'onboarding':
        return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20';
      case 'verification':
      default:
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Template Selector Bar */}
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Email & Alert Notification Templates
            </h3>
            <p className="text-xs text-slate-400">
              Customize responsive HTML and plain-text templates dispatched for billing alerts, failover events, and system security.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {hasUnsavedChanges && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Unsaved Edits
              </span>
            )}

            <button
              type="button"
              id="btn-reset-template"
              onClick={handleResetToDefault}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Template</span>
            </button>

            <button
              type="button"
              id="btn-save-all-templates"
              onClick={handleSaveTemplates}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Save to Firestore</span>
            </button>
          </div>
        </div>

        {/* Template Category Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-white/5">
          {(Object.values(templates) as EmailTemplateConfig[]).map((template) => {
            const isSelected = template.id === selectedTemplateId;
            return (
              <button
                key={template.id}
                type="button"
                id={`pill-template-${template.id}`}
                onClick={() => setSelectedTemplateId(template.id)}
                className={`flex flex-col items-start text-left p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-950/50 border-indigo-500/60 ring-1 ring-indigo-500/40 shadow-sm'
                    : 'bg-slate-950/40 border-white/5 hover:border-white/20 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  {getCategoryIcon(template.category)}
                  <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border uppercase ${getCategoryBadgeClass(template.category)}`}>
                    {template.category}
                  </span>
                </div>
                <span className="text-xs font-semibold text-white line-clamp-1">
                  {template.name}
                </span>
                <span className="text-[10px] font-mono text-slate-400 truncate w-full mt-0.5">
                  ID: {template.id}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notification Banner */}
      {statusNotification && (
        <div className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-3 ${
          statusNotification.type === 'success'
            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
            : statusNotification.type === 'error'
            ? 'bg-rose-950/40 border-rose-500/30 text-rose-200'
            : 'bg-indigo-950/40 border-indigo-500/30 text-indigo-200'
        }`}>
          <div className="flex items-center gap-2">
            {statusNotification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {statusNotification.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {statusNotification.type === 'info' && <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />}
            <span>{statusNotification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusNotification(null)}
            className="text-slate-400 hover:text-white text-xs font-mono px-2 py-0.5 rounded bg-white/5 hover:bg-white/10"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Two-Column Work Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Subject & Editor */}
        <div className="lg:col-span-7 space-y-4">
          {/* Active Template Meta Card */}
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border uppercase ${getCategoryBadgeClass(currentTemplate.category)}`}>
                    {currentTemplate.category}
                  </span>
                  <h4 className="text-base font-bold text-white">
                    {currentTemplate.name}
                  </h4>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {currentTemplate.description}
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] font-mono text-slate-500 block">
                  Template ID: <span className="text-indigo-400">{currentTemplate.id}</span>
                </span>
                {currentTemplate.updatedAt && (
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Updated: {new Date(currentTemplate.updatedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            {/* Subject Line Editor */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <label className="block text-xs font-semibold text-slate-200">
                Email Subject Line
              </label>
              <div className="relative">
                <input
                  ref={subjectInputRef}
                  type="text"
                  id="input-template-subject"
                  value={currentTemplate.subject}
                  onChange={(e) => handleUpdateTemplateField('subject', e.target.value)}
                  placeholder="e.g. ⚠️ [WhyOr Quota Alert] {{company_name}} Monthly Token Budget at {{threshold_percentage}}%"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-white text-xs font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span>Preview:</span>
                <span className="font-mono text-slate-300 italic truncate max-w-md">
                  {previewSubject}
                </span>
              </p>
            </div>

            {/* Variable Chips Toolbox */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-indigo-400" />
                  Dynamic Template Variables
                </label>
                <span className="text-[10px] text-slate-400">
                  {copiedVariable ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-mono">
                      <Check className="w-3 h-3" /> Copied {copiedVariable}!
                    </span>
                  ) : (
                    'Click to insert or copy'
                  )}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {currentTemplate.variables.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => handleInsertVariable(v)}
                    className="group inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950/60 hover:bg-indigo-950/80 border border-white/10 hover:border-indigo-500/50 text-indigo-300 hover:text-indigo-200 text-[11px] font-mono transition-all cursor-pointer"
                    title={`Insert ${v} into template`}
                  >
                    <span>{v}</span>
                    <Copy className="w-2.5 h-2.5 opacity-40 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Editor Container with Tabs */}
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
            {/* Editor Mode Header Tabs */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-slate-950/40">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="tab-mode-html"
                  onClick={() => setActiveEditorTab('html')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    activeEditorTab === 'html'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>HTML Email Body</span>
                </button>

                <button
                  type="button"
                  id="tab-mode-text"
                  onClick={() => setActiveEditorTab('text')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    activeEditorTab === 'text'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Plain Text Fallback</span>
                </button>
              </div>

              <div className="text-[10px] font-mono text-slate-400">
                {activeEditorTab === 'html' ? 'Responsive HTML / Inline CSS' : 'RFC 2822 text/plain'}
              </div>
            </div>

            {/* Code / Text Area */}
            <div className="p-4">
              {activeEditorTab === 'html' ? (
                <div className="relative">
                  <textarea
                    ref={htmlTextareaRef}
                    id="textarea-template-html"
                    value={currentTemplate.htmlBody}
                    onChange={(e) => handleUpdateTemplateField('htmlBody', e.target.value)}
                    rows={18}
                    className="w-full p-4 rounded-xl bg-slate-950 border border-white/10 text-emerald-300 font-mono text-xs leading-relaxed focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y"
                    placeholder="Enter inline-styled HTML email body..."
                    spellCheck={false}
                  />
                  <div className="absolute bottom-3 right-3 text-[10px] font-mono text-slate-500 bg-slate-900/80 px-2 py-1 rounded border border-white/5 pointer-events-none">
                    {currentTemplate.htmlBody.length} characters
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <textarea
                    id="textarea-template-text"
                    value={currentTemplate.textBody || ''}
                    onChange={(e) => handleUpdateTemplateField('textBody', e.target.value)}
                    rows={18}
                    className="w-full p-4 rounded-xl bg-slate-950 border border-white/10 text-sky-200 font-mono text-xs leading-relaxed focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y"
                    placeholder="Enter plaintext email content..."
                    spellCheck={false}
                  />
                  <div className="absolute bottom-3 right-3 text-[10px] font-mono text-slate-500 bg-slate-900/80 px-2 py-1 rounded border border-white/5 pointer-events-none">
                    {(currentTemplate.textBody || '').length} characters
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Preview & Test Dispatcher */}
        <div className="lg:col-span-5 space-y-4">
          {/* Live Preview Container */}
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl flex flex-col">
            {/* Preview Controls Bar */}
            <div className="flex flex-wrap items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-950/60 gap-2">
              <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">Live Email Client Preview</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Device Selector */}
                <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-white/5">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                      previewDevice === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Desktop Client View"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                      previewDevice === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Mobile Client View"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Sample Data Toggle */}
                <button
                  type="button"
                  onClick={() => setUseSampleData(!useSampleData)}
                  className={`text-[10px] font-mono px-2 py-1 rounded-md border transition-colors cursor-pointer ${
                    useSampleData
                      ? 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                      : 'bg-slate-800 text-slate-400 border-white/5 hover:text-white'
                  }`}
                  title="Toggle dynamic data interpolation in preview"
                >
                  {useSampleData ? 'Interpolated Data' : 'Raw Tokens'}
                </button>
              </div>
            </div>

            {/* Email Client Simulated Header Chrome */}
            <div className="p-3.5 bg-slate-950/90 border-b border-white/5 text-xs font-mono space-y-1">
              <div className="flex items-center text-[11px] text-slate-400">
                <span className="w-16 text-slate-500">From:</span>
                <span className="text-slate-300 truncate">
                  {smtpConfig ? `${smtpConfig.fromName} <${smtpConfig.fromEmail}>` : 'WhyOr Dispatch AI Enterprise <solarastra.in@gmail.com>'}
                </span>
              </div>
              <div className="flex items-center text-[11px] text-slate-400">
                <span className="w-16 text-slate-500">To:</span>
                <span className="text-purple-300 font-semibold truncate">
                  {testRecipient || currentUserEmail}
                </span>
              </div>
              <div className="flex items-start text-[11px] text-slate-400">
                <span className="w-16 text-slate-500">Subject:</span>
                <span className="text-white font-medium break-words">
                  {previewSubject}
                </span>
              </div>
            </div>

            {/* Rendered Email Preview Stage */}
            <div className="p-4 bg-slate-950/40 overflow-y-auto max-h-[480px]">
              <div className={`mx-auto transition-all ${
                previewDevice === 'mobile' ? 'max-w-[340px]' : 'max-w-[600px]'
              }`}>
                <div 
                  className="rounded-xl overflow-hidden shadow-2xl border border-white/10"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            </div>
          </div>

          {/* Real-time Trial Dispatch Card */}
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-xl space-y-3.5">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                Dispatch Live Trial With This Custom Template
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Send a real test notification using your customized HTML body & subject directly via the configured SMTP mail server.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300">
                Test Recipient Address
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  id="input-trial-template-recipient"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="solarastra.in@gmail.com"
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950/70 border border-white/10 text-white text-xs font-mono focus:border-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setTestRecipient(currentUserEmail)}
                  className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-purple-300 text-xs font-mono transition-colors shrink-0"
                >
                  SuperAdmin
                </button>
              </div>
            </div>

            <button
              type="button"
              id="btn-send-custom-template-trial"
              onClick={handleSendTrialWithTemplate}
              disabled={isSendingTest}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSendingTest ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>{isSendingTest ? 'Delivering Custom Email...' : `Send Test ${currentTemplate.name} to ${testRecipient}`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
