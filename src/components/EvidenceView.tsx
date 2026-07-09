import React, { useState, useEffect } from 'react';
import { Search, Plus, FileText, ArrowRight, ShieldCheck, ShieldAlert, Calendar, MapPin, User, Package, X, Trash } from 'lucide-react';
import { Evidence, Case, EvidenceType, User as SystemUser, EvidenceCustody } from '../types';

interface EvidenceViewProps {
  evidence: Evidence[];
  cases: Case[];
  evidenceTypes: EvidenceType[];
  users: SystemUser[];
  onAddEvidence: (evData: any) => void;
  onUpdateEvidence: (evidenceId: number, updates: any) => void;
  currentUser: SystemUser;
  onDeleteEvidence?: (evidenceId: number) => void;
  onDataChange?: () => void;
}

export default function EvidenceView({
  evidence,
  cases,
  evidenceTypes,
  users,
  onAddEvidence,
  onUpdateEvidence,
  currentUser,
  onDeleteEvidence,
  onDataChange
}: EvidenceViewProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [caseFilter, setCaseFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [custodyHistory, setCustodyHistory] = useState<EvidenceCustody[]>([]);

  // Add evidence states
  const [addCaseId, setAddCaseId] = useState('');
  const [addTypeId, setAddTypeId] = useState('1');
  const [addDesc, setAddDesc] = useState('');
  const [addLocation, setAddLocation] = useState('Main Vault, Safe Locker 1');
  const [addSealed, setAddSealed] = useState(true);

  // Transfer Custody states
  const [transferToUserId, setTransferToUserId] = useState('');
  const [transferPurpose, setTransferPurpose] = useState('');
  const [transferLocation, setTransferLocation] = useState('');
  const [transferRemarks, setTransferRemarks] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);

  // Edit evidence states
  const [isEditing, setIsEditing] = useState(false);
  const [editDesc, setEditDesc] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editStatus, setEditStatus] = useState('');

  const loadCustodyHistory = async (evidenceId: number) => {
    try {
      const res = await fetch(`/api/evidence-custody?evidence_id=${evidenceId}`);
      if (res.ok) {
        setCustodyHistory(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (selectedEvidence) {
      loadCustodyHistory(selectedEvidence.evidence_id);
      setEditDesc(selectedEvidence.description);
      setEditLocation(selectedEvidence.storage_location);
      setEditStatus(selectedEvidence.current_status);
      setIsEditing(false);
    }
  }, [selectedEvidence, evidence]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addCaseId || !addDesc) return;

    onAddEvidence({
      case_id: Number(addCaseId),
      type_id: Number(addTypeId),
      description: addDesc,
      collected_by: currentUser.user_id,
      collected_date: new Date().toISOString(),
      storage_location: addLocation,
      current_status: 'Collected',
      is_sealed: addSealed
    });

    setAddDesc('');
    setAddLocation('Main Vault, Safe Locker 1');
    setAddSealed(true);
    setShowAddModal(false);
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvidence || !transferToUserId || !transferLocation) return;

    setTransferLoading(true);
    try {
      const response = await fetch('/api/evidence-custody', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evidence_id: selectedEvidence.evidence_id,
          from_user: currentUser.user_id,
          to_user: Number(transferToUserId),
          purpose: transferPurpose,
          location: transferLocation,
          remarks: transferRemarks
        })
      });

      if (response.ok) {
        setTransferToUserId('');
        setTransferPurpose('');
        setTransferLocation('');
        setTransferRemarks('');
        
        const updatedItemRes = await fetch(`/api/evidence/${selectedEvidence.evidence_id}`);
        if (updatedItemRes.ok) {
          setSelectedEvidence(await updatedItemRes.json());
        }
        if (onDataChange) onDataChange();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTransferLoading(false);
    }
  };

  const handleSealToggle = async (evItem: Evidence) => {
    try {
      const updatedSeal = !evItem.is_sealed;
      const res = await fetch(`/api/evidence/${evItem.evidence_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_sealed: updatedSeal,
          operator_id: currentUser.user_id
        })
      });
      if (res.ok) {
        const up = await res.json();
        onUpdateEvidence(evItem.evidence_id, up);
        if (selectedEvidence?.evidence_id === evItem.evidence_id) {
          setSelectedEvidence(up);
        }
        if (onDataChange) onDataChange();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvidence) return;

    try {
      const response = await fetch(`/api/evidence/${selectedEvidence.evidence_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: editDesc,
          storage_location: editLocation,
          current_status: editStatus,
          operator_id: currentUser.user_id
        })
      });

      if (response.ok) {
        const updated = await response.json();
        onUpdateEvidence(selectedEvidence.evidence_id, updated);
        setSelectedEvidence(updated);
        setIsEditing(false);
        if (onDataChange) onDataChange();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredEvidence = evidence.filter(ev => {
    const matchesSearch = ev.barcode.toLowerCase().includes(search.toLowerCase()) ||
                          ev.description.toLowerCase().includes(search.toLowerCase()) ||
                          ev.storage_location.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter ? ev.type_id === Number(typeFilter) : true;
    const matchesCase = caseFilter ? ev.case_id === Number(caseFilter) : true;
    return matchesSearch && matchesType && matchesCase;
  });

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Evidence Vault Locker</h1>
          <p className="text-slate-500 text-xs mt-1 font-medium uppercase tracking-wider">Secured Chains & Barcode Inventories</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs transition-all shadow-md flex items-center gap-2 active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Collect Log Evidence</span>
        </button>
      </div>

      {/* Query Ribbon */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="w-4 h-4 text-indigo-500" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search barcodes, descriptions, storage locations..."
            className="w-full pl-9 pr-4 py-2 bg-slate-100 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-2xl text-slate-800 placeholder-slate-400 text-xs font-semibold focus:outline-none transition-all shadow-inner"
          />
        </div>

        <div className="w-full md:w-48">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded-2xl text-slate-700 text-xs bg-slate-100 focus:outline-none focus:bg-white"
          >
            <option value="">All Types</option>
            {evidenceTypes.map(t => (
              <option key={t.type_id} value={t.type_id}>{t.type_name}</option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-48">
          <select
            value={caseFilter}
            onChange={(e) => setCaseFilter(e.target.value)}
            className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded-2xl text-slate-700 text-xs bg-slate-100 focus:outline-none focus:bg-white"
          >
            <option value="">All Cases</option>
            {cases.map(c => (
              <option key={c.case_id} value={c.case_id}>{c.case_number}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left lists */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-100 flex justify-between items-center text-xs font-bold text-slate-900 uppercase">
            <span>Barcode Registry Catalog</span>
            <span className="text-slate-500">{filteredEvidence.length} items logged</span>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredEvidence.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs font-semibold">
                No matching evidence records logged in vault.
              </div>
            ) : (
              filteredEvidence.map((ev) => {
                const caseNum = cases.find(c => c.case_id === ev.case_id)?.case_number || 'CASE-N/A';
                const isSelected = selectedEvidence?.evidence_id === ev.evidence_id;

                return (
                  <div
                    key={ev.evidence_id}
                    onClick={() => setSelectedEvidence(ev)}
                    className={`p-4 hover:bg-slate-50 cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all ${
                      isSelected ? 'bg-indigo-50/20 hover:bg-indigo-50/30' : ''
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg font-bold tracking-wider">{ev.barcode}</span>
                        <span className="font-mono text-[9px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg font-bold">{caseNum}</span>
                      </div>
                      <p className="text-xs font-extrabold text-slate-800">{ev.description}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-0.5 rounded-md text-[8px] font-black uppercase ${
                        ev.is_sealed ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'
                      }`}>
                        {ev.is_sealed ? 'SEALED' : 'UNSEALED'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 font-mono uppercase">{ev.current_status}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Details Panel */}
        <div className="space-y-6">
          {selectedEvidence ? (
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm space-y-5">
              
              <div>
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-900 text-sm">Asset Specifications</h3>
                  <button
                    onClick={() => {
                      if (isEditing) {
                        setEditDesc(selectedEvidence.description);
                        setEditLocation(selectedEvidence.storage_location);
                        setEditStatus(selectedEvidence.current_status);
                        setIsEditing(false);
                      } else {
                        setIsEditing(true);
                      }
                    }}
                    className="text-[10px] text-indigo-600 hover:text-indigo-700 font-bold uppercase cursor-pointer"
                  >
                    {isEditing ? 'Cancel' : 'Edit'}
                  </button>
                </div>
                <p className="text-slate-400 text-[9px] font-medium uppercase mt-0.5">Chain tracking and sealed locker controls</p>
              </div>

              {isEditing ? (
                <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Description *</label>
                    <textarea
                      required
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Storage Location *</label>
                    <input
                      type="text"
                      required
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Current Custody Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none bg-white font-semibold"
                    >
                      <option value="Collected">Collected</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Under Analysis">Under Analysis</option>
                      <option value="In Storage">In Storage</option>
                      <option value="Presented in Court">Presented in Court</option>
                      <option value="Returned to Owner">Returned to Owner</option>
                      <option value="Destroyed">Destroyed</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all cursor-pointer text-center text-xs shadow-md active:scale-[0.98]"
                  >
                    Save Changes
                  </button>
                </form>
              ) : (
                <div className="space-y-3.5 text-xs">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-400 font-bold uppercase text-[9px]">Locker Code:</span>
                    <span className="font-bold text-slate-800">{selectedEvidence.barcode}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2 items-center">
                    <span className="text-slate-400 font-bold uppercase text-[9px]">Integrity Check:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleSealToggle(selectedEvidence)}
                        className={`px-2 py-0.5 rounded-lg font-bold text-[9px] cursor-pointer ${
                          selectedEvidence.is_sealed ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-orange-50 text-orange-700 border border-orange-200'
                        }`}
                      >
                        {selectedEvidence.is_sealed ? 'Toggle Seal (SEALED)' : 'Toggle Seal (UNSEALED)'}
                      </button>
                      {onDeleteEvidence && (
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to permanently delete this evidence log?')) {
                              onDeleteEvidence(selectedEvidence.evidence_id);
                              setSelectedEvidence(null);
                            }
                          }}
                          className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-all cursor-pointer"
                          title="Delete Evidence log"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-400 font-bold uppercase text-[9px]">Status:</span>
                    <span className="font-bold text-slate-700 uppercase">{selectedEvidence.current_status}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-400 font-bold uppercase text-[9px]">Storage Location:</span>
                    <span className="font-bold text-slate-700">{selectedEvidence.storage_location}</span>
                  </div>
                </div>
              )}

              {/* Transfer Form */}
              <form onSubmit={handleTransferSubmit} className="pt-4 border-t border-slate-100 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Transfer Custody Handover</span>
                
                <select
                  required
                  value={transferToUserId}
                  onChange={(e) => setTransferToUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-700 text-xs bg-white focus:outline-none"
                >
                  <option value="">Recipient Officer...</option>
                  {users.map(u => (
                    <option key={u.user_id} value={u.user_id}>{u.first_name} {u.last_name}</option>
                  ))}
                </select>

                <input
                  type="text"
                  required
                  placeholder="Storage / Handover Location"
                  value={transferLocation}
                  onChange={(e) => setTransferLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none placeholder-slate-400"
                />

                <input
                  type="text"
                  placeholder="Transfer Purpose (e.g. DNA Extraction)"
                  value={transferPurpose}
                  onChange={(e) => setTransferPurpose(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none placeholder-slate-400"
                />

                <button
                  type="submit"
                  disabled={transferLoading}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-[0.98]"
                >
                  {transferLoading ? 'Processing Handover...' : 'Confirm Handover Transfer'}
                </button>
              </form>

            </div>
          ) : (
            <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm text-center text-slate-400 text-xs font-semibold">
              Select an evidence item to review specifications and record chain of custody handovers.
            </div>
          )}
        </div>

      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900">Record Collected Evidence</h3>
                <p className="text-[10px] text-slate-500 font-medium uppercase mt-0.5">Log collected asset parameters into database</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Case Folder *</label>
                <select
                  required
                  value={addCaseId}
                  onChange={(e) => setAddCaseId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold focus:outline-none"
                >
                  <option value="">Select Case...</option>
                  {cases.map(c => (
                    <option key={c.case_id} value={c.case_id}>{c.case_number} - {c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Forensic Material Type</label>
                <select
                  value={addTypeId}
                  onChange={(e) => setAddTypeId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold focus:outline-none"
                >
                  {evidenceTypes.map(t => (
                    <option key={t.type_id} value={t.type_id}>{t.type_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Asset Description *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Swab from door handle containing blood drops..."
                  value={addDesc}
                  onChange={(e) => setAddDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Initial Storage Vault</label>
                <input
                  type="text"
                  placeholder="e.g. Main Vault, Safe Locker 1"
                  value={addLocation}
                  onChange={(e) => setAddLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="addSealed"
                  checked={addSealed}
                  onChange={(e) => setAddSealed(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600"
                />
                <label htmlFor="addSealed" className="text-xs font-bold text-slate-600">Integrity Container Sealed</label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 text-xs font-bold cursor-pointer hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-[0.98] cursor-pointer"
                >
                  Confirm Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
