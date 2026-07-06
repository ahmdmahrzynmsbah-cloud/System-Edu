const fs = require('fs');
let code = fs.readFileSync('src/components/SalariesManager.tsx', 'utf8');

// 1. Add state for paymentToDelete
code = code.replace(/const \[searchTerm, setSearchTerm\] = useState\(''\);/,
  `const [searchTerm, setSearchTerm] = useState('');\n  const [paymentToDelete, setPaymentToDelete] = useState<SalaryPayment | null>(null);`);

// 2. Change handleDelete to set paymentToDelete instead of window.confirm
code = code.replace(/const handleDelete = \(id: string\) => \{[\s\S]*?^\s*\};/m,
  `const confirmDelete = () => {
    if (!paymentToDelete) return;
    const paymentId = paymentToDelete.id;
    const updated = payments.filter(p => p.id !== paymentId);
    setPayments(updated);
    localStorage.setItem('sams_salaries', JSON.stringify(updated));
    addAuditLog('DELETE', 'salaries', paymentId, \`حذف سجل راتب بقيمة \${paymentToDelete.amount} للسكرتيرة: \${paymentToDelete.secretary_name}\`);
    setPaymentToDelete(null);
  };`);

// 3. Update the delete button in the table to set paymentToDelete
code = code.replace(/onClick=\{.*?handleDelete\(payment\.id\).*?\}/,
  `onClick={() => setPaymentToDelete(payment)}`);

// 4. Add the modal rendering just before the final </div> of SalariesManager
const modalHtml = `
      {/* Delete Confirmation Modal */}
      {paymentToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" dir="rtl">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-md w-full p-6 text-right space-y-4 animate-scale-up">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-950 text-sm">إلغاء وحذف سجل راتب</h3>
                <p className="text-[11px] text-slate-500 font-sans font-medium">سيتم حذف المعاملة من السجلات المالية</p>
              </div>
            </div>
            
            <div className="text-xs text-slate-700 leading-relaxed font-sans space-y-1.5 py-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <p>هل أنت متأكد من رغبتك في حذف سجل راتب بقيمة <strong className="text-red-700">{paymentToDelete.amount} ج.م</strong> للسكرتيرة <strong className="text-red-700">{paymentToDelete.secretary_name}</strong>؟</p>
              <p className="text-[10px] text-slate-400">تحذير: سيتم حذف هذا السجل نهائياً ولن يمكن التراجع عن هذا الإجراء.</p>
            </div>
            
            <div className="flex gap-2 pt-2 border-t border-slate-50">
              <button 
                type="button" 
                onClick={() => setPaymentToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                تراجع وإلغاء
              </button>
              <button 
                type="button" 
                onClick={confirmDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm shadow-red-200 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>نعم، تأكيد الحذف</span>
              </button>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace(/    <\/div>\s*<\/div>\s*<\/div>\s*\);\s*\}\s*$/, 
  `    </div>\n      </div>\n${modalHtml}\n    </div>\n  );\n}\n`);

fs.writeFileSync('src/components/SalariesManager.tsx', code);
