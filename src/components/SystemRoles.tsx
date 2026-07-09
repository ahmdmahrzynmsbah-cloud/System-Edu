import React, { useState, useEffect } from 'react';
import { Shield, Key, User, Plus, Check, X, Trash2, Edit2, Lock } from 'lucide-react';
import { getSystemUsersByTenant, saveSystemUser, deleteSystemUser, subscribeToSystemUsers } from '../lib/usersApi';

interface SystemUser {
  id: string;
  name: string;
  role: 'teacher' | 'secretary';
  password: string;
  isDefault?: boolean;
  permissions?: string[];
  tenantId?: string;
}

interface SystemRolesProps {
  onRefreshAllData: () => void;
}

export default function SystemRoles({ onRefreshAllData }: SystemRolesProps) {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<SystemUser>>({ role: 'secretary', name: '', password: '', permissions: [] });
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  
  const availableTabs = [
    { id: 'dashboard', label: 'لوحة التحكم والمؤشرات' },
    { id: 'students', label: 'إدارة الطلاب والقبول' },
    { id: 'parents', label: 'إدارة أولياء الأمور' },
    { id: 'barcodes', label: 'باركود الطلاب' },
    { id: 'attendance', label: 'الحضور والانتظام اليومي' },
    { id: 'exams', label: 'الامتحانات والواجبات' },
    { id: 'books', label: 'المذكرات والملازم' },
    { id: 'classes', label: 'المجموعات والجدول والمقررات' },
    { id: 'fees', label: 'اشتراكات الشهر والحسابات' },
    { id: 'notifications', label: 'بث الرسائل وتواصل الآباء' },
    { id: 'roles', label: 'الصلاحيات وتدقيق الأمان' },
    { id: 'audit', label: 'سجل المعاملات الحية' }
  ];

  const handleTogglePermission = (tabId: string) => {
    const current = formData.permissions || [];
    if (current.includes(tabId)) {
      setFormData({ ...formData, permissions: current.filter(id => id !== tabId) });
    } else {
      setFormData({ ...formData, permissions: [...current, tabId] });
    }
  };

  useEffect(() => {
    const currentTenantId = localStorage.getItem('sams_current_tenant_id') || 'default';
    const unsubscribe = subscribeToSystemUsers(currentTenantId, (dbUsers) => {
      if (dbUsers.length > 0) {
        setUsers(dbUsers);
      } else {
        // Fallback to local storage migration if no users exist in db
        loadUsers();
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  const loadUsers = async () => {
    const currentTenantId = localStorage.getItem('sams_current_tenant_id') || 'default';
    try {
      const dbUsers = await getSystemUsersByTenant(currentTenantId);
      if (dbUsers.length > 0) {
        setUsers(dbUsers);
      } else {
        // Fallback to local storage migration
        const saved = localStorage.getItem(`${currentTenantId}_sams_system_users`) || localStorage.getItem('sams_system_users');
        let defaultUsers: SystemUser[] = [];
        if (saved) {
           defaultUsers = JSON.parse(saved);
        } else {
           defaultUsers = [
            { id: 'u-1', name: 'المدير الأكاديمي', role: 'teacher', password: '123', isDefault: true, tenantId: currentTenantId },
            { id: 'u-2', name: 'أ. سارة علي', role: 'secretary', password: '456', isDefault: true, tenantId: currentTenantId }
          ];
        }
        
        // Ensure tenantId is set for all migrated users
        defaultUsers = defaultUsers.map(u => ({...u, tenantId: currentTenantId}));
        
        setUsers(defaultUsers);
        // Save defaults to Firebase
        await Promise.all(defaultUsers.map(u => saveSystemUser(u)));
      }
    } catch (err) {
      console.error('Failed to load users from Firebase:', err);
    }
  };

  const saveUsers = async (newUsers: SystemUser[]) => {
    // Handled individually in submit
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.password) return;
    setErrorMsg('');

    if (editingId) {
      const updatedUser = { ...users.find(u => u.id === editingId), name: formData.name!, password: formData.password!, role: formData.role!, permissions: formData.permissions || [] } as SystemUser;
      saveSystemUser(updatedUser).then(() => {
        setSuccessMsg('تم تعديل بيانات المستخدم بنجاح');
        setUsers(users.map(u => u.id === editingId ? updatedUser : u));
      }).catch(err => {
        setErrorMsg('حدث خطأ أثناء الحفظ');
      });
    } else {
      // Limit verification for adding a new secretary
      
      if (localStorage.getItem('sams_current_tenant_id') !== 'super-admin' && localStorage.getItem('sams_current_tenant_id') !== 'default' && formData.role === 'secretary') {
        try {
          const savedTenants = localStorage.getItem('sams_system_tenants');
          if (savedTenants) {
            const tenants = JSON.parse(savedTenants);
            const currentTenant = tenants.find((t: any) => t.id === localStorage.getItem('sams_current_tenant_id'));
            if (currentTenant) {
              const maxSecretaries = currentTenant.maxSecretaries || 3;
              const currentSecretaries = users.filter(u => u.role === 'secretary').length;
              if (currentSecretaries >= maxSecretaries) {
                setErrorMsg(`⚠️ تم تجاوز الحد الأقصى المسموح به للسكرتارية لهذا الاشتراك الحالي وهو (${maxSecretaries} سكرتيرة). يرجى مراجعة الإدارة لترقية الاشتراك.`);
                return;
              }
            }
          }
        } catch (err) {}
      }

      
      const newUser: SystemUser = {
        id: 'u-' + Date.now(),
        name: formData.name,
        role: formData.role as 'teacher' | 'secretary',
        permissions: formData.permissions || [],
        password: formData.password,
        tenantId: localStorage.getItem('sams_current_tenant_id') || 'default'
      };
      saveSystemUser(newUser).then(() => {
        setSuccessMsg(formData.role === 'teacher' ? 'تم إضافة مدرس بنجاح' : 'تم إضافة سكرتيرة جديدة بنجاح');
        setUsers([...users, newUser]);
      }).catch(err => {
        setErrorMsg('حدث خطأ أثناء الإضافة');
      });
    }
    
    setShowAddForm(false);
    setEditingId(null);
    setFormData({ role: 'secretary', name: '', password: '', permissions: [] });
  };

  const confirmDelete = (id: string) => {
    setUserToDelete(id);
  };

  const handleDelete = () => {
    if (userToDelete) {
      deleteSystemUser(userToDelete).then(() => {
        setSuccessMsg('تم حذف المستخدم بنجاح');
        setUsers(users.filter(u => u.id !== userToDelete));
        setUserToDelete(null);
      }).catch(err => {
        setErrorMsg('حدث خطأ أثناء الحذف');
        setUserToDelete(null);
      });
    }
  };

  const handleEdit = (user: SystemUser) => {
    setFormData({ name: user.name, password: user.password, role: user.role, permissions: user.permissions || [] });
    setEditingId(user.id);
    setShowAddForm(true);
  };

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">إدارة المستخدمين والصلاحيات</h1>
          <p className="text-sm text-slate-500 mt-1">تغيير كلمات المرور وإضافة حسابات سكرتارية جديدة</p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingId(null);
            setFormData({ role: 'secretary', name: '', password: '', permissions: [] });
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#0D5C8C] hover:bg-[#1A7FAA] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة سكرتيرة جديدة</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span className="font-bold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
          <X className="w-4 h-4 text-red-600" />
          <span className="font-bold">{errorMsg}</span>
        </div>
      )}

      {showAddForm && (
        <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-[#0D5C8C]/20 shadow-xs mb-6">
          <h3 className="font-bold text-[#0D5C8C] text-sm mb-4 border-b border-slate-50 pb-2">
            {editingId ? 'تعديل بيانات المستخدم' : 'إضافة سكرتيرة جديدة'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">الاسم</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full text-sm border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-[#0D5C8C]"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">كلمة المرور (الرمز السري)</label>
              <input
                type="text"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="w-full text-sm border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-[#0D5C8C]"
                required
              />
            </div>

            {!editingId && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">الصلاحية</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full text-sm border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-[#0D5C8C]"
                >
                  <option value="secretary">سكرتيرة</option>
                  <option value="teacher">مدير النظام (أدمن)</option>
                </select>
              </div>
            )}
            {editingId && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">تغيير الصلاحية الأساسية</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full text-sm border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-[#0D5C8C]"
                >
                  <option value="secretary">سكرتيرة</option>
                  <option value="teacher">مدير النظام (أدمن)</option>
                </select>
              </div>
            )}
            
            <div className="md:col-span-3 mt-4 border-t border-slate-100 pt-4">
              <label className="block text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#0D5C8C]" />
                التحكم المخصص في الصفحات المسموحة (اختر ما يمكنه رؤيته)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {availableTabs.map(tab => {
                  const isSelected = formData.permissions?.includes(tab.id);
                  return (
                    <div 
                      key={tab.id}
                      onClick={() => handleTogglePermission(tab.id)}
                      className={`cursor-pointer p-3 rounded-xl border flex items-center gap-2 transition-all ${
                        isSelected 
                          ? 'bg-sky-50 border-sky-200 text-[#0D5C8C]' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'bg-[#0D5C8C] border-[#0D5C8C]' : 'border-slate-300'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-xs font-bold">{tab.label}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-500 mt-2">* إذا لم تقم بتحديد أي صفحات، فسيتم تطبيق الصلاحيات الافتراضية الخاصة بالدور المختار.</p>
            </div>

            <div className="md:col-span-3 flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-[#0D5C8C] hover:bg-[#1A7FAA] rounded-lg flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                حفظ البيانات
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs font-bold">
            <tr>
              <th className="p-4">الاسم</th>
              <th className="p-4">نوع الصلاحية</th>
              <th className="p-4">كلمة المرور</th>
              <th className="p-4 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/50">
                <td className="p-4 font-bold text-slate-800">{u.name}</td>
                <td className="p-4">
                  {u.role === 'teacher' ? (
                    <span className="bg-[#0D5C8C]/10 text-[#0D5C8C] px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 w-max">
                      <Shield className="w-3 h-3" /> المدير الأكاديمي
                    </span>
                  ) : (
                    <span className="bg-sky-100 text-sky-700 px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 w-max">
                      <User className="w-3 h-3" /> سكرتيرة
                    </span>
                  )}
                </td>
                <td className="p-4 font-mono text-slate-600">
                  <span className="bg-slate-100 px-2 py-1 rounded text-xs">{u.password}</span>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleEdit(u)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                      title="تغيير كلمة المرور أو الاسم"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {u.id !== 'u-1' && (
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); confirmDelete(u.id); }}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {userToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-scale-up">
            <div className="bg-rose-50 p-6 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <Trash2 className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">تأكيد الحذف</h3>
              <p className="text-sm text-slate-600">
                هل أنت متأكد من حذف هذا المستخدم نهائياً؟ لا يمكن التراجع عن هذه الخطوة.
              </p>
            </div>
            <div className="p-4 bg-gray-50 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(); }}
                className="flex-1 py-2.5 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-colors shadow-sm text-sm"
              >
                نعم، احذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
