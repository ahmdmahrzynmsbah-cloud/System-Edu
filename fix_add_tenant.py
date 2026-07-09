import re

with open('src/components/SuperAdminDashboard.tsx', 'r') as f:
    content = f.read()

old_add = """    saveTenant(newTenant).then(() => {
      setShowAddModal(false);
    });"""
new_add = """    saveTenant(newTenant).then(() => {
      setShowAddModal(false);
      const updated = [...tenants, newTenant];
      setTenants(updated);
      localStorage.setItem('sams_system_tenants', JSON.stringify(updated));
    }).catch(err => {
      console.error(err);
      alert('حدث خطأ أثناء الحفظ في قاعدة البيانات. يرجى المحاولة مرة أخرى.');
    });"""

content = content.replace(old_add, new_add)

old_edit = """    const updatedTenant = updated.find(t => t.id === selectedTenant!.id);
    if (updatedTenant) {
      saveTenant(updatedTenant).then(() => {
        setShowEditModal(false);
        setSelectedTenant(null);
        addLog('تعديل ترخيص', `تم تحديث رخصة ومميزات المعلم (${formData.name})`, 'info');
        showToast('success', `تم حفظ وتعديل التراخيص بنجاح!`);
      });
    }"""
new_edit = """    const updatedTenant = updated.find(t => t.id === selectedTenant!.id);
    if (updatedTenant) {
      saveTenant(updatedTenant).then(() => {
        setShowEditModal(false);
        setSelectedTenant(null);
        setTenants(updated);
        localStorage.setItem('sams_system_tenants', JSON.stringify(updated));
        addLog('تعديل ترخيص', `تم تحديث رخصة ومميزات المعلم (${formData.name})`, 'info');
        showToast('success', `تم حفظ وتعديل التراخيص بنجاح!`);
      }).catch(err => {
        alert('حدث خطأ أثناء التعديل.');
      });
    }"""

content = content.replace(old_edit, new_edit)

old_del = """    if (window.confirm(`⚠️ تحذير مدمر: هل أنت متأكد من مسح المعلم (${name}) نهائياً؟\\nسيؤدي هذا الإجراء إلى حذف حسابه وتدمير كافة بيانات طلابه ودرجاتهم ومعاملاتهم الحسابية بالكامل ولا يمكن التراجع!`)) {
      deleteTenant(id).then(() => {
        // success
      });"""

new_del = """    if (window.confirm(`⚠️ تحذير مدمر: هل أنت متأكد من مسح المعلم (${name}) نهائياً؟\\nسيؤدي هذا الإجراء إلى حذف حسابه وتدمير كافة بيانات طلابه ودرجاتهم ومعاملاتهم الحسابية بالكامل ولا يمكن التراجع!`)) {
      deleteTenant(id).then(() => {
        const updated = tenants.filter(t => t.id !== id);
        setTenants(updated);
        localStorage.setItem('sams_system_tenants', JSON.stringify(updated));
      });"""

content = content.replace(old_del, new_del)

old_toggle = """    saveTenant({ ...tenant, status: nextStatus }).then(() => {
      // success
    });"""

new_toggle = """    saveTenant({ ...tenant, status: nextStatus }).then(() => {
      setTenants(updated);
      localStorage.setItem('sams_system_tenants', JSON.stringify(updated));
    });"""

content = content.replace(old_toggle, new_toggle)

with open('src/components/SuperAdminDashboard.tsx', 'w') as f:
    f.write(content)
