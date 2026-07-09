import { Shield, LayoutDashboard, Briefcase, FileSearch, LogOut, Users } from 'lucide-react';

export type ActiveTab = 'dashboard' | 'cases' | 'evidence' | 'users';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentUser: any;
  onLogout: () => void;
  roles: any[];
  departments: any[];
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  roles,
  departments
}: SidebarProps) {
  
  const roleName = roles.find(r => r.role_id === currentUser.role_id)?.role_name || 'Officer';
  const deptName = departments.find(d => d.department_id === currentUser.department_id)?.department_name || 'General HQ';

  const renderNavButton = (id: ActiveTab, label: string, IconComponent: any) => {
    const isActive = activeTab === id;
    return (
      <button
        key={id}
        onClick={() => setActiveTab(id)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all group cursor-pointer ${
          isActive
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
            : 'hover:bg-slate-800/50 hover:text-slate-100 text-slate-400'
        }`}
      >
        <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
        <span>{label}</span>
      </button>
    );
  };

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-850 flex flex-col h-screen text-slate-300 shrink-0 select-none font-sans">
      
      {/* Brand Logo */}
      <div className="p-6 border-b border-slate-850 flex items-center gap-3">
        <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-white text-sm tracking-tight block">Custody Suite</span>
          <span className="text-[9px] text-indigo-500 font-bold tracking-wider uppercase block">Federal Operations</span>
        </div>
      </div>

      {/* User Session Profile Card */}
      <div className="p-4 mx-3 my-4 bg-slate-950/40 border border-slate-850/80 rounded-2xl flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-500 flex items-center justify-center font-bold text-white text-xs shrink-0 uppercase shadow-inner">
          {currentUser.first_name[0]}{currentUser.last_name[0]}
        </div>
        <div className="overflow-hidden">
          <span className="font-bold text-slate-100 text-xs block truncate">
            {currentUser.first_name} {currentUser.last_name}
          </span>
          <span className="text-[10px] text-indigo-400 font-bold block truncate mt-0.5">
            {roleName}
          </span>
          <span className="text-[9px] text-slate-500 font-semibold block truncate mt-0.5 uppercase tracking-wide">
            {deptName}
          </span>
        </div>
      </div>

      {/* Navigation Grouping list */}
      <nav className="flex-1 px-3 space-y-2 overflow-y-auto pb-4 pt-2">
        <span className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">
          Core Operations
        </span>
        {renderNavButton('dashboard', 'Dashboard Hub', LayoutDashboard)}
        {renderNavButton('cases', 'Dossiers & Cases', Briefcase)}
        {renderNavButton('evidence', 'Evidence Locker', FileSearch)}
        {renderNavButton('users', 'User Accounts', Users)}
      </nav>

      {/* Footer / Sign out */}
      <div className="p-4 border-t border-slate-850">
        <div className="flex items-center justify-between text-[9px] text-slate-500 px-2 mb-3 font-mono font-semibold">
          <span>SECURE CONNECTED</span>
          <span>ID: {currentUser.employee_id}</span>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 hover:bg-red-500/10 border border-transparent hover:border-red-500/10 text-slate-400 hover:text-red-400 rounded-2xl text-xs font-bold transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit Secure Session</span>
        </button>
      </div>

    </div>
  );
}
