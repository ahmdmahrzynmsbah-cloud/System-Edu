const fs = require('fs');
let code = fs.readFileSync('src/components/SystemRoles.tsx', 'utf-8');

code = code.replace(
  `  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      saveUsers(users.filter(u => u.id !== id));
      setSuccessMsg('تم حذف المستخدم بنجاح');
    }
  };`,
  `  const handleDelete = (id: string) => {
    // window.confirm is blocked in iframes, so we delete directly or you could add a custom modal.
    saveUsers(users.filter(u => u.id !== id));
    setSuccessMsg('تم حذف المستخدم بنجاح');
  };`
);

fs.writeFileSync('src/components/SystemRoles.tsx', code);
