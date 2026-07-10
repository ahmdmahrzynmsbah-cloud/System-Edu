import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Student, ClassRoom, Attendance, FeePayment } from '../types';
import { samsDb } from '../utils/db';
import { CheckCheck, AlertCircle, CreditCard, Wallet, Scan, UserCheck, Calendar, RotateCcw, Search, ShieldAlert, Wifi, Check, X, CheckCircle2, Trash2, Clock } from 'lucide-react';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';

const playSuccessBeep = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {}
};

const playErrorBuzzer = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {}
};

function ClassTimer({ classObj, selectedDate }: { classObj: ClassRoom | null, selectedDate: string }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!classObj) return null;

  const targetDate = new Date(selectedDate);
  const ARABIC_WEEKDAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const dayNameAr = ARABIC_WEEKDAYS[targetDate.getDay()];
  
  let scheduleTime = null;
  if (classObj.schedule_time && classObj.schedule_time.startsWith('{')) {
    try {
      const times = JSON.parse(classObj.schedule_time);
      if (times[dayNameAr]) {
        scheduleTime = times[dayNameAr];
      }
    } catch (e) {}
  } else if (classObj.schedule_time) {
    scheduleTime = classObj.schedule_time;
  }

  // Ensure it is actually a time format
  const isValidTime = scheduleTime && /^\d{1,2}:\d{2}$/.test(scheduleTime);

  const isSelectedToday = selectedDate === (new Date(currentTime.getTime() - (currentTime.getTimezoneOffset() * 60000))).toISOString().split('T')[0];

  if (!scheduleTime || !isValidTime || !isSelectedToday) return null;

  const [hours, minutes] = scheduleTime.split(':').map(Number);
  const startTime = new Date(currentTime);
  startTime.setHours(hours, minutes, 0, 0);

  const endTime = new Date(startTime.getTime() + 120 * 60000); // Default to 2 hours duration

  const diffMs = endTime.getTime() - currentTime.getTime();
  const startDiffMs = startTime.getTime() - currentTime.getTime();

  if (startDiffMs > 2 * 60 * 60000) { // More than 2 hours before start -> don't show the timer yet
     return null; 
  }

  let targetTimeMs = 0;
  let label = '';
  let isApproaching = false;
  let hasStarted = false;

  if (startDiffMs > 0) {
    targetTimeMs = startDiffMs;
    label = 'تبدأ الحصة خلال';
    isApproaching = startDiffMs <= 15 * 60000; 
  } else if (diffMs > 0) {
    targetTimeMs = diffMs;
    label = 'الوقت المتبقي لانتهاء الحصة';
    isApproaching = diffMs <= 15 * 60000;
    hasStarted = true;
  } else {
    return (
       <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm animate-fade-in mt-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-200 text-slate-500">
                <Clock className="w-5 h-5" />
             </div>
             <div>
               <h3 className="font-bold text-slate-700">انتهت الحصة</h3>
               <p className="text-xs text-slate-500">مجموعة ({classObj.name})</p>
             </div>
          </div>
       </div>
    );
  }

  const totalSeconds = Math.floor(targetTimeMs / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  return (
    <div className={`p-4 rounded-xl border flex items-center justify-between shadow-sm transition-colors animate-fade-in mt-4 ${
      isApproaching ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'
    }`}>
       <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isApproaching ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-emerald-100 text-emerald-600'}`}>
             <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`font-bold ${isApproaching ? 'text-rose-800' : 'text-emerald-800'}`}>
              {label}
            </h3>
            <p className={`text-xs ${isApproaching ? 'text-rose-600' : 'text-emerald-600'}`}>
              مجموعة ({classObj.name})
            </p>
          </div>
       </div>
       <div className={`text-2xl sm:text-3xl font-mono font-bold flex gap-1 items-center ${isApproaching ? 'text-rose-700' : 'text-emerald-700'}`} dir="ltr">
         {h > 0 && <span>{h.toString().padStart(2, '0')}:</span>}
         <span>{m.toString().padStart(2, '0')}</span>:
         <span>{s.toString().padStart(2, '0')}</span>
       </div>
    </div>
  );
}

export default function AttendanceTracker() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [fees, setFees] = useState<FeePayment[]>([]);
  const [unpaidStudentForBarcode, setUnpaidStudentForBarcode] = useState<Student | null>(null);
  const [unpaidMonth, setUnpaidMonth] = useState<string>('');
  const [absentWarningStudent, setAbsentWarningStudent] = useState<{student: Student, lastDate: string} | null>(null);
  
  const ARABIC_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

  
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    return localToday.toISOString().split('T')[0];
  });
  
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  
  // Custom alerts/modals
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showAbsentConfirm, setShowAbsentConfirm] = useState<Student[] | null>(null);

  const [recentScans, setRecentScans] = useState<Array<{
    student: Student;
    timestamp: string;
    status: 'success' | 'already_present' | 'wrong_day';
  }>>([]);

  const [scanFeedback, setScanFeedback] = useState<{type: 'success'|'error', msg: string} | null>(null);

  const loadData = () => {
    setStudents(samsDb.getStudents().filter(s => s.status !== 'archived'));
    setClasses(samsDb.getClasses());
    setAttendance(samsDb.getAttendance());
    setFees(samsDb.getFees());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('sams_data_changed', loadData);
    const interval = setInterval(loadData, 5000); // Polling for updates
    return () => clearInterval(interval);
  }, []);

  // Automatic Absence marking when the day has ended
  useEffect(() => {
    if (students.length === 0) return;

    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    const todayStr = localToday.toISOString().split('T')[0];

    // If the selected date is in the past (day has ended)
    if (selectedDate < todayStr) {
      const unmarkedStudents = students.filter(student => {
        // Only active/suspended students
        if (student.status === 'archived') return false;

        // Filter by grade / class if selected
        if (selectedGrade !== 'all' && student.grade_level !== selectedGrade) return false;
        if (selectedClass !== 'all') {
          const currentClassIds = student.class_ids || [student.class_id, student.class_id_2].filter(Boolean);
          if (!currentClassIds.includes(selectedClass)) return false;
        }

        // Check if there is already an attendance record (present, absent, or excused)
        const hasRecord = attendance.some(a => a.student_id === student.id && a.date === selectedDate);
        return !hasRecord;
      });

      if (unmarkedStudents.length > 0) {
        unmarkedStudents.forEach(s => {
          const classToSave = selectedClass !== 'all' ? selectedClass : (s.class_id || 'default');
          samsDb.saveAttendance(s.id, classToSave, selectedDate, 'absent');
        });
        loadData();
        setSuccessMsg(`تنبيه: لقد انتهى هذا اليوم، وتم تسجيل غياب تلقائي لـ (${unmarkedStudents.length}) طالب لم يكونوا مسجلين.`);
      }
    }
  }, [selectedDate, students, attendance, selectedClass, selectedGrade]);


  const processAttendance = (student: Student) => {
    // Check if they were absent last session
    const pastAttendance = attendance
      .filter(a => a.student_id === student.id && a.date < selectedDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    if (pastAttendance.length > 0 && pastAttendance[0].status === 'absent') {
        playErrorBuzzer();
        setAbsentWarningStudent({ student, lastDate: pastAttendance[0].date });
        return;
    }

    // Otherwise just save
    const targetClassId = (selectedClass !== 'all') ? selectedClass : student.class_id;
    samsDb.saveAttendance(student.id, targetClassId, selectedDate, 'present');
    loadData();
    playSuccessBeep();
    setScanFeedback({ type: 'success', msg: `حضور: ${student.name}` });
    setRecentScans(prev => [{
      student,
      timestamp: new Date().toLocaleTimeString('ar-EG'),
      status: 'success'
    }, ...prev].slice(0, 50));
  };

  const handleBarcodeScan = (barcode: string) => {
    const cleanCode = barcode.trim();
    if (!cleanCode) return;

    // Find student by registration_id or barcode
    const student = students.find(s => s.registration_id === cleanCode || s.barcode === cleanCode);
    
    if (!student) {
      playErrorBuzzer();
      setScanFeedback({ type: 'error', msg: `الطالب غير موجود (${cleanCode})` });
      setTimeout(() => setScanFeedback(null), 3000);
      return;
    }

    // Use selectedDate for scanning, so you can scan for past days
    const targetDate = selectedDate;
    
    const targetD = new Date(targetDate);
    const targetMonthStr = `${ARABIC_MONTHS[targetD.getMonth()]} ${targetD.getFullYear()}`;
    const studentPaid = samsDb.getFees().some(f => f.student_id === student.id && f.category === 'tuition' && f.month === targetMonthStr);
    
    if (!studentPaid) {
        playErrorBuzzer();
        setUnpaidStudentForBarcode(student);
        setUnpaidMonth(targetMonthStr);
        return;
    }

    // Check if already present on target date
    const alreadyPresent = attendance.some(a => 
      a.student_id === student.id && 
      a.date === targetDate && 
      a.status === 'present'
    );

    if (alreadyPresent) {
      playErrorBuzzer();
      setScanFeedback({ type: 'error', msg: `مسجل مسبقاً: ${student.name}` });
      setRecentScans(prev => [{
        student,
        timestamp: new Date().toLocaleTimeString('ar-EG'),
        status: 'already_present'
      }, ...prev].slice(0, 50));
      setTimeout(() => setScanFeedback(null), 3000);
      return;
    }

    processAttendance(student);
    
    setTimeout(() => setScanFeedback(null), 3000);
  };

  // Mount the global barcode listener
  const { isScannerDetected } = useBarcodeScanner(handleBarcodeScan);

  // Group Management logic
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const currentClassIds = s.class_ids || [s.class_id, s.class_id_2].filter(Boolean);
      const matchesClass = selectedClass === 'all' || currentClassIds.includes(selectedClass);
      const matchesGrade = selectedGrade === 'all' || s.grade_level === selectedGrade;
      return matchesClass && matchesGrade;
    });
  }, [students, selectedClass, selectedGrade]);


  const handleMarkPresent = (student: Student) => {
    const targetD = new Date(selectedDate);
    const monthStr = `${ARABIC_MONTHS[targetD.getMonth()]} ${targetD.getFullYear()}`;
    const studentPaid = fees.some(f => f.student_id === student.id && f.category === 'tuition' && f.month === monthStr);
    
    if (!studentPaid) {
        setUnpaidStudentForBarcode(student);
        setUnpaidMonth(monthStr);
    } else {
        processAttendance(student);
    }
  };

  const handleQuickPayFromBarcode = () => {
    if (!unpaidStudentForBarcode) return;
    const saved = localStorage.getItem('sams_grade_monthly_fees');
    let defaultFees: Record<string, number> = {};
    if (saved) {
        try { defaultFees = JSON.parse(saved); } catch (e) {}
    }
    const amount = defaultFees[unpaidStudentForBarcode.grade_level] || 150;

    samsDb.addPayment({
        student_id: unpaidStudentForBarcode.id,
        amount: amount,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        term: 'full_year',
        category: 'tuition',
        month: unpaidMonth
    });

    const student = unpaidStudentForBarcode;
    setUnpaidStudentForBarcode(null);
    processAttendance(student);
  };

  const markUnscannedAsAbsent = () => {
    setSuccessMsg('');
    setErrorMsg('');
    if (selectedClass === 'all') {
      setErrorMsg("يرجى اختيار مجموعة محددة أولاً لتسجيل الغياب.");
      return;
    }
    
    const unscanned = filteredStudents.filter(student => {
      const isPresent = attendance.some(a => a.student_id === student.id && a.date === selectedDate && a.status === 'present');
      const isExcused = attendance.some(a => a.student_id === student.id && a.date === selectedDate && a.status === 'excused');
      return !isPresent && !isExcused;
    });

    if (unscanned.length === 0) {
      setErrorMsg("جميع طلاب هذه المجموعة تم تحضيرهم اليوم.");
      return;
    }

    setShowAbsentConfirm(unscanned);
  };

  const confirmAbsent = () => {
    if (showAbsentConfirm) {
      showAbsentConfirm.forEach(s => {
        const attendanceClassId = (selectedClass !== 'all') ? selectedClass : s.class_id;
        samsDb.saveAttendance(s.id, attendanceClassId, selectedDate, 'absent');
      });
      loadData();
      setSuccessMsg("تم تسجيل الغياب بنجاح.");
      setShowAbsentConfirm(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Scan className="w-6 h-6 text-[#1A7FAA]" />
            بوابة الحضور والانصراف
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            قارئ الباركود نشط تلقائياً في الخلفية. يمكنك مسح الكروت مباشرة في أي وقت.
          </p>
        </div>
        
        {/* Active Listener Indicator */}
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border shadow-inner transition-colors ${
          isScannerDetected 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
            : 'bg-slate-50 text-slate-500 border-slate-200'
        }`}>
          <div className="relative flex h-3 w-3">
            {isScannerDetected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isScannerDetected ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
          </div>
          <span className="text-xs font-bold tracking-wide">
            {isScannerDetected ? 'الماسح متصل وجاهز للاستقبال' : 'في انتظار مسح الكارت...'}
          </span>
        </div>
      </div>

      {selectedClass !== 'all' && <ClassTimer classObj={classes.find(c => c.id === selectedClass) || null} selectedDate={selectedDate} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Alerts */}
        <div className="lg:col-span-3">
          {successMsg && (
            <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-100 flex items-center gap-2 font-medium mb-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="bg-rose-50 text-rose-700 p-4 rounded-xl border border-rose-100 flex items-center justify-between font-medium mb-2">
              <div className="flex items-center gap-2">
                <X className="w-5 h-5 shrink-0" />
                {errorMsg}
              </div>
              <button onClick={() => setErrorMsg('')} className="text-rose-500 hover:text-rose-700"><X className="w-4 h-4"/></button>
            </div>
          )}
        </div>

        {/* Right side: Real-time scan feed */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-[500px]">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                <Wifi className="w-4 h-4 text-emerald-400" />
                سجل المسح اللحظي
              </h3>
              <span className="text-xs font-mono text-slate-500 bg-slate-800 px-2 py-1 rounded-lg">
                {recentScans.length}
              </span>
            </div>
            
            {/* Feedback Banner */}
            <div className="p-4 bg-slate-900/50 min-h-[90px] flex items-center justify-center border-b border-slate-800/50">
              <AnimatePresence mode="wait">
                {scanFeedback ? (
                  <motion.div
                    key="feedback"
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`w-full p-3 rounded-xl flex items-center gap-3 shadow-lg border ${
                      scanFeedback.type === 'success' 
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
                        : 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                    }`}
                  >
                    {scanFeedback.type === 'success' ? <CheckCheck className="w-6 h-6 shrink-0" /> : <AlertCircle className="w-6 h-6 shrink-0" />}
                    <span className="font-bold text-sm">{scanFeedback.msg}</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="waiting"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-slate-600 font-medium text-sm flex items-center gap-2 animate-pulse"
                  >
                    <Scan className="w-5 h-5" />
                    في انتظار قراءة الباركود...
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
              {recentScans.map((scan, i) => (
                <div key={i} className={`p-3 rounded-xl border flex items-center justify-between ${
                  scan.status === 'success' ? 'bg-slate-800/50 border-emerald-500/30' : 'bg-slate-800/30 border-amber-500/30'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs ${
                      scan.status === 'success' ? 'bg-emerald-600' : 'bg-amber-600'
                    }`}>
                      {scan.student.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-200">{scan.student.name}</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{scan.student.registration_id}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-slate-400 font-mono">{scan.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Left side: Group Attendance Management */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col h-[500px]">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 whitespace-nowrap">
              <UserCheck className="w-5 h-5 text-[#1A7FAA]" />
              مراجعة حضور المجموعات
            </h3>
            
            <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-1">
              <div className="flex items-center justify-between h-9 shrink-0 gap-1 bg-slate-50 px-2 rounded-lg border border-slate-200">
                <Calendar className="w-4 h-4 text-slate-500 mx-1" />
                <span className="text-[11px] font-bold text-slate-700 select-none">
                  {new Date(selectedDate).toLocaleDateString('ar-EG', { weekday: 'long' })}
                </span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent border-none text-[11px] font-bold text-slate-700 focus:ring-0 cursor-pointer p-0 m-0 w-24"
                />
              </div>

              <select
                value={selectedGrade}
                onChange={(e) => { setSelectedGrade(e.target.value); setSelectedClass('all'); }}
                className="h-9 shrink-0 bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg px-2 focus:border-[#1A7FAA] focus:ring-1 focus:ring-[#1A7FAA] outline-hidden cursor-pointer"
              >
                <option value="all">كل الصفوف</option>
                <option value="الأول الإعدادي">الأول الإعدادي</option>
                <option value="الثاني الإعدادي">الثاني الإعدادي</option>
                <option value="الثالث الإعدادي">الثالث الإعدادي</option>
                <option value="الأول الثانوي">الأول الثانوي</option>
                <option value="الثاني الثانوي">الثاني الثانوي</option>                <option value="الثالث الثانوي">الثالث الثانوي</option>
              </select>

              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="h-9 shrink-0 bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg px-2 focus:border-[#1A7FAA] focus:ring-1 focus:ring-[#1A7FAA] outline-hidden cursor-pointer"
              >
                <option value="all">كل المجموعات</option>
                {classes.filter(c => selectedGrade === 'all' || c.grade_level === selectedGrade).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Filters & Actions */}
          {selectedClass !== 'all' && (
            <div className="mb-4 flex justify-end">
              <button
                onClick={markUnscannedAsAbsent}
                className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                تسجيل الغياب لمن لم يحضر (بالمجموعة)
              </button>
            </div>
          )}

          {/* Students list */}
          <div className="flex-1 border border-slate-100 rounded-xl overflow-hidden bg-white">
            {/* Desktop View Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 text-slate-600 font-bold sticky top-0 shadow-sm">
                  <tr>
                    <th className="px-4 py-3">الطالب</th>
                    <th className="px-4 py-3">رقم القيد</th>
                    {selectedGrade === 'all' && <th className="px-4 py-3">الصف</th>}
                    {selectedClass === 'all' && <th className="px-4 py-3">المجموعة</th>}
                    <th className="px-4 py-3 text-center">حالة اليوم</th>
                    <th className="px-4 py-3 text-center">الدفع</th>
                    <th className="px-4 py-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length > 0 ? filteredStudents.map(student => {
                    const studentAtt = attendance.find(a => a.student_id === student.id && a.date === selectedDate);
                    const status = studentAtt ? studentAtt.status : 'pending';
                    const classObj = classes.find(c => c.id === student.class_id);
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-800">{student.name}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{student.registration_id}</td>
                        {selectedGrade === 'all' && (
                          <td className="px-4 py-3 text-xs text-slate-600">{student.grade_level || '-'}</td>
                        )}
                        {selectedClass === 'all' && (
                          <td className="px-4 py-3 text-xs text-slate-600">{classObj?.name || '-'}</td>
                        )}
                        <td className="px-4 py-3 text-center">
                          {status === 'present' && <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md text-xs font-bold"><Check className="w-3.5 h-3.5" /> حاضر</span>}
                          {status === 'absent' && <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 px-2.5 py-1 rounded-md text-xs font-bold"><X className="w-3.5 h-3.5" /> غائب</span>}
                          {status === 'excused' && <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md text-xs font-bold">مستأذن</span>}
                          {status === 'pending' && <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 px-2.5 py-1 rounded-md text-xs font-bold">لم يُسجل</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {fees.some(f => f.student_id === student.id && f.category === 'tuition' && f.month === `${ARABIC_MONTHS[new Date(selectedDate).getMonth()]} ${new Date(selectedDate).getFullYear()}`) ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md text-xs font-bold"><Check className="w-3.5 h-3.5" /> مسدد</span>
                          ) : (
                              <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md text-xs font-bold"><X className="w-3.5 h-3.5" /> غير مسدد</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleMarkPresent(student)}
                              className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-colors ${status === 'present' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50'}`}
                              title="تعيين حاضر"
                            >
                              حاضر
                            </button>
                            <button
                              onClick={() => { samsDb.saveAttendance(student.id, selectedClass !== 'all' ? selectedClass : student.class_id, selectedDate, 'absent'); loadData(); }}
                              className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-colors ${status === 'absent' ? 'bg-rose-100 text-rose-700' : 'text-slate-500 hover:text-rose-700 hover:bg-rose-50'}`}
                              title="تعيين غائب"
                            >
                              غائب
                            </button>
                            <button
                              onClick={() => { samsDb.saveAttendance(student.id, selectedClass !== 'all' ? selectedClass : student.class_id, selectedDate, 'excused'); loadData(); }}
                              className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-colors ${status === 'excused' ? 'bg-amber-100 text-amber-700' : 'text-slate-500 hover:text-amber-700 hover:bg-amber-50'}`}
                              title="تعيين مستأذن"
                            >
                              مستأذن
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                        لا يوجد طلاب في هذه المجموعة
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View Card List */}
            <div className="block md:hidden divide-y divide-slate-100">
              {filteredStudents.length > 0 ? filteredStudents.map(student => {
                const studentAtt = attendance.find(a => a.student_id === student.id && a.date === selectedDate);
                const status = studentAtt ? studentAtt.status : 'pending';
                const classObj = classes.find(c => c.id === student.class_id);
                const isPaid = fees.some(f => f.student_id === student.id && f.category === 'tuition' && f.month === `${ARABIC_MONTHS[new Date(selectedDate).getMonth()]} ${new Date(selectedDate).getFullYear()}`);
                
                return (
                  <div key={student.id} className="p-4 space-y-3 bg-white">
                    {/* Header: Name, registration ID */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs">{student.name}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] font-mono text-slate-500 bg-slate-100 px-1 py-0.2 rounded">
                            #{student.registration_id}
                          </span>
                          {(selectedGrade === 'all' || selectedClass === 'all') && (
                            <span className="text-[8px] font-bold text-sky-700 bg-sky-50 px-1 py-0.2 rounded border border-sky-100/40">
                              {classObj?.name || student.grade_level || '-'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Today Status Badge */}
                      <div>
                        {status === 'present' && <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md text-[10px] font-bold border border-emerald-100"><Check className="w-3 h-3 text-emerald-600" /> حاضر</span>}
                        {status === 'absent' && <span className="inline-flex items-center gap-0.5 bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md text-[10px] font-bold border border-rose-100"><X className="w-3 h-3 text-rose-500" /> غائب</span>}
                        {status === 'excused' && <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md text-[10px] font-bold border border-amber-100">مستأذن</span>}
                        {status === 'pending' && <span className="inline-flex items-center gap-0.5 bg-slate-50 text-slate-500 px-2 py-0.5 rounded-md text-[10px] font-bold border border-slate-100">لم يُسجل</span>}
                      </div>
                    </div>

                    {/* Status & Payment Row */}
                    <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-100/60 text-xxs">
                      <span className="text-slate-400 font-bold">الحالة المالية لشهر الحضور:</span>
                      {isPaid ? (
                        <span className="inline-flex items-center gap-0.5 bg-emerald-100/50 text-emerald-800 px-2 py-0.5 rounded-md font-bold"><Check className="w-3 h-3 text-emerald-600 shrink-0" /> مسدد الرسوم</span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 bg-rose-100/50 text-rose-800 px-2 py-0.5 rounded-md font-bold"><X className="w-3 h-3 text-rose-600 shrink-0" /> متأخر السداد</span>
                      )}
                    </div>

                    {/* Active Controls: 3 Big Buttons */}
                    <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-slate-100/50">
                      <button
                        onClick={() => handleMarkPresent(student)}
                        className={`py-2 rounded-xl text-xxs font-extrabold border transition-all cursor-pointer text-center ${
                          status === 'present'
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                            : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        حاضر ✓
                      </button>
                      <button
                        onClick={() => { samsDb.saveAttendance(student.id, selectedClass !== 'all' ? selectedClass : student.class_id, selectedDate, 'absent'); loadData(); }}
                        className={`py-2 rounded-xl text-xxs font-extrabold border transition-all cursor-pointer text-center ${
                          status === 'absent'
                            ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                            : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        غائب ✖
                      </button>
                      <button
                        onClick={() => { samsDb.saveAttendance(student.id, selectedClass !== 'all' ? selectedClass : student.class_id, selectedDate, 'excused'); loadData(); }}
                        className={`py-2 rounded-xl text-xxs font-extrabold border transition-all cursor-pointer text-center ${
                          status === 'excused'
                            ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                            : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        مستأذن
                      </button>
                    </div>
                  </div>
                );
              }) : (
                <div className="p-12 text-center text-slate-500">
                  <span className="text-xs font-bold block">لا يوجد طلاب في هذه المجموعة</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showAbsentConfirm && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg text-slate-800 mb-2">تأكيد الغياب</h3>
              <p className="text-sm text-slate-500 mb-6">هل أنت متأكد من تسجيل غياب لـ {showAbsentConfirm.length} طالب/طالبة في هذا اليوم؟</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setShowAbsentConfirm(null)} className="px-5 py-2 text-slate-500 font-semibold hover:bg-slate-50 rounded-xl transition-colors">إلغاء</button>
                <button onClick={confirmAbsent} className="px-5 py-2 bg-red-500 text-white font-bold rounded-xl shadow-md hover:bg-red-600 transition-colors">نعم، سجل الغياب</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

            
      {/* Absent Warning Modal */}
      {createPortal(
        <AnimatePresence>
          {absentWarningStudent && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
              <motion.div 
                  initial={{ scale: 0.95, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 10 }}
                  className="bg-white rounded-3xl shadow-2xl max-w-[340px] w-full p-6 text-center border-t-[5px] border-amber-500 relative overflow-hidden"
                  dir="rtl"
              >
                  <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600"></div>
                  <button 
                      onClick={() => setAbsentWarningStudent(null)} 
                      className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full p-1.5 transition-colors"
                  >
                      <X className="w-4 h-4" />
                  </button>
                  
                  <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner shadow-amber-100">
                      <AlertCircle className="w-7 h-7" />
                  </div>
                  
                  <h3 className="font-extrabold text-lg text-slate-800 mb-1 tracking-tight">تنبيه غياب سابق!</h3>
                  <p className="text-xs text-slate-500 mb-4">الطالب كان غائباً في الحصة السابقة</p>
                  
                  <div className="bg-gradient-to-b from-slate-50 to-white p-3.5 rounded-2xl border border-slate-100 text-center mb-5 shadow-sm">
                      <p className="font-bold text-slate-800 text-sm mb-0.5 truncate">{absentWarningStudent.student.name}</p>
                      <p className="text-xs text-slate-400 mb-2 font-mono tracking-wider">{absentWarningStudent.student.registration_id}</p>
                      <div className="inline-flex items-center justify-center gap-1.5 bg-amber-50 border border-amber-100/50 px-3 py-1.5 rounded-lg w-full">
                          <Calendar className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-amber-700 font-bold text-xs">تاريخ الغياب: {absentWarningStudent.lastDate}</span>
                      </div>
                  </div>
                  
                  <div className="flex flex-col gap-2.5">
                      <button 
                          onClick={() => {
                              samsDb.saveAttendance(absentWarningStudent.student.id, absentWarningStudent.student.class_id, selectedDate, 'present');
                              setAbsentWarningStudent(null);
                              loadData();
                              playSuccessBeep();
                              setScanFeedback({ type: 'success', msg: `حضور: ${absentWarningStudent.student.name}` });
                              setRecentScans(prev => [{
                                student: absentWarningStudent.student,
                                timestamp: new Date().toLocaleTimeString('ar-EG'),
                                status: 'success'
                              }, ...prev].slice(0, 50));
                          }}
                          className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2 text-sm group"
                      >
                          <CheckCircle2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          حسناً، تسجيل الحضور
                      </button>
                  </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Unpaid Payment Modal */}
      {createPortal(
        <AnimatePresence>
          {unpaidStudentForBarcode && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
              <motion.div 
                  initial={{ scale: 0.95, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 10 }}
                  className="bg-white rounded-3xl shadow-2xl max-w-[340px] w-full p-6 text-center border-t-[5px] border-rose-500 relative overflow-hidden"
                  dir="rtl"
              >
                  <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-rose-400 via-rose-500 to-rose-600"></div>
                  <button 
                      onClick={() => setUnpaidStudentForBarcode(null)} 
                      className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full p-1.5 transition-colors"
                  >
                      <X className="w-4 h-4" />
                  </button>
                  
                  <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner shadow-rose-100">
                      <Wallet className="w-7 h-7" />
                  </div>
                  
                  <h3 className="font-extrabold text-lg text-slate-800 mb-1 tracking-tight">تنبيه تأخير السداد!</h3>
                  <p className="text-xs text-slate-500 mb-4">يجب سداد الاشتراك لتسجيل الحضور</p>
                  
                  <div className="bg-gradient-to-b from-slate-50 to-white p-3.5 rounded-2xl border border-slate-100 text-center mb-5 shadow-sm">
                      <p className="font-bold text-slate-800 text-sm mb-0.5 truncate">{unpaidStudentForBarcode.name}</p>
                      <p className="text-xs text-slate-400 mb-2 font-mono tracking-wider">{unpaidStudentForBarcode.registration_id}</p>
                      <div className="inline-flex items-center justify-center gap-1.5 bg-rose-50 border border-rose-100/50 px-3 py-1.5 rounded-lg w-full">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                          <span className="text-rose-600 font-bold text-xs">متأخر عن: {unpaidMonth}</span>
                      </div>
                  </div>
                  
                  <div className="flex flex-col gap-2.5">
                      <button 
                          onClick={handleQuickPayFromBarcode}
                          className="w-full py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold rounded-xl shadow-md shadow-rose-200 transition-all flex items-center justify-center gap-2 text-sm group"
                      >
                          <CreditCard className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          سداد وتسجيل الحضور
                      </button>
                      <button 
                          onClick={() => {
                              const student = unpaidStudentForBarcode;
                              setUnpaidStudentForBarcode(null);
                              processAttendance(student);
                          }} 
                          className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm border border-transparent hover:border-slate-200"
                      >
                          <UserCheck className="w-4 h-4" />
                          تجاوز الحضور فقط
                      </button>
                  </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
