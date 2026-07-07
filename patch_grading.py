import re

with open('src/components/ExamsAndAssignments.tsx', 'r') as f:
    content = f.read()

# Add gradingGradeFilter state
state_match = "  const [assignmentClassFilter, setAssignmentClassFilter] = useState('all');"
state_replacement = state_match + "\n  const [gradingGradeFilter, setGradingGradeFilter] = useState('all');"
content = content.replace(state_match, state_replacement)

# Replace the quick filters panel
old_panel = """          {/* Quick Filters Panel */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Term Select */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">الفصل الدراسي</label>
              <select
                value={termFilter}
                onChange={(e) => {
                  setTermFilter(e.target.value as any);
                  setSuccessMsg('');
                }}
                className="w-full text-xs font-semibold border border-slate-200 p-2.5 rounded-xl bg-white text-slate-700"
              >
                <option value="first_term">الفصل الدراسي الأول</option>
                <option value="second_term">الفصل الدراسي الثاني</option>
              </select>
            </div>

            {/* Class Group Select */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">المجموعة الدراسية</label>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSuccessMsg('');
                }}
                className="w-full text-xs font-semibold border border-slate-200 p-2.5 rounded-xl bg-white text-slate-700"
              >
                {classes.length === 0 ? (
                  <option value="">لا توجد مجموعات</option>
                ) : (
                  classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} (الصف: {c.grade_level})</option>
                  ))
                )}
              </select>
            </div>"""

new_panel = """          {/* Quick Filters Panel */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs grid grid-cols-1 md:grid-cols-5 gap-4">
            
            {/* Term Select */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">الفصل الدراسي</label>
              <select
                value={termFilter}
                onChange={(e) => {
                  setTermFilter(e.target.value as any);
                  setSuccessMsg('');
                }}
                className="w-full text-xs font-semibold border border-slate-200 p-2.5 rounded-xl bg-white text-slate-700"
              >
                <option value="first_term">الفصل الدراسي الأول</option>
                <option value="second_term">الفصل الدراسي الثاني</option>
              </select>
            </div>

            {/* Grade Filter Select */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">الصف الدراسي</label>
              <select
                value={gradingGradeFilter}
                onChange={(e) => {
                  setGradingGradeFilter(e.target.value);
                  setSuccessMsg('');
                }}
                className="w-full text-xs font-semibold border border-slate-200 p-2.5 rounded-xl bg-white text-slate-700"
              >
                <option value="all">كل الصفوف</option>
                <option value="الأول الإعدادي">الأول الإعدادي</option>
                <option value="الثاني الإعدادي">الثاني الإعدادي</option>
                <option value="الثالث الإعدادي">الثالث الإعدادي</option>
                <option value="الأول الثانوي">الأول الثانوي</option>
                <option value="الثاني الثانوي">الثاني الثانوي</option>
                <option value="الثالث الثانوي">الثالث الثانوي</option>
              </select>
            </div>

            {/* Class Group Select */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">المجموعة الدراسية</label>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSuccessMsg('');
                }}
                className="w-full text-xs font-semibold border border-slate-200 p-2.5 rounded-xl bg-white text-slate-700"
              >
                {classes.filter(c => gradingGradeFilter === 'all' || c.grade_level === gradingGradeFilter).length === 0 ? (
                  <option value="">لا توجد مجموعات</option>
                ) : (
                  classes.filter(c => gradingGradeFilter === 'all' || c.grade_level === gradingGradeFilter).map(c => (
                    <option key={c.id} value={c.id}>{c.name} (الصف: {c.grade_level})</option>
                  ))
                )}
              </select>
            </div>"""

content = content.replace(old_panel, new_panel)

with open('src/components/ExamsAndAssignments.tsx', 'w') as f:
    f.write(content)

