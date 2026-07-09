import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, UploadCloud, MapPin, Printer, Download, Eye, Plus, Trash, UserPlus, X, Edit } from 'lucide-react';
import { Case, User, CrimeScene, CaseAssignment, Person, Suspect, Victim, Witness, Evidence, Document, CaseTimeline, EvidenceType } from '../types';

interface CaseDetailsViewProps {
  selectedCaseId: number;
  users: User[];
  crimeScenes: CrimeScene[];
  currentUser: User;
  onBack: () => void;
  onDataChange?: () => void;
}

export default function CaseDetailsView({
  selectedCaseId,
  users,
  crimeScenes,
  currentUser,
  onBack,
  onDataChange
}: CaseDetailsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'evidence' | 'people' | 'briefing'>('overview');
  const [caseItem, setCaseItem] = useState<Case | null>(null);
  const [assignments, setAssignments] = useState<CaseAssignment[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [timeline, setTimeline] = useState<CaseTimeline[]>([]);
  const [evidenceTypes, setEvidenceTypes] = useState<EvidenceType[]>([]);
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

  // Evidence Creation & Linkage states
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [addEvidenceDesc, setAddEvidenceDesc] = useState('');
  const [addEvidenceTypeId, setAddEvidenceTypeId] = useState('1');
  const [addEvidenceLocation, setAddEvidenceLocation] = useState('Main Vault, Safe Locker 1');
  const [addEvidenceSealed, setAddEvidenceSealed] = useState(true);
  const [selectedEvidenceIdForUpload, setSelectedEvidenceIdForUpload] = useState<string>('');

  // Edit Evidence states
  const [editingEvidence, setEditingEvidence] = useState<Evidence | null>(null);
  const [editEvidenceDesc, setEditEvidenceDesc] = useState('');
  const [editEvidenceLocation, setEditEvidenceLocation] = useState('');
  const [editEvidenceStatus, setEditEvidenceStatus] = useState('');
  const [editEvidenceSealed, setEditEvidenceSealed] = useState(true);

  // Edit Case states
  const [showEditCaseModal, setShowEditCaseModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCrimeType, setEditCrimeType] = useState('');
  const [editPriority, setEditPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [editLeadInvestigator, setEditLeadInvestigator] = useState('');

  // Edit Person states
  const [editingPerson, setEditingPerson] = useState<{ type: 'suspect' | 'victim' | 'witness', data: any } | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editGender, setEditGender] = useState('Male');
  const [editDob, setEditDob] = useState('1990-01-01');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');

  const [editSuspectRisk, setEditSuspectRisk] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [editSuspectRecord, setEditSuspectRecord] = useState('');
  const [editSuspectStatus, setEditSuspectStatus] = useState<Suspect['status']>('Under Watch');
  const [editVictimInjuries, setEditVictimInjuries] = useState('');
  const [editWitnessStatement, setEditWitnessStatement] = useState('');

  useEffect(() => {
    if (caseItem) {
      setEditTitle(caseItem.title);
      setEditDesc(caseItem.description || '');
      setEditCrimeType(caseItem.crime_type);
      setEditPriority(caseItem.priority as any);
      setEditLeadInvestigator(String(caseItem.lead_investigator));
    }
  }, [caseItem]);

  useEffect(() => {
    if (editingPerson) {
      const p = editingPerson.data.person;
      setEditFirstName(p.first_name);
      setEditLastName(p.last_name);
      setEditGender(p.gender || 'Male');
      setEditDob(p.dob || '1990-01-01');
      setEditPhone(p.phone || '');
      setEditEmail(p.email || '');
      setEditAddress(p.address || '');

      if (editingPerson.type === 'suspect') {
        setEditSuspectRisk(editingPerson.data.risk_level);
        setEditSuspectRecord(editingPerson.data.criminal_record || '');
        setEditSuspectStatus(editingPerson.data.status);
      } else if (editingPerson.type === 'witness') {
        setEditWitnessStatement(editingPerson.data.statement);
      } else if (editingPerson.type === 'victim') {
        setEditVictimInjuries(editingPerson.data.injury_details || '');
      }
    }
  }, [editingPerson]);

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

      const resEvTypes = await fetch('/api/evidence-types');
      if (resEvTypes.ok) {
        setEvidenceTypes(await resEvTypes.json());
      }

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
        if (onDataChange) onDataChange();
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
        if (onDataChange) onDataChange();
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
        if (onDataChange) onDataChange();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDoc = async (docId: number) => {
    if (confirm('Are you sure you want to permanently delete this document?')) {
      try {
        const response = await fetch(`/api/documents/${docId}?operator_id=${currentUser.user_id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          loadData();
          if (onDataChange) onDataChange();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeleteSuspect = async (suspectId: number) => {
    if (confirm('Are you sure you want to remove this suspect dossier link?')) {
      try {
        const response = await fetch(`/api/suspects/${suspectId}?operator_id=${currentUser.user_id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          loadData();
          if (onDataChange) onDataChange();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeleteWitness = async (witnessId: number) => {
    if (confirm('Are you sure you want to remove this witness record link?')) {
      try {
        const response = await fetch(`/api/witnesses/${witnessId}?operator_id=${currentUser.user_id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          loadData();
          if (onDataChange) onDataChange();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeleteVictim = async (victimId: number) => {
    if (confirm('Are you sure you want to remove this victim record link?')) {
      try {
        const response = await fetch(`/api/victims/${victimId}?operator_id=${currentUser.user_id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          loadData();
          if (onDataChange) onDataChange();
        }
      } catch (err) {
        console.error(err);
      }
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
            evidence_id: selectedEvidenceIdForUpload ? Number(selectedEvidenceIdForUpload) : null,
            file_name: file.name,
            file_type: file.type || 'application/octet-stream',
            file_data: base64Data,
            uploaded_by: currentUser.user_id
          })
        });

        if (!res.ok) {
          throw new Error('Upload failed on server.');
        }

        setSelectedEvidenceIdForUpload('');
        loadData();
        if (onDataChange) onDataChange();
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
      if (onDataChange) onDataChange();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditPersonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPerson) return;

    try {
      const personId = editingPerson.data.person_id;
      const personRes = await fetch(`/api/persons/${personId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: editFirstName,
          last_name: editLastName,
          gender: editGender,
          dob: editDob,
          phone: editPhone,
          email: editEmail,
          address: editAddress
        })
      });

      if (!personRes.ok) return;

      if (editingPerson.type === 'suspect') {
        const suspectId = editingPerson.data.suspect_id;
        await fetch(`/api/suspects/${suspectId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            risk_level: editSuspectRisk,
            criminal_record: editSuspectRecord,
            status: editSuspectStatus,
            operator_id: currentUser.user_id
          })
        });
      } else if (editingPerson.type === 'witness') {
        const witnessId = editingPerson.data.witness_id;
        await fetch(`/api/witnesses/${witnessId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            statement: editWitnessStatement,
            operator_id: currentUser.user_id
          })
        });
      } else if (editingPerson.type === 'victim') {
        const victimId = editingPerson.data.victim_id;
        await fetch(`/api/victims/${victimId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            injury_details: editVictimInjuries,
            operator_id: currentUser.user_id
          })
        });
      }

      setEditingPerson(null);
      loadData();
      if (onDataChange) onDataChange();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditCaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseItem) return;

    try {
      const response = await fetch(`/api/cases/${selectedCaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDesc,
          crime_type: editCrimeType,
          priority: editPriority,
          lead_investigator: Number(editLeadInvestigator),
          operator_id: currentUser.user_id
        })
      });

      if (response.ok) {
        setShowEditCaseModal(false);
        loadData();
        if (onDataChange) onDataChange();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddEvidenceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addEvidenceDesc) return;

    try {
      const response = await fetch('/api/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: selectedCaseId,
          type_id: Number(addEvidenceTypeId),
          description: addEvidenceDesc,
          storage_location: addEvidenceLocation,
          is_sealed: addEvidenceSealed,
          operator_id: currentUser.user_id
        })
      });
      if (response.ok) {
        setAddEvidenceDesc('');
        setAddEvidenceLocation('Main Vault, Safe Locker 1');
        setAddEvidenceTypeId('1');
        setAddEvidenceSealed(true);
        setShowEvidenceModal(false);
        loadData();
        if (onDataChange) onDataChange();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEvidence = async (evidenceId: number) => {
    if (!window.confirm("Are you sure you want to delete this evidence log?")) return;

    try {
      const res = await fetch(`/api/evidence/${evidenceId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        loadData();
        if (onDataChange) onDataChange();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startEditEvidence = (ev: Evidence) => {
    setEditingEvidence(ev);
    setEditEvidenceDesc(ev.description);
    setEditEvidenceLocation(ev.storage_location);
    setEditEvidenceStatus(ev.current_status);
    setEditEvidenceSealed(ev.is_sealed);
  };

  const handleEditEvidenceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvidence) return;

    try {
      const response = await fetch(`/api/evidence/${editingEvidence.evidence_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: editEvidenceDesc,
          storage_location: editEvidenceLocation,
          current_status: editEvidenceStatus,
          is_sealed: editEvidenceSealed,
          operator_id: currentUser.user_id
        })
      });
      if (response.ok) {
        setEditingEvidence(null);
        loadData();
        if (onDataChange) onDataChange();
      }
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
      <div className="space-y-6 print:hidden">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 border border-slate-200 hover:bg-slate-100 rounded-2xl transition-all text-slate-700 cursor-pointer"
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
          <button
            onClick={() => setShowEditCaseModal(true)}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-[0.98]"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Dossier</span>
          </button>
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
              activeSubTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-700'
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
                    <p className="text-xs text-slate-600 italic mt-2">{scene.description}</p>
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
                      <div className="absolute left-[10px] top-1 w-4 h-4 bg-white border-2 border-indigo-600 rounded-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></div>
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

      {/* SUB-TAB: Evidence Inventory */}
      {activeSubTab === 'evidence' && (
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-5">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Evidence Logbook</h3>
              <p className="text-slate-400 text-[9px] font-medium uppercase mt-0.5">Physical assets linked to this case file</p>
            </div>
            <button
              onClick={() => setShowEvidenceModal(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.98] shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Evidence Log</span>
            </button>
          </div>

          {evidence.length === 0 ? (
            <div className="p-12 border border-dashed border-slate-200 rounded-3xl text-center text-slate-400 text-xs font-semibold">
              No evidence assets logged for this case.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {evidence.map((ev) => (
                <div key={ev.evidence_id} className="p-5 border border-slate-100 rounded-2xl space-y-3.5 bg-slate-50/40 hover:bg-slate-50 transition-all flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[9px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                        {ev.barcode}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold ${
                          ev.is_sealed ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'
                        }`}>
                          {ev.is_sealed ? 'SEALED' : 'UNSEALED'}
                        </span>
                        <button
                          onClick={() => startEditEvidence(ev)}
                          className="p-1 hover:bg-slate-150 rounded transition-all cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvidence(ev.evidence_id)}
                          className="p-1 hover:bg-red-50 rounded transition-all cursor-pointer"
                        >
                          <Trash className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-700 font-bold">{ev.description}</p>
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium pt-3.5 border-t border-slate-100 space-y-1">
                    <div className="flex justify-between">
                      <span>LOCATION:</span>
                      <span className="font-bold text-slate-700">{ev.storage_location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CUSTODY:</span>
                      <span className="font-bold text-slate-700 uppercase">{ev.current_status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
              <span className="font-black text-red-950 text-xs uppercase tracking-widest block border-b border-red-100 pb-1">Suspect Profiles</span>
              <div className="space-y-3">
                {suspects.map((s) => (
                  <div key={s.suspect_id} className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-900 text-xs block">{s.person.first_name} {s.person.last_name}</span>
                        <span className="text-[9px] text-slate-400 block font-semibold mt-0.5">{s.person.dob} | {s.person.gender}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold ${s.risk_level === 'High' ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'}`}>
                          {s.risk_level} Risk
                        </span>
                        <button
                          onClick={() => setEditingPerson({ type: 'suspect', data: s })}
                          className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded transition-all cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSuspect(s.suspect_id)}
                          className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-all cursor-pointer"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs space-y-2 pt-2 border-t border-slate-100">
                      <p className="text-slate-500 italic text-[11px] leading-relaxed">{s.criminal_record || 'No record file.'}</p>
                      <div className="flex justify-between items-center text-[9px] font-bold">
                        <span className="text-slate-400">STATUS:</span>
                        <span className="uppercase text-red-600">{s.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Witnesses */}
            <div className="space-y-4">
              <span className="font-black text-blue-950 text-xs uppercase tracking-widest block border-b border-blue-100 pb-1">Witness Statements</span>
              <div className="space-y-3">
                {witnesses.map((w) => (
                  <div key={w.witness_id} className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-900 text-xs block">{w.person.first_name} {w.person.last_name}</span>
                        <span className="text-[9px] text-slate-400 block font-semibold mt-0.5">{w.person.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setEditingPerson({ type: 'witness', data: w })}
                          className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded transition-all cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteWitness(w.witness_id)}
                          className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-all cursor-pointer"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-900 text-xs block">{v.person.first_name} {v.person.last_name}</span>
                        <span className="text-[9px] text-slate-400 block font-semibold mt-0.5">{v.person.dob}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setEditingPerson({ type: 'victim', data: v })}
                          className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded transition-all cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteVictim(v.victim_id)}
                          className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-all cursor-pointer"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
              <span className="uppercase font-bold text-indigo-600">{caseItem.status}</span>
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
            
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900 capitalize">Add Associated {showPersonModal}</h3>
                <p className="text-[10px] text-slate-500 font-medium uppercase mt-0.5">Link person profile to case</p>
              </div>
              <button onClick={() => setShowPersonModal(false)} className="p-1.5 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-700 cursor-pointer">
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
                  <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest block">Suspect Configuration</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Risk</label>
                      <select
                        value={suspectRisk}
                        onChange={(e) => setSuspectRisk(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold focus:outline-none"
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
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold focus:outline-none"
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
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block">Witness Configuration</span>
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
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer active:scale-[0.98]"
                >
                  Register Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Case Modal */}
      {showEditCaseModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900">Edit Case Dossier</h3>
                <p className="text-[10px] text-slate-500 font-medium uppercase mt-0.5">Modify inquiry file details</p>
              </div>
              <button onClick={() => setShowEditCaseModal(false)} className="p-1.5 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditCaseSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Inquiry Title *</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-xs font-semibold focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Crime Category *</label>
                  <select
                    value={editCrimeType}
                    onChange={(e) => setEditCrimeType(e.target.value)}
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
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-xs font-semibold focus:outline-none focus:bg-white"
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Threat</option>
                    <option value="High">High Infiltration</option>
                    <option value="Critical">Critical Impact</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Lead Investigator *</label>
                  <select
                    value={editLeadInvestigator}
                    onChange={(e) => setEditLeadInvestigator(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-xs font-semibold focus:outline-none focus:bg-white"
                  >
                    {users.map(u => (
                      <option key={u.user_id} value={u.user_id}>{u.first_name} {u.last_name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Case Description</label>
                  <textarea
                    rows={3}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-xs font-semibold focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditCaseModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 text-xs hover:bg-slate-50 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-[0.98] cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Person Modal */}
      {editingPerson && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900 capitalize">Edit Associated {editingPerson.type}</h3>
                <p className="text-[10px] text-slate-500 font-medium uppercase mt-0.5">Modify person profile details</p>
              </div>
              <button onClick={() => setEditingPerson(null)} className="p-1.5 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditPersonSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Gender</label>
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value)}
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
                    value={editDob}
                    onChange={(e) => setEditDob(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold focus:outline-none focus:bg-white"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Phone Number</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Address</label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              {editingPerson.type === 'suspect' && (
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <span className="text-[10px] font-bold text-red-655 uppercase tracking-widest block">Suspect Configuration</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Risk</label>
                      <select
                        value={editSuspectRisk}
                        onChange={(e) => setEditSuspectRisk(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold focus:outline-none"
                      >
                        <option value="Low">Low Risk</option>
                        <option value="Medium">Medium Threat</option>
                        <option value="High">High Threat</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Status</label>
                      <select
                        value={editSuspectStatus}
                        onChange={(e) => setEditSuspectStatus(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold focus:outline-none"
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
                        value={editSuspectRecord}
                        onChange={(e) => setEditSuspectRecord(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {editingPerson.type === 'witness' && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-[10px] font-bold text-blue-655 uppercase tracking-widest block">Witness Configuration</span>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Testimony Statement *</label>
                    <textarea
                      rows={3}
                      required
                      value={editWitnessStatement}
                      onChange={(e) => setEditWitnessStatement(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {editingPerson.type === 'victim' && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Victim Configuration</span>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Injury / Trauma Log *</label>
                    <textarea
                      rows={3}
                      required
                      value={editVictimInjuries}
                      onChange={(e) => setEditVictimInjuries(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPerson(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 text-xs font-bold cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer active:scale-[0.98]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Evidence Modal */}
      {showEvidenceModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900">Add Evidence Log</h3>
                <p className="text-[10px] text-slate-500 font-medium uppercase mt-0.5">Register new physical asset to case</p>
              </div>
              <button onClick={() => setShowEvidenceModal(false)} className="p-1.5 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddEvidenceSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Asset Description *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="E.g. Blood sample swab from kitchen door"
                  value={addEvidenceDesc}
                  onChange={(e) => setAddEvidenceDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Evidence Type *</label>
                <select
                  value={addEvidenceTypeId}
                  onChange={(e) => setAddEvidenceTypeId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold focus:outline-none focus:bg-white"
                >
                  {evidenceTypes.map(t => (
                    <option key={t.type_id} value={t.type_id}>{t.type_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Storage Location *</label>
                <input
                  type="text"
                  required
                  value={addEvidenceLocation}
                  onChange={(e) => setAddEvidenceLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="addEvidenceSealed"
                  checked={addEvidenceSealed}
                  onChange={(e) => setAddEvidenceSealed(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="addEvidenceSealed" className="text-xs font-bold text-slate-700 select-none cursor-pointer">
                  Sealed Locker Protection Active
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEvidenceModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 text-xs font-bold cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer active:scale-[0.98]"
                >
                  Log Evidence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Evidence Modal */}
      {editingEvidence && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900">Edit Evidence Log</h3>
                <p className="text-[10px] text-slate-500 font-medium uppercase mt-0.5">Modify details for {editingEvidence.barcode}</p>
              </div>
              <button onClick={() => setEditingEvidence(null)} className="p-1.5 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditEvidenceSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Asset Description *</label>
                <textarea
                  required
                  rows={2}
                  value={editEvidenceDesc}
                  onChange={(e) => setEditEvidenceDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Storage Location *</label>
                <input
                  type="text"
                  required
                  value={editEvidenceLocation}
                  onChange={(e) => setEditEvidenceLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Custody Status *</label>
                <select
                  value={editEvidenceStatus}
                  onChange={(e) => setEditEvidenceStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold focus:outline-none focus:bg-white"
                >
                  <option value="Collected">Collected</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Under Analysis">Under Analysis</option>
                  <option value="In Storage">In Storage</option>
                  <option value="Released">Released</option>
                  <option value="Destroyed">Destroyed</option>
                </select>
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="editEvidenceSealed"
                  checked={editEvidenceSealed}
                  onChange={(e) => setEditEvidenceSealed(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="editEvidenceSealed" className="text-xs font-bold text-slate-700 select-none cursor-pointer">
                  Sealed Locker Protection Active
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingEvidence(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 text-xs font-bold cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer active:scale-[0.98]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      </div> {/* Close print:hidden */}

      {/* Complete print dossier report */}
      <div className="hidden print:block space-y-8 p-6 bg-white text-slate-900 min-h-screen">
        {/* Official Seal / Header */}
        <div className="border-b-2 border-slate-800 pb-4 flex justify-between items-end">
          <div>
            <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg uppercase">
              DOSSIER: {caseItem.case_number}
            </span>
            <h1 className="text-2xl font-black mt-2">{caseItem.title}</h1>
            <p className="text-slate-500 text-xs uppercase font-medium">{caseItem.crime_type} Case File</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">REPORT GENERATED</span>
            <span className="text-xs font-mono font-bold">{new Date().toLocaleString()}</span>
          </div>
        </div>

        {/* Case Meta grid */}
        <div className="grid grid-cols-3 gap-6 border-b border-slate-200 pb-6 text-xs">
          <div>
            <span className="text-slate-400 font-bold uppercase text-[9px] block mb-1">Status</span>
            <span className="font-bold text-slate-800 uppercase">{caseItem.status}</span>
          </div>
          <div>
            <span className="text-slate-400 font-bold uppercase text-[9px] block mb-1">Priority</span>
            <span className="font-bold text-slate-800 uppercase">{caseItem.priority}</span>
          </div>
          <div>
            <span className="text-slate-400 font-bold uppercase text-[9px] block mb-1">Lead Investigator</span>
            <span className="font-bold text-slate-800">
              {users.find(u => u.user_id === caseItem.lead_investigator)
                ? `${users.find(u => u.user_id === caseItem.lead_investigator)?.first_name} ${users.find(u => u.user_id === caseItem.lead_investigator)?.last_name}`
                : 'None'}
            </span>
          </div>
        </div>

        {/* Crime Scene Location */}
        {scene && (
          <div className="space-y-2 border-b border-slate-200 pb-6 text-xs">
            <h3 className="font-black text-slate-900 uppercase tracking-wider text-[10px]">Crime Scene Details</h3>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[8px] block">Address</span>
                <span className="font-semibold text-slate-800">{scene.address}, {scene.city}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[8px] block">District / State</span>
                <span className="font-semibold text-slate-800">{scene.district}, {scene.state}, {scene.country}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 font-bold uppercase text-[8px] block">Description</span>
                <span className="text-slate-700">{scene.description}</span>
              </div>
            </div>
          </div>
        )}

        {/* Evidence List */}
        <div className="space-y-3 border-b border-slate-200 pb-6 text-xs">
          <h3 className="font-black text-slate-900 uppercase tracking-wider text-[10px]">Registered Evidence Logs ({evidence.length})</h3>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-300 text-slate-400 font-bold uppercase text-[8px]">
                <th className="py-2">Barcode</th>
                <th className="py-2">Type</th>
                <th className="py-2">Description</th>
                <th className="py-2">Status</th>
                <th className="py-2">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {evidence.map(ev => (
                <tr key={ev.evidence_id}>
                  <td className="py-2.5 font-mono font-bold text-slate-800">{ev.barcode}</td>
                  <td className="py-2.5 font-semibold text-slate-800">
                    {evidenceTypes.find(t => t.type_id === ev.type_id)?.type_name || 'Physical'}
                  </td>
                  <td className="py-2.5 text-slate-700">{ev.description}</td>
                  <td className="py-2.5 uppercase font-bold text-[10px] text-slate-800">{ev.current_status}</td>
                  <td className="py-2.5 text-slate-600">{ev.storage_location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Personnel Grid */}
        <div className="grid grid-cols-2 gap-8 border-b border-slate-200 pb-6 text-xs">
          {/* Suspects */}
          <div className="space-y-3">
            <h3 className="font-black text-red-950 uppercase tracking-wider text-[10px] border-b border-slate-200 pb-1">Suspect Profiles</h3>
            <div className="space-y-3">
              {suspects.map(s => (
                <div key={s.suspect_id} className="border border-slate-100 p-3 rounded-xl bg-slate-50/50">
                  <span className="font-bold text-slate-900 block">{s.person.first_name} {s.person.last_name}</span>
                  <span className="text-[9px] text-slate-400 block font-semibold">{s.person.dob} | {s.person.gender}</span>
                  <p className="text-slate-600 text-[11px] italic mt-1.5">{s.criminal_record || 'No prior record.'}</p>
                  <div className="flex gap-4 mt-1.5 text-[9px] font-bold">
                    <span>RISK: {s.risk_level}</span>
                    <span>STATUS: {s.status}</span>
                  </div>
                </div>
              ))}
              {suspects.length === 0 && <p className="text-slate-400 italic">No suspects linked.</p>}
            </div>
          </div>

          {/* Witnesses */}
          <div className="space-y-3">
            <h3 className="font-black text-blue-950 uppercase tracking-wider text-[10px] border-b border-slate-200 pb-1">Witness Statements</h3>
            <div className="space-y-3">
              {witnesses.map(w => (
                <div key={w.witness_id} className="border border-slate-100 p-3 rounded-xl bg-slate-50/50">
                  <span className="font-bold text-slate-900 block">{w.person.first_name} {w.person.last_name}</span>
                  <span className="text-[9px] text-slate-400 block font-semibold">{w.person.phone}</span>
                  <p className="text-slate-600 text-[11px] italic mt-1.5 bg-white p-2 rounded border border-slate-100">"{w.statement}"</p>
                </div>
              ))}
              {witnesses.length === 0 && <p className="text-slate-400 italic">No witness statements recorded.</p>}
            </div>
          </div>
        </div>

        {/* Victims & Documents */}
        <div className="grid grid-cols-2 gap-8 border-b border-slate-200 pb-6 text-xs">
          {/* Victims */}
          <div className="space-y-3">
            <h3 className="font-black text-slate-900 uppercase tracking-wider text-[10px] border-b border-slate-200 pb-1">Victims</h3>
            <div className="space-y-3">
              {victims.map(v => (
                <div key={v.victim_id} className="border border-slate-100 p-3 rounded-xl bg-slate-50/50">
                  <span className="font-bold text-slate-900 block">{v.person.first_name} {v.person.last_name}</span>
                  <span className="text-[9px] text-slate-400 block font-semibold">{v.person.dob}</span>
                  <p className="text-slate-500 italic mt-1.5 text-[11px]">{v.injury_details || 'Minor physical injuries logged.'}</p>
                </div>
              ))}
              {victims.length === 0 && <p className="text-slate-400 italic">No victim profiles linked.</p>}
            </div>
          </div>

          {/* Documents */}
          <div className="space-y-3">
            <h3 className="font-black text-slate-900 uppercase tracking-wider text-[10px] border-b border-slate-200 pb-1">Documents Uploaded</h3>
            <div className="space-y-1.5">
              {documents.map(doc => (
                <div key={doc.document_id} className="flex justify-between py-1 border-b border-slate-100">
                  <span className="font-semibold text-slate-800">{doc.file_name}</span>
                  <span className="text-slate-400 font-mono text-[9px]">{doc.file_type}</span>
                </div>
              ))}
              {documents.length === 0 && <p className="text-slate-400 italic">No documents attached.</p>}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-3 text-xs">
          <h3 className="font-black text-slate-900 uppercase tracking-wider text-[10px]">Timeline of Events</h3>
          <div className="space-y-2">
            {timeline.map(event => {
              const executor = users.find(u => u.user_id === event.performed_by);
              const execName = executor ? `${executor.first_name} ${executor.last_name}` : 'Officer';
              return (
                <div key={event.timeline_id} className="flex justify-between border-b border-slate-100 pb-1.5">
                  <div>
                    <span className="font-bold text-slate-800">{event.action}</span>
                    <p className="text-slate-600 text-[11px] mt-0.5">{event.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[9px] text-slate-400 font-mono block">{new Date(event.created_at).toLocaleDateString()}</span>
                    <span className="text-[9px] text-slate-400 font-bold block">{execName}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
