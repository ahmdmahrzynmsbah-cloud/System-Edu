/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { samsDb, getTenantSetting } from '../utils/db';
import { Users, UserCheck, BookOpen, CreditCard, Activity, AlertTriangle, TrendingUp, Calendar, ArrowUpRight, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { Exam, Assignment } from '../types';

interface DashboardProps {
  onNavigateToTab: (tabId: string) => void;
}

export default function Dashboard({ onNavigateToTab }: DashboardProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calendar states (default to July 2026)
  const [currentMonth, setCurrentMonth] = useState<number>(6); // July (0-indexed)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 6, 6));

  const students = samsDb.getStudents();
  const teachers = samsDb.getTeachers();
  const classes = samsDb.getClasses();
  const fees = samsDb.getFees();
  const attendance = samsDb.getAttendance();
  const auditLogs = samsDb.getAuditLogs().slice(0, 5); // top 5 recent actions

  // Arabic Constants for Academic Calendar
  const ARABIC_MONTHS = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const ARABIC_WEEKDAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  const formatDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatArabicFullDate = (d: Date) => {
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return `${days[d.getDay()]}، ${d.getDate()} ${ARABIC_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  };

  const allExams = samsDb.getExams();
  const allAssignments = samsDb.getAssignments();

  const getEventsForDay = (dateObj: Date) => {
    const dateStr = formatDateString(dateObj);
    
    // 1. Exams
    const dayExams = allExams.filter(e => e.date === dateStr);
    
    // 2. Assignments
    const dayAssignments = allAssignments.filter(a => a.due_date === dateStr);
    
    // 3. Classes scheduled on this weekday
    const dayNameAr = ARABIC_WEEKDAYS[dateObj.getDay()];
    const dayClasses = classes.filter(c => c.schedule_days?.includes(dayNameAr));

    return {
      exams: dayExams,
      assignments: dayAssignments,
      classes: dayClasses,
      totalCount: dayExams.length + dayAssignments.length + dayClasses.length
    };
  };

  // Generate grid days for selected currentMonth / currentYear
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const startDayIndex = firstDayOfMonth.getDay(); // 0 Sunday, 1 Monday etc
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const prevMonthDays = [];
  for (let i = startDayIndex - 1; i >= 0; i--) {
    prevMonthDays.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      date: new Date(currentYear, currentMonth - 1, daysInPrevMonth - i)
    });
  }

  const currentMonthDays = [];
  for (let i = 1; i <= daysInMonth; i++) {
    currentMonthDays.push({
      day: i,
      isCurrentMonth: true,
      date: new Date(currentYear, currentMonth, i)
    });
  }

  const totalDaysProcessed = startDayIndex + daysInMonth;
  const nextMonthDaysCount = totalDaysProcessed <= 35 ? 35 - totalDaysProcessed : 42 - totalDaysProcessed;
  const nextMonthDays = [];
  for (let i = 1; i <= nextMonthDaysCount; i++) {
    nextMonthDays.push({
      day: i,
      isCurrentMonth: false,
      date: new Date(currentYear, currentMonth + 1, i)
    });
  }

  const allGridDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  const selectedDayEvents = getEventsForDay(selectedDate);

  // STAT CALCULATIONS
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === 'active').length;
  const suspendedStudents = students.filter(s => s.status === 'suspended').length;
  
  const totalTeachers = teachers.length;
  const totalClasses = classes.length;

  // Revenue calc
  const totalRevenue = fees.reduce((sum, f) => sum + f.amount, 0);
  
  // Calculate pending revenue dynamically:
  // If there are no payments recorded in the system yet, the pending and target fees are 0.
  // Once a center registers transactions, we assume active students with no payment have a standard subscription of 350 L.E.
  const activeStudentsList = students.filter(s => s.status === 'active');
  const unpaidStudents = activeStudentsList.filter(s => !fees.some(f => f.student_id === s.id));
let gradeFees = {
    'الصف الأول الإعدادي': 150,
    'الصف الثاني الإعدادي': 150,
    'الصف الثالث الإعدادي': 150,
    'الصف الأول الثانوي': 200,
    'الصف الثاني الثانوي': 250,
    'الصف الثالث الثانوي': 300
  };
  try {
    const saved = localStorage.getItem('sams_grade_monthly_fees');
    if (saved) gradeFees = JSON.parse(saved);
  } catch (e) {}
  
  const pendingRevenue = fees.length === 0 ? 0 : unpaidStudents.reduce((sum, s) => {
    return sum + (gradeFees[s.grade_level] || 250);
  }, 0);
  const targetRevenue = totalRevenue + pendingRevenue;

  // Present rate on last recorded day (e.g. 2026-03-02)
  const lastRecordedDate = attendance.length > 0 ? [...attendance].sort((a, b) => b.date.localeCompare(a.date))[0].date : new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const attendanceOnDay = attendance.filter(a => a.date === lastRecordedDate);
  const totalInAttendance = attendanceOnDay.length;
  const presentOnDay = attendanceOnDay.filter(a => a.status === 'present').length;
  const attendanceRate = totalInAttendance > 0 ? Math.round((presentOnDay / totalInAttendance) * 100) : 0;

  // Grade performance counts linked directly to the exams database
  const examsList = samsDb.getExams();
  const examGrades = samsDb.getExamGrades();

  let excellentCount = 0;
  let veryGoodCount = 0;
  let goodCount = 0;
  let passingCount = 0;
  let failingCount = 0;

  examGrades.forEach(g => {
    if (g.absent) {
      failingCount++;
      return;
    }
    const exam = examsList.find(e => e.id === g.exam_id);
    if (exam && exam.max_score > 0) {
      const percentage = (g.score / exam.max_score) * 100;
      if (percentage >= 85) excellentCount++;
      else if (percentage >= 75) veryGoodCount++;
      else if (percentage >= 65) goodCount++;
      else if (percentage >= 50) passingCount++;
      else failingCount++;
    }
  });

  const gradesData = [
    { name: 'ممتاز', العدد: excellentCount, fill: '#10B981' },
    { name: 'جيد جداً', العدد: veryGoodCount, fill: '#1A7FAA' },
    { name: 'جيد', العدد: goodCount, fill: '#3B82F6' },
    { name: 'مقبول', العدد: passingCount, fill: '#F59E0B' },
    { name: 'ضعيف', العدد: failingCount, fill: '#E8192C' }
  ];

  // Financial collection status
  const financialData = [
    { name: 'الرسوم المدفوعة', value: totalRevenue },
    { name: 'الرسوم المتأخرة', value: pendingRevenue }
  ];
  const COLORS = ['#0D5C8C', '#E8192C'];

  const appName = getTenantSetting('sams_custom_app_name_v2', 'Fox System');

  return (
    <div className="space-y-6" id="sams_control_dashboard">
      {/* Header Info */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">الأداء العام للسنتر</h1>
          <p className="text-sm text-slate-500 mt-1">{appName} — قاعدة البيانات المحدثة لحظياً حتى تاريخ اليوم</p>
        </div>
        <div className="flex items-center gap-2.5 bg-[#E8192C]/5 px-4 py-2 rounded-xl text-[#C0152A] text-xs font-semibold border border-[#E8192C]/10 self-start md:self-auto font-sans">
          <Calendar className="w-4 h-4 text-[#C0152A]" />
          <span className="whitespace-nowrap">توقيت النظام:</span>
          <span className="font-bold">
            {currentTime.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <span className="text-[#C0152A] font-mono tracking-wide font-extrabold bg-[#E8192C]/10 px-2 py-0.5 rounded">
            {currentTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
          </span>
        </div>
      </div>

      {/* Grid Statistics Cards - 4 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
        
        {/* Total Students Card */}
        <div className="bg-white p-5 rounded-2xl border border-[#0D5C8C] border-r-4 shadow-xs hover:shadow-md transition-all flex items-center justify-between cursor-pointer" onClick={() => onNavigateToTab('students')} id="stat_students_card">
          <div className="space-y-2">
            <p className="text-xs text-slate-500 font-bold font-sans">إجمالي الطلاب المقيدين</p>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl font-black text-[#1A1A2E]">{totalStudents}</span>
              <span className="text-[11px] bg-emerald-50 px-1.5 py-0.5 rounded text-emerald-600 font-bold whitespace-nowrap">+{activeStudents} نشط</span>
            </div>
            <p className="text-[10px] text-amber-600 font-bold leading-tight">({suspendedStudents} معلق / {totalStudents - activeStudents - suspendedStudents} مؤرشف)</p>
          </div>
          <div className="p-3 bg-[#0D5C8C]/10 rounded-xl text-[#0D5C8C] shrink-0">
            <Users className="w-5 h-5 lg:w-6 lg:h-6" />
          </div>
        </div>

        {/* Attendance Rate Card */}
        <div className="bg-white p-5 rounded-2xl border border-[#1A7FAA] border-r-4 shadow-xs hover:shadow-md transition-all flex items-center justify-between cursor-pointer" onClick={() => onNavigateToTab('attendance')} id="stat_attendance_card">
          <div className="space-y-2">
            <p className="text-xs text-slate-500 font-bold font-sans">نسبة حضور اليوم</p>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl font-black text-[#1A7FAA]">{attendanceRate}%</span>
              <span className="text-[11px] bg-emerald-50 px-1.5 py-0.5 rounded text-emerald-600 font-bold">مستقر</span>
            </div>
            <p className="text-[10px] text-slate-400 font-sans font-bold">آخر تسجيل: {lastRecordedDate}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 shrink-0">
            <UserCheck className="w-5 h-5 lg:w-6 lg:h-6" />
          </div>
        </div>

        {/* Classes Card */}
        <div className="bg-white p-5 rounded-2xl border border-yellow-400 border-r-4 shadow-xs hover:shadow-md transition-all flex items-center justify-between cursor-pointer" onClick={() => onNavigateToTab('classes')} id="stat_classes_card">
          <div className="space-y-2">
            <p className="text-xs text-slate-500 font-bold font-sans">المجموعات الدراسية</p>
            <div className="flex items-baseline gap-1 flex-wrap">
              <span className="text-2xl font-black text-slate-800">{totalClasses}</span>
              <span className="text-sm font-bold text-slate-800">مجموعات</span>
            </div>
            <p className="text-[10px] text-[#0D5C8C] font-black font-sans">تحديث فوري</p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl text-[#1A7FAA] shrink-0">
            <BookOpen className="w-5 h-5 lg:w-6 lg:h-6" />
          </div>
        </div>

        {/* Financial Collection Rate Card - Colored alert state */}
        <div className={`p-5 rounded-2xl shadow-xs hover:shadow-md transition-all flex items-center justify-between cursor-pointer ${
          fees.length === 0
            ? 'bg-slate-50 border border-slate-400 border-r-4 text-slate-700'
            : pendingRevenue > 0
            ? 'bg-[#FEF2F2] border border-[#C0152A] border-r-4 text-[#C0152A]'
            : 'bg-emerald-50 border border-emerald-600 border-r-4 text-emerald-800'
        }`} onClick={() => onNavigateToTab('fees')} id="stat_revenue_card">
          <div className="space-y-2">
            <p className={`text-xs font-extrabold font-sans ${fees.length === 0 ? 'text-slate-500' : pendingRevenue > 0 ? 'text-[#C0152A]' : 'text-emerald-700'}`}>المتحصلات المالية والرسوم</p>
            <div className="flex items-baseline gap-1 flex-wrap">
              <span className="text-2xl font-black">{totalRevenue.toLocaleString()}</span>
              <span className="text-sm font-bold">ج.م</span>
            </div>
            <p className="text-[10px] font-bold flex items-center gap-1">
              {fees.length === 0 ? (
                <span className="text-slate-400">لا توجد رسوم مستحقة بعد</span>
              ) : (
                <span>مستحقة: {pendingRevenue.toLocaleString()} ج.م</span>
              )}
            </p>
          </div>
          <div className={`p-3 rounded-xl shrink-0 ${
            fees.length === 0
              ? 'bg-slate-200 text-slate-600'
              : pendingRevenue > 0
              ? 'bg-red-100/60 text-[#C0152A]'
              : 'bg-emerald-100 text-emerald-600'
          }`}>
            <CreditCard className="w-5 h-5 lg:w-6 lg:h-6" />
          </div>
        </div>

      </div>

      {/* Main Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Grades Performance Plot (Recharts) */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#0D5C8C]" />
              توزيع تقديرات الدرجات الأكاديمية للطلاب
            </h3>
            <span className="text-xs text-slate-400">المجموعة الدراسي الأول 2026/2025</span>
          </div>
          <div className="h-64 flex items-center justify-center">
            {examGrades.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradesData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                  <Tooltip formatter={(value) => [`${value} طلاب`, 'العدد']} />
                  <Bar dataKey="العدد" radius={[4, 4, 0, 0]}>
                    {gradesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center p-6 space-y-2 text-slate-400 font-sans">
                <div className="text-3xl">📊</div>
                <p className="text-xs font-bold text-slate-500">لا توجد درجات امتحانات مرصودة حالياً في النظام</p>
                <p className="text-[10px] text-slate-400 max-w-xs">يمكنك رصد علامات الطلاب من تبويب الامتحانات والواجبات لتظهر لك التحليلات وتوزيع المستويات تلقائياً هنا</p>
              </div>
            )}
          </div>
        </div>

        {/* Financial Collection Doughnut Chart */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-500" />
              الحالة المالية وتحصيل الرسوم
            </h3>
            <span className="text-xs text-slate-400">نسب الرسوم السنوية والتحصيلات</span>
          </div>

          <div className="h-44 flex items-center justify-center relative my-4">
            {fees.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={financialData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {financialData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} ج.م`]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute text-center mt-[-8px]">
                  <span className="text-[10px] text-slate-400 font-sans block">نسبة التحصيل</span>
                  <span className="text-lg font-bold text-[#0D5C8C]">
                    {Math.round((totalRevenue / (targetRevenue || 1)) * 100)}%
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center p-4 space-y-1.5 text-slate-400 font-sans">
                <div className="text-3xl">💳</div>
                <p className="text-xs font-bold text-slate-500">لا توجد رسوم محصلة بعد</p>
                <p className="text-[10px] text-slate-400 max-w-[180px] mx-auto">عند تسجيل سداد اشتراك أو مصروفات لأي طالب، سيظهر لك مؤشر نسب التحصيل فوراً</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs p-1.5 rounded bg-[#0D5C8C]/5 border-r-4 border-[#0D5C8C]">
              <span className="text-slate-600">تم تحصيله رقمياً ونقداً</span>
              <span className="font-bold text-[#0D5C8C]">{totalRevenue.toLocaleString()} ج.م</span>
            </div>
            <div className="flex items-center justify-between text-xs p-1.5 rounded bg-red-50 border-r-4 border-[#E8192C]">
              <span className="text-slate-600">رسوم جارية ومستحقة</span>
              <span className="font-bold text-[#C0152A]">{pendingRevenue.toLocaleString()} ج.م</span>
            </div>
          </div>
        </div>

      </div>

      {/* Interactive Academic Calendar & Events */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs" id="academic_calendar_card">
        {/* Card Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5 mb-5">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 text-base md:text-lg flex items-center gap-2">
              <Calendar className="w-5.5 h-5.5 text-[#0D5C8C]" />
              التقويم الدراسي والفعاليات الأكاديمية الشهري
            </h3>
            <p className="text-xs text-slate-500">جدول تفاعلي شهري لعرض مواعيد المجموعات، امتحانات السنتر، وآجال تسليم الواجبات</p>
          </div>
          
          {/* Month/Year Navigation Controls */}
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100 self-start md:self-auto">
            <button
              onClick={() => {
                if (currentMonth === 0) {
                  setCurrentMonth(11);
                  setCurrentYear(prev => prev - 1);
                } else {
                  setCurrentMonth(prev => prev - 1);
                }
              }}
              className="p-1.5 hover:bg-white hover:shadow-xs rounded-lg text-slate-600 transition-all cursor-pointer"
              title="الشهر السابق"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            
            <span className="text-xs md:text-sm font-bold text-slate-800 min-w-[100px] text-center">
              {ARABIC_MONTHS[currentMonth]} {currentYear}
            </span>
            
            <button
              onClick={() => {
                if (currentMonth === 11) {
                  setCurrentMonth(0);
                  setCurrentYear(prev => prev + 1);
                } else {
                  setCurrentMonth(prev => prev + 1);
                }
              }}
              className="p-1.5 hover:bg-white hover:shadow-xs rounded-lg text-slate-600 transition-all cursor-pointer"
              title="الشهر التالي"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setCurrentMonth(6); // Reset to July 2026 for demonstration
                setCurrentYear(2026);
                setSelectedDate(new Date(2026, 6, 6));
              }}
              className="text-[10px] md:text-xs px-2.5 py-1.5 bg-white shadow-2xs hover:bg-slate-100 border border-gray-200 text-[#0D5C8C] font-semibold rounded-lg transition-all cursor-pointer"
            >
              اليوم الحالي
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs mb-5 px-1 bg-slate-50/50 py-2 rounded-xl border border-slate-100">
          <span className="text-slate-400 font-bold">دليل الرموز:</span>
          <span className="flex items-center gap-1.5 text-slate-600 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            حصة مجدولة للمجموعة
          </span>
          <span className="flex items-center gap-1.5 text-slate-600 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            امتحان أو كويز
          </span>
          <span className="flex items-center gap-1.5 text-slate-600 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            موعد تسليم واجب
          </span>
        </div>

        {/* Calendar Grid & Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid (Col Span 2) */}
          <div className="lg:col-span-2 space-y-2">
            {/* Weekdays Header */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-slate-500 text-xs py-2.5 bg-slate-50/80 rounded-lg">
              {ARABIC_WEEKDAYS.map((day, i) => (
                <div key={i}>{day}</div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {allGridDays.map((cell, idx) => {
                const dayEvents = getEventsForDay(cell.date);
                const isSelected = formatDateString(cell.date) === formatDateString(selectedDate);
                const isToday = formatDateString(cell.date) === '2026-07-06'; // current mock local date
                
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDate(cell.date)}
                    className={`min-h-[75px] sm:min-h-[85px] p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer hover:bg-slate-50/80 relative ${
                      !cell.isCurrentMonth
                        ? 'bg-slate-50/20 border-gray-100/60 text-slate-300'
                        : isSelected
                        ? 'border-[#0D5C8C] bg-sky-50/30 ring-1 ring-[#0D5C8C]/50 text-slate-800'
                        : isToday
                        ? 'border-rose-300 bg-rose-50/25 text-slate-800'
                        : 'border-gray-100 bg-white text-slate-700'
                    }`}
                  >
                    {/* Day Number and Today Badge */}
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-black w-5 h-5 flex items-center justify-center rounded-full ${
                        isToday ? 'bg-rose-500 text-white text-[10px]' : isSelected ? 'bg-[#0D5C8C] text-white' : ''
                      }`}>
                        {cell.day}
                      </span>
                      {isToday && !isSelected && (
                        <span className="text-[9px] font-black text-rose-600 hidden sm:inline bg-rose-50 px-1 py-0.5 rounded">اليوم</span>
                      )}
                    </div>

                    {/* Indicator Badges / Dots */}
                    <div className="mt-2 space-y-1">
                      {/* Dots row */}
                      <div className="flex items-center gap-1 flex-wrap">
                        {dayEvents.classes.map((_, i) => (
                          <span key={`c-${i}`} className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="حصة" />
                        ))}
                        {dayEvents.exams.map((_, i) => (
                          <span key={`e-${i}`} className="w-1.5 h-1.5 rounded-full bg-rose-500" title="امتحان" />
                        ))}
                        {dayEvents.assignments.map((_, i) => (
                          <span key={`a-${i}`} className="w-1.5 h-1.5 rounded-full bg-indigo-500" title="واجب" />
                        ))}
                      </div>

                      {/* Text badges on larger screens */}
                      <div className="hidden sm:block space-y-0.5 overflow-hidden">
                        {dayEvents.classes.length > 0 && (
                          <div className="text-[9px] font-bold text-emerald-700 bg-emerald-50/80 px-1 py-0.5 rounded truncate">
                            {dayEvents.classes.length} {dayEvents.classes.length === 1 ? 'حصة' : 'حصص'}
                          </div>
                        )}
                        {dayEvents.exams.length > 0 && (
                          <div className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1 py-0.5 rounded truncate">
                            {dayEvents.exams.length} {dayEvents.exams.length === 1 ? 'امتحان' : 'امتحانات'}
                          </div>
                        )}
                        {dayEvents.assignments.length > 0 && (
                          <div className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded truncate">
                            {dayEvents.assignments.length} {dayEvents.assignments.length === 1 ? 'واجب' : 'واجبات'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar Day Details */}
          <div className="lg:col-span-1 bg-slate-50/70 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between h-full">
            <div>
              {/* Date Heading */}
              <div className="border-b border-gray-200/60 pb-3 mb-4">
                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">الجدول الدراسي والالتزامات لليوم</span>
                <h4 className="font-bold text-slate-800 text-sm mt-0.5">
                  {formatArabicFullDate(selectedDate)}
                </h4>
              </div>

              {/* Event Lists */}
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {/* 1. Classes */}
                {selectedDayEvents.classes.length > 0 && (
                  <div className="space-y-1.5">
                    <h5 className="text-[11px] font-bold text-emerald-700 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      الحصص والمجموعات المجدولة اليوم ({selectedDayEvents.classes.length})
                    </h5>
                    <div className="space-y-2">
                      {selectedDayEvents.classes.map((cls) => (
                        <div key={cls.id} className="p-3 bg-white border border-gray-100 rounded-xl hover:shadow-2xs transition-all text-xs space-y-1">
                          <div className="flex items-center justify-between font-bold text-slate-800">
                            <span>{cls.name}</span>
                            <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-mono text-[10px]">{cls.schedule_time || '12:00'}</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>السنة: {cls.grade_level}</span>
                            <span>السعة: {cls.capacity} طالب</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Exams */}
                {selectedDayEvents.exams.length > 0 && (
                  <div className="space-y-1.5">
                    <h5 className="text-[11px] font-bold text-rose-700 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                      الامتحانات والتقييمات المقررة ({selectedDayEvents.exams.length})
                    </h5>
                    <div className="space-y-2">
                      {selectedDayEvents.exams.map((exam) => (
                        <div key={exam.id} className="p-3 bg-white border border-gray-100 rounded-xl hover:shadow-2xs transition-all text-xs space-y-1">
                          <div className="flex items-center justify-between font-bold text-slate-800">
                            <span className="text-rose-700 font-extrabold">{exam.name}</span>
                            <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded font-bold text-[10px]">
                              {exam.type === 'quiz' ? 'كويز قصير' : exam.type === 'comprehensive' ? 'شامل' : 'اختبار شهري'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>الدرجة العظمى: {exam.max_score}</span>
                            <span>المدة: {exam.duration_mins} دقيقة</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Assignments */}
                {selectedDayEvents.assignments.length > 0 && (
                  <div className="space-y-1.5">
                    <h5 className="text-[11px] font-bold text-indigo-700 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                      تسليمات الواجبات المنزلية ({selectedDayEvents.assignments.length})
                    </h5>
                    <div className="space-y-2">
                      {selectedDayEvents.assignments.map((assign) => (
                        <div key={assign.id} className="p-3 bg-white border border-gray-100 rounded-xl hover:shadow-2xs transition-all text-xs space-y-1">
                          <div className="flex items-center justify-between font-bold text-slate-800">
                            <span className="text-indigo-700 font-extrabold">{assign.title}</span>
                            <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px]">الدرجة: {assign.max_score}</span>
                          </div>
                          <p className="text-[10px] text-slate-400">آخر موعد لتسليم كشكول الواجب</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {selectedDayEvents.totalCount === 0 && (
                  <div className="text-center py-10 px-4 space-y-2.5 bg-white border border-dashed border-gray-200 rounded-2xl shadow-3xs">
                    <span className="text-2xl block">🕊️</span>
                    <h6 className="font-bold text-xs text-slate-700">لا توجد فعاليات في هذا اليوم</h6>
                    <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto leading-relaxed">
                      يوم هادئ وخالٍ من الفعاليات الأكاديمية أو تسليم الواجبات أو امتحانات السنتر
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-4 border-t border-gray-200/60 mt-4 space-y-2">
              <button
                onClick={() => onNavigateToTab('exams')}
                className="w-full text-center py-2.5 bg-[#0D5C8C] hover:bg-[#1A7FAA] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow-md"
              >
                <Plus className="w-4 h-4" />
                إضافة امتحان أو واجب للتقويم
              </button>
              <button
                onClick={() => onNavigateToTab('classes')}
                className="w-full text-center py-2 bg-white border border-gray-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                إدارة مواعيد مجموعات السنتر
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Two Columns: Recent System Notices (Parent Communication) & Audit Log Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Live Transactional Audit Logs */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm" id="sams_audit_logs_preview">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-gray-50 pb-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Activity className="w-4.5 h-4.5 text-indigo-600" />
              سجل تدقيق وإجراءات قاعدة البيانات الحية (Audit Logs)
            </h3>
            <button onClick={() => onNavigateToTab('roles')} className="text-xs text-[#0D5C8C] hover:underline font-semibold flex items-center">
              عرض المزيد
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {auditLogs.map((log) => {
              const badgeColor = {
                INSERT: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                UPDATE: 'bg-sky-50 text-sky-700 border-sky-100',
                DELETE: 'bg-red-50 text-red-700 border-red-100',
                SOFT_DELETE: 'bg-amber-50 text-amber-700 border-amber-100',
                QUERY: 'bg-gray-50 text-gray-700 border-gray-100'
              }[log.action_type];

              return (
                <div key={log.id} className="p-3 border border-gray-50 rounded-xl hover:bg-slate-50/50 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 text-xs">
                  <div className="space-y-1">
                    <p className="text-slate-800 font-medium leading-relaxed">{log.details}</p>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                      <span className="font-bold text-slate-600">{log.user_name}</span>
                      <span>•</span>
                      <span>الجدول: {log.table_name}</span>
                      <span>•</span>
                      <span>التوقيت: {log.timestamp}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 border rounded-sm font-semibold uppercase text-[9px] self-start sm:self-auto ${badgeColor}`}>
                    {log.action_type}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* High-Level Attendance Absent Alert Notice */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-gray-50 pb-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4.5 h-4.5 text-[#C0152A]" />
              الحالات الطارئة وتنبيهات الغياب المتكرر
            </h3>
            <span className="text-[10px] bg-[#E8192C]/10 text-[#C0152A] px-2 py-0.5 rounded font-bold animate-pulse">فوري</span>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 bg-[#E8192C]/5 border border-[#E8192C]/10 rounded-xl flex items-start gap-3">
              <div className="p-2 bg-[#E8192C]/10 rounded-lg text-[#C0152A] shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-slate-800">تجاوز نسبة الغياب المسموحة (الطالب عمر السقا)</h4>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  تجاوز الطالب عمر شادي نسبة غياب 25% من الحصص الشهرية لمجموعة الصف الثالث الابتدائي. تم تجميد القيد تلقائياً وإرسال إشعار SMS لولي الأمر.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => onNavigateToTab('attendance')} className="text-xxs px-2 py-1 bg-[#0D5C8C] text-white rounded cursor-pointer hover:bg-[#1A7FAA]">تحرير الحضور</button>
                  <button onClick={() => onNavigateToTab('notifications')} className="text-xxs px-2 py-1 bg-white border border-gray-200 text-slate-600 rounded cursor-pointer hover:bg-slate-50">عرض الرسالة</button>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-yellow-50 border border-yellow-200/50 rounded-xl flex items-start gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg text-yellow-700 shrink-0 mt-0.5">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-slate-800">مراجعة كشوف الدرجات للمجموعات الدراسية</h4>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  هناك 3 طلاب لم ترصد لهم درجات الاختبار الشهري الخاص بمادة الرياضيات حتى الآن.
                </p>
                <button onClick={() => onNavigateToTab('exams')} className="text-xxs px-2 py-1 bg-amber-600 text-white rounded cursor-pointer hover:bg-amber-700 mt-2">توجه للرصد</button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
