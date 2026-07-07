import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Student, ClassRoom, Attendance } from '../types';
import { samsDb } from '../utils/db';
import { CheckCheck, AlertCircle, Scan, UserCheck, Calendar, RotateCcw, Search, ShieldAlert, Wifi, Check, X, CheckCircle2, Trash2 } from 'lucide-react';
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

export default function AttendanceTracker() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  
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
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Polling for updates
    return () => clearInterval(interval);
  }, []);

  const handleBarcodeScan = (barcode: string) => {
    const cleanCode = barcode.trim();
    if (!cleanCode) return;

    // Find student by registration_id
    const student = students.find(s => s.registration_id === cleanCode || s.national_id === cleanCode);
    
    if (!student) {
      playErrorBuzzer();
      setScanFeedback({ type: 'error', msg: `الطالب غير موجود (${cleanCode})` });
      setTimeout(() => setScanFeedback(null), 3000);
      return;
    }

    // Use selectedDate for scanning, so you can scan for past days
    const targetDate = selectedDate;
    
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

    // Save attendance
    samsDb.saveAttendance(student.id, student.class_id, targetDate, 'present');
    loadData();
    playSuccessBeep();
    
    setScanFeedback({ type: 'success', msg: `حضور: ${student.name}` });
    setRecentScans(prev => [{
      student,
      timestamp: new Date().toLocaleTimeString('ar-EG'),
      status: 'success'
    }, ...prev].slice(0, 50));
    
    setTimeout(() => setScanFeedback(null), 3000);
  };

  // Mount the global barcode listener
  const { isScannerDetected } = useBarcodeScanner(handleBarcodeScan);

  // Group Management logic
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesClass = selectedClass === 'all' || s.class_id === selectedClass;
      const matchesGrade = selectedGrade === 'all' || s.grade_level === selectedGrade;
      return matchesClass && matchesGrade;
    });
  }, [students, selectedClass, selectedGrade]);

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
        samsDb.saveAttendance(s.id, s.class_id, selectedDate, 'absent');
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

          {/* Students Table */}
          <div className="flex-1 overflow-auto border border-slate-100 rounded-xl">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 text-slate-600 font-bold sticky top-0 shadow-sm">
                <tr>
                  <th className="px-4 py-3">الطالب</th>
                  <th className="px-4 py-3">رقم القيد</th>
                  {selectedGrade === 'all' && <th className="px-4 py-3">الصف</th>}
                  {selectedClass === 'all' && <th className="px-4 py-3">المجموعة</th>}
                  <th className="px-4 py-3 text-center">حالة اليوم</th>
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
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => { samsDb.saveAttendance(student.id, student.class_id, selectedDate, 'present'); loadData(); }}
                            className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-colors ${status === 'present' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50'}`}
                            title="تعيين حاضر"
                          >
                            حاضر
                          </button>
                          <button
                            onClick={() => { samsDb.saveAttendance(student.id, student.class_id, selectedDate, 'absent'); loadData(); }}
                            className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-colors ${status === 'absent' ? 'bg-rose-100 text-rose-700' : 'text-slate-500 hover:text-rose-700 hover:bg-rose-50'}`}
                            title="تعيين غائب"
                          >
                            غائب
                          </button>
                          <button
                            onClick={() => { samsDb.saveAttendance(student.id, student.class_id, selectedDate, 'excused'); loadData(); }}
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
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                      لا يوجد طلاب في هذه المجموعة
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
    </div>
  );
}
