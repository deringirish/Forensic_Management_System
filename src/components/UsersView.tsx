import React, { useState, useEffect } from 'react';
import { Plus, Trash, Mail, Phone, Search, X, Users } from 'lucide-react';
import { User, Role, Department } from '../types';

interface UsersViewProps {
  currentUser: User;
  roles: Role[];
  departments: Department[];
}

export default function UsersView({ currentUser, roles, departments }: UsersViewProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('password123');
  const [roleId, setRoleId] = useState('2');
  const [deptId, setDeptId] = useState('1');
  const [employeeId, setEmployeeId] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId: number, name: string) => {
    if (userId === currentUser.user_id) {
      alert("You cannot delete your own logged-in account!");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete user account for ${name}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchUsers();
      } else {
        alert("Failed to delete user.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email) return;

    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          password,
          role_id: Number(roleId),
          department_id: Number(deptId),
          employee_id: employeeId || null,
          status
        })
      });
      if (res.ok) {
        setFirstName('');
        setLastName('');
        setEmail('');
        setPhone('');
        setPassword('password123');
        setRoleId('2');
        setDeptId('1');
        setEmployeeId('');
        setStatus('Active');
        setShowAddModal(false);
        fetchUsers();
      } else {
        alert("Failed to add user account.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || 
      u.email.toLowerCase().includes(query) || 
      (u.employee_id && u.employee_id.toLowerCase().includes(query));
  });

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header Block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>User Accounts & Credentials</span>
          </h1>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mt-1">
            Manage credentials, roles, and departmental assignments
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add User Account</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-3xl shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Search users by name, email, or employee ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-slate-800 placeholder-slate-400 text-xs font-semibold focus:outline-none"
        />
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map(u => {
          const roleName = roles.find(r => r.role_id === u.role_id)?.role_name || 'Officer';
          const deptName = departments.find(d => d.department_id === u.department_id)?.department_name || 'General HQ';
          const initials = `${u.first_name?.[0] || ''}${u.last_name?.[0] || ''}`.toUpperCase();
          const isSelf = u.user_id === currentUser.user_id;

          return (
            <div key={u.user_id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-50 to-blue-500 flex items-center justify-center font-bold text-white text-xs shrink-0 uppercase shadow-inner">
                      {initials}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs tracking-tight">
                        {u.first_name} {u.last_name} {isSelf && <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded ml-1 uppercase">Self</span>}
                      </h4>
                      <span className="font-mono text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
                        ID: {u.employee_id}
                      </span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold ${
                    u.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {u.status.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-2 text-slate-600 text-xs">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate text-[11px] font-semibold">{u.email}</span>
                  </div>
                  {u.phone && (
                    <div className="flex items-center gap-2 text-slate-650 text-xs">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-[11px] font-semibold">{u.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-[10px]">
                <div className="space-y-0.5">
                  <span className="text-[8px] text-indigo-600 font-black bg-indigo-50 px-1.5 py-0.5 rounded uppercase tracking-wider block w-fit">
                    {roleName}
                  </span>
                  <span className="text-slate-550 font-bold text-[9px] block">
                    {deptName}
                  </span>
                </div>
                {!isSelf && (
                  <button
                    onClick={() => handleDeleteUser(u.user_id, `${u.first_name} ${u.last_name}`)}
                    className="p-2 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-all cursor-pointer border border-transparent hover:border-red-100"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredUsers.length === 0 && (
        <div className="p-12 border border-dashed border-slate-200 rounded-3xl text-center text-slate-400 text-xs font-semibold bg-white">
          No user accounts found matching your search.
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900">Add User Account</h3>
                <p className="text-[10px] text-slate-500 font-medium uppercase mt-0.5">Register new system credentials</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Marcus"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Burnett"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="E.g. marcus@forensics.gov"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="E.g. +1 (555) 012-3456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Employee ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="Auto-generated if empty"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Status *</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold focus:outline-none focus:bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Access Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Access Role *</label>
                  <select
                    value={roleId}
                    onChange={(e) => setRoleId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold focus:outline-none focus:bg-white"
                  >
                    {roles.map(r => (
                      <option key={r.role_id} value={r.role_id}>{r.role_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Department *</label>
                  <select
                    value={deptId}
                    onChange={(e) => setDeptId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold focus:outline-none focus:bg-white"
                  >
                    {departments.map(d => (
                      <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 text-xs font-bold cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer active:scale-[0.98]"
                >
                  {loading ? 'Creating...' : 'Register User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
