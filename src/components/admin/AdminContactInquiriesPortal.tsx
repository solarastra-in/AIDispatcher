import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Building2, 
  Phone, 
  ArrowRight,
  Search,
  Check,
  Send
} from 'lucide-react';
import { 
  ContactInquiry, 
  loadContactInquiriesFromFirestore,
  updateContactInquiryStatusInFirestore,
  recordAuditLogToFirestore,
  auth
} from '../../lib/firebase';

interface AdminContactInquiriesPortalProps {
  onNotifyStatus?: (message: { type: 'success' | 'error' | 'info'; text: string }) => void;
}

export const AdminContactInquiriesPortal: React.FC<AdminContactInquiriesPortalProps> = ({ onNotifyStatus }) => {
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'contacted' | 'in_review' | 'closed'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchInquiries = async () => {
    setIsLoading(true);
    try {
      const data = await loadContactInquiriesFromFirestore();
      setInquiries(data);
    } catch (e) {
      console.warn('Error loading inquiries', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: ContactInquiry['status']) => {
    try {
      await updateContactInquiryStatusInFirestore(id, newStatus);
      setInquiries(prev => prev.map(inq => inq.id === id ? { ...inq, status: newStatus } : inq));
      
      const adminEmail = auth.currentUser?.email || 'Admin Superuser';
      await recordAuditLogToFirestore(
        'Updated Contact Inquiry Status',
        'inquiry_management',
        adminEmail,
        `Marked inquiry ID ${id} as ${newStatus}.`
      );

      if (onNotifyStatus) {
        onNotifyStatus({
          type: 'success',
          text: `Inquiry status updated to ${newStatus}.`
        });
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  const filteredInquiries = inquiries.filter(inq => {
    const matchesStatus = statusFilter === 'all' || inq.status === statusFilter;
    const matchesSearch = 
      inq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inq.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inq.company && inq.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      inq.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-bold font-display text-white">Contact Us & Enterprise Inquiries Inbox</h2>
          </div>
          <p className="text-xs text-slate-400">
            Messages and enterprise consultation requests submitted via the public Contact Us page.
          </p>
        </div>

        <button
          onClick={fetchInquiries}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 border border-white/10 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-orange-400' : ''}`} />
          <span>Refresh Inbox</span>
        </button>
      </div>

      {/* FILTER & SEARCH */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-slate-950/70 border border-white/10 rounded-2xl px-3 py-2 text-xs">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search inquiries by name, email, company or message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full sm:w-80"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono">
          {(['all', 'new', 'in_review', 'contacted', 'closed'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-xl capitalize transition-colors cursor-pointer ${
                statusFilter === tab
                  ? 'bg-orange-500 text-slate-950 font-bold shadow-md'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* INQUIRIES LIST */}
      <div className="space-y-4">
        {filteredInquiries.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 border border-white/10 rounded-3xl space-y-2">
            <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-sm font-bold text-slate-300">No Inquiries Found</div>
            <p className="text-xs text-slate-500">Inquiries submitted via the Contact Us form will appear here in real time.</p>
          </div>
        ) : (
          filteredInquiries.map((inq) => {
            const isNew = inq.status === 'new';
            return (
              <div
                key={inq.id}
                className={`p-6 rounded-3xl border backdrop-blur-xl space-y-4 transition-all ${
                  isNew 
                    ? 'bg-slate-900/90 border-orange-500/40 shadow-lg shadow-orange-500/5' 
                    : 'bg-slate-900/60 border-white/10'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{inq.name}</span>
                      {isNew && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40 uppercase">
                          NEW
                        </span>
                      )}
                      <span className="text-[10px] font-mono uppercase bg-slate-800 text-cyan-300 px-2 py-0.5 rounded-md border border-white/10">
                        {inq.topic.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                      <span>{inq.email}</span>
                      {inq.company && <span>· Company: <strong className="text-slate-300">{inq.company}</strong></span>}
                      {inq.phone && <span>· Phone: <strong className="text-slate-300">{inq.phone}</strong></span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(inq.createdAt).toLocaleString()}
                    </span>
                    <select
                      value={inq.status}
                      onChange={(e) => handleUpdateStatus(inq.id, e.target.value as any)}
                      className="bg-slate-950 border border-white/15 rounded-lg px-2.5 py-1 text-[11px] font-mono text-slate-200 focus:outline-none focus:border-orange-500"
                    >
                      <option value="new">Status: New</option>
                      <option value="in_review">Status: In Review</option>
                      <option value="contacted">Status: Contacted</option>
                      <option value="closed">Status: Closed</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/5 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {inq.message}
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <a
                    href={`mailto:${inq.email}?subject=Re: WhyOr Dispatch AI Enterprise Inquiry (${inq.topic})`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-[11px] transition-colors"
                  >
                    <Send className="w-3 h-3 text-orange-400" />
                    <span>Reply via Email ({inq.email})</span>
                  </a>

                  <span className="text-[10px] font-mono text-slate-500">ID: {inq.id}</span>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
