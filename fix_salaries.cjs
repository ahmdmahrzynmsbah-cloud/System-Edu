const fs = require('fs');
let code = fs.readFileSync('src/components/SalariesManager.tsx', 'utf8');

// 1. Add month to SalaryPayment interface
code = code.replace(
  /amount: number;\n  date: string;/,
  `amount: number;\n  date: string;\n  month: string;`
);

// 2. Add month to formData
code = code.replace(
  /date: new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\],\n    notes: ''/,
  `date: new Date().toISOString().split('T')[0],\n    month: new Date().toISOString().slice(0, 7),\n    notes: ''`
);

// 3. Add month to newPayment object
code = code.replace(
  /amount: Number\(formData\.amount\),\n      date: formData\.date,/,
  `amount: Number(formData.amount),\n      date: formData.date,\n      month: formData.month,`
);

// 4. Update form reset to include month
code = code.replace(
  /setFormData\(\{ secretary_id: '', amount: '', date: new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\], notes: '' \}\);/,
  `setFormData({ secretary_id: '', amount: '', date: new Date().toISOString().split('T')[0], month: new Date().toISOString().slice(0, 7), notes: '' });`
);

// 5. Remove window.confirm from handleDelete
code = code.replace(
  /if \(window\.confirm\('هل أنت متأكد من حذف هذا السجل؟'\)\) \{([\s\S]*?)\}/,
  `$1`
);

// 6. Update the form UI to include month input
code = code.replace(
  /lg:grid-cols-4 gap-4/,
  `lg:grid-cols-5 gap-4`
);

const monthInput = `
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">عن شهر</label>
              <input
                type="month"
                value={formData.month}
                onChange={e => setFormData({ ...formData, month: e.target.value })}
                className="w-full text-sm border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
`;

code = code.replace(
  /<div className="space-y-1.5">\s*<label className="block text-xs font-bold text-slate-700">تاريخ الصرف<\/label>/,
  monthInput + `            <div className="space-y-1.5">\n              <label className="block text-xs font-bold text-slate-700">تاريخ الصرف</label>`
);

code = code.replace(
  /lg:col-span-4/,
  `lg:col-span-5`
);

// 7. Update table headers to include month
code = code.replace(
  /<th className="p-4">التاريخ<\/th>/,
  `<th className="p-4">عن شهر</th>\n                <th className="p-4">التاريخ</th>`
);

// 8. Update table body to include month
code = code.replace(
  /<td className="p-4 text-slate-600">\s*<div className="flex items-center gap-1\.5">\s*<Calendar className="w-3\.5 h-3\.5 text-slate-400" \/>\s*<span className="font-sans">\{payment\.date\}<\/span>\s*<\/div>\s*<\/td>/,
  `                    <td className="p-4 text-slate-600 font-bold">\n                      {payment.month}\n                    </td>\n                    <td className="p-4 text-slate-600">\n                      <div className="flex items-center gap-1.5">\n                        <Calendar className="w-3.5 h-3.5 text-slate-400" />\n                        <span className="font-sans">{payment.date}</span>\n                      </div>\n                    </td>`
);

code = code.replace(
  /colSpan=\{5\}/,
  `colSpan={6}`
);

fs.writeFileSync('src/components/SalariesManager.tsx', code);
