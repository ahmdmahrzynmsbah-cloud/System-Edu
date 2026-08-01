const fs = require('fs');
let code = fs.readFileSync('src/components/StudentsList.tsx', 'utf8');

// Add Archive icons
code = code.replace(
  'import { Search, Plus, Filter, Edit, Trash2, ShieldAlert, CheckCircle, Eye, X, BookOpen, CreditCard, Calendar, Phone, User, Users, ArrowUpDown, Bell, AlertTriangle } from \'lucide-react\';',
  'import { Search, Plus, Filter, Edit, Trash2, ShieldAlert, CheckCircle, Eye, X, BookOpen, CreditCard, Calendar, Phone, User, Users, ArrowUpDown, Bell, AlertTriangle, Archive, ArchiveRestore } from \'lucide-react\';'
);

// Add state variables
code = code.replace(
  'const [gradeFilter, setGradeFilter] = useState(\'all\');',
  'const [gradeFilter, setGradeFilter] = useState(\'all\');\n  const [viewArchivedStudents, setViewArchivedStudents] = useState(false);\n  const [studentToArchive, setStudentToArchive] = useState<Student | null>(null);\n  const [studentToRestore, setStudentToRestore] = useState<Student | null>(null);'
);

// Add handlers
const archiveHandlers = `
  const confirmArchiveStudent = () => {
    if (studentToArchive) {
      samsDb.archiveStudent(studentToArchive.id);
      setSuccessMsg(\`تم أرشفة الطالب "\${studentToArchive.name}" بنجاح\`);
      setStudentToArchive(null);
      loadData();
    }
  };

  const confirmRestoreStudent = () => {
    if (studentToRestore) {
      samsDb.restoreStudent(studentToRestore.id);
      setSuccessMsg(\`تم استعادة الطالب "\${studentToRestore.name}" بنجاح\`);
      setStudentToRestore(null);
      loadData();
    }
  };

`;

code = code.replace('const confirmDelete = () => {', archiveHandlers + '  const confirmDelete = () => {');

fs.writeFileSync('src/components/StudentsList.tsx', code);
