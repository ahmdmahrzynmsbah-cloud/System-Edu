const fs = require('fs');
let code = fs.readFileSync('src/components/ClassesManager.tsx', 'utf8');

code = code.replace(
  '<span className="font-bold text-slate-800">{cls.schedule_days ? `${cls.schedule_days} - ${cls.schedule_time || \'\'}` : \'ـ لم تحدد بعد ـ\'}</span>',
  '<span className="font-bold text-slate-800 text-xs truncate max-w-[200px]" title={formatDisplaySchedule(cls)}>{formatDisplaySchedule(cls)}</span>'
);

fs.writeFileSync('src/components/ClassesManager.tsx', code);
