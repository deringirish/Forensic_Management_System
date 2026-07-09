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

  // Load initial tab/case from URL query params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') as ActiveTab;
      const caseId = params.get('caseId');
      
      if (tab && ['dashboard', 'cases', 'evidence'].includes(tab)) {
        setActiveTab(tab);
      }
      if (caseId) {
        setSelectedCaseId(Number(caseId));
      }
    }
  }, []);

  // Sync state with back/forward history buttons
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') as ActiveTab;
      const caseId = params.get('caseId');
      
      setActiveTab(tab || 'dashboard');
      setSelectedCaseId(caseId ? Number(caseId) : null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const updateRoute = (tab: ActiveTab, caseId: number | null) => {
    setActiveTab(tab);
    setSelectedCaseId(caseId);
    
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams();
      params.set('tab', tab);
      if (caseId !== null) {
        params.set('caseId', String(caseId));
      }
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.pushState({ tab, caseId }, '', newUrl);
    }
  };

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

  const handleDeleteCase = async (caseId: number) => {
    try {
      const res = await fetch(`/api/cases/${caseId}?operator_id=${currentUser?.user_id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteEvidence = async (evidenceId: number) => {
    try {
      const res = await fetch(`/api/evidence/${evidenceId}?operator_id=${currentUser?.user_id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectCase = (caseId: number) => {
    updateRoute('cases', caseId);
  };

  const handleDashboardNavigate = (tabName: ActiveTab) => {
    updateRoute(tabName, null);
  };

  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans print:h-auto print:overflow-visible">
      
      {/* 1. Left Sidebar Rail */}
      <div className="print:hidden">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            updateRoute(tab, null);
          }}
          currentUser={currentUser}
          onLogout={handleLogout}
          roles={roles}
          departments={departments}
        />
      </div>

      {/* 2. Right Workspace Panel */}
      <main className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-8 print:p-0 print:overflow-visible print:bg-white">
        <div className="max-w-7xl mx-auto space-y-6 print:space-y-0">
          
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
                onBack={() => updateRoute('cases', null)}
                onDataChange={fetchAllData}
              />
            ) : (
              <CasesView
                cases={cases}
                users={users}
                crimeScenes={crimeScenes}
                onCreateCase={handleCreateCase}
                onSelectCase={handleSelectCase}
                currentUser={currentUser}
                onDeleteCase={handleDeleteCase}
                onDataChange={fetchAllData}
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
              onDeleteEvidence={handleDeleteEvidence}
              onDataChange={fetchAllData}
            />
          )}

        </div>
      </main>

    </div>
  );
}
