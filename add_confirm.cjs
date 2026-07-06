const fs = require('fs');
let code = fs.readFileSync('src/components/SalariesManager.tsx', 'utf8');

code = code.replace(/const handleDelete = \(id: string\) => \{[\s\S]*?\};/, `const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا السجل؟')) {
      const paymentToDelete = payments.find(p => p.id === id);
      if (paymentToDelete) {
        const updated = payments.filter(p => p.id !== id);
        setPayments(updated);
        localStorage.setItem('sams_salaries', JSON.stringify(updated));
        addAuditLog('DELETE', 'salaries', id, \`حذف سجل راتب بقيمة \${paymentToDelete.amount} للسكرتيرة: \${paymentToDelete.secretary_name}\`);
      }
    }
  };`);

fs.writeFileSync('src/components/SalariesManager.tsx', code);
