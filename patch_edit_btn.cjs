const fs = require('fs');
let code = fs.readFileSync('src/components/ClassesManager.tsx', 'utf8');

// Add Edit icon
code = code.replace(
  'import { Plus, BookOpen, User, Users, Maximize2, Search, ShieldAlert, Check, Calendar, Trash2, CheckCircle, X, ExternalLink, Eye, ArrowRight, Phone, Info } from \'lucide-react\';',
  'import { Plus, BookOpen, User, Users, Maximize2, Search, ShieldAlert, Check, Calendar, Trash2, Edit, CheckCircle, X, ExternalLink, Eye, ArrowRight, Phone, Info } from \'lucide-react\';'
);

// Add the edit button next to the delete button
const deleteBtnStr = `<button
                    onClick={() => setClassToDelete(cls)}
                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all cursor-pointer"
                    title="حذف المجموعة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>`;

const newBtnsStr = `<button
                    onClick={() => handleEditClass(cls)}
                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all cursor-pointer ml-1"
                    title="تعديل المجموعة"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setClassToDelete(cls)}
                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all cursor-pointer"
                    title="حذف المجموعة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>`;

code = code.replace(deleteBtnStr, newBtnsStr);
fs.writeFileSync('src/components/ClassesManager.tsx', code);
