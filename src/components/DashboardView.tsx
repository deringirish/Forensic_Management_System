import { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Briefcase, FileSearch, ShieldAlert, Plus, ArrowRight, Search, Shield, Bell, CheckCircle } from 'lucide-react';
import { Case, Evidence, AuditLog, CrimeScene, EvidenceType } from '../types';

interface DashboardViewProps {
  cases: Case[];
  evidence: Evidence[];
  auditLogs: AuditLog[];
  crimeScenes: CrimeScene[];
  evidenceTypes: EvidenceType[];
  users: any[];
  persons: any[];
  suspects: any[];
  victims: any[];
  witnesses: any[];
  onNavigateToTab: (tab: any) => void;
  onCreateCaseClick: () => void;
  onSelectCase?: (caseId: number) => void;
}

export default function DashboardView({
  cases,
  evidence,
  auditLogs,
  crimeScenes,
  onNavigateToTab,
  onCreateCaseClick,
  onSelectCase
}: DashboardViewProps) {
  const [globalQuery, setGlobalQuery] = useState('');

  // Search Filter Logic
  const hasQuery = globalQuery.trim().length >= 2;
  const lowerQuery = globalQuery.toLowerCase();

  const matchingCases = hasQuery
    ? cases.filter(
        c =>
          c.case_number.toLowerCase().includes(lowerQuery) ||
          c.title.toLowerCase().includes(lowerQuery) ||
          c.description.toLowerCase().includes(lowerQuery) ||
          c.crime_type.toLowerCase().includes(lowerQuery)
      )
    : [];

  const matchingEvidence = hasQuery
    ? evidence.filter(
        ev =>
          ev.barcode.toLowerCase().includes(lowerQuery) ||
          ev.description.toLowerCase().includes(lowerQuery) ||
          ev.storage_location.toLowerCase().includes(lowerQuery)
      )
    : [];

  const totalCases = cases.length;
  const activeCases = cases.filter(c => c.status === 'Open' || c.status === 'Under Investigation').length;
  const totalEvidence = evidence.length;
  const sealedEvidence = evidence.filter(ev => !!ev.is_sealed).length;

  // Chart Data: Cases by Status
  const statusCounts = cases.reduce((acc: any, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.keys(statusCounts).map(status => ({
    name: status,
    value: statusCounts[status]
  }));

  const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-8 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Forensic Operations Control</h1>
          <p className="text-slate-500 text-xs mt-1 font-medium uppercase tracking-wider">Telemetry & Secured Database Loggers</p>
        </div>
        <button
          onClick={onCreateCaseClick}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Open New Case File</span>
        </button>
      </div>

      {/* Global Advanced Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm relative overflow-hidden">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
            <Search className="w-4 h-4 text-indigo-500" />
          </span>
          <input
            type="text"
            value={globalQuery}
            onChange={(e) => setGlobalQuery(e.target.value)}
            placeholder="Search dossiers, evidence codes, barcodes, or classifications..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-2xl text-slate-800 placeholder-slate-400 text-xs font-semibold focus:outline-none transition-all shadow-inner"
          />
        </div>

        {/* Unified Search Results overlay */}
        {hasQuery && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Universal Search Results</span>
              <button onClick={() => setGlobalQuery('')} className="text-indigo-600 hover:text-indigo-700 capitalize font-bold cursor-pointer">Clear</button>
            </div>

            {matchingCases.length === 0 && matchingEvidence.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs font-medium">
                No matching records found for "{globalQuery}"
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matchingCases.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Cases ({matchingCases.length})</span>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {matchingCases.map(c => (
                        <div
                          key={c.case_id}
                          onClick={() => {
                            if (onSelectCase) onSelectCase(c.case_id);
                            onNavigateToTab('cases');
                            setGlobalQuery('');
                          }}
                          className="p-3 bg-white hover:bg-indigo-50/20 border border-slate-200 hover:border-indigo-200 rounded-xl cursor-pointer transition-all text-xs"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-800 truncate pr-2">{c.title}</span>
                            <span className="font-mono text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg uppercase tracking-wider shrink-0 font-bold">{c.case_number}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {matchingEvidence.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Evidence Items ({matchingEvidence.length})</span>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {matchingEvidence.map(ev => (
                        <div
                          key={ev.evidence_id}
                          onClick={() => {
                            onNavigateToTab('evidence');
                            setGlobalQuery('');
                          }}
                          className="p-3 bg-white hover:bg-blue-50/20 border border-slate-200 hover:border-blue-200 rounded-xl cursor-pointer transition-all text-xs"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-800 truncate pr-2">{ev.description}</span>
                            <span className="font-mono text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg tracking-wider shrink-0 font-bold">{ev.barcode}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* KPI Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-5 rounded-3xl text-white shadow-lg shadow-indigo-500/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-100 block">Total Dossiers</span>
            <span className="text-3xl font-black mt-1 block">{totalCases}</span>
          </div>
          <div className="p-3.5 bg-white/10 rounded-2xl text-white">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Active Inquiries</span>
            <span className="text-3xl font-black text-slate-900 mt-1 block">{activeCases}</span>
          </div>
          <div className="p-3.5 bg-blue-50 rounded-2xl text-blue-500">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Logged Evidence</span>
            <span className="text-3xl font-black text-slate-900 mt-1 block">{totalEvidence}</span>
          </div>
          <div className="p-3.5 bg-emerald-50 rounded-2xl text-emerald-500">
            <FileSearch className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Integrity Sealed</span>
            <span className="text-3xl font-black text-slate-900 mt-1 block">{sealedEvidence}</span>
          </div>
          <div className="p-3.5 bg-orange-50 rounded-2xl text-orange-500">
            <Shield className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Charts & Audits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cases Chart (Left 2 columns) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Case Status Analysis</h3>
            <p className="text-slate-400 text-[10px] font-medium uppercase mt-0.5">Real-time status metrics visualization</p>
          </div>
          <div className="h-64 w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">No case data available.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', fontSize: '11px', border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={45}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* System Activity Feed (Right 1 column) */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Audit Activity Log</h3>
              <p className="text-slate-400 text-[10px] font-medium uppercase mt-0.5">Immutable audit log entries</p>
            </div>

            <div className="space-y-3.5">
              {auditLogs.slice(0, 4).map((log) => (
                <div key={log.log_id} className="flex gap-3 text-xs leading-normal">
                  <div className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-400 shrink-0 self-start">
                    <ShieldAlert className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block">{log.action.replace(/_/g, ' ')}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block truncate max-w-[180px]">{log.table_name} record ID: {log.record_id}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigateToTab('cases')}
            className="w-full mt-6 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-2xl text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Review Active Dossiers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

    </div>
  );
}
