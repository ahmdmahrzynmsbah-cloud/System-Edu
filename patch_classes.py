import re

with open('src/components/ClassesManager.tsx', 'r') as f:
    content = f.read()

# 1. Add state
state_old = "  const [errorText, setErrorText] = useState('');"
state_new = "  const [errorText, setErrorText] = useState('');\n  const [classGradeFilter, setClassGradeFilter] = useState('all');\n  const [classSearchQuery, setClassSearchQuery] = useState('');"
content = content.replace(state_old, state_new)

# 2. Add filter to mapping
mapping_old = """      {/* Class list Grid cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {classes.map((cls) => {"""

mapping_new = """      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-3">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="ابحث باسم المجموعة..."
            value={classSearchQuery}
            onChange={(e) => setClassSearchQuery(e.target.value)}
            className="w-full text-right pr-9 pl-3 h-10 text-xs border border-slate-200 rounded-xl focus:border-[#1A7FAA] focus:ring-1 focus:ring-[#1A7FAA] outline-hidden"
            dir="rtl"
          />
          <Search className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
        </div>
        <select
          value={classGradeFilter}
          onChange={(e) => setClassGradeFilter(e.target.value)}
          className="h-10 w-full md:w-auto shrink-0 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 focus:border-[#1A7FAA] focus:ring-1 focus:ring-[#1A7FAA] outline-hidden cursor-pointer"
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

      {/* Class list Grid cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {classes
          .filter(cls => (classGradeFilter === 'all' || cls.grade_level === classGradeFilter) && cls.name.toLowerCase().includes(classSearchQuery.toLowerCase()))
          .map((cls) => {"""

content = content.replace(mapping_old, mapping_new)

with open('src/components/ClassesManager.tsx', 'w') as f:
    f.write(content)

