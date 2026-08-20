import React, { useState } from 'react';
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  ShieldCheck, 
  Globe, 
  Sparkles, 
  Clock, 
  MessageSquare, 
  Phone,
  ArrowRight,
  Headphones,
  Server,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  Lock,
  Zap,
  Users
} from 'lucide-react';
import { saveContactInquiryToFirestore, ContactInquiry } from '../lib/firebase';

interface ContactPageProps {
  onNavigateTab?: (tab: string) => void;
}

const ENTERPRISE_FAQS = [
  {
    q: "What is included in the Enterprise Tier & Custom VPC Deployment?",
    a: "WhyOr Enterprise includes dedicated private VPC deployments (AWS, GCP, Azure), custom local Ollama inference clusters, SAML 2.0 / Okta SSO, custom SLA guarantees (<2h incident response), and high-volume pooled token discounts with dedicated account management."
  },
  {
    q: "How does WhyOr ensure Zero-Data Retention (ZDR) and data privacy?",
    a: "Under our Enterprise ZDR agreement, no prompt payload or completion transcript is ever stored or used for model training. Prompts are processed statelessly in-memory or stored strictly in customer-dedicated encrypted Firestore instances with tenant-specific AES-256 keys."
  },
  {
    q: "Can we pay via Invoice (PO / Net 30 terms) instead of credit card?",
    a: "Yes. Enterprise accounts with annual contracts or monthly spends over $1,000 can be invoiced directly via purchase order (PO) with standard Net 30 payment terms and custom billing contacts."
  },
  {
    q: "How fast can our engineering team integrate the 14-endpoint FastAPI surface?",
    a: "Most teams integrate WhyOr's drop-in OpenAI-compatible proxy `/api/v1/dispatch` in less than 15 minutes by swapping the base URL and API key in their standard SDK client."
  }
];

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigateTab }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [topic, setTopic] = useState<ContactInquiry['topic']>('enterprise_quote');
  const [message, setMessage] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorMessage('Please fill in all required fields (Name, Email, and Message).');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await saveContactInquiryToFirestore({
        name: name.trim(),
        email: email.trim(),
        company: company.trim() || undefined,
        phone: phone.trim() || undefined,
        topic,
        message: message.trim(),
      });

      setSubmittedSuccess(true);
      setName('');
      setEmail('');
      setCompany('');
      setPhone('');
      setMessage('');
    } catch (err: any) {
      console.error('Submission error:', err);
      setErrorMessage('Failed to send message. You can also email solarastra.in@gmail.com directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in pb-20">
      
      {/* HEADER */}
      <div className="text-center max-w-3xl mx-auto space-y-4 pt-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 uppercase tracking-wider">
          <Headphones className="w-3.5 h-3.5" />
          Enterprise Support & Inquiries
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold font-display text-white tracking-tight">
          Let's Discuss Your <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">AI Dispatch Strategy</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
          Whether you need a custom multi-tenant quota, dedicated private VPC deployment, or technical assistance with BYOK credentials, our team is ready to assist.
        </p>
      </div>

      {/* MAIN TWO-COLUMN LAYOUT */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: CONTACT CHANNELS & SLA INFO */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Direct Support Channels */}
          <div className="bg-slate-900/70 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
            <h3 className="text-xl font-bold font-display text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-orange-400" />
              Direct Operations & Engineering
            </h3>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-1.5">
                <div className="text-slate-400 font-mono">Platform Lead & Admin</div>
                <a 
                  href="mailto:solarastra.in@gmail.com" 
                  className="text-sm font-bold text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1.5 font-mono"
                >
                  solarastra.in@gmail.com
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
                <div className="text-[11px] text-slate-500">SuperAdmin inquiries & infrastructure provisioning.</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-1.5">
                <div className="text-slate-400 font-mono">Platform Domain & API Reverse Proxy</div>
                <div className="text-sm font-bold text-cyan-400 flex items-center gap-1.5 font-mono">
                  <Globe className="w-4 h-4" />
                  ai.whyor.in
                </div>
                <div className="text-[11px] text-slate-500">Global SSL reverse proxy & AST routing engine.</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-1.5">
                <div className="text-slate-400 font-mono">Enterprise SLA Guarantee</div>
                <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 font-mono">
                  <Clock className="w-4 h-4" />
                  &lt; 2 Hour Response Window
                </div>
                <div className="text-[11px] text-slate-500">Priority triage for high-volume production routing.</div>
              </div>
            </div>
          </div>

          {/* Security & ZDR Standards */}
          <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-lg space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
              Zero-Data Retention (ZDR)
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              WhyOr implements Zero-Data Retention (ZDR) architectures. Your prompt payloads are processed statelessly or stored in encrypted Firestore collections isolated by tenant ID.
            </p>
          </div>

          {/* Consultation Process */}
          <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-lg space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold">
              <FileCheck2 className="w-4 h-4" />
              What Happens Next?
            </div>
            <div className="space-y-2 text-xs text-slate-300 font-mono">
              <div className="flex items-start gap-2">
                <span className="text-orange-400 font-bold">1.</span>
                <span>Technical discovery call with lead architect.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-orange-400 font-bold">2.</span>
                <span>Custom token volume modeling & rate quote.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-orange-400 font-bold">3.</span>
                <span>Sandbox onboarding with BYOK governance keys.</span>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: CONTACT FORM */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-white/15 rounded-3xl p-6 sm:p-10 backdrop-blur-xl shadow-2xl space-y-6">
          
          <div className="space-y-1">
            <h3 className="text-2xl font-bold font-display text-white">Send Us a Message</h3>
            <p className="text-xs text-slate-400">Fill out the inquiry details below and our team will get back to you promptly.</p>
          </div>

          {/* Success Banner */}
          {submittedSuccess && (
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Thank you! Your inquiry has been logged in Firestore.</span>
              </div>
              <p className="text-xs text-emerald-200/80 leading-relaxed">
                An administrator at <span className="font-mono text-white">solarastra.in@gmail.com</span> will review your inquiry and follow up within 24 hours.
              </p>
              <button
                type="button"
                onClick={() => setSubmittedSuccess(false)}
                className="mt-2 text-xs font-mono text-emerald-400 underline hover:text-emerald-300 cursor-pointer"
              >
                Submit another inquiry
              </button>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!submittedSuccess && (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300 font-semibold">Your Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl bg-slate-950/80 border border-white/15 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300 font-semibold">Work Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. sarah@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl bg-slate-950/80 border border-white/15 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300 font-semibold">Company / Organization</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Technologies"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full rounded-xl bg-slate-950/80 border border-white/15 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300 font-semibold">Phone (Optional)</label>
                  <input
                    type="tel"
                    placeholder="e.g. +1 (555) 019-2834"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl bg-slate-950/80 border border-white/15 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300 font-semibold">Inquiry Topic</label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value as any)}
                  className="w-full rounded-xl bg-slate-950/80 border border-white/15 px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors"
                >
                  <option value="enterprise_quote">Enterprise Plan & High-Volume Quota</option>
                  <option value="custom_onprem">Dedicated VPC / Air-Gapped Deployment</option>
                  <option value="sla_security">SLA & Security / Compliance Audit</option>
                  <option value="byok_integration">Custom AI Engine / BYOK Key Integration</option>
                  <option value="billing_api">Billing, Invoices & API Support</option>
                  <option value="general">General Partnership / Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300 font-semibold">Message & Project Scope *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Tell us about your team size, expected token volume, target models, or custom integration requirements..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-xl bg-slate-950/80 border border-white/15 p-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Submitting Inquiry...' : 'Send Message to WhyOr Team'}</span>
              </button>

            </form>
          )}

        </div>

      </div>

      {/* ENTERPRISE & PROCUREMENT FAQS */}
      <div className="max-w-6xl mx-auto bg-slate-900/60 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-xl space-y-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase">
            <HelpCircle className="w-3.5 h-3.5" />
            Enterprise Procurement FAQ
          </div>
          <h3 className="text-xl font-bold font-display text-white">Common Questions About Commercial Deployments</h3>
        </div>

        <div className="space-y-3 pt-2">
          {ENTERPRISE_FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div 
                key={idx}
                className="rounded-2xl bg-slate-950/70 border border-white/10 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                >
                  <span className="text-xs sm:text-sm font-bold text-white font-display">
                    {faq.q}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-orange-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-slate-300 leading-relaxed border-t border-white/5 pt-3 animate-in fade-in font-sans">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
