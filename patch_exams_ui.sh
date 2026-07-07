#!/bin/bash
cat << 'INNER_EOF' > script_ui.py
import re

with open('src/components/ExamsAndAssignments.tsx', 'r') as f:
    content = f.read()

# Replace Exam Search UI
old_exam_ui = """            {/* Search filter */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-3xs flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="ابحث باسم الامتحان، تصنيفه، أو اسم المجموعة..."
                  value={examSearch}
                  onChange={(e) => setExamSearch(e.target.value)}
                  className="w-full text-right pr-9 pl-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden"
                  dir="rtl"
                />
                <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
              </div>
              <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">إجمالي الامتحانات: {exams.length}</span>
            </div>"""

new_exam_ui = """            {/* Search filter */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-3xs flex flex-col gap-3">
              <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3">
                <div className="relative flex-1 w-full">
                  <input
                    type="text"
                    placeholder="ابحث باسم الامتحان، تصنيفه، أو اسم المجموعة..."
                    value={examSearch}
                    onChange={(e) => setExamSearch(e.target.value)}
                    className="w-full text-right pr-9 pl-3 h-10 text-xs border border-slate-200 rounded-xl focus:border-[#1A7FAA] focus:ring-1 focus:ring-[#1A7FAA] outline-hidden"
                    dir="rtl"
                  />
                  <Search className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                </div>
                <div className="flex items-center gap-2 w-full xl:w-auto overflow-x-auto pb-1">
                  <select
                    value={examGradeFilter}
                    onChange={(e) => { setExamGradeFilter(e.target.value); setExamClassFilter('all'); }}
                    className="h-10 shrink-0 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 focus:border-[#1A7FAA] focus:ring-1 focus:ring-[#1A7FAA] outline-hidden cursor-pointer"
                  >
                    <option value="all">كل الصفوف</option>
                    <option value="الأول الإعدادي">الأول الإعدادي</option>
                    <option value="الثاني الإعدادي">الثاني الإعدادي</option>
                    <option value="الثالث الإعدادي">الثالث الإعدادي</option>
                    <option value="الأول الثانوي">الأول الثانوي</option>
                    <option value="الثاني الثانوي">الثاني الثانوي</option>
                    <option value="الثالث الثانوي">الثالث الثانوي</option>
                  </select>

                  <select
                    value={examClassFilter}
                    onChange={(e) => setExamClassFilter(e.target.value)}
                    className="h-10 shrink-0 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 focus:border-[#1A7FAA] focus:ring-1 focus:ring-[#1A7FAA] outline-hidden cursor-pointer"
                  >
                    <option value="all">كل المجموعات</option>
                    {classes.filter(c => examGradeFilter === 'all' || c.grade_level === examGradeFilter).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap shrink-0">إجمالي: {filteredExams.length}</span>
              </div>
            </div>"""

content = content.replace(old_exam_ui, new_exam_ui)

# Replace Assignment Search UI
old_assignment_ui = """            {/* Search filter */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-3xs flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="ابحث بموضوع الواجب، اسم المجموعة..."
                  value={assignmentSearch}
                  onChange={(e) => setAssignmentSearch(e.target.value)}
                  className="w-full text-right pr-9 pl-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden"
                  dir="rtl"
                />
                <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
              </div>
              <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">إجمالي الواجبات: {assignments.length}</span>
            </div>"""

new_assignment_ui = """            {/* Search filter */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-3xs flex flex-col gap-3">
              <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3">
                <div className="relative flex-1 w-full">
                  <input
                    type="text"
                    placeholder="ابحث بموضوع الواجب، اسم المجموعة..."
                    value={assignmentSearch}
                    onChange={(e) => setAssignmentSearch(e.target.value)}
                    className="w-full text-right pr-9 pl-3 h-10 text-xs border border-slate-200 rounded-xl focus:border-[#1A7FAA] focus:ring-1 focus:ring-[#1A7FAA] outline-hidden"
                    dir="rtl"
                  />
                  <Search className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                </div>
                <div className="flex items-center gap-2 w-full xl:w-auto overflow-x-auto pb-1">
                  <select
                    value={assignmentGradeFilter}
                    onChange={(e) => { setAssignmentGradeFilter(e.target.value); setAssignmentClassFilter('all'); }}
                    className="h-10 shrink-0 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 focus:border-[#1A7FAA] focus:ring-1 focus:ring-[#1A7FAA] outline-hidden cursor-pointer"
                  >
                    <option value="all">كل الصفوف</option>
                    <option value="الأول الإعدادي">الأول الإعدادي</option>
                    <option value="الثاني الإعدادي">الثاني الإعدادي</option>
                    <option value="الثالث الإعدادي">الثالث الإعدادي</option>
                    <option value="الأول الثانوي">الأول الثانوي</option>
                    <option value="الثاني الثانوي">الثاني الثانوي</option>
                    <option value="الثالث الثانوي">الثالث الثانوي</option>
                  </select>

                  <select
                    value={assignmentClassFilter}
                    onChange={(e) => setAssignmentClassFilter(e.target.value)}
                    className="h-10 shrink-0 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 focus:border-[#1A7FAA] focus:ring-1 focus:ring-[#1A7FAA] outline-hidden cursor-pointer"
                  >
                    <option value="all">كل المجموعات</option>
                    {classes.filter(c => assignmentGradeFilter === 'all' || c.grade_level === assignmentGradeFilter).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap shrink-0">إجمالي: {filteredAssignments.length}</span>
              </div>
            </div>"""

content = content.replace(old_assignment_ui, new_assignment_ui)

with open('src/components/ExamsAndAssignments.tsx', 'w') as f:
    f.write(content)

INNER_EOF
python3 script_ui.py
