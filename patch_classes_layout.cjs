const fs = require('fs');
let code = fs.readFileSync('src/components/ClassesManager.tsx', 'utf8');

// 1. Remove the active subjects text
code = code.replace(
  /<p className="text-\[10px\] text-slate-400 font-bold uppercase">قائمة المواد الدراسية النشطة بالمجموعة:<\/p>\n\s*\{currentSubjects\.length === 0 \? \(\n\s*<p className="text-\[10px\] text-amber-600 italic">يتم تدريس المحاضرات الأساسية حالياً\.<\/p>\n\s*\) : \(\n\s*<div className="flex flex-wrap gap-1">/g,
  '{currentSubjects.length > 0 && (\n                  <div className="flex flex-wrap gap-1">'
);

// Close the condition properly
code = code.replace(
  /<\/div>\n\s*\)\}\n\s*<\/div>/g,
  '</div>\n                )}\n              </div>'
);

// 2. Change layout of schedule row
const scheduleRowOld = `<div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 font-sans whitespace-nowrap shrink-0">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    مواعيد المجموعة
                  </span>
                  <span className="font-bold text-slate-800 text-[11px] truncate flex-1 text-left mr-2" title={formatDisplaySchedule(cls)}>{formatDisplaySchedule(cls)}</span>
                </div>`;

const scheduleRowNew = `<div className="flex flex-col items-start gap-1 text-slate-600">
                  <span className="flex items-center gap-1.5 font-sans whitespace-nowrap shrink-0">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    مواعيد المجموعة
                  </span>
                  <span className="font-bold text-slate-800 text-[11px] leading-relaxed pr-5" title={formatDisplaySchedule(cls)}>
                    {formatDisplaySchedule(cls)}
                  </span>
                </div>`;

code = code.replace(scheduleRowOld, scheduleRowNew);

fs.writeFileSync('src/components/ClassesManager.tsx', code);
