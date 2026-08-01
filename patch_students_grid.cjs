const fs = require('fs');
let code = fs.readFileSync('src/components/StudentsList.tsx', 'utf8');

const sortByStr = `              </select>
            </div>
          </div>`;

const newSortByStr = `              </select>
            </div>
          </div>
          
          {/* 7. Archive Toggle */}
          <button
            onClick={() => setViewArchivedStudents(!viewArchivedStudents)}
            className={\`h-12 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border \${viewArchivedStudents ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}\`}
          >
            {viewArchivedStudents ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
            {viewArchivedStudents ? 'عرض الطلاب النشطين' : 'عرض أرشيف الطلاب'}
          </button>`;

code = code.replace(sortByStr, newSortByStr);
fs.writeFileSync('src/components/StudentsList.tsx', code);
