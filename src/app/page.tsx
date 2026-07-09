"use client";

import { useState, useEffect } from 'react';
import { User, Case, Evidence, Role, Department, CrimeScene, AuditLog } from '../types';
import Sidebar, { ActiveTab } from '../components/Sidebar';
import LoginView from '../components/LoginView';
import DashboardView from '../components/DashboardView';
import CasesView from '../components/CasesView';
import CaseDetailsView from '../components/CaseDetailsView';
import EvidenceView from '../components/EvidenceView';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);

  // Global State Repositories
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [evidenceTypes, setEvidenceTypes] = useState<any[]>([]);
  const [crimeScenes, setCrimeScenes] = useState<CrimeScene[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Page Initializing
  const fetchAllData = async () => {
    try {
      const headers = token ? { 'Authorization': `Bearer ${token}` } : undefined;

      const [
        resRoles, resDepts, resUsers, resCases, resEvidence,
        resEvTypes, resScenes, resAudits
      ] = await Promise.all([
        fetch('/api/roles', { headers }),
        fetch('/api/departments', { headers }),
        fetch('/api/users', { headers }),
        fetch('/api/cases', { headers }),
        fetch('/api/evidence', { headers }),
        fetch('/api/evidence-types', { headers }),
        fetch('/api/crime-scenes', { headers }),
        fetch('/api/audit', { headers })
      ]);

      if (resRoles.ok) setRoles(await resRoles.json());
      if (resDepts.ok) setDepartments(await resDepts.json());
      if (resUsers.ok) setUsers(await resUsers.json());
      if (resCases.ok) setCases(await resCases.json());
      if (resEvidence.ok) setEvidence(await resEvidence.json());
      if (resEvTypes.ok) setEvidenceTypes(await resEvTypes.json());
      if (resScenes.ok) setCrimeScenes(await resScenes.json());
      if (resAudits.ok) setAuditLogs(await resAudits.json());

    } catch (err) {
      console.error('Unified API polling fetch failed', err);
    }
  };

  // Restore authenticated session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('fms_user');
    const savedToken = localStorage.getItem('fms_token');
    if (savedUser && savedToken) {
      setCurrentUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
  }, []);

  // Poll databases once authenticated
  useEffect(() => {
    if (currentUser) {
      fetchAllData();
      const interval = setInterval(fetchAllData, 10000);
      return () => clearInterval(interval);
    }
  }, [currentUser, token]);

  const handleLoginSuccess = (user: User, userToken: string) => {
    setCurrentUser(user);
    setToken(userToken);
    localStorage.setItem('fms_user', JSON.stringify(user));
    localStorage.setItem('fms_token', userToken);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('fms_user');
    localStorage.removeItem('fms_token');
  };

  // Create Case (with Crime scene coordinate in tandem)
  const handleCreateCase = async (caseData: any, sceneData: any) => {
    try {
      // 1. Create Crime Scene coordinates first
      const sceneRes = await fetch('/api/crime-scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sceneData)
      });
      if (!sceneRes.ok) return;
      const createdScene: CrimeScene = await sceneRes.json();

      // 2. Create Case matching Crime Scene id
      const finalCase = {
        ...caseData,
        crime_scene_id: createdScene.scene_id
      };

      const caseRes = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalCase)
      });

      if (caseRes.ok) {
        fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Add Evidence item
  const handleAddEvidence = async (evData: any) => {
    try {
      const res = await fetch('/api/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...evData, operator_id: currentUser?.user_id })
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateEvidence = (evidenceId: number, updatedItem: Evidence) => {
    setEvidence(prev => prev.map(e => e.evidence_id === evidenceId ? updatedItem : e));
    fetchAllData();
  };

  const handleSelectCase = (caseId: number) => {
    setSelectedCaseId(caseId);
  };

  const handleDashboardNavigate = (tabName: ActiveTab) => {
    setSelectedCaseId(null);
    setActiveTab(tabName);
  };

  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans">
      
      {/* 1. Left Sidebar Rail */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setSelectedCaseId(null);
          setActiveTab(tab);
        }}
        currentUser={currentUser}
        onLogout={handleLogout}
        roles={roles}
        departments={departments}
      />

      {/* 2. Right Workspace Panel */}
      <main className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Dashboard View */}
          {activeTab === 'dashboard' && (
            <DashboardView
              cases={cases}
              evidence={evidence}
              auditLogs={auditLogs}
              crimeScenes={crimeScenes}
              evidenceTypes={evidenceTypes}
              users={users}
              persons={[]}
              suspects={[]}
              victims={[]}
              witnesses={[]}
              onNavigateToTab={handleDashboardNavigate}
              onCreateCaseClick={() => handleDashboardNavigate('cases')}
              onSelectCase={handleSelectCase}
            />
          )}

          {/* Cases View */}
          {activeTab === 'cases' && (
            selectedCaseId !== null ? (
              <CaseDetailsView
                selectedCaseId={selectedCaseId}
                users={users}
                crimeScenes={crimeScenes}
                currentUser={currentUser}
                onBack={() => setSelectedCaseId(null)}
              />
            ) : (
              <CasesView
                cases={cases}
                users={users}
                crimeScenes={crimeScenes}
                onCreateCase={handleCreateCase}
                onSelectCase={handleSelectCase}
                currentUser={currentUser}
              />
            )
          )}

          {/* Evidence View */}
          {activeTab === 'evidence' && (
            <EvidenceView
              evidence={evidence}
              cases={cases}
              evidenceTypes={evidenceTypes}
              users={users}
              onAddEvidence={handleAddEvidence}
              onUpdateEvidence={handleUpdateEvidence}
              currentUser={currentUser}
            />
          )}

        </div>
      </main>

    </div>
  );
}
