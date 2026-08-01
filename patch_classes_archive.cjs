const fs = require('fs');
let code = fs.readFileSync('src/components/ClassesManager.tsx', 'utf8');

// Add state
code = code.replace(
  'const [classToDelete, setClassToDelete] = useState<ClassRoom | null>(null);',
  'const [classToDelete, setClassToDelete] = useState<ClassRoom | null>(null);\n  const [viewArchivedClasses, setViewArchivedClasses] = useState(false);\n  const [classToArchive, setClassToArchive] = useState<ClassRoom | null>(null);\n  const [classToRestore, setClassToRestore] = useState<ClassRoom | null>(null);'
);

// Add icons
code = code.replace(
  'import { Plus, BookOpen, User, Users, Maximize2, Search, ShieldAlert, Check, Calendar, Trash2, Edit, CheckCircle, X, ExternalLink, Eye, ArrowRight, Phone, Info } from \'lucide-react\';',
  'import { Plus, BookOpen, User, Users, Maximize2, Search, ShieldAlert, Check, Calendar, Trash2, Edit, CheckCircle, X, ExternalLink, Eye, ArrowRight, Phone, Info, Archive, ArchiveRestore } from \'lucide-react\';'
);

// Add handlers
const archiveHandlers = `
  const confirmArchiveClass = () => {
    if (classToArchive) {
      samsDb.archiveClass(classToArchive.id);
      setSuccessText(\`تم أرشفة المجموعة "\${classToArchive.name}" بنجاح!\`);
      setClassToArchive(null);
      loadData();
    }
  };

  const confirmRestoreClass = () => {
    if (classToRestore) {
      samsDb.restoreClass(classToRestore.id);
      setSuccessText(\`تم استعادة المجموعة "\${classToRestore.name}" بنجاح!\`);
      setClassToRestore(null);
      loadData();
    }
  };

`;

code = code.replace('const confirmDeleteClass = () => {', archiveHandlers + '  const confirmDeleteClass = () => {');

// Add toggle button
const filterStr = `</select>
      </div>`;
const filterStrNew = `</select>
        <button
          onClick={() => setViewArchivedClasses(!viewArchivedClasses)}
          className={\`h-10 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border \${viewArchivedClasses ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}\`}
        >
          {viewArchivedClasses ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
          {viewArchivedClasses ? 'إخفاء الأرشيف' : 'سجل الأرشيف'}
        </button>
      </div>`;
code = code.replace(filterStr, filterStrNew);

// Add filter condition
code = code.replace(
  'const matchesGrade = classGradeFilter === \'all\' || cls.grade_level === classGradeFilter;',
  'const isArchived = cls.is_archived === true;\n            if (viewArchivedClasses && !isArchived) return false;\n            if (!viewArchivedClasses && isArchived) return false;\n            const matchesGrade = classGradeFilter === \'all\' || cls.grade_level === classGradeFilter;'
);

// Add Archive/Restore buttons in the list
const deleteBtnStr = `<button
                    onClick={() => setClassToDelete(cls)}
                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all cursor-pointer"
                    title="حذف المجموعة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>`;
const archiveBtnStr = `{cls.is_archived ? (
                    <button
                      onClick={() => setClassToRestore(cls)}
                      className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-all cursor-pointer"
                      title="استعادة من الأرشيف"
                    >
                      <ArchiveRestore className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setClassToArchive(cls)}
                      className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-all cursor-pointer"
                      title="أرشفة المجموعة"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setClassToDelete(cls)}
                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all cursor-pointer"
                    title="حذف المجموعة نهائياً"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>`;
code = code.replace(deleteBtnStr, archiveBtnStr);

fs.writeFileSync('src/components/ClassesManager.tsx', code);
