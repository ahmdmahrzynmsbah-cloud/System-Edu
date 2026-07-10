const fs = require('fs');
let code = fs.readFileSync('src/components/ClassesManager.tsx', 'utf8');

code = code.replace(
  '<h3 className="font-bold text-[#0D5C8C] text-sm mb-4 border-b border-gray-50 pb-2">تأسيس مجموعة دراسية جديدة</h3>',
  '<h3 className="font-bold text-[#0D5C8C] text-sm mb-4 border-b border-gray-50 pb-2">{editingClassId ? "تعديل بيانات المجموعة" : "تأسيس مجموعة دراسية جديدة"}</h3>'
);

code = code.replace(
  'onClick={() => setShowAddClass(false)}',
  'onClick={() => { setShowAddClass(false); setEditingClassId(null); setClassForm({ name: "", schedule_days: "", schedule_time: "", grade_level: "الأول الإعدادي" }); setDayTimes({}); }}'
);

code = code.replace(
  '<button onClick={() => setShowAddClass(true)} className="bg-gradient-to-r from-[#0D5C8C] to-[#1A7FAA] hover:opacity-90 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-[#0D5C8C]/20 transition-all flex items-center gap-2">',
  '<button onClick={() => { setShowAddClass(true); setEditingClassId(null); setClassForm({ name: "", schedule_days: "", schedule_time: "", grade_level: "الأول الإعدادي" }); setDayTimes({}); }} className="bg-gradient-to-r from-[#0D5C8C] to-[#1A7FAA] hover:opacity-90 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-[#0D5C8C]/20 transition-all flex items-center gap-2">'
);

fs.writeFileSync('src/components/ClassesManager.tsx', code);
