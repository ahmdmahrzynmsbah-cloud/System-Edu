import re

with open('src/components/SuperAdminDashboard.tsx', 'r') as f:
    content = f.read()

import_str = "import { ShieldCheck, Plus, Search, Check, AlertTriangle, Users, Database, Globe, Play, Square, Settings, UploadCloud, LogOut, CheckCircle, DatabaseZap, Clock, FileWarning, Eye, Trash2, Edit3, X, Copy, Zap, Heart } from 'lucide-react';"
new_import = import_str + "\nimport { getAllTenants, saveTenant, deleteTenant, subscribeToTenants } from '../lib/tenantsApi';"

if "getAllTenants" not in content:
    content = content.replace(import_str, new_import)

load_tenants_old = """  // Load and seed tenants and log on mount
  useEffect(() => {
    // 1. Tenants Load
    const savedTenants = localStorage.getItem('sams_system_tenants');
    let loadedTenants: Tenant[] = [];
    if (savedTenants) {
      loadedTenants = JSON.parse(savedTenants);
    } else {
      // Seed default teachers
      loadedTenants = [
        {
          id: 'tenant-1',
          name: 'الأستاذ أحمد كمال',
          phone: '01012345678',
          password: '123',
          status: 'active',
          joinedDate: '2026-06-01',
          expiryDate: '2026-12-31',
          appName: 'أكاديمية أحمد كمال للغة العربية',
          features: ['dashboard', 'students', 'classes', 'attendance', 'exams', 'fees', 'notifications', 'settings'],
          pricePaid: 1500,
          maxStudents: 100,
          maxSecretaries: 3,
          whatsappGatewayEnabled: true
        }
      ];
      localStorage.setItem('sams_system_tenants', JSON.stringify(loadedTenants));
    }
    setTenants(loadedTenants);
    scanDatabaseIsolation(loadedTenants);

    // 2. Logs Load
    const savedLogs = localStorage.getItem('sams_super_admin_audit_logs');
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    } else {
      const initLog: SuperAdminLog = {
        id: 'log-initial',
        timestamp: new Date().toISOString(),
        action: 'تأسيس النظام',
        details: 'تم تدشين لوحة تحكم الإدارة العامة للسوبر أدمن',
        type: 'info'
      };
      setLogs([initLog]);
      localStorage.setItem('sams_super_admin_audit_logs', JSON.stringify([initLog]));
    }
  }, []);"""

load_tenants_new = """  // Load and seed tenants and log on mount
  useEffect(() => {
    // 1. Tenants Load
    const loadData = async () => {
      try {
        const dbTenants = await getAllTenants();
        if (dbTenants.length > 0) {
          setTenants(dbTenants);
          scanDatabaseIsolation(dbTenants);
        } else {
          const loadedTenants: Tenant[] = [
            {
              id: 'tenant-1',
              name: 'الأستاذ أحمد كمال',
              phone: '01012345678',
              password: '123',
              status: 'active',
              joinedDate: '2026-06-01',
              expiryDate: '2026-12-31',
              appName: 'أكاديمية أحمد كمال للغة العربية',
              features: ['dashboard', 'students', 'classes', 'attendance', 'exams', 'fees', 'notifications', 'settings'],
              pricePaid: 1500,
              maxStudents: 100,
              maxSecretaries: 3,
              whatsappGatewayEnabled: true
            }
          ];
          setTenants(loadedTenants);
          scanDatabaseIsolation(loadedTenants);
          await Promise.all(loadedTenants.map(t => saveTenant(t)));
        }
      } catch (err) {
        console.error("Failed to load tenants:", err);
      }
    };
    loadData();

    const unsubscribe = subscribeToTenants((updatedList) => {
      if (updatedList.length > 0) {
        setTenants(updatedList);
        scanDatabaseIsolation(updatedList);
      }
    });

    // 2. Logs Load
    const savedLogs = localStorage.getItem('sams_super_admin_audit_logs');
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    } else {
      const initLog: SuperAdminLog = {
        id: 'log-initial',
        timestamp: new Date().toISOString(),
        action: 'تأسيس النظام',
        details: 'تم تدشين لوحة تحكم الإدارة العامة للسوبر أدمن',
        type: 'info'
      };
      setLogs([initLog]);
      localStorage.setItem('sams_super_admin_audit_logs', JSON.stringify([initLog]));
    }
    
    return () => unsubscribe();
  }, []);"""

content = content.replace(load_tenants_old, load_tenants_new)

save_tenants_old = """  const saveTenantsToStorage = (updatedList: Tenant[]) => {
    localStorage.setItem('sams_system_tenants', JSON.stringify(updatedList));
    setTenants(updatedList);
    scanDatabaseIsolation(updatedList);
  };"""

save_tenants_new = """  const saveTenantsToStorage = (updatedList: Tenant[]) => {
    localStorage.setItem('sams_system_tenants', JSON.stringify(updatedList));
    setTenants(updatedList);
    scanDatabaseIsolation(updatedList);
  };"""

# Instead of changing saveTenantsToStorage entirely, we'll patch the specific actions (add/edit/delete/toggle)

# ADD
add_old = """    const updated = [...tenants, newTenant];
    saveTenantsToStorage(updated);
    setShowAddModal(false);"""
add_new = """    saveTenant(newTenant).then(() => {
      setShowAddModal(false);
    });"""
content = content.replace(add_old, add_new)

# EDIT
edit_old = """      }
      return t;
    });

    saveTenantsToStorage(updated);
    setShowEditModal(false);
    setSelectedTenant(null);

    addLog('تعديل ترخيص', `تم تحديث رخصة ومميزات المعلم (${formData.name})`, 'info');
    showToast('success', `تم حفظ وتعديل التراخيص بنجاح!`);
  };"""

edit_new = """      }
      return t;
    });

    const updatedTenant = updated.find(t => t.id === selectedTenant!.id);
    if (updatedTenant) {
      saveTenant(updatedTenant).then(() => {
        setShowEditModal(false);
        setSelectedTenant(null);
        addLog('تعديل ترخيص', `تم تحديث رخصة ومميزات المعلم (${formData.name})`, 'info');
        showToast('success', `تم حفظ وتعديل التراخيص بنجاح!`);
      });
    }
  };"""
content = content.replace(edit_old, edit_new)

# DELETE
delete_old = """    if (window.confirm(`⚠️ تحذير مدمر: هل أنت متأكد من مسح المعلم (${name}) نهائياً؟\nسيؤدي هذا الإجراء إلى حذف حسابه وتدمير كافة بيانات طلابه ودرجاتهم ومعاملاتهم الحسابية بالكامل ولا يمكن التراجع!`)) {
      const updated = tenants.filter(t => t.id !== id);
      saveTenantsToStorage(updated);"""
delete_new = """    if (window.confirm(`⚠️ تحذير مدمر: هل أنت متأكد من مسح المعلم (${name}) نهائياً؟\nسيؤدي هذا الإجراء إلى حذف حسابه وتدمير كافة بيانات طلابه ودرجاتهم ومعاملاتهم الحسابية بالكامل ولا يمكن التراجع!`)) {
      deleteTenant(id).then(() => {
        // success
      });"""
content = content.replace(delete_old, delete_new)

# TOGGLE
toggle_old = """      if (t.id === tenant.id) {
        return { ...t, status: nextStatus };
      }
      return t;
    });
    saveTenantsToStorage(updated);"""
toggle_new = """      if (t.id === tenant.id) {
        return { ...t, status: nextStatus };
      }
      return t;
    });
    saveTenant({ ...tenant, status: nextStatus }).then(() => {
      // success
    });"""
content = content.replace(toggle_old, toggle_new)

with open('src/components/SuperAdminDashboard.tsx', 'w') as f:
    f.write(content)

