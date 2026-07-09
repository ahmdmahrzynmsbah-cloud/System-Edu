import re

with open('src/components/SystemRoles.tsx', 'r') as f:
    content = f.read()

# Make sure imports are correct
if "getSystemUsersByTenant" not in content:
    content = content.replace(
        "import { Shield, Key, User, Plus, Check, X, Trash2, Edit2, Lock } from 'lucide-react';",
        "import { Shield, Key, User, Plus, Check, X, Trash2, Edit2, Lock } from 'lucide-react';\nimport { getSystemUsersByTenant, saveSystemUser, deleteSystemUser, subscribeToSystemUsers } from '../lib/usersApi';"
    )

# Find loadData
load_data_old = """    const tenantId = localStorage.getItem('sams_current_tenant_id') || 'default';
    const saved = localStorage.getItem(`${tenantId}_sams_system_users`) || localStorage.getItem('sams_system_users');
    if (saved) {
      setUsers(JSON.parse(saved));
    } else {
      const defaultUsers: SystemUser[] = [
        { id: 'u-1', name: 'المدير الأكاديمي', role: 'teacher', password: '123', isDefault: true },
        { id: 'u-2', name: 'أ. سارة علي', role: 'secretary', password: '456', isDefault: true }
      ];
      setUsers(defaultUsers);
      localStorage.setItem('sams_system_users', JSON.stringify(defaultUsers));
      localStorage.setItem(`${tenantId}_sams_system_users`, JSON.stringify(defaultUsers));
    }"""

load_data_new = """    const tenantId = localStorage.getItem('sams_current_tenant_id') || 'default';
    try {
      const dbUsers = await getSystemUsersByTenant(tenantId);
      if (dbUsers.length > 0) {
        setUsers(dbUsers);
      } else {
        const defaultUsers: SystemUser[] = [
          { id: 'u-1', name: 'المدير الأكاديمي', role: 'teacher', password: '123', isDefault: true, tenantId },
          { id: 'u-2', name: 'أ. سارة علي', role: 'secretary', password: '456', isDefault: true, tenantId }
        ];
        setUsers(defaultUsers);
        // Save defaults to Firebase
        await Promise.all(defaultUsers.map(u => saveSystemUser(u)));
      }
    } catch (err) {
      console.error('Failed to load users from Firebase:', err);
    }"""
content = content.replace(load_data_old, load_data_new)

# add async to loadData
content = content.replace("const loadData = () => {", "const loadData = async () => {")

# find useeffect and add subscription
useeffect_old = """  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);"""

useeffect_new = """  useEffect(() => {
    loadData();
    const tenantId = localStorage.getItem('sams_current_tenant_id') || 'default';
    const unsubscribe = subscribeToSystemUsers(tenantId, (newUsers) => {
      if (newUsers.length > 0) {
        setUsers(newUsers);
      }
    });
    return () => unsubscribe();
  }, []);"""
content = content.replace(useeffect_old, useeffect_new)

# handle submit adding user
new_user_old = """      const newUser: SystemUser = {
        id: 'u-' + Date.now(),
        name: formData.name,
        role: formData.role as 'teacher' | 'secretary',
        permissions: formData.permissions || [],
        password: formData.password
      };
      saveUsers([...users, newUser]);
      setSuccessMsg('تم إضافة سكرتيرة جديدة بنجاح');"""

new_user_new = """      const tenantId = localStorage.getItem('sams_current_tenant_id') || 'default';
      const newUser: SystemUser = {
        id: 'u-' + Date.now(),
        name: formData.name,
        role: formData.role as 'teacher' | 'secretary',
        permissions: formData.permissions || [],
        password: formData.password,
        tenantId: tenantId
      };
      saveSystemUser(newUser).then(() => {
        setSuccessMsg(formData.role === 'teacher' ? 'تم إضافة مدرس بنجاح' : 'تم إضافة سكرتيرة جديدة بنجاح');
      }).catch(err => {
        setErrorMsg('حدث خطأ أثناء الإضافة');
      });"""
content = content.replace(new_user_old, new_user_new)

# update saving logic
handle_submit_old = """    if (editingId) {
      const updated = users.map(u => u.id === editingId ? { ...u, name: formData.name!, password: formData.password!, role: formData.role!, permissions: formData.permissions || [] } as SystemUser : u);
      saveUsers(updated);
      setSuccessMsg('تم تعديل بيانات المستخدم بنجاح');
    } else {"""
handle_submit_new = """    if (editingId) {
      const updatedUser = { ...users.find(u => u.id === editingId), name: formData.name!, password: formData.password!, role: formData.role!, permissions: formData.permissions || [] } as SystemUser;
      saveSystemUser(updatedUser).then(() => {
        setSuccessMsg('تم تعديل بيانات المستخدم بنجاح');
      }).catch(err => {
        setErrorMsg('حدث خطأ أثناء الحفظ');
      });
    } else {"""
content = content.replace(handle_submit_old, handle_submit_new)

# handle delete
delete_old = """  const handleDelete = () => {
    if (userToDelete) {
      saveUsers(users.filter(u => u.id !== userToDelete));
      setSuccessMsg('تم حذف المستخدم بنجاح');
      setUserToDelete(null);
    }
  };"""
delete_new = """  const handleDelete = () => {
    if (userToDelete) {
      deleteSystemUser(userToDelete).then(() => {
        setSuccessMsg('تم حذف المستخدم بنجاح');
        setUserToDelete(null);
      }).catch(err => {
        setErrorMsg('حدث خطأ أثناء الحذف');
        setUserToDelete(null);
      });
    }
  };"""
content = content.replace(delete_old, delete_new)

with open('src/components/SystemRoles.tsx', 'w') as f:
    f.write(content)

