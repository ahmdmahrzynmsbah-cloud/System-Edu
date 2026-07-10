/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Student, FeePayment, ClassRoom } from '../types';
import { samsDb, addAuditLog, saveToStorage } from '../utils/db';
import { 
  Check, 
  ShieldAlert, 
  CreditCard, 
  Receipt, 
  Award, 
  Printer, 
  Plus, 
  AlertCircle, 
  RefreshCw, 
  Search, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  Send, 
  Trash2,
  FileSpreadsheet,
  Coins,
  ArrowLeftRight,
  TrendingUp,
  UserCheck
} from 'lucide-react';

const MONTHS_LIST = [
  'يوليو 2026',
  'أغسطس 2026',
  'سبتمبر 2026',
  'أكتوبر 2026',
  'نوفمبر 2026',
  'ديسمبر 2026',
  'يناير 2027',
  'فبراير 2027',
  'مارس 2027',
  'أبريل 2027',
  'مايو 2027',
  'يونيو 2027'
];

const playSuccessBeep = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) {
    console.log(e);
  }
};

const playCashRegisterSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    // Chime 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1200, ctx.currentTime);
    gain1.gain.setValueAtTime(0.05, ctx.currentTime);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.08);

    // Chime 2
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1500, ctx.currentTime);
      gain2.gain.setValueAtTime(0.05, ctx.currentTime);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start();
      osc2.stop(ctx.currentTime + 0.15);
    }, 80);
  } catch (e) {
    console.log(e);
  }
};

export default function FeesTracker() {
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'all_receipts'>('subscriptions');
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [paymentToDelete, setPaymentToDelete] = useState<FeePayment | null>(null);
  
  // Selection filters
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('يوليو 2026');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Quick payment modal states
  const [showQuickPayModal, setShowQuickPayModal] = useState(false);
  const [quickPayStudent, setQuickPayStudent] = useState<Student | null>(null);
  const [quickPayAmount, setQuickPayAmount] = useState<number | ''>(250);
  const [quickPayMethod, setQuickPayMethod] = useState<FeePayment['payment_method']>('cash');
  const [quickPayNotify, setQuickPayNotify] = useState<boolean>(true);
  const [quickPayCategory, setQuickPayCategory] = useState<FeePayment['category']>('tuition');
  const [quickPaySessionCount, setQuickPaySessionCount] = useState<number | ''>(4);
  const [quickPaySessionPrice, setQuickPaySessionPrice] = useState<number | ''>(50);

  // General payment form states (Tab 2)
  const [showGeneralPayForm, setShowGeneralPayForm] = useState(false);
  const [generalPayData, setGeneralPayData] = useState({
    student_id: '',
    amount: 250 as number | '',
    payment_method: 'cash' as FeePayment['payment_method'],
    category: 'tuition' as FeePayment['category'],
    term: 'first_term' as FeePayment['term'],
    month: 'يوليو 2026',
    session_count: 4 as number | '',
    session_price: 50 as number | ''
  });

  // Automatically calculate general payment amount based on session count and price
  useEffect(() => {
    if (generalPayData.category === 'sessions') {
      const count = generalPayData.session_count === '' ? 0 : Number(generalPayData.session_count);
      const price = generalPayData.session_price === '' ? 0 : Number(generalPayData.session_price);
      setGeneralPayData(prev => ({
        ...prev,
        amount: count * price
      }));
    }
  }, [generalPayData.category, generalPayData.session_count, generalPayData.session_price]);

  // Automatically calculate quick pay amount based on session count and price
  useEffect(() => {
    if (quickPayCategory === 'sessions') {
      const count = quickPaySessionCount === '' ? 0 : Number(quickPaySessionCount);
      const price = quickPaySessionPrice === '' ? 0 : Number(quickPaySessionPrice);
      setQuickPayAmount(count * price);
    }
  }, [quickPayCategory, quickPaySessionCount, quickPaySessionPrice]);

  // Monthly group fees rate config
  const [gradeFees, setGradeFees] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('sams_grade_monthly_fees');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return {
      'الصف الأول الإعدادي': 150,
      'الصف الثاني الإعدادي': 150,
      'الصف الثالث الإعدادي': 150,
      'الصف الأول الثانوي': 200,
      'الصف الثاني الثانوي': 250,
      'الصف الثالث الثانوي': 300
    };
  });

  // Feedback states
  const [successInfo, setSuccessInfo] = useState('');
  const [errorInfo, setErrorInfo] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<FeePayment | null>(null);

  useEffect(() => {
    loadData();
    window.addEventListener('sams_data_changed', loadData);
    return () => window.removeEventListener('sams_data_changed', loadData);
  }, []);

  const loadData = () => {
    const allPayments = samsDb.getFees();
    const allStudents = samsDb.getStudents();
    const allClasses = samsDb.getClasses();
    
    setPayments(allPayments);
    setStudents(allStudents);
    setClasses(allClasses);

    if (allClasses.length > 0) {
      const grades = Array.from(new Set(allClasses.map(c => c.grade_level)));
      if (!selectedGrade && grades.length > 0) {
        setSelectedGrade(grades[0]);
        setSelectedClass('all');
      }
    }
  };

  // Auto-clear success/error alerts
  useEffect(() => {
    if (successInfo) {
      const timer = setTimeout(() => setSuccessInfo(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [successInfo]);

  useEffect(() => {
    if (errorInfo) {
      const timer = setTimeout(() => setErrorInfo(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [errorInfo]);

  // Save updated group fee rates
  const handleSaveGradeFee = (gradeLevel: string, amount: number) => {
    const updated = { ...gradeFees, [gradeLevel]: amount };
    setGradeFees(updated);
    saveToStorage('sams_grade_monthly_fees', updated);
    setSuccessInfo(`تم تحديث قيمة اشتراك الصف بنجاح لتصبح: ${amount} ج.م`);
    playSuccessBeep();
  };

  // Quick Pay Submit Handler
  const handleQuickPaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPayStudent) return;

    // Check if already paid for this month (only if tuition subscription)
    if (quickPayCategory === 'tuition') {
      const alreadyPaid = payments.some(
        p => p.student_id === quickPayStudent.id && 
             p.category === 'tuition' && 
             p.month === selectedMonth
      );

      if (alreadyPaid) {
        setErrorInfo(`الطالب ${quickPayStudent.name} مسجل كمدفوع له بالفعل لشهر ${selectedMonth}`);
        setShowQuickPayModal(false);
        return;
      }
    }

    // Register payment
    const newPayment = samsDb.addPayment({
      student_id: quickPayStudent.id,
      amount: Number(quickPayAmount),
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: quickPayMethod,
      term: 'first_term', // Default term
      category: quickPayCategory,
      month: quickPayCategory === 'tuition' ? selectedMonth : undefined,
      session_count: quickPayCategory === 'sessions' ? (quickPaySessionCount === '' ? undefined : Number(quickPaySessionCount)) : undefined,
      session_price: quickPayCategory === 'sessions' ? (quickPaySessionPrice === '' ? undefined : Number(quickPaySessionPrice)) : undefined
    });

    // Simulated SMS message to parent
    if (quickPayNotify) {
      const msgDetails = quickPayCategory === 'sessions' 
        ? `حضور عدد (${quickPaySessionCount}) حصص بسعر (${quickPaySessionPrice} ج.م) للحصة`
        : `اشتراك شهر (${selectedMonth})`;

      samsDb.addNotification({
        title: `تأكيد استلام اشتراك: ${quickPayStudent.name}`,
        message: `تم بحمد الله استلام قيمة ${msgDetails} والمقدرة بـ ${quickPayAmount} ج.م للطالب ${quickPayStudent.name}. إيصال سداد رقم: ${newPayment.receipt_number}. شكراً لكم.`,
        category: 'sms',
        recipient_type: 'specific',
        recipient_id: quickPayStudent.id
      });
    }

    playCashRegisterSound();
    setSuccessInfo(
      quickPayCategory === 'sessions'
        ? `تم سداد قيمة الحصص للطالب: ${quickPayStudent.name} بنجاح! رقم الإيصال: ${newPayment.receipt_number}`
        : `تم سداد اشتراك شهر ${selectedMonth} للطالب: ${quickPayStudent.name} بنجاح! رقم الإيصال: ${newPayment.receipt_number}`
    );
    
    // Autoopen receipt for printing
    setSelectedReceipt(newPayment);
    setShowQuickPayModal(false);
    loadData();
  };

  // General payment form submit
  const handleGeneralPaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!generalPayData.student_id) {
      setErrorInfo('يرجى اختيار الطالب أولاً لإتمام المعاملة المالية.');
      return;
    }

    const newPayment = samsDb.addPayment({
      student_id: generalPayData.student_id,
      amount: Number(generalPayData.amount),
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: generalPayData.payment_method,
      category: generalPayData.category,
      term: generalPayData.term,
      month: generalPayData.category === 'tuition' ? generalPayData.month : undefined,
      session_count: generalPayData.category === 'sessions' ? (generalPayData.session_count === '' ? undefined : Number(generalPayData.session_count)) : undefined,
      session_price: generalPayData.category === 'sessions' ? (generalPayData.session_price === '' ? undefined : Number(generalPayData.session_price)) : undefined
    });

    playCashRegisterSound();
    setSuccessInfo(`تم تسجيل العملية بنجاح برقم إيصال: ${newPayment.receipt_number}`);
    setShowGeneralPayForm(false);
    setSelectedReceipt(newPayment);
    
    // Reset general pay data
    setGeneralPayData({
      student_id: '',
      amount: 250 as number | '',
      payment_method: 'cash',
      category: 'tuition',
      term: 'first_term',
      month: selectedMonth,
      session_count: 4 as number | '',
      session_price: 50 as number | ''
    });

    loadData();
  };

  // Delete payment handler
  const confirmDeletePayment = () => {
    if (!paymentToDelete) return;

    const fees = samsDb.getFees();
    const paymentId = paymentToDelete.id;

    const filtered = fees.filter(f => f.id !== paymentId);
    saveToStorage('sams_v2_fees', filtered);
    
    // Log audit
    const student = students.find(s => s.id === paymentToDelete.student_id);
    const studentName = student ? student.name : 'طالب';
    addAuditLog('DELETE', 'fees', paymentId, `حذف وإلغاء إيصال السداد رقم ${paymentToDelete.receipt_number} بقيمة ${paymentToDelete.amount} ج.م للطالب (${studentName})`);
    
    setSuccessInfo(`تم إلغاء وحذف الإيصال رقم ${paymentToDelete.receipt_number} بنجاح.`);
    setPaymentToDelete(null);
    loadData();
  };

  // Students in selected class
  const classStudents = students.filter(student => {
    const currentClassIds = student.class_ids || [student.class_id, student.class_id_2].filter(Boolean);
    if (selectedClass !== 'all') {
      return currentClassIds.includes(selectedClass);
    }
    const studentClasses = currentClassIds.map(id => classes.find(c => c.id === id)).filter(Boolean);
    return studentClasses.some(c => c.grade_level === selectedGrade) || student.grade_level === selectedGrade;
  });
  
  // Filter students based on search query
  const filteredClassStudents = classStudents.filter(s => 
    s.name.includes(searchQuery) || 
    s.registration_id.includes(searchQuery)
  );

  // Stats calculation for active group & month
  const activeGradeMonthlyFee = gradeFees[selectedGrade] || 250;
  const paidStudentsInClass = classStudents.filter(s => 
    payments.some(p => p.student_id === s.id && p.category === 'tuition' && p.month === selectedMonth)
  );
  const unpaidStudentsInClass = classStudents.filter(s => 
    !payments.some(p => p.student_id === s.id && p.category === 'tuition' && p.month === selectedMonth)
  );

  const totalCollectedForMonth = payments
    .filter(p => {
      const student = students.find(s => s.id === p.student_id);
      if (!student) return false;
      const currentClassIds = student.class_ids || [student.class_id, student.class_id_2].filter(Boolean);
      if (selectedClass !== 'all') {
        if (!currentClassIds.includes(selectedClass)) return false;
      } else {
        const studentClasses = currentClassIds.map(id => classes.find(c => c.id === id)).filter(Boolean);
        const matchesGrade = studentClasses.some(c => c.grade_level === selectedGrade) || student.grade_level === selectedGrade;
        if (!matchesGrade) return false;
      }
      return p.category === 'tuition' && p.month === selectedMonth;
    })
    .reduce((sum, item) => sum + item.amount, 0);

  const expectedRevenue = classStudents.length * activeGradeMonthlyFee;
  const outstandingDebt = unpaidStudentsInClass.length * activeGradeMonthlyFee;
  const collectionPercentage = expectedRevenue > 0 ? Math.round((totalCollectedForMonth / expectedRevenue) * 100) : 0;

  // Calculate dynamic history timeline (rolling 4 months ending with selected month)
  const currentMonthIdx = MONTHS_LIST.indexOf(selectedMonth);
  const timelineMonths = MONTHS_LIST.slice(Math.max(0, currentMonthIdx - 3), currentMonthIdx + 1);

  return (
    <div className="space-y-6" id="sams_fees_module" dir="rtl">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
        <div className="text-right">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Coins className="w-5 h-5 text-[#0D5C8C]" />
            <span>نظام اشتراكات الطلاب والتحصيل الشهري</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">تتبع وتحصيل اشتراكات المجموعات لشهر {selectedMonth} ومراجعة مديونيات الطلاب بنقرة واحدة</p>
        </div>

        <div className="flex gap-2">
          {activeTab === 'subscriptions' ? (
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 pr-1">قيمة اشتراك للصف المحدد:</span>
              <input 
                type="number" 
                value={activeGradeMonthlyFee === 0 ? '' : activeGradeMonthlyFee}
                onChange={(e) => handleSaveGradeFee(selectedGrade, e.target.value === '' ? 0 : Number(e.target.value))}
                className="w-16 text-center text-xs font-sans font-bold text-[#0D5C8C] bg-white border border-slate-200 rounded-md py-1 px-1.5 focus:outline-hidden"
                title="عدّل قيمة اشتراك الشهر لهذا الصف واحفظ لتتغير قيمة السداد التلقائية لكل الطلاب"
              />
              <span className="text-[10px] text-slate-400 font-bold pl-1">ج.م</span>
            </div>
          ) : (
            <button
              onClick={() => {
                setShowGeneralPayForm(!showGeneralPayForm);
                setErrorInfo('');
                setSuccessInfo('');
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#0D5C8C] hover:bg-[#1A7FAA] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل سداد رسوم عامة</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-100 gap-1 bg-white p-1.5 rounded-xl border border-gray-100 shadow-3xs">
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'subscriptions'
              ? 'bg-[#0D5C8C] text-white shadow-xs'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          منصة الاشتراكات الشهرية 🗓️
        </button>
        <button
          onClick={() => {
            setActiveTab('all_receipts');
            setShowGeneralPayForm(false);
          }}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'all_receipts'
              ? 'bg-[#0D5C8C] text-white shadow-xs'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          دفتر الإيصالات والمدفوعات التاريخي 📑
        </button>
      </div>

      {/* Alerts */}
      {successInfo && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
          <Check className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successInfo}</span>
        </div>
      )}

      {errorInfo && (
        <div className="p-4 bg-red-50 border border-red-200 text-[#C0152A] rounded-xl text-xs flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4.5 h-4.5 text-[#E8192C] shrink-0" />
          <span className="font-semibold">{errorInfo}</span>
        </div>
      )}

      {/* General Fee Recording Form (Tab 2 subform) */}
      {showGeneralPayForm && activeTab === 'all_receipts' && (
        <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-[#0D5C8C]/20 shadow-xs animate-slide-up">
          <h3 className="font-bold text-[#0D5C8C] text-sm mb-4 border-b border-slate-50 pb-2">تسجيل إيصال سداد رسوم عامة (زي / باص / مذكرات)</h3>
          <form onSubmit={handleGeneralPaySubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 text-right">
            
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">الطالب المستفيد *</label>
              <select
                value={generalPayData.student_id}
                onChange={(e) => setGeneralPayData({ ...generalPayData, student_id: e.target.value })}
                className="w-full text-xs font-sans border border-slate-200 p-2.5 rounded-lg text-slate-700 bg-white"
                required
              >
                <option value="">-- اختر الطالب --</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} (كود: #{s.registration_id})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">نوع البند الدراسي الرسومي</label>
              <select
                value={generalPayData.category}
                onChange={(e) => setGeneralPayData({ ...generalPayData, category: e.target.value as FeePayment['category'] })}
                className="w-full text-xs font-sans border border-slate-200 p-2.5 rounded-lg text-slate-700 bg-white"
              >
                <option value="tuition">اشتراك الشهر الدراسي (Tuition)</option>
                <option value="sessions">فلوس حصص حضر (بعدد الحصص وسعرها)</option>
                <option value="bus">اشتراك الباص ونقل السنتر</option>
                <option value="uniform">الزي المدرسي والملازم الأساسية</option>
                <option value="activities">رحلات سنوية وأنشطة إضافية</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                قيمة المبلغ المدفوع (ج.م) *
                {generalPayData.category === 'sessions' && <span className="text-xxs text-indigo-600 block">(محسوب تلقائياً)</span>}
              </label>
              <input
                type="number"
                min={0}
                max={15000}
                value={generalPayData.amount === '' ? '' : generalPayData.amount}
                onChange={(e) => setGeneralPayData({ ...generalPayData, amount: e.target.value === '' ? '' : Number(e.target.value) })}
                className={`w-full text-xs font-sans border border-slate-200 px-3 py-2.5 rounded-lg text-slate-700 text-right ${generalPayData.category === 'sessions' ? 'bg-slate-50 font-bold text-indigo-700 border-indigo-200' : ''}`}
                required
                disabled={generalPayData.category === 'sessions'}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">طريقة الدفع المعتمدة</label>
              <select
                value={generalPayData.payment_method}
                onChange={(e) => setGeneralPayData({ ...generalPayData, payment_method: e.target.value as FeePayment['payment_method'] })}
                className="w-full text-xs font-sans border border-slate-200 p-2.5 rounded-lg text-slate-700 bg-white"
              >
                <option value="cash">نقدي (Cash)</option>
                <option value="card">دفع إلكتروني (POS/فيزا)</option>
                <option value="transfer">تحويل فودافون كاش / بنكي</option>
              </select>
            </div>

            {generalPayData.category === 'sessions' && (
              <>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">عدد الحصص التي حضرها الطالب *</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={generalPayData.session_count === '' ? '' : generalPayData.session_count}
                    onChange={(e) => setGeneralPayData({ ...generalPayData, session_count: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full text-xs font-sans border border-indigo-200 px-3 py-2 rounded-lg text-slate-700 text-right focus:border-[#0D5C8C] focus:outline-hidden"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">سعر الحصة الواحدة (ج.م) *</label>
                  <input
                    type="number"
                    min={0}
                    max={1000}
                    value={generalPayData.session_price === '' ? '' : generalPayData.session_price}
                    onChange={(e) => setGeneralPayData({ ...generalPayData, session_price: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full text-xs font-sans border border-indigo-200 px-3 py-2 rounded-lg text-slate-700 text-right focus:border-[#0D5C8C] focus:outline-hidden"
                    required
                  />
                </div>
              </>
            )}

            {generalPayData.category === 'tuition' && (
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">سداد لاشتراك شهر:</label>
                <select
                  value={generalPayData.month}
                  onChange={(e) => setGeneralPayData({ ...generalPayData, month: e.target.value })}
                  className="w-full text-xs font-sans border border-slate-200 p-2.5 rounded-lg text-slate-700 bg-white"
                >
                  {MONTHS_LIST.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="md:col-span-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setShowGeneralPayForm(false)}
                className="px-4 py-2 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-bold cursor-pointer"
              >
                إلغاء السداد
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#0D5C8C] hover:bg-[#1A7FAA] text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>توثيق الفاتورة وطباعة الإيصال</span>
              </button>
            </div>

          </form>
        </div>
      )}


      {/* TAB 1: MONTHLY SUBSCRIPTIONS ENGINE */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-6">
          
          {/* Controls Panel (Group & Month Selector) */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-3xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="space-y-1.5 text-right">
              <label className="block text-xs font-extrabold text-slate-500">اختر الصف الدراسي:</label>
              <select
                value={selectedGrade}
                onChange={(e) => {
                  setSelectedGrade(e.target.value);
                  setSelectedClass('all');
                }}
                className="w-full text-xs font-sans font-semibold border border-slate-200 p-2.5 rounded-lg text-slate-700 bg-slate-50/50 focus:bg-white focus:outline-hidden"
              >
                {Array.from(new Set(classes.map(c => c.grade_level))).map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1.5 text-right">
              <label className="block text-xs font-extrabold text-slate-500">اختر المجموعة الدراسية:</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full text-xs font-sans font-semibold border border-slate-200 p-2.5 rounded-lg text-slate-700 bg-slate-50/50 focus:bg-white focus:outline-hidden"
              >
                <option value="all">جميع المجموعات (للصف المحدد)</option>
                {classes.filter(c => c.grade_level === selectedGrade).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 text-right">
              <label className="block text-xs font-extrabold text-slate-500">اختر شهر الاشتراك الحالي:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full text-xs font-sans font-semibold border border-slate-200 p-2.5 rounded-lg text-slate-700 bg-slate-50/50 focus:bg-white focus:outline-hidden"
              >
                {MONTHS_LIST.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 text-right">
              <label className="block text-xs font-extrabold text-slate-500">البحث بالاسم أو رقم القيد الكودي:</label>
              <div className="relative">
                <Search className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحث عن طالب بالمجموعة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs font-sans border border-slate-200 pr-9 pl-3 py-2.5 rounded-lg text-slate-700 bg-slate-50/50 focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

          </div>

          {/* Subscription Analytics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            
            <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between shadow-3xs">
              <div className="space-y-1 text-right">
                <span className="text-[10px] text-slate-400 font-bold block">إجمالي الطلاب (حسب التصفية)</span>
                <span className="text-lg font-black text-slate-800">{classStudents.length} طلاب</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg text-slate-600">
                <UserCheck className="w-4.5 h-4.5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between shadow-3xs">
              <div className="space-y-1 text-right">
                <span className="text-[10px] text-slate-400 font-bold block">الاشتراكات المحصلة</span>
                <span className="text-lg font-black text-emerald-600">
                  {paidStudentsInClass.length} <span className="text-xs text-slate-400 font-bold">طالب ({collectionPercentage}%)</span>
                </span>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
                <CheckCircle2 className="w-4.5 h-4.5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between shadow-3xs">
              <div className="space-y-1 text-right">
                <span className="text-[10px] text-slate-400 font-bold block">المحصل لشهر {selectedMonth}</span>
                <span className="text-lg font-black text-[#0D5C8C]">{totalCollectedForMonth.toLocaleString()} ج.م</span>
              </div>
              <div className="p-2.5 bg-[#0D5C8C]/5 rounded-lg text-[#0D5C8C]">
                <TrendingUp className="w-4.5 h-4.5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between shadow-3xs">
              <div className="space-y-1 text-right">
                <span className="text-[10px] text-slate-400 font-bold block">المديونية المتبقية (المتأخرات)</span>
                <span className="text-lg font-black text-rose-600">{outstandingDebt.toLocaleString()} ج.م</span>
              </div>
              <div className="p-2.5 bg-rose-50 rounded-lg text-rose-500">
                <XCircle className="w-4.5 h-4.5" />
              </div>
            </div>

          </div>

          {/* Students Subscription Matrix */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-50 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">مصفوفة سداد الاشتراكات لطلاب {selectedClass === 'all' ? selectedGrade : '(' + classes.find(c => c.id === selectedClass)?.name + ')'}</h3>
              <span className="text-[10px] bg-[#0D5C8C]/5 text-[#0D5C8C] px-3 py-1 rounded-full font-bold">الشهر المعروض: {selectedMonth}</span>
            </div>

            <div className="hidden md:block overflow-x-auto border border-gray-50 rounded-xl">
              <table className="min-w-full text-right" dir="rtl">
                <thead className="bg-slate-50 text-slate-700 text-xs font-bold border-b border-gray-100">
                  <tr>
                    <th className="p-3 w-20">كود الطالب</th>
                    <th className="p-3">اسم الطالب</th>
                    <th className="p-3">حالة الشهور الفائتة ({timelineMonths.length} شهور)</th>
                    <th className="p-3 text-center">اشتراك شهر {selectedMonth} الحالي</th>
                    <th className="p-3 text-left">الإجراء المالي الفوري</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-slate-700 font-sans">
                  {filteredClassStudents.map(student => {
                    // Check if paid for current month
                    const currentMonthPayment = payments.find(
                      p => p.student_id === student.id && 
                           p.category === 'tuition' && 
                           p.month === selectedMonth
                    );
                    const isPaidThisMonth = !!currentMonthPayment;

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/50 transition-all">
                        
                        {/* Student Reg ID */}
                        <td className="p-3 font-mono font-extrabold text-[#0D5C8C]">#{student.registration_id}</td>
                        
                        {/* Student Name */}
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 text-[13px]">{student.name}</span>
                            <span className="text-[9px] text-slate-400 font-medium">الهاتف: {student.phone} | ولي الأمر: {student.parent_phone}</span>
                          </div>
                        </td>

                        {/* Visual Rolling Timeline of past 4 months */}
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            {timelineMonths.map((m) => {
                              const paidForThisTimelineMonth = payments.some(
                                p => p.student_id === student.id && 
                                     p.category === 'tuition' && 
                                     p.month === m
                              );
                              
                              const isTargetMonth = m === selectedMonth;

                              return (
                                <div 
                                  key={m} 
                                  className={`flex flex-col items-center px-1.5 py-0.5 rounded text-[8px] font-bold border transition-all ${
                                    paidForThisTimelineMonth 
                                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-700' 
                                      : isTargetMonth 
                                      ? 'bg-slate-100/50 border-slate-200 text-slate-400'
                                      : 'bg-rose-50/70 border-rose-200 text-rose-700 font-semibold'
                                  }`}
                                  title={`${m}: ${paidForThisTimelineMonth ? 'مدفوع 🟢' : 'غير مدفوع 🔴'}`}
                                >
                                  <span>{m.split(' ')[0]}</span>
                                  <span className="text-[7px]">
                                    {paidForThisTimelineMonth ? '✓' : '✖'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </td>

                        {/* Current Month Payment Badge */}
                        <td className="p-3 text-center">
                          {isPaidThisMonth ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-bold text-[10px]">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>مدفوع ({currentMonthPayment.amount} ج.م)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-50 text-rose-800 border border-rose-100 rounded-full font-bold text-[10px] animate-pulse">
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                              <span>غير مدفوع</span>
                            </span>
                          )}
                        </td>

                        {/* Quick action button */}
                        <td className="p-3 text-left">
                          {isPaidThisMonth ? (
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedReceipt(currentMonthPayment)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-[#0D5C8C] rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                title="طباعة الإيصال الورقي"
                              >
                                <Printer className="w-3 h-3" />
                                <span>إيصال #{currentMonthPayment.receipt_number.split('-').pop()}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setPaymentToDelete(currentMonthPayment)}
                                className="p-1 text-slate-300 hover:text-red-600 rounded transition-colors cursor-pointer"
                                title="إلغاء المعاملة وحذفها"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setQuickPayStudent(student);
                                setQuickPayAmount(activeGradeMonthlyFee);
                                setShowQuickPayModal(true);
                              }}
                              className="px-3 py-1.5 bg-[#0D5C8C] hover:bg-[#1A7FAA] text-white rounded-lg font-bold flex items-center gap-1 transition-all hover:scale-105 cursor-pointer ml-0 mr-auto"
                            >
                              <Plus className="w-3 h-3" />
                              <span>سداد سريع 💸</span>
                            </button>
                          )}
                        </td>

                      </tr>
                    );
                  })}

                  {filteredClassStudents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500 font-sans">
                        {searchQuery ? 'لا يوجد طلاب يطابقون بحثك ضمن الشروط المحددة.' : 'لا يوجد طلاب مسجلين ضمن هذه الشروط حالياً.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View Cards list (One-touch interaction) */}
            <div className="block md:hidden space-y-3">
              {filteredClassStudents.map(student => {
                const currentMonthPayment = payments.find(
                  p => p.student_id === student.id && 
                       p.category === 'tuition' && 
                       p.month === selectedMonth
                );
                const isPaidThisMonth = !!currentMonthPayment;

                return (
                  <div key={student.id} className={`p-4 rounded-xl border transition-all space-y-3 ${
                    isPaidThisMonth ? 'bg-emerald-50/10 border-emerald-100' : 'bg-white border-slate-100 shadow-2xs'
                  }`}>
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono font-black text-[#0D5C8C] bg-sky-50 px-1.5 py-0.5 rounded">
                          #{student.registration_id}
                        </span>
                        <h4 className="font-bold text-slate-800 text-xs mt-1.5 leading-tight">{student.name}</h4>
                        <span className="text-[9px] text-slate-400 block mt-1">الهاتف: {student.phone} | ولي الأمر: {student.parent_phone}</span>
                      </div>
                      
                      {/* Current Status Badge */}
                      {isPaidThisMonth ? (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md font-bold text-[9px] flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                          <span>مسدد</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-100 rounded-md font-bold text-[9px] flex items-center gap-0.5 animate-pulse">
                          <AlertCircle className="w-2.5 h-2.5 text-rose-600 shrink-0" />
                          <span>متأخر</span>
                        </span>
                      )}
                    </div>

                    {/* Timeline past months */}
                    <div className="bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                      <span className="text-[9px] text-slate-400 font-bold block mb-1">حالة الشهور السابقة:</span>
                      <div className="flex items-center gap-1.5">
                        {timelineMonths.map((m) => {
                          const paidForThisTimelineMonth = payments.some(
                            p => p.student_id === student.id && 
                                 p.category === 'tuition' && 
                                 p.month === m
                          );
                          const isTargetMonth = m === selectedMonth;

                          return (
                            <div 
                              key={m} 
                              className={`flex-1 flex flex-col items-center py-1 rounded text-[8px] font-bold border transition-all ${
                                paidForThisTimelineMonth 
                                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-700' 
                                  : isTargetMonth 
                                  ? 'bg-slate-100 border-slate-200 text-slate-400'
                                  : 'bg-rose-50/70 border-rose-200 text-rose-700 font-semibold'
                              }`}
                            >
                              <span className="truncate w-full text-center">{m.split(' ')[0]}</span>
                              <span className="text-[7px] mt-0.5">
                                {paidForThisTimelineMonth ? '✓' : '✖'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end pt-1">
                      {isPaidThisMonth ? (
                        <div className="flex items-center gap-1.5 w-full justify-between">
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md">
                            مبلغ الاشتراك: {currentMonthPayment.amount} ج.م
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setSelectedReceipt(currentMonthPayment)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#0D5C8C] border border-slate-150 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>إيصال #{currentMonthPayment.receipt_number.split('-').pop()}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setPaymentToDelete(currentMonthPayment)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg border border-slate-150 hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setQuickPayStudent(student);
                            setQuickPayAmount(activeGradeMonthlyFee);
                            setShowQuickPayModal(true);
                          }}
                          className="w-full py-2.5 bg-[#0D5C8C] hover:bg-[#1A7FAA] text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer text-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>سداد اشتراك {selectedMonth} 💸</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredClassStudents.length === 0 && (
                <div className="p-8 text-center text-slate-500 font-sans border border-dashed border-slate-200 rounded-xl bg-slate-50">
                  <span className="text-xs">لا يوجد طلاب يطابقون بحثك ضمن الشروط المحددة.</span>
                </div>
              )}
            </div>

            {/* General Instructions Card */}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-2 text-right">
              <span className="text-sm">💡</span>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-700">طريقة احتساب الاشتراكات الشهرية:</h4>
                <p className="text-[10px] text-slate-500 font-sans leading-relaxed">
                  يتم التحقق من جدول الاشتراكات استناداً للبند الرسومي (مصاريف دراسية) للشهر المحدّد. يمكنك تصفية الطلاب، السداد بنقرة واحدة، وطباعة إيصال معتمد وتسجيل الحركة المالية في الصندوق تلقائياً.
                </p>
              </div>
            </div>

          </div>

        </div>
      )}


      {/* TAB 2: GENERAL PAYMENTS & HISTORIC LOGS */}
      {activeTab === 'all_receipts' && (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-50 pb-2">
            <h3 className="font-bold text-slate-800 text-sm">دفتر المدفوعات التاريخي وسجل حركة المعاملات</h3>
            <span className="text-xxs font-bold text-slate-400">إجمالي السجلات المستردة: {payments.length} إيصالات</span>
          </div>

          <div className="hidden md:block overflow-x-auto border border-gray-50 rounded-xl">
            <table className="min-w-full text-right" dir="rtl">
              <thead className="bg-slate-50 text-slate-700 text-xs font-bold border-b border-gray-100">
                <tr>
                  <th className="p-3">رقم الإيصال</th>
                  <th className="p-3">اسم الطالب</th>
                  <th className="p-3">نوع البند الرسومي</th>
                  <th className="p-3 text-center">تفصيل الاشتراك</th>
                  <th className="p-3 text-center">تاريخ السداد</th>
                  <th className="p-3">المبلغ المحصل</th>
                  <th className="p-3">طريقة السداد</th>
                  <th className="p-3 text-left">التحكم والطباعة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-slate-700 font-sans">
                {payments.map(item => {
                  const s = students.find(studentItem => studentItem.id === item.student_id);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-all">
                      
                      <td className="p-3 font-mono font-bold text-indigo-800">{item.receipt_number}</td>
                      <td className="p-3 font-bold text-slate-800">{s ? s.name : 'ـ طالب مُستبعد ـ'}</td>
                      
                      {/* Category */}
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          item.category === 'tuition'
                            ? 'bg-[#0D5C8C]/5 text-[#0D5C8C]'
                            : item.category === 'bus'
                            ? 'bg-amber-50 text-amber-800'
                            : item.category === 'uniform'
                            ? 'bg-purple-50 text-purple-850'
                            : 'bg-emerald-50 text-emerald-800'
                        }`}>
                          {item.category === 'tuition'
                            ? 'مصاريف دراسية شهري'
                            : item.category === 'bus'
                            ? 'باص وحافلة السنتر'
                            : item.category === 'uniform'
                            ? 'زي وملازم'
                            : 'أنشطة وخدمات ترفيهية'}
                        </span>
                      </td>

                      {/* Detail */}
                      <td className="p-3 text-center text-slate-500 font-sans">
                        {item.category === 'tuition' ? item.month || 'اشتراك شهري' : 'ـ'}
                      </td>

                      {/* Date */}
                      <td className="p-3 text-center text-slate-400 font-sans">{item.payment_date}</td>
                      
                      {/* Amount */}
                      <td className="p-3 font-bold text-[#0D5C8C]">{item.amount.toLocaleString()} ج.م</td>
                      
                      {/* Method */}
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          item.payment_method === 'cash'
                            ? 'bg-emerald-50 text-emerald-800'
                            : item.payment_method === 'card'
                            ? 'bg-indigo-50 text-indigo-800'
                            : 'bg-amber-50 text-amber-800'
                        }`}>
                          {item.payment_method === 'cash' ? 'نقدي' : item.payment_method === 'card' ? 'فيزا POS' : 'حوالة ومسجل'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-left">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => setSelectedReceipt(item)}
                            className="text-xs text-[#0D5C8C] hover:bg-[#0D5C8C]/5 px-2 py-1 rounded-md flex items-center gap-1 cursor-pointer"
                            title="عرض الإيصال لطباعته"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>عرض الإيصال</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentToDelete(item)}
                            className="p-1 text-slate-300 hover:text-red-500 rounded cursor-pointer"
                            title="حذف السجل"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}

                {payments.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500 font-sans">
                      لا توجد أي معاملات سداد مسجلة حتى الآن.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile View Cards list (One-touch interaction) */}
          <div className="block md:hidden space-y-3">
            {payments.map(item => {
              const s = students.find(studentItem => studentItem.id === item.student_id);
              return (
                <div key={item.id} className="p-4 rounded-xl border border-slate-100 bg-white shadow-2xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-black text-indigo-800 bg-indigo-50 px-1.5 py-0.5 rounded">
                        {item.receipt_number}
                      </span>
                      <h4 className="font-bold text-slate-800 text-xs mt-1.5 leading-tight">{s ? s.name : 'ـ طالب مُستبعد ـ'}</h4>
                      <span className="text-[9px] text-slate-400 block mt-1">تاريخ المعاملة: {item.payment_date}</span>
                    </div>

                    <div className="text-left">
                      <span className="text-xs font-black text-[#0D5C8C] block">{item.amount.toLocaleString()} ج.م</span>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold mt-1 ${
                        item.payment_method === 'cash'
                          ? 'bg-emerald-50 text-emerald-800'
                          : item.payment_method === 'card'
                          ? 'bg-indigo-50 text-indigo-800'
                          : 'bg-amber-50 text-amber-800'
                      }`}>
                        {item.payment_method === 'cash' ? 'نقدي' : item.payment_method === 'card' ? 'فيزا' : 'حوالة'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100/70 text-[10px]">
                    <div>
                      <span className="text-slate-400 block text-[8px] font-bold">بند الرسوم</span>
                      <span className="font-bold text-slate-700">
                        {item.category === 'tuition'
                          ? 'مصاريف دراسية شهري'
                          : item.category === 'sessions'
                          ? `حصص حضر (${item.session_count} × ${item.session_price} ج.م)`
                          : item.category === 'bus'
                          ? 'باص وحافلة السنتر'
                          : item.category === 'uniform'
                          ? 'زي وملازم'
                          : 'أنشطة وخدمات ترفيهية'}
                      </span>
                    </div>

                    {item.category === 'tuition' && (
                      <div>
                        <span className="text-slate-400 block text-[8px] font-bold text-left">شهر الاشتراك</span>
                        <span className="font-bold text-slate-600 text-left block">{item.month || 'ـ'}</span>
                      </div>
                    )}
                    {item.category === 'sessions' && (
                      <div>
                        <span className="text-slate-400 block text-[8px] font-bold text-left">التفاصيل</span>
                        <span className="font-bold text-slate-600 text-left block">{item.session_count} حصص</span>
                      </div>
                    )}
                  </div>

                  {/* Mobile action buttons */}
                  <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-slate-100/50">
                    <button
                      onClick={() => setSelectedReceipt(item)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#0D5C8C] border border-slate-150 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
                      title="عرض الإيصال لطباعته"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>عرض الإيصال</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentToDelete(item)}
                      className="p-1.5 text-slate-400 hover:text-red-600 border border-slate-150 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      title="حذف السجل"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {payments.length === 0 && (
              <div className="p-8 text-center text-slate-500 font-sans border border-dashed border-slate-250 rounded-xl bg-slate-50">
                <span className="text-xs">لا توجد أي معاملات سداد مسجلة حتى الآن.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QUICK SUBSCRIPTION PAYMENT MODAL */}
      {showQuickPayModal && quickPayStudent && (() => {
        const studentClass = classes.find(c => c.id === quickPayStudent.class_id);
        const gradeMonthlyFee = studentClass ? (gradeFees[studentClass.grade_level] || 250) : 250;
        
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden animate-scale-up text-right">
              
              {/* Header */}
              <div className="bg-gradient-to-r from-[#0D5C8C] to-[#1A7FAA] p-4 text-white flex justify-between items-center">
                <h3 className="font-bold text-sm flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-300" />
                  <span>سداد فوري للطالب</span>
                </h3>
                <button 
                  type="button" 
                  onClick={() => setShowQuickPayModal(false)} 
                  className="text-white/80 hover:text-white font-bold text-sm bg-black/10 hover:bg-black/20 px-2.5 py-0.5 rounded"
                >
                  ×
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleQuickPaySubmit} className="p-5 space-y-4">
                
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-2">
                  <div className="text-slate-400 text-xxs font-bold uppercase">بيانات الطالب والمجموعة:</div>
                  <div className="text-xs font-black text-slate-800">{quickPayStudent.name}</div>
                  <div className="text-[10px] text-slate-500 font-sans">
                    مجموعة: {studentClass?.name || 'غير محددة'} • رقم القيد: #{quickPayStudent.registration_id}
                  </div>
                </div>

                {/* Sub-tabs to choose payment category */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">نوع التحصيل المالي:</label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setQuickPayCategory('tuition');
                        setQuickPayAmount(gradeMonthlyFee);
                      }}
                      className={`py-2 text-xs font-bold rounded-md text-center transition-all cursor-pointer ${
                        quickPayCategory === 'tuition'
                          ? 'bg-white text-[#0D5C8C] shadow-xs'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      فلوس الشهر بالكامل 🗓️
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickPayCategory('sessions');
                        const count = quickPaySessionCount === '' ? 0 : Number(quickPaySessionCount);
                        const price = quickPaySessionPrice === '' ? 0 : Number(quickPaySessionPrice);
                        setQuickPayAmount(count * price);
                      }}
                      className={`py-2 text-xs font-bold rounded-md text-center transition-all cursor-pointer ${
                        quickPayCategory === 'sessions'
                          ? 'bg-white text-[#0D5C8C] shadow-xs'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      بعدد الحصص فقط 🎯
                    </button>
                  </div>
                </div>

                {quickPayCategory === 'tuition' ? (
                  <>
                    <div className="text-xs font-bold text-[#0D5C8C] bg-blue-50/50 p-2.5 rounded-lg border border-blue-100 flex justify-between">
                      <span>سداد اشتراك شهر: <span className="underline">{selectedMonth}</span></span>
                      <span>القيمة التلقائية: {gradeMonthlyFee} ج.م</span>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">قيمة الاشتراك المطلوب تحصيلها (ج.م) *</label>
                      <input
                        type="number"
                        min={0}
                        max={5000}
                        value={quickPayAmount === '' ? '' : quickPayAmount}
                        onChange={(e) => setQuickPayAmount(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full text-xs font-sans font-extrabold border border-slate-300 px-3 py-2.5 rounded-lg text-[#0D5C8C] text-right focus:border-[#0D5C8C] focus:outline-hidden"
                        required
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">عدد حصص الحضور *</label>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={quickPaySessionCount === '' ? '' : quickPaySessionCount}
                          onChange={(e) => setQuickPaySessionCount(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full text-xs font-sans border border-slate-300 px-3 py-2 rounded-lg text-slate-800 text-right focus:border-[#0D5C8C] focus:outline-hidden"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">سعر الحصة الواحدة *</label>
                        <input
                          type="number"
                          min={0}
                          max={1000}
                          value={quickPaySessionPrice === '' ? '' : quickPaySessionPrice}
                          onChange={(e) => setQuickPaySessionPrice(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full text-xs font-sans border border-slate-300 px-3 py-2 rounded-lg text-slate-800 text-right focus:border-[#0D5C8C] focus:outline-hidden"
                          required
                        />
                      </div>
                    </div>

                    <div className="bg-indigo-50 border border-indigo-150 p-2.5 rounded-xl flex justify-between items-center text-xs text-indigo-900">
                      <span className="font-bold">إجمالي المبلغ المحسوب:</span>
                      <span className="font-black font-sans text-sm">{((quickPaySessionCount === '' ? 0 : Number(quickPaySessionCount)) * (quickPaySessionPrice === '' ? 0 : Number(quickPaySessionPrice))).toLocaleString()} ج.م</span>
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">طريقة التحصيل واستلام المال:</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setQuickPayMethod('cash')}
                      className={`p-2.5 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
                        quickPayMethod === 'cash'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      نقدي 💵
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickPayMethod('card')}
                      className={`p-2.5 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
                        quickPayMethod === 'card'
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-800'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      فيزا POS 💳
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickPayMethod('transfer')}
                      className={`p-2.5 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
                        quickPayMethod === 'transfer'
                          ? 'bg-amber-50 border-amber-500 text-amber-800'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Vodafone 📲
                    </button>
                  </div>
                </div>

                {/* SMS Notification simulation option */}
                <div className="flex items-start gap-2 pt-1">
                  <input
                    id="sms_notify_parent"
                    type="checkbox"
                    checked={quickPayNotify}
                    onChange={(e) => setQuickPayNotify(e.target.checked)}
                    className="w-4 h-4 text-[#0D5C8C] border-slate-300 rounded focus:ring-[#0D5C8C] cursor-pointer mt-0.5"
                  />
                  <label htmlFor="sms_notify_parent" className="text-[10px] font-semibold text-slate-600 cursor-pointer select-none leading-normal">
                    إرسال رسالة تأكيد الدفع لولي الأمر تلقائياً (صامتاً عبر بوابة الإشعارات) ✉️
                  </label>
                </div>

                <div className="flex gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowQuickPayModal(false)}
                    className="flex-1 py-2 text-xs border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 font-bold cursor-pointer"
                  >
                    إلغاء المعاملة
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-[#0D5C8C] hover:bg-[#1A7FAA] text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer"
                  >
                    تأكيد التحصيل واستلام الإيصال ✓
                  </button>
                </div>

              </form>

            </div>
          </div>
        );
      })()}


      {/* DIGITAL RECEIPT PRINT MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full p-6 text-right space-y-4 relative animate-scale-up" dir="rtl">
            
            <div className="border-b-2 border-dashed border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">إيصال سداد مالي معتمد</h4>
                <p className="text-[9px] text-slate-400 font-sans font-medium">الأكاديمية التعليمية لإدارة المراكز</p>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 font-bold rounded-full">
                مدفوع كلياً بنجاح ✓
              </span>
            </div>

            {/* Printable Frame */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2.5 text-xs font-sans" id="sams-printable-invoice-element">
              
              <div className="flex justify-between p-1.5 border-b border-slate-200/60">
                <span className="text-slate-400">رقم الإيصال</span>
                <span className="font-mono font-bold text-slate-800">{selectedReceipt.receipt_number}</span>
              </div>

              <div className="flex justify-between p-1.5 border-b border-slate-200/60">
                <span className="text-slate-400 font-bold">اسم الطالب</span>
                <span className="font-bold text-slate-900">
                  {students.find(st => st.id === selectedReceipt.student_id)?.name || 'ـ طالب كود مالي ـ'}
                </span>
              </div>

              {selectedReceipt.category === 'tuition' && (
                <div className="flex justify-between p-1.5 border-b border-slate-200/60">
                  <span className="text-slate-400">سداد اشتراك شهر</span>
                  <span className="font-bold text-indigo-700 underline">{selectedReceipt.month || 'ـ'}</span>
                </div>
              )}

              <div className="flex justify-between p-1.5 border-b border-slate-200/60">
                <span className="text-slate-400">بند الدفع الرسومي</span>
                <span className="font-semibold text-slate-700">
                  {selectedReceipt.category === 'tuition'
                    ? 'اشتراك الحضور والخدمة التعليمية'
                    : selectedReceipt.category === 'bus'
                    ? 'باص وحافلة السنتر'
                    : selectedReceipt.category === 'uniform'
                    ? 'زي وملازم'
                    : 'أنشطة وخدمات ترفيهية'}
                </span>
              </div>

              <div className="flex justify-between p-1.5 border-b border-slate-200/60">
                <span className="text-slate-400">قيمة المعاملة الكلية</span>
                <span className="font-black text-[#0D5C8C] text-sm">{selectedReceipt.amount.toLocaleString()} ج.م</span>
              </div>

              <div className="flex justify-between p-1.5 border-b border-slate-200/60">
                <span className="text-slate-400">تاريخ وتوقيت السداد</span>
                <span className="text-slate-700">{selectedReceipt.payment_date}</span>
              </div>

              <div className="flex justify-between p-1.5">
                <span className="text-slate-400">وسيلة المعاملة</span>
                <span className="font-semibold text-slate-700">
                  {selectedReceipt.payment_method === 'cash' ? 'نقدي (Cash)' : selectedReceipt.payment_method === 'card' ? 'بطاقة POS' : 'Vodafone cash'}
                </span>
              </div>

            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg text-[9px] text-slate-400 leading-relaxed text-center">
              تم توثيق هذا الإيصال الإلكتروني رسمياً. شكراً لثقتكم بالأكاديمية التعليمية.
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => {
                  const printContents = document.getElementById('sams-printable-invoice-element')?.outerHTML;
                  if (!printContents) return;
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    const style = `<style>
                      body { direction: rtl; font-family: system-ui, -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: white; }
                      #invoice { border: 2px solid black; width: 320px; padding: 20px; border-radius: 12px; }
                      .flex { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #ddd; }
                      .font-bold { font-weight: bold; }
                      .font-mono { font-family: monospace; }
                      .text-center { text-align: center; margin-top: 15px; font-size: 11px; color: #666; }
                    </style>`;
                    printWindow.document.write('<html><head><title>Print Receipt</title>' + style + '</head><body>');
                    printWindow.document.write('<div id="invoice">' + printContents + '<div class="text-center">تم طباعة هذا الإيصال بواسطة الأكاديمية التعليمية</div></div>');
                    printWindow.document.write('</body></html>');
                    printWindow.document.close();
                    printWindow.focus();
                    setTimeout(() => {
                      printWindow.print();
                      printWindow.close();
                    }, 250);
                  }
                }}
                className="px-4 py-2 bg-[#0D5C8C] hover:bg-[#1A7FAA] text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>أمر طباعة الإيصال الفوري</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                إغلاق المعاينة
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Custom Payment Deletion Modal */}
      <AnimatePresence>
        {paymentToDelete && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" dir="rtl">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-md w-full p-6 text-right space-y-4"
            >
              <div className="flex items-center gap-3 text-red-600">
                <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-950 text-sm">إلغاء وحذف إيصال السداد</h3>
                  <p className="text-[11px] text-slate-500 font-sans font-medium">سيتم حذف المعاملة من السجلات المالية وسجل الطالب</p>
                </div>
              </div>

              <div className="text-xs text-slate-700 leading-relaxed font-sans space-y-1.5 py-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <p>هل أنت متأكد من رغبتك في إلغاء الإيصال رقم: <strong className="text-red-700">"{paymentToDelete.receipt_number}"</strong> بقيمة <strong className="text-red-700">{paymentToDelete.amount} ج.م</strong>؟</p>
                <p className="text-[10px] text-slate-400">تحذير: سيتم حذف هذا الإيصال نهائياً من السجلات المالية وحسابات السنتر ولن يمكن التراجع عن هذا الإجراء.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setPaymentToDelete(null)}
                  className="px-4 py-2 border border-gray-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={confirmDeletePayment}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  تأكيد الحذف والإلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
