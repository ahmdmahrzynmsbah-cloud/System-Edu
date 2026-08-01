const fs = require('fs');
let code = fs.readFileSync('src/components/StudentsList.tsx', 'utf8');

const archiveModalStr = `
      {/* Archive Confirmation Modal */}
      <AnimatePresence>
        {studentToArchive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 overflow-hidden"
            >
              <div className="flex items-center gap-3 text-amber-600 mb-4">
                <div className="p-3 bg-amber-100 rounded-full">
                  <Archive className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">تأكيد الأرشفة</h3>
              </div>
              <p className="text-slate-600 mb-6 leading-relaxed">
                هل أنت متأكد من رغبتك في أرشفة الطالب <span className="font-bold text-slate-800">"{studentToArchive.name}"</span>؟ سيتم إخفاء بياناته من القوائم النشطة.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setStudentToArchive(null)}
                  className="px-5 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={confirmArchiveStudent}
                  className="px-5 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 font-medium transition-colors"
                >
                  تأكيد الأرشفة
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Restore Confirmation Modal */}
      <AnimatePresence>
        {studentToRestore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 overflow-hidden"
            >
              <div className="flex items-center gap-3 text-emerald-600 mb-4">
                <div className="p-3 bg-emerald-100 rounded-full">
                  <ArchiveRestore className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">استعادة الطالب</h3>
              </div>
              <p className="text-slate-600 mb-6 leading-relaxed">
                هل أنت متأكد من رغبتك في استعادة الطالب <span className="font-bold text-slate-800">"{studentToRestore.name}"</span>؟ سيعود للقوائم النشطة فوراً.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setStudentToRestore(null)}
                  className="px-5 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={confirmRestoreStudent}
                  className="px-5 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-medium transition-colors"
                >
                  تأكيد الاستعادة
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
`;

code = code.replace(
  '      <AnimatePresence>\n        {studentToDelete && (',
  archiveModalStr + '\n      <AnimatePresence>\n        {studentToDelete && ('
);

fs.writeFileSync('src/components/StudentsList.tsx', code);
