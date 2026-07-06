const fs = require('fs');
let code = fs.readFileSync('src/components/SystemAuditLogs.tsx', 'utf8');

// Change actorFilter state
code = code.replace(
  /const \[actorFilter, setActorFilter\] = useState<'all' \| 'secretary' \| 'admin'>\('all'\);/,
  "const [actorFilter, setActorFilter] = useState<string>('all');\n  const [systemUsers, setSystemUsers] = useState<any[]>([]);"
);

// Add users loading in useEffect
const effectTarget = `  useEffect(() => {
    setAuditLogs(samsDb.getAuditLogs());
  }, []);`;
const effectReplacement = `  useEffect(() => {
    setAuditLogs(samsDb.getAuditLogs());
    const saved = localStorage.getItem('sams_system_users');
    if (saved) {
      setSystemUsers(JSON.parse(saved));
    }
  }, []);`;
code = code.replace(effectTarget, effectReplacement);

// Change filteredLogs logic for Actor Filter
const filterLogicTarget = `    // 2. Actor Filter
    const isSec = log.user_role === 'secretary' || log.user_name.includes('سارة') || log.user_name.includes('سكرتير');
    if (actorFilter === 'secretary' && !isSec) return false;
    if (actorFilter === 'admin' && isSec) return false; // non-secretary (admin/principal/teacher)`;
const filterLogicReplacement = `    // 2. Actor Filter
    const isSec = log.user_role === 'secretary' || log.user_name.includes('سارة') || log.user_name.includes('سكرتير');
    if (actorFilter === 'admin' && isSec) return false;
    if (actorFilter !== 'all' && actorFilter !== 'admin') {
      // It's a specific secretary name
      if (log.user_name !== actorFilter) return false;
    }`;
code = code.replace(filterLogicTarget, filterLogicReplacement);

// Replace UI for Actor Filter
const uiTarget = `            {/* 2. Filter by Actor */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold block">تصفية بحسب القائم بالعملية (المستخدم)</label>
              <div className="flex bg-white rounded-lg p-1 border border-slate-200">
                <button
                  onClick={() => setActorFilter('all')}
                  className={\`flex-1 text-center py-1.5 rounded-md text-[10px] font-bold cursor-pointer transition-all \${
                    actorFilter === 'all' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
                  }\`}
                >
                  كل المستخدمين
                </button>
                <button
                  onClick={() => setActorFilter('secretary')}
                  className={\`flex-1 text-center py-1.5 rounded-md text-[10px] font-bold cursor-pointer transition-all flex items-center justify-center gap-0.5 \${
                    actorFilter === 'secretary' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
                  }\`}
                >
                  <UserCheck className="w-3 h-3" />
                  السكرتيرة سارة
                </button>
                <button
                  onClick={() => setActorFilter('admin')}
                  className={\`flex-1 text-center py-1.5 rounded-md text-[10px] font-bold cursor-pointer transition-all \${
                    actorFilter === 'admin' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
                  }\`}
                >
                  الإدارة والأكاديمي
                </button>
              </div>
            </div>`;

const uiReplacement = `            {/* 2. Filter by Actor */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold block">تصفية بحسب القائم بالعملية (المستخدم)</label>
              <select
                value={actorFilter}
                onChange={(e) => setActorFilter(e.target.value)}
                className="w-full text-xs font-sans border border-slate-200 rounded-lg p-2.5 bg-white text-slate-700 outline-none hover:border-slate-300 transition-all cursor-pointer"
              >
                <option value="all">كل المستخدمين</option>
                <option value="admin">الإدارة والأكاديمي</option>
                {systemUsers.filter(u => u.role === 'secretary').map(u => (
                  <option key={u.id} value={u.name}>سكرتيرة: {u.name}</option>
                ))}
              </select>
            </div>`;

code = code.replace(uiTarget, uiReplacement);

fs.writeFileSync('src/components/SystemAuditLogs.tsx', code);
