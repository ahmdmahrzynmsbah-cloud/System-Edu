import { db } from "../lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { getAllTenants, saveTenant, deleteTenant, subscribeToTenants } from "../lib/tenantsApi";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, UserPlus, Key, Calendar, ShieldCheck, Star, 
  Trash2, Edit, LogOut, CheckCircle, XCircle, Search, 
  DollarSign, Activity, Settings, Info, BellRing, BookOpen, 
  UserCheck, AlertCircle, RefreshCw, Layers, LayoutDashboard,
  Database, ShieldAlert, Terminal, CheckCircle2, ChevronRight,
  Smartphone, Award, HardDrive, Filter, Globe, Sparkles, Send, Shield,
  Clock
} from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  phone?: string;
  password?: string;
  status: 'active' | 'suspended';
  joinedDate: string;
  expiryDate?: string;
  appName?: string;
  features?: string[];
  pricePaid?: number;
  maxStudents?: number;
  maxSecretaries?: number;
  whatsappGatewayEnabled?: boolean;
}

interface SuperAdminLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  type: 'info' | 'success' | 'warning' | 'danger';
}

interface SuperAdminDashboardProps {
  onLogout: () => void;
}

export default function SuperAdminDashboard({ onLogout }: SuperAdminDashboardProps) {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<'overview' | 'teachers' | 'databases' | 'movements' | 'broadcast' | 'settings'>('overview');
  
  // Real-time system clock
  const [systemTime, setSystemTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setSystemTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [logs, setLogs] = useState<SuperAdminLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals & Controls
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Database scan states
  const [databaseStats, setDatabaseStats] = useState<Record<string, { studentsCount: number, feesCount: number, secretariesCount: number, keysCount: number, sizeBytes: number }>>({});
  const [isScanningDb, setIsScanningDb] = useState(false);

  // Broadcast Announcement State
  const [announcement, setAnnouncement] = useState({
    title: '',
    message: '',
    sender: 'الإدارة العامة للسيستم',
    target: 'all' // all, active
  });

  // Owner security settings states
  const [ownerPassword, setOwnerPassword] = useState(localStorage.getItem('sams_super_admin_password') || '222');
  const [newOwnerPassword, setNewOwnerPassword] = useState('');

  // Form states for adding/editing teachers
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    status: 'active' as 'active' | 'suspended',
    expiryDate: '',
    appName: '',
    pricePaid: 1000,
    features: ['dashboard', 'students', 'books', 'classes', 'attendance', 'exams', 'fees', 'notifications', 'settings'],
    maxStudents: 100,
    maxSecretaries: 3,
    whatsappGatewayEnabled: true
  });

  // Features description array with sub-features for customization
  const featuresList = [
    {
      id: 'dashboard',
      label: 'لوحة التحكم والمؤشرات العامّة',
      subFeatures: [
        { id: 'stat_cards', label: 'بطاقات الإحصائيات الفورية' },
        { id: 'charts_analysis', label: 'الرسومات والمنحنيات البيانية' },
        { id: 'streak_counter', label: 'عداد التفاعل والالتزام اليومي' }
      ]
    },
    {
      id: 'students',
      label: 'إدارة شؤون الطلاب والقبول',
      subFeatures: [
        { id: 'add_student', label: 'تسجيل وقبول الطلاب الجدد' },
        { id: 'attendance_history', label: 'سجل الحضور الكامل للطالب' },
        { id: 'student_notes', label: 'ملاحظات السلوك والتقارير' }
      ]
    },
    {
      id: 'parents',
      label: 'ملفات أولياء الأمور والآباء',
      subFeatures: [
        { id: 'parent_phone', label: 'أرقام هواتف الآباء والأمهات' },
        { id: 'parent_followup', label: 'تحديثات المتابعة والغياب للآباء' }
      ]
    },
    {
      id: 'barcodes',
      label: 'أكواد الباركود وكروت الهوية',
      subFeatures: [
        { id: 'generate_barcode', label: 'توليد باركود تلقائي لكل طالب' },
        { id: 'print_cards', label: 'تصميم وطباعة كروت التعريف' }
      ]
    },
    {
      id: 'books',
      label: 'المذكرات والملازم والمبيعات',
      subFeatures: [
        { id: 'books_inventory', label: 'تسجيل وتخزين المذكرات المتاحة' },
        { id: 'books_sales', label: 'تسجيل مبيعات المذكرات للطلاب' },
        { id: 'books_reports', label: 'تقارير توزيع واستلام المذكرات' }
      ]
    },
    {
      id: 'attendance',
      label: 'التحضير الذكي والغياب اليومي',
      subFeatures: [
        { id: 'manual_attendance', label: 'التحضير اليدوي السريع' },
        { id: 'barcode_attendance', label: 'التحضير الذكي بجهاز الباركود' },
        { id: 'session_reports', label: 'تقارير غياب وحضور المجموعات' }
      ]
    },
    {
      id: 'exams',
      label: 'سجلات الامتحانات والواجبات',
      subFeatures: [
        { id: 'exam_grades', label: 'رصد درجات اختبارات الشهور' },
        { id: 'homework_grades', label: 'متابعة وتقييم الواجبات اليومية' },
        { id: 'certificates_print', label: 'طباعة شهادات التكريم الذكية' }
      ]
    },
    {
      id: 'classes',
      label: 'المجموعات وجداول الحصص',
      subFeatures: [
        { id: 'class_scheduling', label: 'تخطيط المواعيد وجدول الحصص' },
        { id: 'assistant_assign', label: 'تعيين المساعدين لإدارة المجموعات' },
        { id: 'capacity_limit', label: 'تحديد سعة القاعة وتنبيهات الامتلاء' }
      ]
    },
    {
      id: 'salaries',
      label: 'الحسابات والمصاريف ورواتب المساعدين',
      subFeatures: [
        { id: 'assistant_salaries', label: 'حساب رواتب المساعدين والسكرتارية' },
        { id: 'center_expenses', label: 'تسجيل مصاريف السنتر والإيجارات' }
      ]
    },
    {
      id: 'fees',
      label: 'تحصيل الاشتراكات والمدفوعات المالية',
      subFeatures: [
        { id: 'monthly_subscriptions', label: 'تحصيل اشتراكات المجموعات والحصص' },
        { id: 'book_sales', label: 'مبيعات الكتب والمذكرات والملخصات' },
        { id: 'financial_reports', label: 'التقارير المالية اليومية والشهرية' }
      ]
    },
    {
      id: 'notifications',
      label: 'بث الرسائل والغياب الفوري',
      subFeatures: [
        { id: 'sms_gateways', label: 'بوابات الإرسال السحابي والـ SMS' },
        { id: 'whatsapp_integration', label: 'إرسال إشعارات الواتساب الفورية' },
        { id: 'absent_auto_send', label: 'إرسال تلقائي لغياب وحضور الطلاب' }
      ]
    },
    {
      id: 'roles',
      label: 'الصلاحيات والتدقيق الأمني للسكرتارية',
      subFeatures: [
        { id: 'secretary_permissions', label: 'إدارة أدوار وصلاحيات السكرتارية' },
        { id: 'security_audit', label: 'مراقبة سجل عمليات المستخدمين' }
      ]
    },
    {
      id: 'settings',
      label: 'إعدادات البراند وشعار السنتر',
      subFeatures: [
        { id: 'custom_logo', label: 'تخصيص لوجو وهوية البراند الخاص بالمعلم' },
        { id: 'data_backup_restore', label: 'نسخ احتياطي واستعادة قواعد البيانات' },
        { id: 'app_customization', label: 'تعديل ألوان وأنماط المنصة' }
      ]
    },
  ];

  // Load and seed tenants and log on mount
  useEffect(() => {
    // 1. Tenants Load
    const loadData = async () => {
      try {
        const dbTenants = await getAllTenants();
        if (dbTenants.length > 0) {
          setTenants(dbTenants);
          scanDatabaseIsolation(dbTenants);
        } else {
          // Check local storage first
          const savedTenants = localStorage.getItem('sams_system_tenants');
          let loadedTenants: Tenant[] = [];
          if (savedTenants) {
             loadedTenants = JSON.parse(savedTenants);
          } else {
            loadedTenants = [
              {
                id: 'tenant-1',
                name: 'الأستاذ أحمد كمال',
                phone: '01012345678',
                password: '123',
                status: 'active',
                joinedDate: '2026-06-01',
                expiryDate: '2026-12-31',
                appName: 'أكاديمية أحمد كمال للغة العربية',
                features: ['dashboard', 'students', 'classes', 'attendance', 'exams', 'fees', 'notifications', 'settings'],
                pricePaid: 1500,
                maxStudents: 100,
                maxSecretaries: 3,
                whatsappGatewayEnabled: true
              }
            ];
          }
          setTenants(loadedTenants);
          scanDatabaseIsolation(loadedTenants);
          await Promise.all(loadedTenants.map(t => saveTenant(t)));
        }
      } catch (err) {
        console.error("Failed to load tenants:", err);
      }
    };
    loadData();

    const unsubscribe = subscribeToTenants((updatedList) => {
      if (updatedList.length > 0) {
        setTenants(updatedList);
        scanDatabaseIsolation(updatedList);
      }
    });

    // 2. Logs Load
    const savedLogs = localStorage.getItem('sams_super_admin_audit_logs');
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    } else {
      const defaultLogs: SuperAdminLog[] = [
        {
          id: 'log-1',
          timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
          action: 'تهيئة النظام المركزي',
          details: 'تم تأسيس خادم الإدارة المركزية وعزل مساحات التخزين بنجاح.',
          type: 'success'
        },
        {
          id: 'log-2',
          timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
          action: 'تفعيل حساب المعلم',
          details: 'تم تسليم رخصة نشطة للمعلم أحمد كمال حتى نهاية العام.',
          type: 'info'
        }
      ];
      localStorage.setItem('sams_super_admin_audit_logs', JSON.stringify(defaultLogs));
      setLogs(defaultLogs);
    }

    return () => { if (unsubscribe) unsubscribe(); }
  }, []);

  // Scan localStorage to calculate actual size and record count for each teacher
  const scanDatabaseIsolation = (currentTenants: Tenant[]) => {
    setIsScanningDb(true);
    const stats: Record<string, { studentsCount: number, feesCount: number, secretariesCount: number, keysCount: number, sizeBytes: number }> = {};
    
    currentTenants.forEach(tenant => {
      let keysCount = 0;
      let totalSize = 0;
      let studentsCount = 0;
      let feesCount = 0;
      let secretariesCount = 1; // default to 1 (أ. سارة علي)
      const prefix = `${tenant.id}_`;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keysCount++;
          const val = localStorage.getItem(key) || '';
          totalSize += val.length * 2; // approximation for utf-16 string size

          if (key.endsWith('sams_v2_students')) {
            try { studentsCount = JSON.parse(val).length; } catch(e){}
          }
          if (key.endsWith('sams_v2_fees')) {
            try { feesCount = JSON.parse(val).length; } catch(e){}
          }
          if (key.endsWith('sams_system_users')) {
            try {
              const usersList = JSON.parse(val);
              secretariesCount = usersList.filter((u: any) => u.role === 'secretary').length;
            } catch(e){}
          }
        }
      }

      stats[tenant.id] = {
        studentsCount,
        feesCount,
        secretariesCount,
        keysCount,
        sizeBytes: totalSize
      };
    });

    setDatabaseStats(stats);
    setTimeout(() => {
      setIsScanningDb(false);
    }, 400);
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const addLog = (action: string, details: string, type: 'info' | 'success' | 'warning' | 'danger') => {
    const newLog: SuperAdminLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action,
      details,
      type
    };
    const updated = [newLog, ...logs];
    localStorage.setItem('sams_super_admin_audit_logs', JSON.stringify(updated));
    setLogs(updated);
  };

  const saveTenantsToStorage = (updatedList: Tenant[]) => {
    localStorage.setItem('sams_system_tenants', JSON.stringify(updatedList));
    setTenants(updatedList);
    scanDatabaseIsolation(updatedList);
  };

  const handleOpenAddModal = () => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const dateString = nextMonth.toISOString().split('T')[0];

    setFormData({
      name: '',
      phone: '',
      password: '',
      status: 'active',
      expiryDate: dateString,
      appName: '',
      pricePaid: 1000,
      features: ['dashboard', 'students', 'classes', 'attendance', 'exams', 'fees', 'notifications', 'settings'],
      maxStudents: 100,
      maxSecretaries: 3,
      whatsappGatewayEnabled: true
    });
    setShowAddModal(true);
  };

  const handleAddTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.password.trim()) {
      showToast('error', 'يرجى إدخال اسم المعلم والباسورد الخاص به.');
      return;
    }

    const isDuplicate = tenants.some(t => t.name.trim().toLowerCase() === formData.name.trim().toLowerCase());
    if (isDuplicate) {
      showToast('error', 'اسم المعلم مسجل مسبقاً بقاعدة البيانات!');
      return;
    }

    const newTenant: Tenant = {
      id: `tenant-${Date.now()}`,
      name: formData.name.trim(),
      phone: formData.phone.trim() || 'غير محدد',
      password: formData.password.trim(),
      status: formData.status,
      joinedDate: new Date().toISOString().split('T')[0],
      expiryDate: formData.expiryDate || '2027-12-31',
      appName: formData.appName.trim() || `سيستم ${formData.name.trim()}`,
      features: formData.features,
      pricePaid: Number(formData.pricePaid) || 0,
      maxStudents: Number(formData.maxStudents) || 100,
      maxSecretaries: Number(formData.maxSecretaries) || 3,
      whatsappGatewayEnabled: formData.whatsappGatewayEnabled
    };

    saveTenant(newTenant).then(() => {
      setShowAddModal(false);
      const updated = [...tenants, newTenant];
      setTenants(updated);
      localStorage.setItem('sams_system_tenants', JSON.stringify(updated));
    }).catch(err => {
      console.error(err);
      alert('حدث خطأ أثناء الحفظ في قاعدة البيانات. يرجى المحاولة مرة أخرى.');
    });
    
    // Seed blank structures for this new tenant
    const prefix = `${newTenant.id}_`;
    const keys = ['sams_v2_students', 'sams_v2_teachers', 'sams_v2_classes', 'sams_v2_fees', 'sams_v2_attendance', 'sams_v2_exams', 'sams_v2_assignments', 'sams_v2_exam_grades', 'sams_v2_assignment_grades'];
    keys.forEach(k => {
      localStorage.setItem(`${prefix}${k}`, '[]');
      setDoc(doc(db, 'system_tenant_data', `${prefix}${k}`), {
        tenantId: prefix.replace('_', ''),
        key: k,
        data: '[]',
        updatedAt: Date.now()
      }).catch(err => console.error(err));
    });

    addLog('تسجيل معلم جديد', `تم إنشاء مساحة تخزين مشفرة وتفعيل رخصة لـ (${newTenant.name})`, 'success');
    showToast('success', `تم تسجيل المعلم وعزل قاعدة بياناته بنجاح!`);
  };

  const handleOpenEditModal = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setFormData({
      name: tenant.name,
      phone: tenant.phone,
      password: tenant.password,
      status: tenant.status,
      expiryDate: tenant.expiryDate,
      appName: tenant.appName || `سيستم ${tenant.name}`,
      pricePaid: tenant.pricePaid || 0,
      features: tenant.features || [],
      maxStudents: tenant.maxStudents || 100,
      maxSecretaries: tenant.maxSecretaries || 3,
      whatsappGatewayEnabled: tenant.whatsappGatewayEnabled !== false
    });
    setShowEditModal(true);
  };

  const handleEditTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;

    if (!formData.name.trim() || !formData.password.trim()) {
      showToast('error', 'يرجى ملء جميع الحقول المطلوبة.');
      return;
    }

    const updated = tenants.map(t => {
      if (t.id === selectedTenant.id) {
         return {
          ...t,
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          password: formData.password.trim(),
          status: formData.status,
          expiryDate: formData.expiryDate,
          appName: formData.appName.trim() || `سيستم ${formData.name.trim()}`,
          features: formData.features,
          pricePaid: Number(formData.pricePaid) || 0,
          maxStudents: Number(formData.maxStudents) || 100,
          maxSecretaries: Number(formData.maxSecretaries) || 3,
          whatsappGatewayEnabled: formData.whatsappGatewayEnabled
        };
      }
      return t;
    });

    const updatedTenant = updated.find(t => t.id === selectedTenant!.id);
    if (updatedTenant) {
      saveTenant(updatedTenant).then(() => {
        setShowEditModal(false);
        setSelectedTenant(null);
        setTenants(updated);
        localStorage.setItem('sams_system_tenants', JSON.stringify(updated));
        addLog('تعديل ترخيص', `تم تحديث رخصة ومميزات المعلم (${formData.name})`, 'info');
        showToast('success', `تم حفظ وتعديل التراخيص بنجاح!`);
      }).catch(err => {
        alert('حدث خطأ أثناء التعديل.');
      });
    }
  };

  const handleDeleteTenant = (id: string, name: string) => {
    if (window.confirm(`⚠️ تحذير مدمر: هل أنت متأكد من مسح المعلم (${name}) نهائياً؟\nسيؤدي هذا الإجراء إلى حذف حسابه وتدمير كافة بيانات طلابه ودرجاتهم ومعاملاتهم الحسابية بالكامل ولا يمكن التراجع!`)) {
      const updated = tenants.filter(t => t.id !== id);
      saveTenantsToStorage(updated);
      
      // Clean up tenant namespace from localStorage
      const prefix = `${id}_`;
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));

      addLog('حذف معلم كلياً', `تم مسح المعلم (${name}) وتطهير مساحته المعزولة من القرص كلياً.`, 'danger');
      showToast('success', `تم حذف المعلم وقاعدة بياناته نهائياً.`);
    }
  };

  const handleToggleStatus = (tenant: Tenant) => {
    const nextStatus = tenant.status === 'active' ? 'suspended' : 'active';
    const updated = tenants.map(t => {
      if (t.id === tenant.id) {
        return { ...t, status: nextStatus };
      }
      return t;
    });
    saveTenant({ ...tenant, status: nextStatus }).then(() => {
      setTenants(updated);
      localStorage.setItem('sams_system_tenants', JSON.stringify(updated));
    });
    
    addLog(
      nextStatus === 'active' ? 'تنشيط رخصة' : 'إيقاف رخصة', 
      `تم تغيير رخصة المعلم (${tenant.name}) إلى ${nextStatus === 'active' ? 'نشط ومفعل' : 'موقوف معلق'}`,
      nextStatus === 'active' ? 'success' : 'warning'
    );

    showToast(
      nextStatus === 'active' ? 'success' : 'error', 
      nextStatus === 'active' 
        ? `تم تنشيط رخصة المعلم وعادت خدماته للعمل.` 
        : `تم تعطيل رخصة المعلم مؤقتاً وحجب دخوله.`
    );
  };

  const handleWipeDatabase = (tenantId: string, name: string) => {
    if (window.confirm(`⚠️ تصفير قاعدة البيانات: هل تريد مسح كافة السجلات وعمل فورمات لقاعدة بيانات المعلم (${name}) والبدء على بياض؟ طلابه وعملياته ستضيع بالكامل!`)) {
      const prefix = `${tenantId}_`;
      
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));

      scanDatabaseIsolation(tenants);
      addLog('تصفير قاعدة بيانات', `تم مسح وتصفير كافة جداول المعلم (${name}) بناءً على طلب المالك.`, 'warning');
      showToast('success', `تم تصفير وإفراغ قاعدة بيانات المعلم بنجاح!`);
    }
  };

  const handleSeedMockData = (tenantId: string, name: string) => {
    const prefix = `${tenantId}_`;
    
    // 1. Wipe existing data for this tenant to ensure a clean state for the mock data
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // 2. Seed robust mock structures for presentation/testing
    const mockStudents = [
      { id: 's-101', name: 'أحمد محمود العاصي', phone: '01011122233', parentPhone: '01233344455', classId: 'c-1', barcode: '2026101', balance: 0, academicYear: 'third_sec', status: 'active', notes: 'طالب ممتاز ومستمر' },
      { id: 's-102', name: 'سارة عبد الرحمن يوسف', phone: '01155566677', parentPhone: '01599988811', classId: 'c-1', barcode: '2026102', balance: -150, academicYear: 'third_sec', status: 'active', notes: 'متأخر في قسط يونيو' },
      { id: 's-103', name: 'عمر هاشم المختار', phone: '01288899900', parentPhone: '01044455566', classId: 'c-2', barcode: '2026103', balance: 50, academicYear: 'first_sec', status: 'active', notes: '' }
    ];

    const mockClasses = [
      { id: 'c-1', name: 'مجموعة النخبة - الصف الثالث الثانوي', academicYear: 'third_sec', schedule: 'الأحد والثلاثاء 4 مساءً', price: 150, teacherId: 't-1' },
      { id: 'c-2', name: 'مجموعة التميز - الصف الأول الثانوي', academicYear: 'first_sec', schedule: 'الإثنين والخميس 6 مساءً', price: 120, teacherId: 't-1' }
    ];

    const mockFees = [
      { id: 'f-1', studentId: 's-101', studentName: 'أحمد محمود العاصي', className: 'مجموعة النخبة - الصف الثالث الثانوي', amount: 150, date: '2026-07-01', month: 'يوليو 2026', type: 'monthly_subscription', notes: 'تم الدفع كاش بالسكرتارية' },
      { id: 'f-2', studentId: 's-103', studentName: 'عمر هاشم المختار', className: 'مجموعة التميز - الصف الأول الثانوي', amount: 120, date: '2026-07-02', month: 'يوليو 2026', type: 'monthly_subscription', notes: 'دفع بالفيزا' }
    ];

    const setFb = (k: string, v: any) => {
      const s = JSON.stringify(v);
      localStorage.setItem(`${prefix}${k}`, s);
      setDoc(doc(db, 'system_tenant_data', `${prefix}${k}`), {
        tenantId: prefix.replace('_', ''),
        key: k,
        data: s,
        updatedAt: Date.now()
      }).catch(err => console.error(err));
    };
    setFb('sams_v2_students', mockStudents);
    setFb('sams_v2_classes', mockClasses);
    setFb('sams_v2_fees', mockFees);

    scanDatabaseIsolation(tenants);
    addLog('تغذية بيانات تجريبية', `تم شحن قاعدة بيانات المعلم (${name}) ببيانات توضيحية كاملة لغرض العرض.`, 'success');
    showToast('success', `تم شحن الحساب ببيانات تجريبية كاملة بنجاح!`);
  };

  const handleSendAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcement.title.trim() || !announcement.message.trim()) {
      showToast('error', 'يرجى كتابة عنوان الإشعار ومحتوى الرسالة.');
      return;
    }

    // Save global notification that teachers and secretaries will see
    const notificationItem = {
      id: `announcement-${Date.now()}`,
      title: announcement.title.trim(),
      message: announcement.message.trim(),
      date: new Date().toISOString().split('T')[0],
      sender: announcement.sender,
      target: announcement.target,
      isRead: false
    };

    // Store in global key
    let currentAnnouncements: any[] = [];
    try {
      const saved = localStorage.getItem('sams_admin_notifications');
      if (saved) currentAnnouncements = JSON.parse(saved);
    } catch (e) {}

    const updated = [notificationItem, ...currentAnnouncements];
    localStorage.setItem('sams_admin_notifications', JSON.stringify(updated));

    setAnnouncement({
      title: '',
      message: '',
      sender: 'الإدارة العامة للسيستم',
      target: 'all'
    });

    addLog('بث إعلان عام', `تم بث رسالة إدارية لكافة المشتركين بعنوان: (${notificationItem.title})`, 'info');
    showToast('success', 'تم بث الإعلان بنجاح! سيظهر لجميع السكرتارية والمعلمين فور دخولهم لوحة التحكم الخاصة بهم.');
  };

  const handleUpdateOwnerPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOwnerPassword.trim()) {
      showToast('error', 'يرجى كتابة رمز المرور الجديد.');
      return;
    }

    localStorage.setItem('sams_super_admin_password', newOwnerPassword.trim());
    setOwnerPassword(newOwnerPassword.trim());
    setNewOwnerPassword('');
    
    addLog('تغيير كلمة مرور المالك', 'تمت ترقية وتحديث كلمة مرور المدير العام للسيستم بنجاح.', 'success');
    showToast('success', `تم تغيير كلمة مرور المالك المركزي إلى: ${newOwnerPassword.trim()} بنجاح.`);
  };

  const handleClearLogs = () => {
    if (window.confirm('هل تريد مسح وتصفير سجل العمليات والتحركات بالسيستم؟')) {
      localStorage.setItem('sams_super_admin_audit_logs', '[]');
      setLogs([]);
      showToast('success', 'تم تنظيف وتصفير السجل المركزي.');
    }
  };

  const toggleFeature = (featureId: string) => {
    setFormData(prev => {
      const isSelected = prev.features.includes(featureId);
      if (isSelected) {
        // Toggled off: remove parent ID and all its sub-features (e.g. "parentId:")
        const nextFeatures = prev.features.filter(f => f !== featureId && !f.startsWith(`${featureId}:`));
        return { ...prev, features: nextFeatures };
      } else {
        // Toggled on: add parent ID, and also default-enable all its sub-features for convenience
        const feat = featuresList.find(f => f.id === featureId);
        const subIds = feat && feat.subFeatures ? feat.subFeatures.map(sf => `${featureId}:${sf.id}`) : [];
        const nextFeatures = [...prev.features, featureId, ...subIds];
        return { ...prev, features: nextFeatures };
      }
    });
  };

  const toggleSubFeature = (parentId: string, subId: string) => {
    const fullId = `${parentId}:${subId}`;
    setFormData(prev => {
      const isSelected = prev.features.includes(fullId);
      const nextFeatures = isSelected
        ? prev.features.filter(f => f !== fullId)
        : [...prev.features, fullId];
      return { ...prev, features: nextFeatures };
    });
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.appName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.phone.includes(searchQuery)
  );

  // Stats Calculations
  const totalCount = tenants.length;
  const activeCount = tenants.filter(t => t.status === 'active').length;
  const suspendedCount = tenants.filter(t => t.status === 'suspended').length;
  const totalRevenue = tenants.reduce((sum, t) => sum + (t.pricePaid || 0), 0);
  
  // Calculate total student load across all databases
  const totalStudentsCrossTenant = Object.values(databaseStats).reduce((sum, s: any) => sum + (s?.studentsCount || 0), 0);

  return (
    <div className="flex h-screen bg-[#F4F6F8] font-sans text-slate-800" dir="rtl">
      
      {/* 1. ROYAL PREMIUM SIDEBAR FOR SUPER ADMIN */}
      <aside className="w-72 bg-[#091F2C] text-slate-200 flex flex-col justify-between shrink-0 border-l border-slate-800 shadow-2xl relative z-10">
        
        {/* Pinned Top Brand & Administrator Information (Stays Fixed) */}
        <div className="shrink-0 bg-gradient-to-br from-[#0B3047] to-[#091F2C]">
          {/* Logo & Head Brand */}
          <div className="p-6 border-b border-slate-800/60">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-amber-400 rounded-2xl flex items-center justify-center border border-amber-300 shadow-lg shadow-amber-500/10">
                <ShieldCheck className="w-6 h-6 text-[#091F2C]" />
              </div>
              <div>
                <span className="text-xs bg-amber-400/20 text-amber-300 font-black px-2.5 py-0.5 rounded-full border border-amber-400/15">
                  المدير العام
                </span>
                <h1 className="text-sm font-black text-white mt-1.5 tracking-wide">لوحة تحكم Fox System المركزية</h1>
              </div>
            </div>
          </div>

          {/* Connected Administrator Badge */}
          <div className="mx-4 my-4 p-3.5 bg-slate-800/40 border border-slate-700/50 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full flex items-center justify-center font-black text-slate-900 text-xs shadow-md">
              M
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-black text-white truncate">المالك الأصلي للسيستم</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-slate-400 font-bold">بوابة السيرفر: متصل</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Navigation Menu Items ONLY */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* Navigation Items */}
          <nav className="px-3 space-y-1.5 py-2">
            <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase px-4 pb-1">أدوات التحكم المركزي</p>
            
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-gradient-to-r from-sky-500/20 to-transparent text-sky-400 border-r-4 border-sky-500 font-black shadow-inner'
                  : 'text-slate-400 hover:bg-slate-800/30 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4.5 h-4.5" />
                <span>الرئيسية ونشاط المنصة</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 opacity-60 transition-transform ${activeTab === 'overview' ? 'rotate-90 text-sky-400' : ''}`} />
            </button>

            <button
              onClick={() => setActiveTab('teachers')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'teachers'
                  ? 'bg-gradient-to-r from-sky-500/20 to-transparent text-sky-400 border-r-4 border-sky-500 font-black shadow-inner'
                  : 'text-slate-400 hover:bg-slate-800/30 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4.5 h-4.5" />
                <span>إدارة المعلمين وتراخيص المشتركين</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 opacity-60 transition-transform ${activeTab === 'teachers' ? 'rotate-90 text-sky-400' : ''}`} />
            </button>

            <button
              onClick={() => setActiveTab('databases')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'databases'
                  ? 'bg-gradient-to-r from-sky-500/20 to-transparent text-sky-400 border-r-4 border-sky-500 font-black shadow-inner'
                  : 'text-slate-400 hover:bg-slate-800/30 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Database className="w-4.5 h-4.5" />
                <span>أمان وعزل قواعد البيانات</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 opacity-60 transition-transform ${activeTab === 'databases' ? 'rotate-90 text-sky-400' : ''}`} />
            </button>

            <button
              onClick={() => setActiveTab('movements')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'movements'
                  ? 'bg-gradient-to-r from-sky-500/20 to-transparent text-sky-400 border-r-4 border-sky-500 font-black shadow-inner'
                  : 'text-slate-400 hover:bg-slate-800/30 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Activity className="w-4.5 h-4.5" />
                <span>سجل التحركات والعمليات كلياً</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 opacity-60 transition-transform ${activeTab === 'movements' ? 'rotate-90 text-sky-400' : ''}`} />
            </button>

            <button
              onClick={() => setActiveTab('broadcast')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'broadcast'
                  ? 'bg-gradient-to-r from-sky-500/20 to-transparent text-sky-400 border-r-4 border-sky-500 font-black shadow-inner'
                  : 'text-slate-400 hover:bg-slate-800/30 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BellRing className="w-4.5 h-4.5" />
                <span>بث إشعار عام للمشتركين</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 opacity-60 transition-transform ${activeTab === 'broadcast' ? 'rotate-90 text-sky-400' : ''}`} />
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-gradient-to-r from-sky-500/20 to-transparent text-sky-400 border-r-4 border-sky-500 font-black shadow-inner'
                  : 'text-slate-400 hover:bg-slate-800/30 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Key className="w-4.5 h-4.5" />
                <span>أمن المالك ورمز الدخول</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 opacity-60 transition-transform ${activeTab === 'settings' ? 'rotate-90 text-sky-400' : ''}`} />
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Logout button */}
        <div className="p-4 border-t border-slate-800 bg-[#071722]/80">
          <button
            onClick={onLogout}
            className="w-full py-2.5 bg-red-650 hover:bg-red-700 bg-red-600/95 text-white rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer shadow-lg flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            تسجيل خروج آمن للمالك
          </button>
          <div className="text-center mt-3 text-[9px] text-slate-500 font-bold font-mono">
            Fox System Admin v2.5.4
          </div>
        </div>
      </aside>

      {/* 2. MAIN STAGE VIEW */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* TOP STATUS HEADER BAR */}
        <header className="h-16 bg-white border-b border-gray-150 flex items-center justify-end px-6 sm:px-8 shadow-3xs shrink-0">
          <div className="flex items-center gap-3">
            
            {/* Live System Time & Date Badge */}
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 px-3.5 py-1.5 rounded-2xl shadow-3xs hover:bg-slate-100/50 transition-all duration-350" dir="rtl">
              {/* Date Segment */}
              <div className="flex items-center gap-1.5 border-l border-slate-200/85 pl-2.5 text-right">
                <Calendar className="w-3.5 h-3.5 text-[#0D5C8C] shrink-0" />
                <span className="text-[11px] font-black text-slate-700">
                  {systemTime.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              
              {/* Time Segment */}
              <div className="flex items-center gap-1.5 text-right">
                <Clock className="w-3.5 h-3.5 text-[#0D5C8C] shrink-0" />
                <span className="text-[11px] font-black text-slate-800 font-mono tracking-wide">
                  {systemTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                </span>
              </div>
            </div>

          </div>
        </header>

        {/* CONTAINER WITH TRANSITIONS */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          
          {/* TOAST TOAST FLASH ALERTS */}
          <AnimatePresence>
            {notification && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-black shadow-lg max-w-xl mx-auto ${
                  notification.type === 'success' 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-500/30 dark:text-emerald-300' 
                    : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-500/30 dark:text-red-300'
                }`}
              >
                {notification.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                )}
                <span>{notification.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* TAB CONTENT RENDERING */}

          {/* A. OVERVIEW MODULE */}
          {activeTab === 'overview' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Dynamic Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">إجمالي المشتركين (المعلمين)</p>
                    <h3 className="text-2xl font-black text-slate-800 font-mono">{totalCount}</h3>
                    <p className="text-[9px] text-slate-400 font-semibold">تراخيص بيع النظام</p>
                  </div>
                  <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">الاشتراكات المفعلة والنشطة</p>
                    <h3 className="text-2xl font-black text-emerald-600 font-mono">{activeCount}</h3>
                    <p className="text-[9px] text-emerald-500 font-semibold">وصول كامل للوحة التحكم</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                    <UserCheck className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">الطلاب تحت إشراف المنظومة</p>
                    <h3 className="text-2xl font-black text-[#0D5C8C] font-mono">{totalStudentsCrossTenant}</h3>
                    <p className="text-[9px] text-[#0D5C8C] font-semibold">موزعين على المعلمين</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <Award className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">إجمالي مبيعات رخص Fox System</p>
                    <h3 className="text-2xl font-black text-amber-600 font-mono">{(totalRevenue).toLocaleString()} ج.م</h3>
                    <p className="text-[9px] text-amber-600 font-semibold">أرباح مبيعات التراخيص</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Graphic Ring & Summary Split row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm col-span-2 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <h4 className="text-xs font-black text-slate-900">حالة التراخيص والخدمات السحابية</h4>
                      <p className="text-[11px] text-slate-400">نظرة عامة على صحة واستقرار قواعد بيانات المشتركين وتوفر المساحة</p>
                    </div>
                    <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">
                      SSL Secure 256-bit
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50 border border-gray-150 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-600">نسبة تفعيل الاشتراكات:</span>
                      <span className="font-mono font-black text-[#0D5C8C]">
                        {totalCount ? Math.round((activeCount / totalCount) * 100) : 0}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#0D5C8C] to-emerald-500 rounded-full transition-all" 
                        style={{ width: `${totalCount ? (activeCount / totalCount) * 100 : 0}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                      كلما زادت نسبة تفعيل التراخيص، زادت أرباحك السحابية. يمكنك تعليق أي اشتراك بشكل فوري لمنع المعلم وسكرتاريته من الدخول في حال تأخرهم عن السداد أو انتهاء مدة رخصتهم.
                    </p>
                  </div>

                  {/* Guaranteed Isolated Block */}
                  <div className="border border-amber-200 bg-amber-50/20 p-4 rounded-2xl flex gap-3.5 items-start">
                    <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h5 className="text-[11px] font-black text-amber-800">ميزة عزل البيانات المتقدمة (Isolated Multi-Tenant Node)</h5>
                      <p className="text-[10px] text-slate-600 leading-relaxed">
                        قمنا بفصل قواعد البيانات كلياً وتوجيهها بناءً على رمز الدخول والمشترك. لن تظهر بيانات طالب واحد لأي معلم آخر، حتى لو كانت قواعد البيانات مخزنة في نفس المتصفح أو السيرفر. الخصوصية مضمونة 100%.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick actions Panel */}
                <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-4">
                  <h4 className="text-xs font-black text-slate-900 border-b border-gray-100 pb-3">إجراءات سريعة للمدير</h4>
                  
                  <div className="space-y-2.5">
                    <button
                      onClick={() => { handleOpenAddModal(); setActiveTab('teachers'); }}
                      className="w-full p-3 bg-[#0D5C8C] hover:bg-[#1A7FAA] text-white rounded-xl text-xs font-bold flex items-center justify-between transition-transform active:scale-98 cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <UserPlus className="w-4 h-4" />
                        بيع المنظومة لمعلم جديد
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setActiveTab('databases')}
                      className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-gray-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-between transition-transform active:scale-98 cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-sky-600" />
                        التحقق من أحجام الداتا
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    <button
                      onClick={() => setActiveTab('broadcast')}
                      className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-gray-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-between transition-transform active:scale-98 cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <BellRing className="w-4 h-4 text-amber-500" />
                        بث إعلان طوارئ للسيستم
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>

                  <div className="bg-[#091F2C] text-slate-300 p-3.5 rounded-2xl border border-slate-800 text-[10px] space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-amber-400 mb-1">
                      <Terminal className="w-3.5 h-3.5" />
                      <span>معلومات تهم الموزع:</span>
                    </div>
                    <p>&bull; الباسورد الافتراضي لدخولك: <span className="font-mono text-white font-black">{ownerPassword}</span></p>
                    <p>&bull; لتسجيل الدخول: اختر دور (مدير) واكتب اسمك واكتب الباسورد المركزي الخاص بك.</p>
                  </div>
                </div>

              </div>

              {/* Latest Central logs list */}
              <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-slate-900">سجل التحركات الأخيرة بالسيستم</h4>
                    <p className="text-[11px] text-slate-400">مراقبة فورية للعمليات الأمنية وتغيير التراخيص</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('movements')}
                    className="text-[11px] font-bold text-[#0D5C8C] hover:underline"
                  >
                    عرض السجل الكامل &larr;
                  </button>
                </div>

                <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
                  {logs.slice(0, 5).map(log => (
                    <div key={log.id} className="py-2.5 flex items-center justify-between text-xs font-sans">
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${
                          log.type === 'success' ? 'bg-emerald-500' :
                          log.type === 'danger' ? 'bg-red-500' :
                          log.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                        }`} />
                        <div>
                          <p className="font-bold text-slate-800">{log.action}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{log.details}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          )}

          {/* B. TEACHERS MANAGEMENT MODULE */}
          {activeTab === 'teachers' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-950">تراخيص المعلمين والسناتر المشتركة</h2>
                    <p className="text-xs text-slate-400 mt-0.5">يمكنك إضافة معلمين جدد، تعديل مميزاتهم وتاريخ اشتراكهم، أو تعطيل حساباتهم</p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
                    <div className="relative flex-1 sm:flex-initial">
                      <Search className="absolute right-3.5 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="ابحث عن معلم، سنتر..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full sm:w-64 pr-10 pl-4 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#0D5C8C] focus:bg-white font-medium"
                      />
                    </div>

                    <button
                      onClick={handleOpenAddModal}
                      className="px-4 py-2.5 bg-[#0D5C8C] hover:bg-[#1A7FAA] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
                    >
                      <UserPlus className="w-4.5 h-4.5" />
                      إضافة معلم جديد
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[10px] font-black tracking-wider uppercase border-b border-gray-100">
                        <th className="p-4">المعلم / السنتر</th>
                        <th className="p-4">العلامة التجارية للبرنامج</th>
                        <th className="p-4">الهاتف</th>
                        <th className="p-4">الطلاب (المسجل/الأقصى)</th>
                        <th className="p-4">السكرتارية (المسجل/الأقصى)</th>
                        <th className="p-4">الباسورد الخاص بالمعلم</th>
                        <th className="p-4">صلاحية الترخيص</th>
                        <th className="p-4 text-center">حالة الحساب والسويتش</th>
                        <th className="p-4">المميزات المفعلة</th>
                        <th className="p-4 text-center">العمليات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium">
                      {filteredTenants.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="p-12 text-center text-slate-400">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Users className="w-8 h-8 text-slate-300" />
                              <p className="text-xs font-bold">لم يتم العثور على معلمين يطابقون بحثك.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredTenants.map((tenant) => {
                          const expired = new Date(tenant.expiryDate) < new Date();
                          const stats = databaseStats[tenant.id] || { studentsCount: 0, feesCount: 0, secretariesCount: 1, keysCount: 0, sizeBytes: 0 };
                          return (
                            <tr key={tenant.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-4">
                                <div className="font-bold text-slate-900">{tenant.name}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5">انضمام: {tenant.joinedDate}</div>
                              </td>
                              <td className="p-4">
                                <div className="font-black text-[#0D5C8C] flex items-center gap-1">
                                  <Globe className="w-3.5 h-3.5 text-sky-500" />
                                  <span>{tenant.appName || 'Fox System'}</span>
                                </div>
                              </td>
                              <td className="p-4 text-slate-600 font-mono">{tenant.phone}</td>
                              <td className="p-4">
                                <div className="font-bold text-slate-900 font-mono">
                                  {stats.studentsCount} / <span className="text-[#0D5C8C]">{tenant.maxStudents || 100}</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 max-w-[80px]">
                                  <div 
                                    className={`h-full rounded-full ${stats.studentsCount >= (tenant.maxStudents || 100) ? 'bg-red-500' : 'bg-[#0D5C8C]'}`}
                                    style={{ width: `${Math.min(100, (stats.studentsCount / (tenant.maxStudents || 100)) * 100)}%` }}
                                  />
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="font-bold text-slate-900 font-mono">
                                  {stats.secretariesCount} / <span className="text-[#0D5C8C]">{tenant.maxSecretaries || 3}</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 max-w-[80px]">
                                  <div 
                                    className={`h-full rounded-full ${stats.secretariesCount >= (tenant.maxSecretaries || 3) ? 'bg-red-500' : 'bg-amber-500'}`}
                                    style={{ width: `${Math.min(100, (stats.secretariesCount / (tenant.maxSecretaries || 3)) * 100)}%` }}
                                  />
                                </div>
                              </td>
                              <td className="p-4">
                                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-bold tracking-wider">
                                  {tenant.password}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="font-bold text-slate-800">ينتهي: <span className="font-mono">{tenant.expiryDate}</span></div>
                                {expired ? (
                                  <span className="inline-block mt-1 text-[9px] font-black text-red-650 bg-red-50 text-red-650 text-red-600 px-2 py-0.5 rounded border border-red-100">منتهي الصلاحية</span>
                                ) : (
                                  <span className="inline-block mt-1 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">نشط وصالح</span>
                                )}
                              </td>
                              <td className="p-4 text-center">
                                {/* PROFESSIONAL TOGGLE SWITCH */}
                                <div className="flex items-center justify-center gap-2.5">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleStatus(tenant)}
                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                      tenant.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'
                                    }`}
                                  >
                                    <span
                                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                        tenant.status === 'active' ? '-translate-x-5' : 'translate-x-0'
                                      }`}
                                    />
                                  </button>
                                  <span className={`text-[10px] font-black ${tenant.status === 'active' ? 'text-emerald-600' : 'text-slate-400'}`}>
                                    {tenant.status === 'active' ? 'مفعّل ونشط' : 'موقوف معطّل'}
                                  </span>
                                </div>
                              </td>
                              <td className="p-4 max-w-xs">
                                <div className="flex flex-wrap gap-1.5">
                                  {(() => {
                                    const mainFeatures = tenant.features
                                      .map(f => featuresList.find(fl => fl.id === f))
                                      .filter(Boolean);
                                    return (
                                      <>
                                        {mainFeatures.slice(0, 2).map((match, idx) => (
                                          <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-bold font-sans whitespace-nowrap overflow-hidden text-ellipsis max-w-[130px]" title={match!.label}>
                                            {match!.label}
                                          </span>
                                        ))}
                                        {mainFeatures.length > 2 && (
                                          <span className="text-[10px] bg-sky-50 text-sky-600 border border-sky-100 px-2 py-1 rounded-md font-black font-sans shrink-0">
                                            +{mainFeatures.length - 2} ميزات
                                          </span>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleOpenEditModal(tenant)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-lg transition-colors cursor-pointer"
                                    title="تعديل التراخيص والمميزات"
                                  >
                                    <Edit className="w-4.5 h-4.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTenant(tenant.id, tenant.name)}
                                    className="p-1.5 text-red-605 text-red-650 text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-colors cursor-pointer"
                                    title="حذف كلي وتدمير قاعدة البيانات"
                                  >
                                    <Trash2 className="w-4.5 h-4.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* C. DATABASES ISOLATION CONSOLE */}
          {activeTab === 'databases' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Dynamic Database Isolation warning explanation */}
              <div className="bg-[#091F2C] text-slate-200 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-sky-500/15 text-sky-400 rounded-2xl flex items-center justify-center border border-sky-500/20 shadow-inner">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">وحدة التحكم والمصادقة في عزل قواعد البيانات المعزولة (Isolated Nodes Console)</h3>
                    <p className="text-xs text-sky-300 font-medium mt-0.5">من هنا يمكنك تتبع استهلاك القرص لكل مدرس، شحن الحسابات ببيانات تجريبية للعميل، أو تصفير الحسابات تماماً.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
                  <div className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl space-y-1">
                    <span className="text-[10px] text-slate-400 font-black uppercase">عزل البيانات النشطة</span>
                    <p className="text-white font-bold font-sans">تخزين معزول بالمتصفح لكل معلّم</p>
                  </div>
                  <div className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl space-y-1">
                    <span className="text-[10px] text-slate-400 font-black uppercase">التصفير الفوري للأقراص</span>
                    <p className="text-white font-bold font-sans">تطهير كامل وإفراغ الذاكرة بضغطة زر</p>
                  </div>
                  <div className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl space-y-1">
                    <span className="text-[10px] text-slate-400 font-black uppercase">محاكاة الشحن</span>
                    <p className="text-white font-bold font-sans">حقن داتا تجريبية لتسهيل العرض للمشتركين</p>
                  </div>
                </div>
              </div>

              {/* Grid of Tenants and their actual DB sizes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tenants.map(tenant => {
                  const stats = databaseStats[tenant.id] || { studentsCount: 0, feesCount: 0, keysCount: 0, sizeBytes: 0 };
                  return (
                    <div key={tenant.id} className="bg-white rounded-3xl border border-gray-150 shadow-sm p-6 space-y-5 relative overflow-hidden">
                      {/* Active indicator */}
                      <span className={`absolute top-0 left-0 w-32 h-1 ${tenant.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />

                      <div className="flex justify-between items-start">
                        <div className="space-y-1 text-right">
                          <span className="text-[9px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full border border-gray-150 font-bold">
                            الاسم الحركي: {tenant.id}
                          </span>
                          <h4 className="font-extrabold text-slate-900 text-sm mt-1">{tenant.name}</h4>
                          <p className="text-[11px] text-[#0D5C8C] font-semibold">{tenant.appName || 'Fox System'}</p>
                        </div>

                        <div className="flex flex-col items-end text-left">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                            tenant.status === 'active' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-red-50 text-red-800 border border-red-100'
                          }`}>
                            {tenant.status === 'active' ? 'الترخيص نشط' : 'الترخيص موقوف'}
                          </span>
                        </div>
                      </div>

                      {/* DB metrics list */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-gray-150 grid grid-cols-2 gap-4 text-xs font-sans">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-slate-500 font-bold">
                            <Users className="w-3.5 h-3.5 text-blue-500" />
                            <span>عدد الطلاب:</span>
                          </div>
                          <p className="font-black text-slate-800 font-mono text-sm">{stats.studentsCount} طالب</p>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-slate-500 font-bold">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                            <span>عمليات تحصيل الرسوم:</span>
                          </div>
                          <p className="font-black text-slate-800 font-mono text-sm">{stats.feesCount} معاملة</p>
                        </div>

                        <div className="space-y-1 border-t border-gray-200/60 pt-2 col-span-2 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-bold">إجمالي جداول التخزين (Tables Key):</span>
                          <span className="font-mono font-black text-slate-700">{stats.keysCount} جدول معزول</span>
                        </div>

                        <div className="space-y-1 col-span-2 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-bold">حجم البيانات المستهلكة (Storage Size):</span>
                          <span className="font-mono font-black text-[#0D5C8C]">{(stats.sizeBytes / 1024).toFixed(2)} KB</span>
                        </div>
                      </div>

                      {/* Operation Control tools */}
                      <div className="flex gap-2 pt-2 border-t border-gray-100">
                        <button
                          onClick={() => handleWipeDatabase(tenant.id, tenant.name)}
                          className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-650 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition-transform active:scale-97 cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          تصفير قاعدة البيانات
                        </button>

                        <button
                          onClick={() => handleSeedMockData(tenant.id, tenant.name)}
                          className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-transform active:scale-97 cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          حقن داتا تجريبية كاملة
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* D. MOVEMENTS & AUDIT LOG MODULE */}
          {activeTab === 'movements' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-950">سجل التحركات والعمليات كلياً (Global Audit Trail)</h2>
                    <p className="text-xs text-slate-400 mt-0.5">تتبع أمني غير قابل للتزوير لقرارات المدير العام، إنشاء المشتركين، تعديل التراخيص، وتصفير مساحات القرص</p>
                  </div>

                  <button
                    onClick={handleClearLogs}
                    className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-150 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    مسح السجل المركزي
                  </button>
                </div>

                <div className="p-6 bg-[#091F2C] text-slate-300 font-mono text-xs">
                  <div className="flex items-center gap-2 text-amber-400 font-bold border-b border-slate-800 pb-3 mb-4">
                    <Terminal className="w-4 h-4" />
                    <span>سجل نظام الإرسال والتدقيق المركزي للمنصة &bull; Terminal Console Active</span>
                  </div>

                  <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                    {logs.length === 0 ? (
                      <p className="text-slate-500 text-center py-12 font-bold font-sans">لا توجد عمليات مسجلة في التاريخ المركزي حتى الآن.</p>
                    ) : (
                      logs.map((log, idx) => (
                        <div key={log.id} className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-slate-800/40 pb-3 gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500">[{logs.length - idx}]</span>
                              <span className="text-[#0D5C8C] font-black">@SERVER_SYS</span>
                              <span className="text-slate-500">&gt;&gt;</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                log.type === 'success' ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800/40' :
                                log.type === 'danger' ? 'bg-red-950/40 text-red-400 border border-red-800/40' :
                                log.type === 'warning' ? 'bg-amber-950/40 text-amber-400 border border-amber-800/40' :
                                'bg-sky-950/40 text-sky-400 border border-sky-800/40'
                              }`}>
                                {log.action}
                              </span>
                            </div>
                            <p className="text-white text-xs pl-4 leading-relaxed font-sans mt-1.5">{log.details}</p>
                          </div>

                          <div className="text-left text-slate-500 text-[10px]">
                            {new Date(log.timestamp).toLocaleString('ar-EG')}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* E. BROADCAST SYSTEM ANNOUNCEMENTS */}
          {activeTab === 'broadcast' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-3xl border border-gray-150 shadow-sm p-6 space-y-6">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-950">بث الإشعارات والإعلانات العامة للمشتركين</h2>
                  <p className="text-xs text-slate-400 mt-0.5">يمكنك بث رسائل فورية تظهر لجميع المعلمين وسكرتاريتهم على لوحة التحكم الخاصة بهم بمجرد تصفحهم للسيستم.</p>
                </div>

                <form onSubmit={handleSendAnnouncement} className="space-y-4 max-w-2xl text-right">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-600">جهة الإرسال الموقعة:</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: الإدارة العامة لشركة Fox System أو الدعم الفني"
                      value={announcement.sender}
                      onChange={(e) => setAnnouncement({...announcement, sender: e.target.value})}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#0D5C8C] focus:bg-white font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-600">عنوان الإعلان العاجل: *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: تحديث أمني هام وتنبيه بصيانة دورية"
                      value={announcement.title}
                      onChange={(e) => setAnnouncement({...announcement, title: e.target.value})}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#0D5C8C] focus:bg-white font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-600">نص الرسالة والإشعار التفصيلي: *</label>
                    <textarea
                      required
                      rows={5}
                      placeholder="اكتب هنا كافة تفاصيل التحديث أو الصيانة أو التوجيهات المالية للمعلمين..."
                      value={announcement.message}
                      onChange={(e) => setAnnouncement({...announcement, message: e.target.value})}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#0D5C8C] focus:bg-white font-medium"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-600">الفئة المستهدفة بالبث الفوري:</span>
                    <select
                      value={announcement.target}
                      onChange={(e) => setAnnouncement({...announcement, target: e.target.value})}
                      className="bg-slate-50 border border-gray-200 px-3 py-1.5 rounded-xl text-xs font-bold outline-none"
                    >
                      <option value="all">كافة المعلمين والسكرتارية بالمنظومة</option>
                      <option value="active">المشتركين أصحاب التراخيص المفعلة فقط</option>
                    </select>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-[#0D5C8C] hover:bg-[#1A7FAA] text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      بث الإعلان العام فوراً
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* F. SECURITY SETTINGS & PASSWORD MODULE */}
          {activeTab === 'settings' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-3xl border border-gray-150 shadow-sm p-6 space-y-6">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-950">إعدادات أمان المالك (Super Admin Security)</h2>
                  <p className="text-xs text-slate-400 mt-0.5">من هنا يمكنك تحديث وتغيير باسورد الدخول الخاص بك كمدير عام بدلاً من الباسورد الحالي</p>
                </div>

                <form onSubmit={handleUpdateOwnerPassword} className="space-y-4 max-w-md text-right">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-500">رمز المرور المعتمد الحالي بالسيستم:</label>
                    <input
                      type="text"
                      disabled
                      value={ownerPassword}
                      className="w-full px-3.5 py-2.5 bg-slate-100 text-slate-500 border border-gray-200 rounded-xl text-xs outline-none font-bold text-center tracking-widest font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">رمز المرور الجديد للمدير العام: *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: 555"
                      value={newOwnerPassword}
                      onChange={(e) => setNewOwnerPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#0D5C8C] focus:bg-white font-black text-center tracking-widest font-mono"
                    />
                    <span className="text-[10px] text-amber-600 block mt-1 font-bold">⚠️ تذكر الباسورد جيداً لتتمكن من الدخول للمستقبل كمالك للسيستم.</span>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
                    >
                      <Key className="w-4 h-4 text-amber-400" />
                      ترقية وحفظ كلمة المرور الجديدة
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

        </div>
      </div>

      {/* 3. POPUP MODALS FOR ADD / EDIT TEACHERS */}

      {/* Add New Teacher Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50" dir="rtl">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center gap-3 border-b border-gray-150 p-4 shrink-0 bg-slate-50/50">
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-[#0D5C8C]">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-950">إضافة معلم جديد وتخصيص قاعدة بيانات</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">سيتم عزل قاعدة بياناته بالكامل فور الحفظ</p>
              </div>
            </div>

            <form onSubmit={handleAddTenant} className="flex-1 flex flex-col overflow-hidden">
              {/* Scrollable Body Content */}
              <div className="p-4 space-y-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-600">اسم المعلم الكامل: *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: أ. محمد عبدالهادي"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#0D5C8C] focus:bg-white font-semibold transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-600">رقم الهاتف:</label>
                    <input
                      type="text"
                      placeholder="مثال: 010xxxxxxxx"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#0D5C8C] focus:bg-white font-semibold font-mono transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-600">رمز المرور (الباسورد): *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: 999"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#0D5C8C] focus:bg-white font-bold text-center tracking-widest font-mono transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-600">تاريخ انتهاء الاشتراك: *</label>
                    <input
                      type="date"
                      required
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#0D5C8C] focus:bg-white font-bold text-center font-mono transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-600">سعر الباقة (ج.م):</label>
                    <input
                      type="number"
                      value={formData.pricePaid}
                      onChange={(e) => setFormData({...formData, pricePaid: Number(e.target.value)})}
                      className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#0D5C8C] focus:bg-white font-semibold font-mono transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-600">الحد الأقصى للطلاب: *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formData.maxStudents}
                      onChange={(e) => setFormData({...formData, maxStudents: Number(e.target.value)})}
                      className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#0D5C8C] focus:bg-white font-semibold font-mono transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-600">الحد الأقصى للسكرتارية: *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formData.maxSecretaries}
                      onChange={(e) => setFormData({...formData, maxSecretaries: Number(e.target.value)})}
                      className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#0D5C8C] focus:bg-white font-semibold font-mono transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex flex-wrap items-center gap-4 border-b border-gray-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-700">حالة التفعيل الفوري:</span>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                        className="bg-slate-50 border border-gray-200 px-3 py-1.5 rounded-xl text-xs outline-none font-bold"
                      >
                        <option value="active">نشط ومفعل</option>
                        <option value="suspended">موقوف معلق</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-700">بوابة الواتسآب السحابي (صامت):</span>
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, whatsappGatewayEnabled: !formData.whatsappGatewayEnabled})}
                        className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer focus:outline-hidden ${formData.whatsappGatewayEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      >
                        <span className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${formData.whatsappGatewayEnabled ? 'left-1' : 'left-6'}`} />
                      </button>
                      <span className={`text-[10px] font-bold ${formData.whatsappGatewayEnabled ? 'text-emerald-600' : 'text-slate-500'}`}>{formData.whatsappGatewayEnabled ? 'مفعلة' : 'معطلة'}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-200 border-b border-gray-100 dark:border-slate-850 pb-1.5">الخدمات والأقسام المفعلة لهذا المشترك:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                      {featuresList.map((feature) => {
                        const active = formData.features.includes(feature.id);
                        return (
                          <div
                            key={feature.id}
                            className={`p-2.5 rounded-2xl border text-right transition-all flex flex-col gap-2 ${
                              active 
                                ? 'bg-[#0D5C8C]/5 border-[#0D5C8C]/40 text-[#0D5C8C] dark:text-sky-400 shadow-xs dark:bg-sky-500/10 dark:border-sky-500/30' 
                                : 'bg-slate-50/50 border-gray-200 text-slate-500 dark:text-slate-300 hover:border-gray-300 dark:hover:border-slate-600'
                            }`}
                          >
                            <div 
                              onClick={() => toggleFeature(feature.id)}
                              className="flex items-center gap-2 cursor-pointer select-none"
                            >
                              <input
                                type="checkbox"
                                checked={active}
                                onChange={() => {}}
                                className="w-4 h-4 rounded border-gray-300 text-[#0D5C8C] dark:text-sky-400 focus:ring-[#0D5C8C] dark:focus:ring-sky-400 accent-[#0D5C8C] dark:accent-sky-500 cursor-pointer"
                              />
                              <span className="text-[11px] font-black leading-tight select-none">{feature.label}</span>
                            </div>

                            {active && feature.subFeatures && (
                              <div className="border-t border-[#0D5C8C]/15 dark:border-sky-500/15 pt-2 mt-1 space-y-1.5 animate-fadeIn">
                                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-400">تخصيص الصلاحيات الفرعية والوظائف:</p>
                                <div className="flex flex-col gap-1">
                                  {feature.subFeatures.map((sub) => {
                                    const subFullId = `${feature.id}:${sub.id}`;
                                    const isSubActive = formData.features.includes(subFullId);
                                    return (
                                      <div 
                                        key={sub.id}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleSubFeature(feature.id, sub.id);
                                        }}
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all cursor-pointer select-none ${
                                          isSubActive 
                                            ? 'bg-white dark:bg-slate-800 border-[#0D5C8C]/35 dark:border-sky-500/40 text-[#0D5C8C] dark:text-sky-400 font-bold' 
                                            : 'bg-white/40 dark:bg-slate-800/30 border-gray-150 dark:border-slate-700/50 text-slate-400 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/40'
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isSubActive}
                                          onChange={() => {}}
                                          className="w-3.5 h-3.5 rounded border-gray-300 text-[#0D5C8C] dark:text-sky-400 focus:ring-[#0D5C8C] dark:focus:ring-sky-400 accent-[#0D5C8C] dark:accent-sky-500 cursor-pointer"
                                        />
                                        <span className="text-[10px] font-bold leading-none select-none">{sub.label}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pinned Footer */}
              <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-150 bg-slate-50/50 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-250 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  إلغاء التراجع
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0D5C8C] hover:bg-[#1A7FAA] text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-colors"
                >
                  حفظ وتسجيل المعلم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {showEditModal && selectedTenant && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50" dir="rtl">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center gap-3 border-b border-gray-150 p-4 shrink-0 bg-slate-50/50">
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-[#0D5C8C]">
                <Edit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-950">تحديث تراخيص وصلاحيات المعلم</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">الاسم: {selectedTenant.name}</p>
              </div>
            </div>

            <form onSubmit={handleEditTenant} className="flex-1 flex flex-col overflow-hidden">
              {/* Scrollable Body Content */}
              <div className="p-4 space-y-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-600">اسم المعلم الكامل: *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#0D5C8C] focus:bg-white font-semibold transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-600">رقم الهاتف:</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#0D5C8C] focus:bg-white font-semibold font-mono transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-600">رمز الدخول (باسورد): *</label>
                    <input
                      type="text"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#0D5C8C] focus:bg-white font-bold text-center tracking-widest font-mono transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-600">تاريخ انتهاء الاشتراك: *</label>
                    <input
                      type="date"
                      required
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#0D5C8C] focus:bg-white font-bold text-center font-mono transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-600">سعر الترخيص والتجديد (ج.م):</label>
                    <input
                      type="number"
                      value={formData.pricePaid}
                      onChange={(e) => setFormData({...formData, pricePaid: Number(e.target.value)})}
                      className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#0D5C8C] focus:bg-white font-semibold font-mono transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-600">الحد الأقصى للطلاب: *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formData.maxStudents}
                      onChange={(e) => setFormData({...formData, maxStudents: Number(e.target.value)})}
                      className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#0D5C8C] focus:bg-white font-semibold font-mono transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-600">الحد الأقصى للسكرتارية: *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formData.maxSecretaries}
                      onChange={(e) => setFormData({...formData, maxSecretaries: Number(e.target.value)})}
                      className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#0D5C8C] focus:bg-white font-semibold font-mono transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex flex-wrap items-center gap-4 border-b border-gray-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-700">حالة الاشتراك:</span>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                        className="bg-slate-50 border border-gray-200 px-3 py-1.5 rounded-xl text-xs outline-none font-bold"
                      >
                        <option value="active">نشط وصالح</option>
                        <option value="suspended">موقوف معلق</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-700">بوابة الواتسآب السحابي (صامت):</span>
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, whatsappGatewayEnabled: !formData.whatsappGatewayEnabled})}
                        className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer focus:outline-hidden ${formData.whatsappGatewayEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      >
                        <span className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${formData.whatsappGatewayEnabled ? 'left-1' : 'left-6'}`} />
                      </button>
                      <span className={`text-[10px] font-bold ${formData.whatsappGatewayEnabled ? 'text-emerald-600' : 'text-slate-500'}`}>{formData.whatsappGatewayEnabled ? 'مفعلة' : 'معطلة'}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-200 border-b border-gray-100 dark:border-slate-850 pb-1.5">الخدمات والأقسام المتاحة:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                      {featuresList.map((feature) => {
                        const active = formData.features.includes(feature.id);
                        return (
                          <div
                            key={feature.id}
                            className={`p-2.5 rounded-2xl border text-right transition-all flex flex-col gap-2 ${
                              active 
                                ? 'bg-[#0D5C8C]/5 border-[#0D5C8C]/40 text-[#0D5C8C] dark:text-sky-400 shadow-xs dark:bg-sky-500/10 dark:border-sky-500/30' 
                                : 'bg-slate-50/50 border-gray-200 text-slate-500 dark:text-slate-300 hover:border-gray-300 dark:hover:border-slate-600'
                            }`}
                          >
                            <div 
                              onClick={() => toggleFeature(feature.id)}
                              className="flex items-center gap-2 cursor-pointer select-none"
                            >
                              <input
                                type="checkbox"
                                checked={active}
                                onChange={() => {}}
                                className="w-4 h-4 rounded border-gray-300 text-[#0D5C8C] dark:text-sky-400 focus:ring-[#0D5C8C] dark:focus:ring-sky-400 accent-[#0D5C8C] dark:accent-sky-500 cursor-pointer"
                              />
                              <span className="text-[11px] font-black leading-tight select-none">{feature.label}</span>
                            </div>

                            {active && feature.subFeatures && (
                              <div className="border-t border-[#0D5C8C]/15 dark:border-sky-500/15 pt-2 mt-1 space-y-1.5 animate-fadeIn">
                                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-400">تخصيص الصلاحيات الفرعية والوظائف:</p>
                                <div className="flex flex-col gap-1">
                                  {feature.subFeatures.map((sub) => {
                                    const subFullId = `${feature.id}:${sub.id}`;
                                    const isSubActive = formData.features.includes(subFullId);
                                    return (
                                      <div 
                                        key={sub.id}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleSubFeature(feature.id, sub.id);
                                        }}
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all cursor-pointer select-none ${
                                          isSubActive 
                                            ? 'bg-white dark:bg-slate-800 border-[#0D5C8C]/35 dark:border-sky-500/40 text-[#0D5C8C] dark:text-sky-400 font-bold' 
                                            : 'bg-white/40 dark:bg-slate-800/30 border-gray-150 dark:border-slate-700/50 text-slate-400 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/40'
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isSubActive}
                                          onChange={() => {}}
                                          className="w-3.5 h-3.5 rounded border-gray-300 text-[#0D5C8C] dark:text-sky-400 focus:ring-[#0D5C8C] dark:focus:ring-sky-400 accent-[#0D5C8C] dark:accent-sky-500 cursor-pointer"
                                        />
                                        <span className="text-[10px] font-bold leading-none select-none">{sub.label}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pinned Footer */}
              <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-150 bg-slate-50/50 shrink-0">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setSelectedTenant(null); }}
                  className="px-4 py-2 border border-gray-250 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  إلغاء التراجع
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0D5C8C] hover:bg-[#1A7FAA] text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-colors"
                >
                  تحديث البيانات والتراخيص
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
