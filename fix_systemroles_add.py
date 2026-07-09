import re

with open('src/components/SystemRoles.tsx', 'r') as f:
    content = f.read()

old_add = """      saveSystemUser(newUser).then(() => {
        setSuccessMsg(formData.role === 'teacher' ? 'تم إضافة مدرس بنجاح' : 'تم إضافة سكرتيرة جديدة بنجاح');
      }).catch(err => {
        setErrorMsg('حدث خطأ أثناء الإضافة');
      });"""

new_add = """      saveSystemUser(newUser).then(() => {
        setSuccessMsg(formData.role === 'teacher' ? 'تم إضافة مدرس بنجاح' : 'تم إضافة سكرتيرة جديدة بنجاح');
        setUsers([...users, newUser]);
      }).catch(err => {
        setErrorMsg('حدث خطأ أثناء الإضافة');
      });"""

content = content.replace(old_add, new_add)

old_edit = """      saveSystemUser(updatedUser).then(() => {
        setSuccessMsg('تم تعديل بيانات المستخدم بنجاح');
      }).catch(err => {
        setErrorMsg('حدث خطأ أثناء الحفظ');
      });"""

new_edit = """      saveSystemUser(updatedUser).then(() => {
        setSuccessMsg('تم تعديل بيانات المستخدم بنجاح');
        setUsers(users.map(u => u.id === editingId ? updatedUser : u));
      }).catch(err => {
        setErrorMsg('حدث خطأ أثناء الحفظ');
      });"""

content = content.replace(old_edit, new_edit)

old_del = """  const handleDelete = () => {
    if (userToDelete) {
      deleteSystemUser(userToDelete).then(() => {
        setSuccessMsg('تم حذف المستخدم بنجاح');
        setUserToDelete(null);
      }).catch(err => {
        setErrorMsg('حدث خطأ أثناء الحذف');
      });
    }
  };"""

new_del = """  const handleDelete = () => {
    if (userToDelete) {
      deleteSystemUser(userToDelete).then(() => {
        setSuccessMsg('تم حذف المستخدم بنجاح');
        setUsers(users.filter(u => u.id !== userToDelete));
        setUserToDelete(null);
      }).catch(err => {
        setErrorMsg('حدث خطأ أثناء الحذف');
      });
    }
  };"""

content = content.replace(old_del, new_del)

with open('src/components/SystemRoles.tsx', 'w') as f:
    f.write(content)
