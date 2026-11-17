import React, { useState } from 'react';
import { 
  Mail, Phone, Calendar, Clock, CheckCircle2, AlertCircle, 
  RotateCw, Search, Trash2, Eye, Filter, Copy, Check, 
  ExternalLink, User, Home, MapPin, MessageSquare, AlertTriangle, X
} from 'lucide-react';
import { usePropertyData } from '../../context/PropertyDataContext';
import { Enquiry, EmailDeliveryStatus } from '../../types';

export const EnquiriesTab: React.FC = () => {
  const { propertyInfo, enquiries, retryEnquiryEmail, updateEnquiryStatus, deleteEnquiry } = usePropertyData();
  const targetEmail = propertyInfo?.email && propertyInfo.email !== 'aibrandorigin@gmail.com' ? propertyInfo.email : 'ellisonsolon@gmail.com';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterEmailStatus, setFilterEmailStatus] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRetryEmail = async (enquiry: Enquiry) => {
    setRetryingId(enquiry.id);
    try {
      const res = await retryEnquiryEmail(enquiry.id);
      if (res.success && res.emailStatus === 'sent') {
        const dest = enquiry.emailRecipient && enquiry.emailRecipient !== 'aibrandorigin@gmail.com' ? enquiry.emailRecipient : targetEmail;
        showNotice(`Notification for ${enquiry.id} sent successfully to ${dest}!`);
      } else {
        showNotice(`Retry notification failed: ${res.emailError || 'Server connection error'}`);
      }
      // If modal is open, refresh selected enquiry
      if (selectedEnquiry && selectedEnquiry.id === enquiry.id) {
        const updated = enquiries.find((e) => e.id === enquiry.id);
        if (updated) setSelectedEnquiry(updated);
      }
    } catch (err: unknown) {
      showNotice(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setRetryingId(null);
    }
  };

  const handleDelete = async (enquiry: Enquiry) => {
    if (window.confirm(`Delete enquiry ${enquiry.id} from ${enquiry.customerName}?`)) {
      await deleteEnquiry(enquiry.id);
      if (selectedEnquiry?.id === enquiry.id) {
        setSelectedEnquiry(null);
      }
      showNotice(`Enquiry ${enquiry.id} removed.`);
    }
  };

  // Filtered list
  const filteredEnquiries = enquiries.filter((item) => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch = !q || 
      item.id.toLowerCase().includes(q) ||
      item.customerName.toLowerCase().includes(q) ||
      item.phone.toLowerCase().includes(q) ||
      (item.email && item.email.toLowerCase().includes(q)) ||
      (item.message && item.message.toLowerCase().includes(q));

    const matchesType = filterType === 'all' || item.enquiryType === filterType;
    const matchesEmailStatus = filterEmailStatus === 'all' || item.emailStatus === filterEmailStatus;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;

    return matchesSearch && matchesType && matchesEmailStatus && matchesStatus;
  });

  const sentCount = enquiries.filter((e) => e.emailStatus === 'sent').length;
  const failedCount = enquiries.filter((e) => e.emailStatus === 'failed').length;
  const pendingCount = enquiries.filter((e) => e.emailStatus === 'pending').length;

  return (
    <div className="p-4 sm:p-6 space-y-5 text-stone-800">
      
      {/* Notice Banner */}
      {actionNotice && (
        <div className="p-3 bg-slate-800 text-[#FAF0D7] rounded-xl text-xs font-medium flex items-center justify-between border border-slate-700 animate-in fade-in duration-200">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-stone-200 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Total Enquiries</div>
          <div className="text-2xl font-bold text-[#233242] mt-0.5">{enquiries.length}</div>
          <div className="text-[10px] text-stone-400 mt-0.5">Stored in database</div>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Emails Sent</span>
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-0.5">{sentCount}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Delivered to {targetEmail}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Emails Failed</span>
          </div>
          <div className="text-2xl font-bold text-rose-700 mt-0.5">{failedCount}</div>
          <div className="text-[10px] text-rose-600 mt-0.5">Retryable anytime</div>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Pending Delivery</span>
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-0.5">{pendingCount}</div>
          <div className="text-[10px] text-amber-600 mt-0.5">Awaiting provider</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, phone, email, or Enquiry ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#233242]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-medium focus:outline-none"
          >
            <option value="all">All Enquiry Types</option>
            <option value="Tour Request">Tour Requests</option>
            <option value="Quick Message">Quick Messages</option>
            <option value="General Enquiry">General Enquiries</option>
          </select>

          {/* Email Status Filter */}
          <select
            value={filterEmailStatus}
            onChange={(e) => setFilterEmailStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-medium focus:outline-none"
          >
            <option value="all">All Email Statuses</option>
            <option value="sent">Email Sent</option>
            <option value="failed">Email Failed</option>
            <option value="pending">Email Pending</option>
          </select>

          {/* Review Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-medium focus:outline-none"
          >
            <option value="all">All Review Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="scheduled">Scheduled</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Enquiries List / Table */}
      {filteredEnquiries.length === 0 ? (
        <div className="py-12 text-center bg-stone-50 rounded-xl border border-dashed border-stone-300">
          <Mail className="w-8 h-8 text-stone-400 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-stone-700">No enquiries matching filter criteria</h4>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            {enquiries.length === 0
              ? 'Enquiries submitted through the website (tour schedules or quick messages) will appear here in real time.'
              : 'Try clearing your search query or adjusting the filters above.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-100 text-stone-600 uppercase tracking-wider text-[11px] border-b border-stone-200">
                  <th className="py-2.5 px-3 font-bold">Enquiry ID</th>
                  <th className="py-2.5 px-3 font-bold">Date & Time</th>
                  <th className="py-2.5 px-3 font-bold">Customer Details</th>
                  <th className="py-2.5 px-3 font-bold">Type & Service</th>
                  <th className="py-2.5 px-3 font-bold">Email Status</th>
                  <th className="py-2.5 px-3 font-bold">Review Status</th>
                  <th className="py-2.5 px-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredEnquiries.map((item) => {
                  const isRetrying = retryingId === item.id;
                  const dateStr = item.createdAt 
                    ? new Date(item.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })
                    : 'Unknown';

                  return (
                    <tr key={item.id} className="hover:bg-stone-50/80 transition-colors">
                      {/* ID */}
                      <td className="py-3 px-3 font-mono font-bold text-stone-800 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{item.id}</span>
                          <button
                            onClick={() => handleCopy(item.id, item.id)}
                            className="text-stone-400 hover:text-stone-700 cursor-pointer p-0.5"
                            title="Copy Enquiry ID"
                          >
                            {copiedId === item.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 text-stone-600 whitespace-nowrap">
                        {dateStr}
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-stone-900">{item.customerName}</div>
                        <div className="text-[11px] text-stone-600 flex items-center gap-2 mt-0.5">
                          <a href={`tel:${item.phone}`} className="hover:underline flex items-center gap-1">
                            <Phone className="w-3 h-3 text-stone-400" />
                            <span>{item.phone}</span>
                          </a>
                          {item.email && (
                            <a href={`mailto:${item.email}`} className="text-[#233242] hover:underline flex items-center gap-1">
                              <Mail className="w-3 h-3 text-stone-400" />
                              <span>{item.email}</span>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Type & Service */}
                      <td className="py-3 px-3">
                        <span className="font-medium text-stone-800">{item.enquiryType}</span>
                        {item.service && (
                          <div className="text-[11px] text-stone-500 truncate max-w-[180px]">
                            {item.service}
                          </div>
                        )}
                        {item.preferredDate && (
                          <div className="text-[10px] text-stone-500 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 text-stone-400" />
                            <span>{item.preferredDate} {item.preferredTime ? `@ ${item.preferredTime}` : ''}</span>
                          </div>
                        )}
                      </td>

                      {/* Email Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {item.emailStatus === 'sent' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200" title={`Delivered to ${item.emailRecipient}`}>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Sent</span>
                          </span>
                        )}
                        {item.emailStatus === 'failed' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200" title={item.emailError || 'Failed to dispatch email'}>
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Failed</span>
                          </span>
                        )}
                        {item.emailStatus === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200" title="Email delivery queued">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Pending</span>
                          </span>
                        )}
                        {item.emailAttempts > 1 && (
                          <span className="text-[10px] text-stone-400 ml-1">({item.emailAttempts} tries)</span>
                        )}
                      </td>

                      {/* Review Status Dropdown */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <select
                          value={item.status}
                          onChange={(e) => updateEnquiryStatus(item.id, e.target.value as any)}
                          className="text-[11px] font-semibold px-2 py-1 rounded border border-stone-200 bg-stone-50 focus:outline-none"
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="scheduled">Scheduled</option>
                          <option value="closed">Closed</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedEnquiry(item)}
                            className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                            title="View Full Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleRetryEmail(item)}
                            disabled={isRetrying}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              item.emailStatus === 'failed'
                                ? 'text-rose-600 hover:bg-rose-50'
                                : 'text-stone-600 hover:bg-stone-100'
                            }`}
                            title={`Retry Email Notification to ${item.emailRecipient && item.emailRecipient !== 'aibrandorigin@gmail.com' ? item.emailRecipient : targetEmail}`}
                          >
                            <RotateCw className={`w-4 h-4 ${isRetrying ? 'animate-spin text-sky-600' : ''}`} />
                          </button>

                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Enquiry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedEnquiry && (
        <div 
          className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedEnquiry(null);
          }}
        >
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
            {/* Modal Header */}
            <div className="bg-[#233242] text-white p-5 flex items-center justify-between">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#FAF0D7]/20 text-[#FAF0D7] border border-[#c5a880]/40 uppercase mb-1">
                  Enquiry ID: {selectedEnquiry.id}
                </span>
                <h3 className="text-base font-bold text-white">{selectedEnquiry.enquiryType} Details</h3>
              </div>
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              
              {/* Notification Status Alert */}
              <div className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 ${
                selectedEnquiry.emailStatus === 'sent'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : selectedEnquiry.emailStatus === 'failed'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    {selectedEnquiry.emailStatus === 'sent' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : selectedEnquiry.emailStatus === 'failed' ? (
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-600" />
                    )}
                    <span>
                      Email Notification: {selectedEnquiry.emailStatus.toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px]">
                    Recipient: <strong>{selectedEnquiry.emailRecipient && selectedEnquiry.emailRecipient !== 'aibrandorigin@gmail.com' ? selectedEnquiry.emailRecipient : targetEmail}</strong>
                    {selectedEnquiry.emailSentAt && (
                      <span className="block mt-0.5 text-stone-500">
                        Accepted at: {new Date(selectedEnquiry.emailSentAt).toLocaleString()}
                      </span>
                    )}
                    {selectedEnquiry.emailError && (
                      <span className="block mt-1 font-mono text-[10px] text-rose-700 bg-rose-100/70 p-1 rounded">
                        Error: {selectedEnquiry.emailError}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleRetryEmail(selectedEnquiry)}
                  disabled={retryingId === selectedEnquiry.id}
                  className="px-3 py-1.5 rounded-lg bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 font-bold text-[11px] shadow-2xs flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${retryingId === selectedEnquiry.id ? 'animate-spin text-sky-600' : ''}`} />
                  <span>{retryingId === selectedEnquiry.id ? 'Sending...' : 'Retry Email'}</span>
                </button>
              </div>

              {/* Customer Details */}
              <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-2">
                <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Customer Details</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-stone-800">
                  <div><strong>Name:</strong> {selectedEnquiry.customerName}</div>
                  <div>
                    <strong>Phone:</strong>{' '}
                    <a href={`tel:${selectedEnquiry.phone}`} className="text-[#233242] underline">
                      {selectedEnquiry.phone}
                    </a>
                  </div>
                  {selectedEnquiry.email && (
                    <div>
                      <strong>Email:</strong>{' '}
                      <a href={`mailto:${selectedEnquiry.email}`} className="text-[#233242] underline">
                        {selectedEnquiry.email}
                      </a>
                    </div>
                  )}
                  <div>
                    <strong>Submitted:</strong>{' '}
                    {new Date(selectedEnquiry.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Enquiry / Tour Specific Details */}
              <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-2">
                <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Booking & Service Details</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-stone-800">
                  <div><strong>Type:</strong> {selectedEnquiry.enquiryType}</div>
                  {selectedEnquiry.service && <div><strong>Service:</strong> {selectedEnquiry.service}</div>}
                  {selectedEnquiry.preferredDate && <div><strong>Preferred Date:</strong> {selectedEnquiry.preferredDate}</div>}
                  {selectedEnquiry.preferredTime && <div><strong>Preferred Time:</strong> {selectedEnquiry.preferredTime}</div>}
                  {selectedEnquiry.floorPlanInterest && <div><strong>Floor Plan:</strong> {selectedEnquiry.floorPlanInterest}</div>}
                  {selectedEnquiry.location && <div><strong>Location:</strong> {selectedEnquiry.location}</div>}
                </div>
              </div>

              {/* Message / Notes */}
              {selectedEnquiry.message && (
                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-1.5">
                  <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Customer Message</div>
                  <p className="text-stone-800 whitespace-pre-wrap bg-white p-2.5 rounded-lg border border-stone-200">
                    {selectedEnquiry.message}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-stone-100 border-t border-stone-200 flex justify-end gap-2">
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
