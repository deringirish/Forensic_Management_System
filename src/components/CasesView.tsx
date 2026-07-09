import React, { useState } from 'react';
import { Search, Plus, Calendar, AlertTriangle, ShieldCheck, MapPin, X } from 'lucide-react';
import { Case, User as SystemUser, CrimeScene } from '../types';

interface CasesViewProps {
  cases: Case[];
  users: SystemUser[];
  crimeScenes: CrimeScene[];
  onCreateCase: (caseData: any, sceneData: any) => void;
  onSelectCase: (caseId: number) => void;
  currentUser: SystemUser;
}

export default function CasesView({
  cases,
  users,
  crimeScenes,
  onCreateCase,
  onSelectCase,
  currentUser
}: CasesViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Case States
  const [newCaseTitle, setNewCaseTitle] = useState('');
  const [newCaseDesc, setNewCaseDesc] = useState('');
  const [newCrimeType, setNewCrimeType] = useState('Homicide');
  const [newPriority, setNewPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [newLeadInvestigator, setNewLeadInvestigator] = useState(currentUser.user_id);

  // New Crime Scene States
  const [sceneAddress, setSceneAddress] = useState('');
  const [sceneCity, setSceneCity] = useState('Metro City');
  const [sceneDistrict, setSceneDistrict] = useState('');
  const [sceneDesc, setSceneDesc] = useState('');

  const investigators = users.filter(u => u.role_id === 2 || u.role_id === 3 || u.role_id === 1);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseTitle || !newCrimeType || !sceneAddress) return;

    const caseData = {
      title: newCaseTitle,
      description: newCaseDesc,
      crime_type: newCrimeType,
      priority: newPriority,
      status: 'Open',
      opened_date: new Date().toISOString(),
      closed_date: null,
      lead_investigator: Number(newLeadInvestigator),
    };

    const sceneData = {
      address: sceneAddress,
      city: sceneCity,
      district: sceneDistrict,
      state: 'New State',
      country: 'USA',
      latitude: parseFloat((40.7 + Math.random() * 0.1).toFixed(4)),
      longitude: parseFloat((-74.0 - Math.random() * 0.1).toFixed(4)),
      description: sceneDesc || 'Primary scene of interest for investigation.'
    };

    onCreateCase(caseData, sceneData);

    // Reset Form
    setNewCaseTitle('');
    setNewCaseDesc('');
    setNewCrimeType('Homicide');
    setNewPriority('Medium');
    setSceneAddress('');
    setSceneDistrict('');
    setSceneDesc('');
    setShowAddModal(false);
  };

  const filteredCases = cases.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
                          c.case_number.toLowerCase().includes(search.toLowerCase()) ||
                          c.crime_type.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? c.status === statusFilter : true;
    const matchesPriority = priorityFilter ? c.priority === priorityFilter : true;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'Critical': return 'bg-red-500 text-white';
      case 'High': return 'bg-orange-500 text-white';
      case 'Medium': return 'bg-yellow-500 text-slate-900';
      default: return 'bg-blue-500 text-white';
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'Closed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Under Investigation': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Cold Case': return 'bg-slate-100 text-slate-700 border-slate-300';
      default: return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Active Case Portfolios</h1>
          <p className="text-slate-500 text-xs mt-1 font-medium uppercase tracking-wider">Secured Investigative Files & Catalogs</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs transition-all shadow-md flex items-center gap-2 active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Case File</span>
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
            placeholder="Search cases by barcode number, title, type..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-2xl text-slate-800 placeholder-slate-400 text-xs font-semibold focus:outline-none transition-all shadow-inner"
          />
        </div>

        <div className="w-full md:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded-2xl text-slate-700 text-xs bg-slate-50 focus:outline-none focus:bg-white"
          >
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Under Investigation">Under Investigation</option>
            <option value="Closed">Closed</option>
            <option value="Cold Case">Cold Case</option>
          </select>
        </div>

        <div className="w-full md:w-48">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded-2xl text-slate-700 text-xs bg-slate-50 focus:outline-none focus:bg-white"
          >
            <option value="">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Case Dossiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCases.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 text-xs font-semibold bg-white border border-slate-200 rounded-3xl">
            No matching case dossiers found.
          </div>
        ) : (
          filteredCases.map((c) => {
            const investigator = users.find(u => u.user_id === c.lead_investigator);
            const invName = investigator ? `${investigator.first_name} ${investigator.last_name}` : 'Unassigned';
            const scene = crimeScenes.find(s => s.scene_id === c.crime_scene_id);
            const dateStr = new Date(c.opened_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

            return (
              <div
                key={c.case_id}
                onClick={() => onSelectCase(c.case_id)}
                className="bg-white border border-slate-200 hover:border-indigo-300 rounded-3xl p-5 shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-[9px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg font-bold uppercase tracking-wider">
                      {c.case_number}
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border ${getStatusColor(c.status)}`}>
                      {c.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm group-hover:text-indigo-650 transition-all truncate">
                      {c.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">{c.crime_type}</p>
                  </div>

                  <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2 text-[10px] font-semibold text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Opened: {dateStr}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate max-w-[130px]">{scene ? scene.city : 'General HQ'}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-extrabold uppercase ${getPriorityColor(c.priority)}`}>
                      {c.priority}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modern Case Creation overlay modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-55/30">
              <div>
                <h3 className="text-sm font-black text-slate-900">Authorize New Inquiry File</h3>
                <p className="text-[10px] text-slate-500 font-medium uppercase mt-0.5">Enter dossier metadata and processing zone coordinates</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-650 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
              
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-indigo-650 uppercase tracking-widest block border-b border-slate-100 pb-1">I. Dossier Metadata</span>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Inquiry Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Infiltration of Main Terminal Vault"
                      value={newCaseTitle}
                      onChange={(e) => setNewCaseTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 text-xs font-semibold focus:outline-none focus:bg-white focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Crime Category *</label>
                    <select
                      value={newCrimeType}
                      onChange={(e) => setNewCrimeType(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-xs font-semibold focus:outline-none focus:bg-white"
                    >
                      <option value="Homicide">Homicide</option>
                      <option value="Cyber Crime">Cyber Crime</option>
                      <option value="Grand Larceny">Grand Larceny</option>
                      <option value="Narcotics">Narcotics</option>
                      <option value="Fraud">Fraud</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Threat Priority *</label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-xs font-semibold focus:outline-none focus:bg-white"
                    >
                      <option value="Low">Low Priority</option>
                      <option value="Medium">Medium Threat</option>
                      <option value="High">High Infiltration</option>
                      <option value="Critical">Critical Impact</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Case Description</label>
                    <textarea
                      rows={3}
                      placeholder="Enter detailed facts..."
                      value={newCaseDesc}
                      onChange={(e) => setNewCaseDesc(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 text-xs font-semibold focus:outline-none focus:bg-white focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <span className="text-[10px] font-bold text-indigo-650 uppercase tracking-widest block border-b border-slate-100 pb-1">II. Crime Scene Address</span>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Location Address *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 104 Government Blvd, Sector 5"
                      value={sceneAddress}
                      onChange={(e) => setSceneAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 text-xs font-semibold focus:outline-none focus:bg-white focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">District / Zone</label>
                    <input
                      type="text"
                      placeholder="e.g. Capitol Zone"
                      value={sceneDistrict}
                      onChange={(e) => setSceneDistrict(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 text-xs font-semibold focus:outline-none focus:bg-white focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">City</label>
                    <input
                      type="text"
                      placeholder="Metro City"
                      value={sceneCity}
                      onChange={(e) => setSceneCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 text-xs font-semibold focus:outline-none focus:bg-white focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 text-xs hover:bg-slate-50 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-[0.98] cursor-pointer"
                >
                  Confirm Registration
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
