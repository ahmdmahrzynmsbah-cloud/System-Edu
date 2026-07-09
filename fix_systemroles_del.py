import re

with open('src/components/SystemRoles.tsx', 'r') as f:
    content = f.read()

old_del = """  const handleDelete = () => {
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

new_del = """  const handleDelete = () => {
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
  };"""

content = content.replace(old_del, new_del)

with open('src/components/SystemRoles.tsx', 'w') as f:
    f.write(content)
