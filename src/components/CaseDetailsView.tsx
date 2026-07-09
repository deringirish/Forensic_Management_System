import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, UploadCloud, MapPin, Printer, Download, Eye, Plus, Trash, UserPlus, X } from 'lucide-react';
import { Case, User, CrimeScene, CaseAssignment, Person, Suspect, Victim, Witness, Evidence, Document, CaseTimeline } from '../types';

interface CaseDetailsViewProps {
  selectedCaseId: number;
  users: User[];
  crimeScenes: CrimeScene[];
  currentUser: User;
  onBack: () => void;
}

export default function CaseDetailsView({
  selectedCaseId,
  users,
  crimeScenes,
  currentUser,
  onBack
}: CaseDetailsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'evidence' | 'people' | 'briefing'>('overview');
  const [caseItem, setCaseItem] = useState<Case | null>(null);
  const [assignments, setAssignments] = useState<CaseAssignment[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [timeline, setTimeline] = useState<CaseTimeline[]>([]);
  const [scene, setScene] = useState<CrimeScene | null>(null);

  // Associated persons states
  const [suspects, setSuspects] = useState<(Suspect & { person: Person })[]>([]);
  const [victims, setVictims] = useState<(Victim & { person: Person })[]>([]);
  const [witnesses, setWitnesses] = useState<(Witness & { person: Person })[]>([]);

  // Form states
  const [assignUserId, setAssignUserId] = useState('');
  const [assignRole, setAssignRole] = useState('Investigator');
  const [statusVal, setStatusVal] = useState<Case['status']>('Open');
  
  const [showPersonModal, setShowPersonModal] = useState<false | 'suspect' | 'victim' | 'witness'>(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newGender, setNewGender] = useState('Male');
  const [newDob, setNewDob] = useState('1990-01-01');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAddress, setNewAddress] = useState('');
  
  const [suspectRisk, setSuspectRisk] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [suspectRecord, setSuspectRecord] = useState('');
  const [suspectStatus, setSuspectStatus] = useState<Suspect['status']>('Under Watch');
  const [victimInjuries, setVictimInjuries] = useState('');
  const [witnessStatement, setWitnessStatement] = useState('');

  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const resCase = await fetch(`/api/cases/${selectedCaseId}`);
      if (!resCase.ok) return;
      const c = await resCase.json();
      setCaseItem(c);
      setStatusVal(c.status);

      if (c.crime_scene_id) {
        const resScenes = await fetch('/api/crime-scenes');
        const scenes = await resScenes.json();
        const sc = scenes.find((s: CrimeScene) => s.scene_id === c.crime_scene_id);
        setScene(sc || null);
      }

      const resAssigns = await fetch(`/api/cases/${selectedCaseId}/assignments`);
      setAssignments(await resAssigns.json());

      const resEv = await fetch(`/api/evidence?case_id=${selectedCaseId}`);
      setEvidence(await resEv.json());

      const resDoc = await fetch(`/api/documents?case_id=${selectedCaseId}`);
      setDocuments(await resDoc.json());

      const resTime = await fetch(`/api/timeline?case_id=${selectedCaseId}`);
      setTimeline(await resTime.json());

      const resPersons = await fetch('/api/persons');
      const persons: Person[] = await resPersons.json();

      const resSusp = await fetch(`/api/suspects?case_id=${selectedCaseId}`);
      const suspList: Suspect[] = await resSusp.json();
      setSuspects(suspList.map(s => ({
        ...s,
        person: persons.find(p => p.person_id === s.person_id)!
      })).filter(s => !!s.person));

      const resVict = await fetch(`/api/victims?case_id=${selectedCaseId}`);
      const victList: Victim[] = await resVict.json();
      setVictims(victList.map(v => ({
        ...v,
        person: persons.find(p => p.person_id === v.person_id)!
      })).filter(v => !!v.person));

      const resWitness = await fetch(`/api/witnesses?case_id=${selectedCaseId}`);
      const witnessList: Witness[] = await resWitness.json();
      setWitnesses(witnessList.map(w => ({
        ...w,
        person: persons.find(p => p.person_id === w.person_id)!
      })).filter(w => !!w.person));

    } catch (e) {
      console.error('Failed to load case details', e);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCaseId]);

  if (!caseItem) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 font-bold text-xs">
        <span className="inline-block w-5 h-5 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin mr-3"></span>
        Retrieving Case Portfolio...
      </div>
    );
  }

  const handleStatusChange = async (newStatus: Case['status']) => {
    try {
      const response = await fetch(`/api/cases/${selectedCaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          operator_id: currentUser.user_id
        })
      });
      if (response.ok) {
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignUserId) return;

    try {
      const response = await fetch(`/api/cases/${selectedCaseId}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: assignUserId,
          role_in_case: assignRole
        })
      });
      if (response.ok) {
        setAssignUserId('');
        setAssignRole('Investigator');
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveAssignment = async (assignId: number) => {
    try {
      const response = await fetch(`/api/assignments/${assignId}?operator_id=${currentUser.user_id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = (reader.result as string).split(',')[1];
        const res = await fetch('/api/documents/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            case_id: selectedCaseId,
            file_name: file.name,
            file_type: file.type || 'application/octet-stream',
            file_data: base64Data,
            uploaded_by: currentUser.user_id
          })
        });

        if (!res.ok) {
          throw new Error('Upload failed on server.');
        }

        loadData();
      } catch (err: any) {
        setUploadError(err.message || 'File upload failed');
      } finally {
        setUploadLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddPersonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName || !newLastName) return;

    try {
      const pRes = await fetch('/api/persons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: newFirstName,
          last_name: newLastName,
          gender: newGender,
          dob: newDob,
          phone: newPhone,
          email: newEmail,
          address: newAddress
        })
      });
      if (!pRes.ok) return;
      const createdPerson: Person = await pRes.json();

      if (showPersonModal === 'suspect') {
        await fetch('/api/suspects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            person_id: createdPerson.person_id,
            case_id: selectedCaseId,
            risk_level: suspectRisk,
            criminal_record: suspectRecord,
            status: suspectStatus,
            operator_id: currentUser.user_id
          })
        });
      } else if (showPersonModal === 'witness') {
        await fetch('/api/witnesses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            person_id: createdPerson.person_id,
            case_id: selectedCaseId,
            statement: witnessStatement,
            operator_id: currentUser.user_id
          })
        });
      } else if (showPersonModal === 'victim') {
        await fetch('/api/victims', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            person_id: createdPerson.person_id,
            case_id: selectedCaseId,
            injury_details: victimInjuries,
            operator_id: currentUser.user_id
          })
        });
      }

      setNewFirstName('');
      setNewLastName('');
      setNewPhone('');
      setNewEmail('');
      setNewAddress('');
      setSuspectRecord('');
      setWitnessStatement('');
      setVictimInjuries('');
      setShowPersonModal(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulateCSV = () => {
    if (!caseItem) return;
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Report Title,Federal Laboratory Case Dossier\n"
      + `Case Code,${caseItem.case_number}\n`
      + `Title,${caseItem.title}\n`
      + `Category,${caseItem.crime_type}\n`
      + `Status,${caseItem.status}\n\n`
      + "Evidence Catalog:\n"
      + "Barcode,Description,Location,IntegrityStatus\n"
      + evidence.map(e => `${e.barcode},"${e.description.replace(/"/g, '""')}",${e.storage_location},${e.is_sealed ? 'Sealed' : 'Unsealed'}`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Case_Dossier_Export_${caseItem.case_number}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 border border-slate-200 hover:bg-slate-100 rounded-2xl transition-all text-slate-650 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                {caseItem.case_number}
              </span>
              <h1 className="text-lg font-black text-slate-900 tracking-tight">{caseItem.title}</h1>
            </div>
            <p className="text-slate-500 text-[10px] mt-0.5 uppercase tracking-wide font-medium">{caseItem.crime_type} Case File</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status:</span>
          <select
            value={statusVal}
            onChange={(e) => handleStatusChange(e.target.value as any)}
            className="px-3.5 py-1.5 border border-slate-200 rounded-2xl text-slate-800 text-xs bg-white focus:outline-none"
          >
            <option value="Open">Open</option>
            <option value="Under Investigation">Under Investigation</option>
            <option value="Closed">Closed</option>
            <option value="Cold Case">Cold Case</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-250 flex gap-5">
        {(['overview', 'evidence', 'people', 'briefing'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`pb-3 font-bold text-xs border-b-2 px-1 transition-all uppercase tracking-widest cursor-pointer ${
              activeSubTab === tab ? 'border-indigo-600 text-indigo-650' : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* SUB-TAB: Overview */}
      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Incident Summary</h3>
                <p className="text-slate-400 text-[9px] font-medium uppercase mt-0.5">Narrative facts registered by officers</p>
              </div>
              <p className="text-slate-750 text-xs leading-relaxed whitespace-pre-line">
                {caseItem.description}
              </p>

              {scene && (
                <div className="pt-4 border-t border-slate-100 flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800 text-xs block">Crime Scene Location</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">{scene.address}, {scene.district}, {scene.city}</span>
                    <p className="text-xs text-slate-650 italic mt-2">{scene.description}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
              <div className="mb-4">
                <h3 className="font-bold text-slate-900 text-sm">Investigation Timeline</h3>
                <p className="text-slate-400 text-[9px] font-medium uppercase mt-0.5">Chronological events ledger</p>
              </div>

              <div className="space-y-5 relative before:absolute before:inset-y-1 before:left-[17px] before:w-0.5 before:bg-slate-100 pl-2">
                {timeline.map((event) => {
                  const executor = users.find(u => u.user_id === event.performed_by);
                  const execName = executor ? `${executor.first_name} ${executor.last_name}` : 'Officer';
                  const dateString = new Date(event.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

                  return (
                    <div key={event.timeline_id} className="relative pl-8 flex gap-3 text-xs leading-relaxed">
                      <div className="absolute left-[10px] top-1 w-4 h-4 bg-white border-2 border-indigo-650 rounded-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-indigo-650 rounded-full"></div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{event.action}</span>
                          <span className="text-[9px] text-slate-400 font-mono font-semibold">{dateString}</span>
                        </div>
                        <p className="text-slate-600 mt-0.5">{event.description}</p>
                        <span className="text-[9px] text-slate-450 font-bold block mt-1 uppercase">By: {execName}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Assigned Personnel</h3>
                <p className="text-slate-400 text-[9px] font-medium uppercase mt-0.5">Clearance authorized officers</p>
              </div>

              <div className="space-y-2.5">
                {assignments.map((assign) => {
                  const assignedUser = users.find(u => u.user_id === assign.user_id);
                  if (!assignedUser) return null;

                  return (
                    <div key={assign.assignment_id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block">
                          {assignedUser.first_name} {assignedUser.last_name}
                        </span>
                        <span className="text-slate-450 font-bold text-[9px] uppercase tracking-wider block mt-0.5">
                          {assign.role_in_case}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveAssignment(assign.assignment_id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleAssignSubmit} className="pt-4 border-t border-slate-100 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Assign Officer</span>
                
                <select
                  required
                  value={assignUserId}
                  onChange={(e) => setAssignUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-700 text-xs bg-white focus:outline-none"
                >
                  <option value="">Select Officer...</option>
                  {users.map(u => (
                    <option key={u.user_id} value={u.user_id}>
                      {u.first_name} {u.last_name}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  required
                  placeholder="Role (e.g. Lead DNA Analyst)"
                  value={assignRole}
                  onChange={(e) => setAssignRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none placeholder-slate-400"
                />

                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Assign Officer</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: Evidence & Documents */}
      {activeSubTab === 'evidence' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Evidence Inventory</h3>
                <p className="text-slate-400 text-[9px] font-medium uppercase mt-0.5">Physical assets linked to this file</p>
              </div>

              {evidence.length === 0 ? (
                <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs font-semibold">
                  No evidence assets logged for this case.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {evidence.map((ev) => (
                    <div key={ev.evidence_id} className="p-4 border border-slate-100 rounded-2xl space-y-3 bg-slate-50/40">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-[9px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                          {ev.barcode}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold ${
                          ev.is_sealed ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'
                        }`}>
                          {ev.is_sealed ? 'SEALED' : 'UNSEALED'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-semibold">{ev.description}</p>
                      <div className="text-[10px] text-slate-400 font-medium pt-2 border-t border-slate-100 space-y-1">
                        <div className="flex justify-between"><span>LOCATION:</span><span className="font-bold text-slate-650">{ev.storage_location}</span></div>
                        <div className="flex justify-between"><span>CUSTODY:</span><span className="font-bold text-slate-650 uppercase">{ev.current_status}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Secure Document Vault */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Secure Document Vault</h3>
                <p className="text-slate-400 text-[9px] font-medium uppercase mt-0.5">Certificates & examination files</p>
              </div>

              {/* Upload Box */}
              <div className="relative border-2 border-dashed border-slate-200 hover:border-indigo-500/50 bg-slate-50 rounded-2xl p-6 text-center cursor-pointer transition-all">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploadLoading}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="flex flex-col items-center justify-center space-y-1.5">
                  <UploadCloud className="w-8 h-8 text-slate-400" />
                  <span className="text-xs font-bold text-slate-700 block">
                    {uploadLoading ? 'Uploading...' : 'Click to Upload Document'}
                  </span>
                  <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">PDF, DOCX, JPEG</span>
                </div>
              </div>

              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-650 text-xs rounded-xl">
                  {uploadError}
                </div>
              )}

              {/* Document list */}
              <div className="divide-y divide-slate-100 pt-2">
                {documents.map((doc) => (
                  <div key={doc.document_id} className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 px-1 rounded-xl transition-all">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate max-w-[120px]" title={doc.file_name}>
                        {doc.file_name}
                      </span>
                    </div>
                    <a
                      href={doc.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={doc.file_name}
                      className="text-[9px] bg-slate-100 hover:bg-indigo-600 hover:text-white px-2 py-1 rounded-lg transition-all font-bold shrink-0 uppercase tracking-wide"
                    >
                      Decrypt
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: Associated Persons */}
      {activeSubTab === 'people' && (
        <div className="space-y-6">
          <div className="flex gap-2.5 flex-wrap">
            <button
              onClick={() => setShowPersonModal('suspect')}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Suspect Dossier</span>
            </button>
            <button
              onClick={() => setShowPersonModal('witness')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Witness Record</span>
            </button>
            <button
              onClick={() => setShowPersonModal('victim')}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Victim Record</span>
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Suspects */}
            <div className="space-y-4">
              <span className="font-black text-red-900 text-xs uppercase tracking-widest block border-b border-red-100 pb-1">Suspect Profiles</span>
              <div className="space-y-3">
                {suspects.map((s) => (
                  <div key={s.suspect_id} className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-900 text-xs block">{s.person.first_name} {s.person.last_name}</span>
                        <span className="text-[9px] text-slate-400 block font-semibold mt-0.5">{s.person.dob} | {s.person.gender}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold ${s.risk_level === 'High' ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'}`}>
                        {s.risk_level} Risk
                      </span>
                    </div>
                    <div className="text-xs space-y-2 pt-2 border-t border-slate-100">
                      <p className="text-slate-500 italic text-[11px] leading-relaxed">{s.criminal_record || 'No record file.'}</p>
                      <div className="flex justify-between items-center text-[9px] font-bold">
                        <span className="text-slate-400">STATUS:</span>
                        <span className="uppercase text-red-650">{s.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Witnesses */}
            <div className="space-y-4">
              <span className="font-black text-blue-900 text-xs uppercase tracking-widest block border-b border-blue-100 pb-1">Witness Statements</span>
              <div className="space-y-3">
                {witnesses.map((w) => (
                  <div key={w.witness_id} className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm space-y-3">
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">{w.person.first_name} {w.person.last_name}</span>
                      <span className="text-[9px] text-slate-400 block font-semibold mt-0.5">{w.person.phone}</span>
                    </div>
                    <p className="italic text-slate-600 text-[11px] leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      "{w.statement}"
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Victims */}
            <div className="space-y-4">
              <span className="font-black text-slate-900 text-xs uppercase tracking-widest block border-b border-slate-200 pb-1">Victims</span>
              <div className="space-y-3">
                {victims.map((v) => (
                  <div key={v.victim_id} className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm space-y-3">
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">{v.person.first_name} {v.person.last_name}</span>
                      <span className="text-[9px] text-slate-400 block font-semibold mt-0.5">{v.person.dob}</span>
                    </div>
                    <p className="text-slate-500 italic text-[11px] leading-relaxed">{v.injury_details || 'Minor physical injuries logged.'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: Briefing compilation */}
      {activeSubTab === 'briefing' && (
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-6 max-w-2xl mx-auto">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Official Examination briefing</h3>
            <p className="text-slate-400 text-[9px] font-medium uppercase mt-0.5">Synthesize official court evidence logs and case files</p>
          </div>

          <div className="border border-slate-200 rounded-2xl p-5 bg-slate-55/30 text-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3 font-semibold text-slate-700">
              <span>CASE IDENTIFIER:</span>
              <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{caseItem.case_number}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 pb-3 font-semibold text-slate-700">
              <span>TITLE:</span>
              <span>{caseItem.title}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 pb-3 font-semibold text-slate-700">
              <span>EVIDENCE COUNT:</span>
              <span>{evidence.length} Items</span>
            </div>
            <div className="flex justify-between items-center pb-1 font-semibold text-slate-700">
              <span>INQUIRY STATUS:</span>
              <span className="uppercase font-bold text-indigo-650">{caseItem.status}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => window.print()}
              className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-[0.98] cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Briefing</span>
            </button>
            <button
              onClick={handleSimulateCSV}
              className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      )}

      {/* Person Modal */}
      {showPersonModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-55/30">
              <div>
                <h3 className="text-sm font-black text-slate-900 capitalize">Add Associated {showPersonModal}</h3>
                <p className="text-[10px] text-slate-500 font-medium uppercase mt-0.5">Link person profile to case</p>
              </div>
              <button onClick={() => setShowPersonModal(false)} className="p-1.5 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-650 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPersonSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Marcus"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Vance"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Gender</label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold focus:outline-none focus:bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">DOB</label>
                  <input
                    type="date"
                    value={newDob}
                    onChange={(e) => setNewDob(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold focus:outline-none focus:bg-white"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 019-3388"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Address</label>
                  <input
                    type="text"
                    placeholder="404 Elm St, District B"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              {showPersonModal === 'suspect' && (
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <span className="text-[10px] font-bold text-red-650 uppercase tracking-widest block">Suspect Configuration</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Risk</label>
                      <select
                        value={suspectRisk}
                        onChange={(e) => setSuspectRisk(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-755 text-xs font-semibold focus:outline-none"
                      >
                        <option value="Low">Low Risk</option>
                        <option value="Medium">Medium Threat</option>
                        <option value="High">High Threat</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Status</label>
                      <select
                        value={suspectStatus}
                        onChange={(e) => setSuspectStatus(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-755 text-xs font-semibold focus:outline-none"
                      >
                        <option value="Under Watch">Under Watch</option>
                        <option value="Detained">Detained</option>
                        <option value="Released">Released</option>
                        <option value="Wanted">Wanted</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Prior Record Notes</label>
                      <textarea
                        rows={2}
                        placeholder="Armed burglary conviction in 2018..."
                        value={suspectRecord}
                        onChange={(e) => setSuspectRecord(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {showPersonModal === 'witness' && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-[10px] font-bold text-blue-650 uppercase tracking-widest block">Witness Configuration</span>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Testimony Statement *</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Saw delivery van leaving downtown at high speed..."
                      value={witnessStatement}
                      onChange={(e) => setWitnessStatement(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {showPersonModal === 'victim' && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Victim Configuration</span>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Injury / Trauma Log *</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Fatal gunshot wound to chest, bruising..."
                      value={victimInjuries}
                      onChange={(e) => setVictimInjuries(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPersonModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 text-xs font-bold cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-650 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer active:scale-[0.98]"
                >
                  Register Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
