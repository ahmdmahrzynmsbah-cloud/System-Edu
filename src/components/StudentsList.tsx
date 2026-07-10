import React, { useState, useEffect } from 'react';
import { samsDb, getTenantSetting } from '../utils/db';
import { Student, ClassRoom } from '../types';
import { Search, Plus, Filter, Edit, Trash2, ShieldAlert, CheckCircle, Eye, X, BookOpen, CreditCard, Calendar, Phone, User, Users, ArrowUpDown, Bell, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import StudentFullReport from './StudentFullReport';

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

interface StudentsListProps {
  userRole?: 'teacher' | 'secretary' | 'super_admin' | null;
}

export default function StudentsList({ userRole }: StudentsListProps = {}) {
  const isFeeReminderEnabled = getTenantSetting('sams_enable_fee_reminder', 'true') !== 'false';
  const allowTeacherFeeReminder = getTenantSetting('sams_allow_teacher_fee_reminder', 'true') !== 'false';
  const canShowReminderButton = isFeeReminderEnabled && (userRole !== 'teacher' || allowTeacherFeeReminder);

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  
  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [feeStatusFilter, setFeeStatusFilter] = useState<'all' | 'late' | 'paid'>('all');
  const [feeCheckMonth, setFeeCheckMonth] = useState<string>('يوليو 2026');
  const [sortBy, setSortBy] = useState<'default' | 'name-asc' | 'name-desc' | 'date-desc' | 'date-asc'>('default');

  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const hasActiveFilters = searchTerm !== '' || classFilter.length > 0 || statusFilter !== 'all' || gradeFilter !== 'all' || sortBy !== 'default' || feeStatusFilter !== 'all' || feeCheckMonth !== 'يوليو 2026';

  const resetFilters = () => {
    setSearchTerm('');
    setClassFilter([]);
    setStatusFilter('all');
    setGradeFilter('all');
    setSortBy('default');
    setFeeStatusFilter('all');
    setFeeCheckMonth('يوليو 2026');
  };

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [showFilterClassDropdown, setShowFilterClassDropdown] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Full Report state
  const [showFullReport, setShowFullReport] = useState(false);
  const [showBriefProfile, setShowBriefProfile] = useState(false);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);
  
  // Selected Profile for detail card
  const [selectedProfile, setSelectedProfile] = useState<Student | null>(null);

  // Calculate attendance statistics for the selected student
  const getStudentAttendanceStats = (studentId: string) => {
    const records = samsDb.getAttendance().filter(a => a.student_id === studentId);
    if (records.length === 0) {
      return {
        percentage: 100,
        total: 0,
        present: 0,
        absent: 0,
        statusLabel: 'لا توجد سجلات 📂',
        statusColor: 'text-slate-500',
        bgClass: 'bg-slate-50 border-slate-200 text-slate-600',
        description: 'لم يتم تسجيل أي حضور أو غياب لهذا الطالب بعد في النظام.'
      };
    }

    const total = records.length;
    const present = records.filter(a => a.status === 'present').length;
    const excused = records.filter(a => a.status === 'excused').length;
    const absent = records.filter(a => a.status === 'absent').length;
    
    const percentage = Math.round((present / total) * 100);

    let statusLabel = 'مستقر';
    let statusColor = 'text-emerald-600';
    let bgClass = 'bg-emerald-50 border-emerald-100 text-emerald-800';
    let description = `نسبة حضور الطالب للشهر الحالي سجلت ${percentage}% مع عدم رصد أي إنذار غياب مسبق.`;

    if (percentage >= 90) {
      statusLabel = 'ممتاز ✨';
      statusColor = 'text-emerald-700';
      bgClass = 'bg-emerald-50 border-emerald-100 text-emerald-800';
      description = `نسبة حضور الطالب ممتازة حيث بلغت ${percentage}% (حضر ${present} من أصل ${total} حصص).`;
    } else if (percentage >= 75) {
      statusLabel = 'مستقر 👍';
      statusColor = 'text-[#0D5C8C]';
      bgClass = 'bg-sky-50 border-sky-100 text-[#0D5C8C]';
      description = `نسبة حضور الطالب مستقرة عند ${percentage}% (حضر ${present} من أصل ${total} حصص).`;
    } else if (percentage >= 50) {
      statusLabel = 'إنذار غياب ⚠️';
      statusColor = 'text-amber-700';
      bgClass = 'bg-amber-50 border-amber-100 text-amber-800';
      description = `انتباه: تراجعت نسبة حضور الطالب إلى ${percentage}% بسبب غيابه المتكرر (${absent} حصص غياب).`;
    } else {
      statusLabel = 'حرج خطير 🚨';
      statusColor = 'text-rose-700';
      bgClass = 'bg-rose-50 border-rose-100 text-rose-800';
      description = `خطر: نسبة الحضور حرجة جداً وتساوي ${percentage}% (تغيب الطالب في ${absent} حصص من أصل ${total}).`;
    }

    return { percentage, total, present, absent, excused, statusLabel, statusColor, bgClass, description };
  };

  // Custom Delete Confirm state
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  
  // Creating/Editing student states
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    class_id: '',
    class_id_2: '',
    class_ids: [] as string[],
    grade_level: 'الأول الإعدادي',
    birth_date: '2015-05-12',
    phone: '',
    parent_name: '',
    parent_phone: '',
    barcode: '',
    notes: '',
    status: 'active' as Student['status']
  });

  // Immediate Payment states
  const [payImmediately, setPayImmediately] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(150);
  const [paymentCategory, setPaymentCategory] = useState<'tuition' | 'sessions'>('tuition');
  const [sessionCount, setSessionCount] = useState<number | ''>(4);
  const [sessionPrice, setSessionPrice] = useState<number | ''>(40);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [paymentMonth, setPaymentMonth] = useState<string>('يوليو 2026');
  const [sendPaymentSms, setSendPaymentSms] = useState(true);

  useEffect(() => {
    if (paymentCategory === 'tuition') {
      // Look up grade fees rate from localStorage or fallback
      const savedFees = localStorage.getItem('sams_grade_monthly_fees');
      let gradeFees: Record<string, number> = {
        'الأول الإعدادي': 150,
        'الثاني الإعدادي': 150,
        'الثالث الإعدادي': 150,
        'الأول الثانوي': 200,
        'الثاني الثانوي': 250,
        'الثالث الثانوي': 300
      };
      if (savedFees) {
        try {
          const parsed = JSON.parse(savedFees);
          const mappedFees: Record<string, number> = {};
          Object.keys(parsed).forEach(k => {
            const cleanKey = k.replace('الصف ', '');
            mappedFees[cleanKey] = parsed[k];
            mappedFees[k] = parsed[k];
          });
          Object.assign(gradeFees, mappedFees);
        } catch (e) {}
      }
      const rate = gradeFees[formData.grade_level] || 250;
      setPaymentAmount(rate);
    } else {
      const count = sessionCount === '' ? 0 : Number(sessionCount);
      const price = sessionPrice === '' ? 0 : Number(sessionPrice);
      setPaymentAmount(count * price);
    }
  }, [formData.grade_level, paymentCategory, sessionCount, sessionPrice]);

  useEffect(() => {
    loadData();
    window.addEventListener('sams_data_changed', loadData);
    const pendingSearch = localStorage.getItem('sams_global_search');
    if (pendingSearch) {
      setSearchTerm(pendingSearch);
      localStorage.removeItem('sams_global_search');
    }
    return () => window.removeEventListener('sams_data_changed', loadData);
  }, []);

  const loadData = () => {
    setStudents(samsDb.getStudents());
    const cl = samsDb.getClasses();
    setClasses(cl);
    setPayments(samsDb.getFees());
    if (!formData.class_id && cl.length > 0) {
      setFormData(prev => ({ ...prev, class_id: cl[0].id }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.target.name === 'grade_level') {
      setFormData(prev => ({
        ...prev,
        grade_level: e.target.value,
        class_ids: [],
        class_id: '',
        class_id_2: ''
      }));
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    }
  };

  const executeAddOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const finalClassIds = formData.class_ids && formData.class_ids.length > 0 
      ? formData.class_ids 
      : [formData.class_id, formData.class_id_2].filter(Boolean);
    const finalClassId = finalClassIds[0] || '';
    const finalClassId2 = finalClassIds[1] || '';

    if (!formData.name || !formData.phone || !finalClassId) {
      setErrorMessage('يرجى ملء جميع الحقول الإلزامية التي تحمل النجمة (*).');
      return;
    }
    
    const studentPayload = {
      ...formData,
      class_id: finalClassId,
      class_id_2: finalClassId2,
      class_ids: finalClassIds
    };

    if (!isEditing) {
      const res = samsDb.addStudent(studentPayload);
      if (res.success && res.student) {
        let msg = `تم تسجيل الطالب بنجاح برقم القيد: ${res.student.registration_id}`;
        
        if (payImmediately) {
          try {
            const newPayment = samsDb.addPayment({
              student_id: res.student.id,
              amount: Number(paymentAmount),
              payment_date: new Date().toISOString().split('T')[0],
              payment_method: paymentMethod,
              term: 'first_term',
              category: paymentCategory,
              month: paymentCategory === 'tuition' ? paymentMonth : undefined,
              session_count: paymentCategory === 'sessions' ? (sessionCount === '' ? undefined : Number(sessionCount)) : undefined,
              session_price: paymentCategory === 'sessions' ? (sessionPrice === '' ? undefined : Number(sessionPrice)) : undefined
            });

            if (sendPaymentSms) {
              const categoryAr = {
                tuition: 'مصروفات دراسية',
                sessions: 'فلوس حصص حضر'
              }[paymentCategory] || 'رسوم أخرى';

              const msgDetails = paymentCategory === 'tuition' 
                ? `اشتراك شهر (${paymentMonth})` 
                : `فلوس عدد (${sessionCount}) حصة حضر بسعر (${sessionPrice} ج.م للحصة)`;

              samsDb.addNotification({
                title: `تأكيد استلام دفعة: ${res.student.name}`,
                message: `تم بحمد الله استلام قيمة ${msgDetails} والمقدرة بـ ${paymentAmount} ج.م للطالب ${res.student.name}. إيصال سداد رقم: ${newPayment.receipt_number}. شكراً لكم.`,
                category: 'sms',
                recipient_type: 'specific',
                recipient_id: res.student.id
              });
            }

            msg += ` تم أيضاً سداد مبلغ ${paymentAmount} ج.م بنجاح! إيصال رقم ${newPayment.receipt_number}`;

            // Play successful register cash register sound
            try {
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc1 = ctx.createOscillator();
              const gain1 = ctx.createGain();
              osc1.type = 'sine';
              osc1.frequency.setValueAtTime(1200, ctx.currentTime);
              gain1.gain.setValueAtTime(0.05, ctx.currentTime);
              osc1.connect(gain1);
              gain1.connect(ctx.destination);
              osc1.start();
              osc1.stop(ctx.currentTime + 0.08);
            } catch (e) {}

          } catch (paymentErr) {
            console.error('Error adding payment during registration:', paymentErr);
            msg += ' (حدث خطأ أثناء معالجة الدفعة المالية)';
          }
        }

        setSuccessMessage(msg);
        
        // Reset state
        setPayImmediately(false);
        setFormData({
          name: '',
          class_id: classes[0]?.id || '',
          class_id_2: '',
          class_ids: [],
          grade_level: 'الأول الإعدادي',
          birth_date: '2016-01-01',
          phone: '',
          parent_name: '',
          parent_phone: '',
          barcode: '',
          notes: '',
          status: 'active'
        });
        setShowAddForm(false);
        loadData();
      } else {
        setErrorMessage(res.error || 'حدث خطأ غير متوقع أثناء تسجيل الطالب.');
      }
    } else {
      const updatedStudent: Student = {
        ...studentPayload,
        id: editId,
        registration_id: students.find(s => s.id === editId)?.registration_id || '20230000',
        created_at: students.find(s => s.id === editId)?.created_at || '2023-09-01'
      };
      
      const res = samsDb.updateStudent(updatedStudent);
      if (res.success) {
        setSuccessMessage('تم تعديل وحفظ بيانات الطالب بنجاح.');
        setIsEditing(false);
        setEditId('');
        setShowAddForm(false);
        loadData();
        if (selectedProfile && selectedProfile.id === editId) {
          setSelectedProfile(updatedStudent);
        }
      } else {
        setErrorMessage(res.error || 'فشل التعديل.');
      }
    }
  };

  const handleEditClick = (student: Student) => {
    setIsEditing(true);
    setEditId(student.id);
    setFormData({
      name: student.name,
      class_id: student.class_id,
      class_id_2: student.class_id_2 || '',
      class_ids: student.class_ids || [student.class_id, student.class_id_2].filter(Boolean),
      grade_level: student.grade_level,
      birth_date: student.birth_date,
      phone: student.phone,
      parent_name: student.parent_name,
      parent_phone: student.parent_phone,
      barcode: student.barcode || '',
      notes: student.notes || '',
      status: student.status
    });
    setShowAddForm(true);
    setErrorMessage('');
    
    // Smoothly scroll back to top of window and module container
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      document.getElementById('sams_students_module')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleDeleteClick = (student: Student) => {
    setStudentToDelete(student);
  };

  const confirmDelete = () => {
    if (studentToDelete) {
      samsDb.softDeleteStudent(studentToDelete.id);
      setSuccessMessage('تمت أرشفة ونقل قيد الطالب بنجاح.');
      setStudentToDelete(null);
      loadData();
      if (selectedProfile?.id === studentToDelete.id) {
        setSelectedProfile(null);
      }
    }
  };

  const cancelDelete = () => {
    setStudentToDelete(null);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedStudents(sortedStudents.map(s => s.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleBulkStatusUpdate = (newStatus: 'active' | 'inactive') => {
    if (selectedStudents.length === 0) return;
    
    selectedStudents.forEach(id => {
      const student = students.find(s => s.id === id);
      if (student) {
        samsDb.updateStudent({ ...student, status: newStatus });
      }
    });
    
    setSuccessMessage(`تم تحديث حالة ${selectedStudents.length} طلاب بنجاح.`);
    setSelectedStudents([]);
    loadData();
  };

  const isStudentPaid = (studentId: string, month: string) => {
    return payments.some(p => p.student_id === studentId && p.category === 'tuition' && p.month === month);
  };

  const handleSendReminder = (student: Student) => {
    setSendingReminderId(student.id);
    
    // Look up grade fees rate from localStorage or fallback
    const savedFees = localStorage.getItem('sams_grade_monthly_fees');
    let gradeFees: Record<string, number> = {
      'الصف الأول الإعدادي': 150,
      'الصف الثاني الإعدادي': 150,
      'الصف الثالث الإعدادي': 150,
      'الصف الأول الثانوي': 200,
      'الصف الثاني الثانوي': 250,
      'الصف الثالث الثانوي': 300
    };
    if (savedFees) {
      try {
        gradeFees = JSON.parse(savedFees);
      } catch (e) {}
    }

    const classFee = gradeFees[student.grade_level] || 250;

    // Simulate sending time (600ms for premium UX)
    setTimeout(() => {
      samsDb.addNotification({
        title: `⚠️ تذكير سداد اشتراك: ${student.name}`,
        message: `عزيزي ولي الأمر (${student.parent_name || 'المحترم'})، نرجو التكرم بسداد قيمة الاشتراك الشهري لـ (${feeCheckMonth}) وقدرها (${classFee} ج.م) المقررة للطالب/ة (${student.name}). شكراً لتعاونكم مع السنتر.`,
        category: 'sms',
        recipient_type: 'specific',
        recipient_id: student.id
      });

      // Play sound
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } catch (e) {}

      setSuccessMessage(`🔔 تم إرسال تذكير سداد لولي أمر الطالب (${student.name}) بنجاح عبر SMS!`);
      setSendingReminderId(null);
    }, 600);
  };

  const filteredStudents = students.filter(s => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (s.name && s.name.toLowerCase().includes(searchLower)) || 
      (s.registration_id && s.registration_id.toLowerCase().includes(searchLower)) ||
      (s.barcode && s.barcode.toLowerCase().includes(searchLower));
    const matchesClass = classFilter.length === 0 || classFilter.includes(s.class_id) || (s.class_id_2 ? classFilter.includes(s.class_id_2) : false);
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchesGrade = gradeFilter === 'all' || s.grade_level === gradeFilter;
    
    const paid = isStudentPaid(s.id, feeCheckMonth);
    const matchesFeeStatus = 
      feeStatusFilter === 'all' ||
      (feeStatusFilter === 'paid' && paid) ||
      (feeStatusFilter === 'late' && !paid);

    return matchesSearch && matchesClass && matchesStatus && matchesGrade && matchesFeeStatus;
  });

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (sortBy === 'name-asc') {
      return a.name.localeCompare(b.name, 'ar');
    }
    if (sortBy === 'name-desc') {
      return b.name.localeCompare(a.name, 'ar');
    }
    if (sortBy === 'date-desc') {
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    }
    if (sortBy === 'date-asc') {
      return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    }
    return 0;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6" 
      id="sams_students_module"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            إدارة سجلات الطلاب والقبول والتسجيل
          </h2>
          <p className="text-xs text-slate-500 mt-1">تسجيل، تعديل، أرشفة الطلاب الجدد وإدارة الملفات السنتر</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setIsEditing(false);
              setFormData({
                name: '', class_id: classes[0]?.id || '', class_id_2: '', grade_level: 'الأول الإعدادي', 
                birth_date: '2016-01-01', phone: '', parent_name: '', parent_phone: '', barcode: '', notes: '', status: 'active'
              });
              setShowAddForm(!showAddForm);
              setErrorMessage('');
            }}
            className="px-4 py-2 bg-[#1A7FAA] text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-md hover:bg-[#0D5C8C] transition-all"
          >
            {showAddForm && !isEditing ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddForm && !isEditing ? 'إغلاق النموذج' : 'إضافة طالب جديد'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {errorMessage && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl flex items-center gap-3 text-sm font-bold">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <p>{errorMessage}</p>
          </motion.div>
        )}
        {successMessage && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl flex items-center gap-3 text-sm font-bold">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <p>{successMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <form onSubmit={executeAddOrUpdate} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6 space-y-5">
              <h3 className="font-bold text-slate-800 border-b border-gray-100 pb-3">{isEditing ? 'تعديل بيانات الطالب المحددة' : 'تسجيل قيد طالب جديد'}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 block">اسم الطالب الرباعي <span className="text-rose-500">*</span></label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#1A7FAA]/30 focus:border-[#1A7FAA] outline-none transition-all" placeholder="الاسم كامل..." />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 block">هاتف الطالب <span className="text-rose-500">*</span></label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#1A7FAA]/30 outline-none" placeholder="01X XXXX XXXX" dir="ltr" />
                </div>

                {classes.filter(c => c.grade_level === formData.grade_level).length > 0 && (
                  <div className="space-y-1.5 lg:col-span-2 relative">
                    <label className="text-xs font-semibold text-slate-600 block flex items-center justify-between">
                      <span>تحديد المجموعات الدراسية <span className="text-rose-500">*</span></span>
                      <span className="text-[10px] text-slate-400 font-bold">يمكنك تحديد أي عدد من المجموعات</span>
                    </label>
                    
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowClassDropdown(!showClassDropdown)}
                        className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-right flex items-center justify-between outline-none transition-all cursor-pointer shadow-xs min-h-[44px]"
                      >
                        <div className="flex flex-wrap gap-1.5 max-w-[85%]">
                          {(() => {
                            const currentClassIds = formData.class_ids && formData.class_ids.length > 0
                              ? formData.class_ids
                              : [formData.class_id, formData.class_id_2].filter(Boolean);
                            const selectedClasses = currentClassIds.map(id => classes.find(c => c.id === id)).filter(Boolean);
                            
                            if (selectedClasses.length === 0) {
                              return <span className="text-slate-400 font-medium">اضغط لتحديد المجموعات...</span>;
                            }
                            
                            return selectedClasses.map((c: any) => (
                              <span 
                                key={c.id} 
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-sky-50 text-[#0D5C8C] rounded-lg text-xs font-black border border-sky-100"
                              >
                                <span>{c.name}</span>
                                <span className="text-[9px] text-slate-400 font-normal">({c.grade_level})</span>
                              </span>
                            ));
                          })()}
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-slate-500 font-bold bg-slate-200/50 px-2 py-0.5 rounded-md font-sans">
                            {(formData.class_ids && formData.class_ids.length > 0 ? formData.class_ids : [formData.class_id, formData.class_id_2].filter(Boolean)).length} مجموعات
                          </span>
                          <Filter className="w-4 h-4 text-slate-400" />
                        </div>
                      </button>

                      {showClassDropdown && (() => {
                        const filteredFormClasses = classes.filter(c => c.grade_level === formData.grade_level);
                        return (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setShowClassDropdown(false)} />
                            <div className="absolute right-0 left-0 mt-1.5 bg-white border border-slate-150 rounded-2xl shadow-xl z-40 max-h-64 overflow-y-auto p-2 space-y-1 text-right animate-fade-in">
                              <div className="p-2 border-b border-slate-100 text-[10px] font-bold text-slate-400 flex justify-between items-center bg-slate-50/50 rounded-t-xl">
                                <span>قائمة المجموعات المتاحة لـ ({formData.grade_level})</span>
                                <span>تحديد متعدد</span>
                              </div>
                              <div className="p-1 space-y-1">
                                {filteredFormClasses.map(c => {
                                  const currentClassIds = formData.class_ids && formData.class_ids.length > 0
                                    ? formData.class_ids
                                    : [formData.class_id, formData.class_id_2].filter(Boolean);
                                  const isSelected = currentClassIds.includes(c.id);
                                  return (
                                    <button
                                      key={c.id}
                                      type="button"
                                      onClick={() => {
                                        let nextClassIds = [];
                                        if (isSelected) {
                                          nextClassIds = currentClassIds.filter(id => id !== c.id);
                                        } else {
                                          nextClassIds = [...currentClassIds, c.id];
                                        }
                                        
                                        setFormData(prev => ({
                                          ...prev,
                                          class_ids: nextClassIds,
                                          class_id: nextClassIds[0] || '',
                                          class_id_2: nextClassIds[1] || ''
                                        }));
                                      }}
                                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-right text-xs font-semibold transition-all cursor-pointer ${
                                        isSelected 
                                          ? 'bg-blue-50/70 text-[#0D5C8C] border border-blue-100/50' 
                                          : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5">
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                          isSelected 
                                            ? 'border-[#0D5C8C] bg-[#0D5C8C] text-white' 
                                            : 'border-slate-300 bg-white'
                                        }`}>
                                          {isSelected && <span className="text-[9px] font-black">✓</span>}
                                        </div>
                                        <span className="font-bold">{c.name}</span>
                                      </div>
                                      <span className="text-[10px] text-slate-400 font-sans">{c.grade_level}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 block">الصف الدراسي</label>
                  <select name="grade_level" value={formData.grade_level} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none">
                    <option value="الأول الإعدادي">الأول الإعدادي</option>
                    <option value="الثاني الإعدادي">الثاني الإعدادي</option>
                    <option value="الثالث الإعدادي">الثالث الإعدادي</option>
                    <option value="الأول الثانوي">الأول الثانوي</option>
                    <option value="الثاني الثانوي">الثاني الثانوي</option>
                    <option value="الثالث الثانوي">الثالث الثانوي</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 block">تاريخ الميلاد</label>
                  <input type="date" name="birth_date" value={formData.birth_date} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 block">حالة القيد</label>
                  <select name="status" value={formData.status} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none">
                    <option value="active">مفعل ومنتظم</option>
                    <option value="inactive">مجمد مؤقتاً</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 block">اسم ولي الأمر</label>
                  <input type="text" name="parent_name" value={formData.parent_name} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none" placeholder="الاسم..." />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 block">رقم هاتف ولي الأمر (للطوارئ)</label>
                  <input type="tel" name="parent_phone" value={formData.parent_phone} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none" placeholder="01X XXXX XXXX" dir="ltr" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 block">باركود الطالب <span className="text-slate-400 font-normal">- اختياري</span></label>
                  <input type="text" name="barcode" value={formData.barcode} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none" placeholder="أدخل كود الباركود هنا أو قم بمسحه..." dir="ltr" />
                </div>
                <div className="space-y-1.5 lg:col-span-3">
                  <label className="text-xs font-semibold text-slate-600 block">المذكرات (الكتب والملازم التي استلمها الطالب) <span className="text-slate-400 font-normal">- اختياري</span></label>
                  <textarea name="notes" value={formData.notes || ''} onChange={(e) => handleInputChange(e as any)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none min-h-[80px]" placeholder="مثال: استلم مذكرة الباب الأول وتم الدفع، كتاب المراجعة النهائية (باقي 50 جنيه)..." />
                </div>

                {!isEditing && (
                  <div className="lg:col-span-3 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-[#1A7FAA] text-sm select-none">
                      <input 
                        type="checkbox" 
                        checked={payImmediately} 
                        onChange={(e) => setPayImmediately(e.target.checked)}
                        className="w-4 h-4 text-[#1A7FAA] focus:ring-[#1A7FAA] border-slate-300 rounded"
                      />
                      <span>💵 تسجيل دفعة مالية فورية (سداد اشتراك شهري أو رسوم أخرى) عند الحفظ</span>
                    </label>

                    {payImmediately && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 pt-4 border-t border-slate-200/60">
                        <div className="space-y-1.5 lg:col-span-4">
                          <label className="text-xs font-semibold text-slate-600 block">بند الدفع (نوع الرسوم)</label>
                          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
                            <button
                              type="button"
                              onClick={() => {
                                setPaymentCategory('tuition');
                              }}
                              className={`py-2 text-xs font-bold rounded-lg text-center transition-all cursor-pointer ${
                                paymentCategory === 'tuition'
                                  ? 'bg-white text-[#0D5C8C] shadow-xs'
                                  : 'text-slate-500 hover:text-slate-700'
                              }`}
                            >
                              الشهر بالكامل 🗓️
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setPaymentCategory('sessions');
                              }}
                              className={`py-2 text-xs font-bold rounded-lg text-center transition-all cursor-pointer ${
                                paymentCategory === 'sessions'
                                  ? 'bg-white text-[#0D5C8C] shadow-xs'
                                  : 'text-slate-500 hover:text-slate-700'
                              }`}
                            >
                              بعدد الحصص 🎯
                            </button>
                          </div>
                        </div>

                        {paymentCategory === 'tuition' && (
                          <div className="space-y-1.5 lg:col-span-4">
                            <label className="text-xs font-semibold text-slate-600 block">الشهر المستهدف</label>
                            <select 
                              value={paymentMonth} 
                              onChange={(e) => setPaymentMonth(e.target.value)} 
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                            >
                              {MONTHS_LIST.map(m => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {paymentCategory === 'sessions' && (
                          <>
                            <div className="space-y-1.5 lg:col-span-2">
                              <label className="text-xs font-semibold text-slate-600 block">عدد الحصص</label>
                              <input 
                                type="number" 
                                min={1}
                                value={sessionCount === '' ? '' : sessionCount} 
                                onChange={(e) => setSessionCount(e.target.value === '' ? '' : Number(e.target.value))} 
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none" 
                              />
                            </div>
                            <div className="space-y-1.5 lg:col-span-2">
                              <label className="text-xs font-semibold text-slate-600 block">سعر الحصة (ج.م)</label>
                              <input 
                                type="number" 
                                min={1}
                                value={sessionPrice === '' ? '' : sessionPrice} 
                                onChange={(e) => setSessionPrice(e.target.value === '' ? '' : Number(e.target.value))} 
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none" 
                              />
                            </div>
                          </>
                        )}

                        <div className="space-y-1.5 lg:col-span-2">
                          <label className="text-xs font-semibold text-slate-600 block">
                            المبلغ {paymentCategory === 'sessions' && <span className="text-[9px] text-slate-400 font-bold">(تلقائي)</span>}
                          </label>
                          <input 
                            type="number" 
                            value={paymentAmount === 0 ? '' : paymentAmount} 
                            onChange={(e) => setPaymentAmount(e.target.value === '' ? 0 : Number(e.target.value))} 
                            disabled={paymentCategory === 'sessions'}
                            className={`w-full border rounded-xl px-3 py-2 text-sm outline-none ${
                              paymentCategory === 'sessions' 
                                ? 'bg-slate-50 border-slate-200 font-bold text-[#0D5C8C]' 
                                : 'bg-white border-slate-200'
                            }`} 
                            min="0"
                          />
                        </div>

                        <div className="space-y-1.5 lg:col-span-2">
                          <label className="text-xs font-semibold text-slate-600 block">طريقة السداد</label>
                          <select 
                            value={paymentMethod} 
                            onChange={(e) => setPaymentMethod(e.target.value as any)} 
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                          >
                            <option value="cash">نقدي (Cash)</option>
                            <option value="card">فيزا / بطاقة (Card)</option>
                            <option value="transfer">تحويل فودافون كاش / بنكي</option>
                          </select>
                        </div>

                        <div className="lg:col-span-4 flex items-center gap-2 pt-2">
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600 select-none">
                            <input 
                              type="checkbox" 
                              checked={sendPaymentSms} 
                              onChange={(e) => setSendPaymentSms(e.target.checked)}
                              className="w-3.5 h-3.5 text-[#1A7FAA] focus:ring-[#1A7FAA] border-slate-300 rounded"
                            />
                            <span>إرسال إشعار تأكيد سداد تلقائي لولي الأمر عبر SMS</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowAddForm(false)} className="px-5 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-xl ml-3">إلغاء</button>
                <button type="submit" className="px-6 py-2 bg-[#1A7FAA] text-white rounded-xl text-sm font-bold shadow-md hover:bg-[#0D5C8C]">
                  {isEditing ? 'حفظ التعديلات المطبقة' : 'حفظ وتسجيل الطالب المذكور'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Tools Filters */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-md space-y-5" id="sams_advanced_filters_card">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="البحث بالاسم المذكور، كود القيد أو الباركود..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1A7FAA]/30 outline-none transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>

          {/* Quick Stats or Active Filters Info */}
          <div className="flex items-center gap-2 text-xs text-slate-500 justify-between lg:justify-end">
            <span>عدد الطلاب المصفين: <strong className="text-[#0D5C8C]">{sortedStudents.length}</strong> من <strong className="text-slate-700">{students.length}</strong></span>
            {hasActiveFilters && (
              <button 
                onClick={resetFilters}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer animate-pulse"
              >
                <X className="w-3 h-3" />
                إلغاء التصفية
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters & Sorting Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Level Filter */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <div className="flex-1">
              <span className="text-[9px] text-slate-400 block -mt-1 font-semibold">المستوى / الصف الدراسي</span>
              <select value={gradeFilter} onChange={e => setGradeFilter(e.target.value)} className="w-full bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer">
                <option value="all">كل الصفوف الدراسية</option>
                <option value="الأول الإعدادي">الأول الإعدادي</option>
                <option value="الثاني الإعدادي">الثاني الإعدادي</option>
                <option value="الثالث الإعدادي">الثالث الإعدادي</option>
                <option value="الأول الثانوي">الأول الثانوي</option>
                <option value="الثاني الثانوي">الثاني الثانوي</option>
                <option value="الثالث الثانوي">الثالث الثانوي</option>
              </select>
            </div>
          </div>

          {/* 2. Class Filter */}
          <div className="relative flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <div className="flex-1">
              <span className="text-[9px] text-slate-400 block -mt-1 font-semibold">المجموعة التعليمية</span>
              <button
                type="button"
                onClick={() => setShowFilterClassDropdown(!showFilterClassDropdown)}
                className="w-full bg-transparent text-right text-xs font-bold text-slate-700 outline-none cursor-pointer flex items-center justify-between"
              >
                <span className="truncate max-w-[120px] block text-right">
                  {classFilter.length === 0 
                    ? 'كل المجموعات (الكل)' 
                    : classes.filter(c => classFilter.includes(c.id)).map(c => c.name).join('، ')
                  }
                </span>
                <span className="text-[10px] text-slate-400 shrink-0 select-none mr-1">
                  {classFilter.length > 0 && `(${classFilter.length})`} ▾
                </span>
              </button>
            </div>

            {showFilterClassDropdown && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowFilterClassDropdown(false)} />
                <div className="absolute right-0 left-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-40 max-h-60 overflow-y-auto p-1.5 space-y-0.5 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setClassFilter([]);
                      setShowFilterClassDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-right text-xs font-semibold cursor-pointer ${
                      classFilter.length === 0
                        ? 'bg-blue-50/70 text-[#0D5C8C]'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>كل المجموعات (الكل)</span>
                    {classFilter.length === 0 && <span className="text-[#0D5C8C] text-xs">✓</span>}
                  </button>
                  
                  {classes.map(c => {
                    const isSelected = classFilter.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setClassFilter(classFilter.filter(id => id !== c.id));
                          } else {
                            setClassFilter([...classFilter, c.id]);
                          }
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-right text-xs font-semibold cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/70 text-[#0D5C8C]'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                            isSelected
                              ? 'border-[#0D5C8C] bg-[#0D5C8C] text-white'
                              : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && <span className="text-[9px]">✓</span>}
                          </div>
                          <span>{c.name}</span>
                        </div>
                        <span className="text-[9px] text-slate-400">{c.grade_level}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* 3. Status Filter */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <div className="flex-1">
              <span className="text-[9px] text-slate-400 block -mt-1 font-semibold">حالة الطالب بالسنتر</span>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer">
                <option value="all">كل الحالات (نشط / موقوف)</option>
                <option value="active">نشط (منتظم)</option>
                <option value="inactive">موقوف (مجمد)</option>
              </select>
            </div>
          </div>

          {/* 4. Payment Status Filter */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <div className="flex-1">
              <span className="text-[9px] text-slate-400 block -mt-1 font-semibold">حالة سداد الرسوم</span>
              <select value={feeStatusFilter} onChange={e => setFeeStatusFilter(e.target.value as any)} className="w-full bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer">
                <option value="all">كل السدادات (الكل)</option>
                <option value="paid">المسددين للرسوم</option>
                <option value="late">المتأخرين في السداد ⚠️</option>
              </select>
            </div>
          </div>

          {/* 5. Check Target Month Filter */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <div className="flex-1">
              <span className="text-[9px] text-slate-400 block -mt-1 font-semibold">شهر الفحص المستهدف</span>
              <select value={feeCheckMonth} onChange={e => setFeeCheckMonth(e.target.value)} className="w-full bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer">
                {MONTHS_LIST.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 6. Alphabetical & Date Sorting */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <div className="flex-1">
              <span className="text-[9px] text-slate-400 block -mt-1 font-semibold">ترتيب وتنسيق العرض</span>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="w-full bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer">
                <option value="default">الترتيب الافتراضي</option>
                <option value="name-asc">أبجدياً من أ إلى ي</option>
                <option value="name-desc">أبجدياً من ي إلى أ</option>
                <option value="date-desc">الأحدث تسجيلاً أولاً</option>
                <option value="date-asc">الأقدم تسجيلاً أولاً</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {selectedStudents.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800 border border-slate-700 rounded-2xl p-3 md:p-4 mb-4 flex flex-wrap items-center justify-between gap-4 shadow-lg shadow-slate-900/10"
        >
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center bg-white text-slate-800 w-7 h-7 rounded-full text-sm font-bold shadow-sm">
              {selectedStudents.length}
            </span>
            <span className="text-sm font-bold text-white">طالب محدد لتحديث الحالة الجماعي</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => handleBulkStatusUpdate('active')}
              className="px-4 py-2.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              تعيين كنشط (منتظم)
            </button>
            <button 
              onClick={() => handleBulkStatusUpdate('inactive')}
              className="px-4 py-2.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              تعيين كموقوف (مجمد)
            </button>
          </div>
        </motion.div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Desktop View Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-gray-100 whitespace-nowrap">
                <tr>
                  <th className="px-4 py-4 pr-6 w-20 flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-slate-600 focus:ring-slate-600 cursor-pointer"
                      checked={selectedStudents.length === sortedStudents.length && sortedStudents.length > 0}
                      onChange={handleSelectAll}
                      title="تحديد الكل"
                    />
                    <span>م</span>
                  </th>
                  <th className="px-4 py-4 min-w-[200px]">بيانات الطالب</th>
                  <th className="px-4 py-4 min-w-[150px]">المجموعة والصف الدراسي</th>
                  <th className="px-4 py-4 min-w-[140px]">رقم ولي الأمر</th>
                  <th className="px-4 py-4 min-w-[200px]">المذكرات المستلمة</th>
                  <th className="px-4 py-4 text-left pl-6 min-w-[160px]">إجراءات التحكم</th>
                </tr>
              </thead>
               <tbody className="divide-y divide-slate-100 whitespace-nowrap">
                {sortedStudents.length > 0 ? sortedStudents.map((student, index) => {
                  const paid = isStudentPaid(student.id, feeCheckMonth);
                  return (
                    <tr 
                      key={student.id} 
                      className={
                        paid 
                          ? 'hover:bg-blue-50/30 transition-colors' 
                          : 'bg-rose-50/20 hover:bg-rose-50/40 transition-colors border-r-4 border-r-rose-500/70'
                      }
                    >
                      <td className="px-4 py-3 pr-6 text-xs text-slate-400 font-mono flex items-center gap-3">
                        <input 
                          type="checkbox"
                          className="w-4 h-4 rounded border-gray-300 text-slate-600 focus:ring-slate-600 cursor-pointer"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => handleSelectStudent(student.id)}
                        />
                        <span>{(index + 1).toString().padStart(2, '0')}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-lg border ${
                            paid 
                              ? 'bg-slate-100 border-slate-200 text-slate-400' 
                              : 'bg-rose-100/70 border-rose-200 text-rose-500'
                          }`}>
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm leading-tight">{student.name}</p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <p className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-sm">#{student.registration_id}</p>
                              {student.status === 'active' ? (
                                <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50/30 px-1.5 py-0.5 rounded border border-emerald-100/50"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> منتظم</span>
                              ) : (
                                <span className="flex items-center gap-1 text-[9px] font-bold text-rose-600 bg-rose-50/30 px-1.5 py-0.5 rounded border border-rose-100/50"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> غير منتظم</span>
                              )}
                              
                              {paid ? (
                                <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
                                  <CheckCircle className="w-2.5 h-2.5 text-emerald-500" />
                                  مسدد ({feeCheckMonth})
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-100 animate-pulse">
                                  <AlertTriangle className="w-2.5 h-2.5 text-rose-500" />
                                  متأخر ({feeCheckMonth}) ⚠️
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex flex-wrap gap-1">
                            <span className="font-bold text-[#0D5C8C] text-xs bg-sky-50 px-2 py-0.5 rounded border border-sky-100 inline-flex items-center">
                              {classes.find(c => c.id === student.class_id)?.name || '-'}
                            </span>
                            {student.class_id_2 && (
                              <span className="font-bold text-indigo-700 text-xs bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 inline-flex items-center">
                                {classes.find(c => c.id === student.class_id_2)?.name || '-'}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 mt-0.5 mr-0.5">{student.grade_level}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-100" dir="ltr">
                          {student.parent_phone}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {student.notes ? (
                          <div className="max-w-[200px] whitespace-normal text-[11px] text-slate-600 bg-slate-50 px-2 py-1.5 rounded border border-slate-100" title={student.notes}>
                            {student.notes}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 pl-6">
                        <div className="flex items-center justify-end gap-2">
                          {!paid && canShowReminderButton && (
                            <button
                              onClick={() => handleSendReminder(student)}
                              disabled={sendingReminderId === student.id}
                              className={`px-2 py-1.5 flex items-center gap-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                                sendingReminderId === student.id
                                  ? 'bg-slate-100 text-slate-400 border border-slate-200'
                                  : 'text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/50 shadow-2xs hover:shadow-xs'
                              }`}
                              title="إرسال تذكير سريع لولي الأمر بسداد الرسوم"
                            >
                              {sendingReminderId === student.id ? (
                                <>
                                  <span className="w-2.5 h-2.5 rounded-full border-2 border-slate-400 border-t-transparent animate-spin inline-block" />
                                  <span>رسالة...</span>
                                </>
                              ) : (
                                <>
                                  <Bell className="w-3.5 h-3.5 text-rose-500" />
                                  <span>تذكير سداد</span>
                                </>
                              )}
                            </button>
                          )}

                          <button 
                            onClick={() => {
                              setSelectedProfile(student);
                              setShowBriefProfile(true);
                            }} 
                            className="p-1.5 text-slate-400 hover:text-[#1A7FAA] hover:bg-sky-50 rounded-lg transition-colors" 
                            title="عرض الملف"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedProfile(student);
                              setShowFullReport(true);
                            }} 
                            className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors" 
                            title="التقرير الشامل"
                          >
                            <BookOpen className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleEditClick(student)} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title="تعديل">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteClick(student)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="أرشفة وحذف">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                      <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p>لا توجد سجلات طلاب مطابقة للشروط الحالية</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile View Cards list (One-touch interaction) */}
        <div className="block md:hidden divide-y divide-slate-100 bg-white">
          {sortedStudents.length > 0 ? sortedStudents.map((student, index) => {
            const paid = isStudentPaid(student.id, feeCheckMonth);
            return (
              <div 
                key={student.id} 
                className={`p-4 space-y-3 transition-colors ${
                  paid ? 'bg-white' : 'bg-rose-50/15 border-r-4 border-r-rose-500/70'
                }`}
              >
                {/* Header info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <input 
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-slate-600 focus:ring-slate-600 cursor-pointer"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => handleSelectStudent(student.id)}
                    />
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm border ${
                      paid 
                        ? 'bg-slate-50 border-slate-100 text-slate-400' 
                        : 'bg-rose-100/70 border-rose-200 text-rose-500'
                    }`}>
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-xs leading-snug">{student.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] font-mono text-slate-500 bg-slate-100 px-1 py-0.2 rounded">
                          #{student.registration_id}
                        </span>
                        {student.status === 'active' ? (
                          <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50/30 px-1 py-0.2 rounded border border-emerald-100/30">منتظم</span>
                        ) : (
                          <span className="text-[8px] font-bold text-rose-600 bg-rose-50/30 px-1 py-0.2 rounded border border-rose-100/30">متغيب</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono font-bold">
                    #{(index + 1).toString().padStart(2, '0')}
                  </span>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-2 text-xxs">
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100/70">
                    <span className="text-[9px] text-slate-400 block font-bold mb-0.5">المجموعات والصف</span>
                    <span className="font-bold text-slate-700 truncate block">
                      {classes.find(c => c.id === student.class_id)?.name || '-'}
                      {student.class_id_2 && ` / ${classes.find(c => c.id === student.class_id_2)?.name || ''}`}
                    </span>
                    <span className="text-[10px] text-slate-500 block">{student.grade_level}</span>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100/70">
                    <span className="text-[9px] text-slate-400 block font-bold mb-0.5">رسوم ({feeCheckMonth})</span>
                    {paid ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 mt-1">
                        <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />
                        مسدد
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 mt-1 animate-pulse">
                        <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                        غير مسدد
                      </span>
                    )}
                  </div>

                  <div className="bg-slate-50 px-2 py-1.5 rounded-xl border border-slate-100/70 col-span-2 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold">هاتف ولي الأمر</span>
                      <span className="font-mono text-slate-700 block text-xs" dir="ltr">{student.parent_phone}</span>
                    </div>
                    <a href={`tel:${student.parent_phone}`} className="p-1.5 bg-sky-50 text-[#0D5C8C] rounded-lg hover:bg-sky-100 border border-sky-100 flex items-center justify-center cursor-pointer">
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {student.notes && (
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100/70 col-span-2">
                      <span className="text-[9px] text-slate-400 block font-bold mb-0.5">المذكرات / الملاحظات</span>
                      <p className="text-[10px] text-slate-600 leading-relaxed">{student.notes}</p>
                    </div>
                  )}
                </div>

                {/* Touch Actions */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-slate-100/70">
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => {
                        setSelectedProfile(student);
                        setShowBriefProfile(true);
                      }} 
                      className="p-1.5 text-slate-400 hover:text-[#1A7FAA] hover:bg-sky-50 rounded-lg border border-slate-150 bg-slate-50/50 cursor-pointer" 
                      title="الملف"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedProfile(student);
                        setShowFullReport(true);
                      }} 
                      className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg border border-slate-150 bg-slate-50/50 cursor-pointer" 
                      title="التقرير"
                    >
                      <BookOpen className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleEditClick(student)} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg border border-slate-150 bg-slate-50/50 cursor-pointer" title="تعديل">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteClick(student)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg border border-slate-150 bg-slate-50/50 cursor-pointer" title="حذف">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {!paid && canShowReminderButton && (
                    <button
                      onClick={() => handleSendReminder(student)}
                      disabled={sendingReminderId === student.id}
                      className={`px-2.5 py-1.5 flex items-center gap-1 text-[10px] font-extrabold rounded-lg transition-colors cursor-pointer ${
                        sendingReminderId === student.id
                          ? 'bg-slate-100 text-slate-400 border border-slate-200'
                          : 'text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/50 shadow-2xs'
                      }`}
                    >
                      {sendingReminderId === student.id ? (
                        <>
                          <span className="w-2.5 h-2.5 rounded-full border-2 border-slate-400 border-t-transparent animate-spin inline-block" />
                          <span>إرسال...</span>
                        </>
                      ) : (
                        <>
                          <Bell className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
                          <span>تذكير سداد</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          }) : (
            <div className="p-12 text-center text-slate-500">
              <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs">لا توجد سجلات طلاب مطابقة للشروط الحالية</p>
            </div>
          )}
        </div>

      <AnimatePresence>
        {selectedProfile && showBriefProfile && (
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
              className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 overflow-hidden"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    الملف الأكاديمي والشخصي
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setShowBriefProfile(false);
                        setSelectedProfile(null);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div className="w-12 h-12 rounded-full bg-[#1A7FAA]/10 flex items-center justify-center border border-[#1A7FAA]/20 text-[#1A7FAA] shrink-0">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-slate-800 text-sm leading-tight">{selectedProfile.name}</h4>
                    <p className="text-[10px] text-slate-500 font-mono">قيد: #{selectedProfile.registration_id}</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2 border-b border-slate-50">
                    <span className="text-slate-500">المجموعات المقيد بها</span>
                    <div className="flex flex-wrap gap-1 justify-end">
                      <span className="font-bold text-[#1A7FAA] bg-[#1A7FAA]/5 px-2 py-0.5 rounded text-[11px]">
                        {classes.find(c => c.id === selectedProfile.class_id)?.name || '-'}
                      </span>
                      {selectedProfile.class_id_2 && (
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                          {classes.find(c => c.id === selectedProfile.class_id_2)?.name || '-'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between p-2 border-b border-slate-50">
                    <span className="text-slate-500">الصف الدراسي</span>
                    <span className="font-bold text-slate-700">{selectedProfile.grade_level}</span>
                  </div>
                  <div className="flex justify-between p-2 border-b border-slate-50">
                    <span className="text-slate-500">تاريخ الميلاد</span>
                    <span className="font-mono text-slate-600">{selectedProfile.birth_date}</span>
                  </div>
                  <div className="flex justify-between p-2 border-b border-slate-50">
                    <span className="text-slate-500">هاتف ولي الأمر</span>
                    <span className="font-mono text-slate-600" dir="ltr">{selectedProfile.parent_phone}</span>
                  </div>
                  {selectedProfile.notes && (
                    <div className="flex flex-col gap-1 p-2 bg-amber-50 rounded-lg mt-2 border border-amber-100">
                      <span className="text-amber-700 font-bold text-[10px]">المذكرات المستلمة</span>
                      <span className="text-amber-900 text-xs leading-relaxed whitespace-pre-wrap">{selectedProfile.notes}</span>
                    </div>
                  )}
                </div>

                {(() => {
                  const stats = getStudentAttendanceStats(selectedProfile.id);
                  return (
                    <div className={`p-3 border rounded-xl space-y-2 text-xs ${stats.bgClass}`}>
                      <div className="flex items-center justify-between font-bold text-[11px]">
                        <span>حضور وانتظام الطالب</span>
                        <span className={`font-extrabold ${stats.statusColor}`}>{stats.statusLabel}</span>
                      </div>
                      <p className={`text-[10px] ${stats.statusColor} opacity-80 leading-relaxed`}>{stats.description}</p>
                    </div>
                  );
                })()}

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setShowBriefProfile(false);
                      setShowFullReport(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-[#1A7FAA] hover:bg-[#156a8e] text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-colors"
                  >
                    <BookOpen className="w-4 h-4" />
                    عرض التقرير الشامل للطالب
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {studentToDelete && (
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
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">تأكيد الحذف</h3>
              </div>
              <p className="text-slate-600 mb-6 leading-relaxed">
                هل أنت متأكد تماماً من رغبتك في أرشفة الطالب <span className="font-bold text-slate-800">"{studentToDelete.name}"</span>؟ ستطبق عليه عملية Soft Delete وسيُنقل لسجلات الأرشيف.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={cancelDelete}
                  className="px-5 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium transition-colors"
                >
                  نعم، أرشفة الطالب
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFullReport && selectedProfile && (
          <StudentFullReport
            student={selectedProfile}
            onClose={() => {
              setShowFullReport(false);
              setSelectedProfile(null);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
