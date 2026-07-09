import { db } from './lib/firebase';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  LayoutDashboard,
  Users,
  GraduationCap,
  Calendar,
  BookOpen,
  DollarSign,
  Megaphone,
  Key,
  Database,
  Bot,
  UserCheck,
  Award,
  Clock,
  Printer,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  LogOut,
  Star,
  SearchX,
  PanelRightClose,
  PanelRightOpen,
  AlertCircle,
} from 'lucide-react';

// Import local components
import Dashboard from './components/Dashboard';
import StudentsList from './components/StudentsList';
import ParentsList from './components/ParentsList';
import BooksManager from './components/BooksManager';
import ClassesManager from './components/ClassesManager';
import AttendanceTracker from './components/AttendanceTracker';
import SalariesManager from "./components/SalariesManager";
import FeesTracker from './components/FeesTracker';
import NotificationsCenter from './components/NotificationsCenter';
import SystemRoles from './components/SystemRoles';
import SystemAuditLogs from './components/SystemAuditLogs';
import LoginScreen from './components/LoginScreen';
import StudentExamPortal from './components/StudentExamPortal';
import SettingsManager from './components/SettingsManager';
import StudentBarcodes from './components/StudentBarcodes';
import ExamsAndAssignments from './components/ExamsAndAssignments';
import PrivacyPolicy from './components/PrivacyPolicy';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import AnnouncementsManager from './components/AnnouncementsManager';
import { Settings, Search, ShieldCheck } from 'lucide-react';
import { AdminNotification } from './types';
import { Bell, CheckCheck, Trash2, Sun, Moon } from 'lucide-react';

import { motion, AnimatePresence } from 'motion/react';

import { samsDb, getTenantSetting, saveToStorage } from './utils/db';
import { subscribeToTenants } from './lib/tenantsApi';

type TabType = 'dashboard' | 'students' | 'parents' | 'barcodes' | 'classes' | 'attendance' | 'fees' | 'notifications' | 'roles' | 'audit' | 'settings' | 'exams' | 'salaries' | 'privacy' | 'books' | 'announcements';

export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('exam_id')) {
    return <StudentExamPortal />;
  }

  // Initial loading states
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('جاري تهيئة النظام الأكاديمي...');

  useEffect(() => {
    // Step-by-step progress simulation with realistic texts
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsInitialLoading(false);
          }, 600); // premium delay after 100% for a polished fluid exit
          return 100;
        }
        
        // Get the current custom app name if defined, else use default
        let sysName = 'Fox System';
        if (localStorage.getItem('sams_current_tenant_id') === 'super-admin') {
          sysName = 'إدارة Fox System المركزية';
        } else {
          const tId = localStorage.getItem('sams_current_tenant_id');
          const raw = localStorage.getItem(tId && tId !== 'default' ? `${tId}_sams_custom_app_name_v2` : 'sams_custom_app_name_v2');
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (typeof parsed === 'string') sysName = parsed;
              else sysName = raw;
            } catch (e) {
              sysName = raw;
            }
          }
        }

        // Random fluid progress increment
        const nextProgress = prev + Math.floor(Math.random() * 12) + 4;
        const boundedProgress = Math.min(nextProgress, 100);
        
        if (boundedProgress < 25) {
          setLoadingText(`تأمين بوابة ${sysName}...`);
        } else if (boundedProgress < 50) {
          setLoadingText('جاري تحميل سجلات الطلاب وقاعدة البيانات الإدارية...');
        } else if (boundedProgress < 75) {
          setLoadingText('تهيئة لوحة التحكم الذكية وفهرس الحصص...');
        } else if (boundedProgress < 95) {
          setLoadingText('مزامنة الحسابات وتوزيع الصلاحيات اليومية...');
        } else {
          setLoadingText(`مكتمل! مرحباً بك في ${sysName}...`);
        }
        
        return boundedProgress;
      });
    }, 120);

    return () => clearInterval(interval);
  }, []);

  // Session states
  const [currentUserRole, setCurrentUserRole] = useState<'teacher' | 'secretary' | 'super_admin' | null>(
    (localStorage.getItem('sams_logged_in_role') as any) || null
  );
  const [currentUserId, setCurrentUserId] = useState<string | null>(
    localStorage.getItem('sams_logged_in_id') || null
  );
  const [currentUserName, setCurrentUserName] = useState(() => {
    const stored = localStorage.getItem('sams_logged_in_name') || '';
    if (stored === 'د. أحمد كمال' || stored === 'أحمد كمال' || stored === 'د أحمد كمال' || stored === 'الدكتور في اللغة العربية') {
      localStorage.setItem('sams_logged_in_name', 'إدارة Fox System');
      return 'إدارة Fox System';
    }
    return stored;
  });

  // Customized Branding state
  const [customAppName, setCustomAppName] = useState(() => getTenantSetting('sams_custom_app_name_v2', 'Fox System'));
  const [customAppLogo, setCustomAppLogo] = useState(() => getTenantSetting('sams_custom_app_logo_v2', 'F'));
  const [customHeaderTitle, setCustomHeaderTitle] = useState(() => getTenantSetting('sams_custom_header_title_v2', 'المنصة التعليمية المتكاملة'));
  const [customHeaderSubtitle, setCustomHeaderSubtitle] = useState(() => getTenantSetting('sams_custom_header_subtitle_v2', 'بوابة التحكم الإدارية والحصص الأكاديمية'));

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showSuspendedModal, setShowSuspendedModal] = useState(false);

  useEffect(() => {
    if (!currentUserRole || currentUserRole === 'super_admin') return;

    const tenantId = localStorage.getItem('sams_current_tenant_id');
    if (!tenantId || tenantId === 'default') return;

    const unsubscribe = subscribeToTenants((tenants) => {
      const currentTenant = tenants.find(t => t.id === tenantId);
      if (currentTenant && currentTenant.status === 'suspended') {
        setShowSuspendedModal(true);
      }
    });

    return () => unsubscribe();
  }, [currentUserRole]);


  // Global Realtime Sync
  useEffect(() => {
    if (!currentUserRole || currentUserRole === 'super_admin') return;

    const tenantId = localStorage.getItem('sams_current_tenant_id');
    if (!tenantId || tenantId === 'default') return;

    const q = query(
      collection(db, 'system_tenant_data'),
      where('tenantId', '==', tenantId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
       let changed = false;
       snapshot.docs.forEach(docSnap => {
          const remoteData = docSnap.data().data;
          const docKey = docSnap.id;
          const localData = localStorage.getItem(docKey);
          if (remoteData && remoteData !== localData) {
              localStorage.setItem(docKey, remoteData);
              changed = true;
          }
       });
       if (changed) {
          window.dispatchEvent(new Event('sams_data_changed'));
       }
    });

    return () => unsubscribe();
  }, [currentUserRole]);

  // Auto-logout effect when suspended
  useEffect(() => {
    if (showSuspendedModal) {
      const timer = setTimeout(() => {
        handleLogout();
        setShowSuspendedModal(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuspendedModal]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [adminNotis, setAdminNotis] = useState<AdminNotification[]>([]);
  const [showNotiDropdown, setShowNotiDropdown] = useState(false);

  const notiDropdownRef = React.useRef<HTMLDivElement>(null);

  // Dark mode states
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('sams_dark_mode') === 'true';
  });

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('sams_dark_mode', String(next));
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notiDropdownRef.current && !notiDropdownRef.current.contains(event.target as Node)) {
        setShowNotiDropdown(false);
      }
    }
    
    if (showNotiDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotiDropdown]);


  useEffect(() => {
    // FIX MIGRATION: Update old notifications
    let notisData = samsDb.getAdminNotifications();
    let updatedNotis = false;
    notisData = notisData.map(n => {
      if (n.message && n.message.includes('سجلت السكرتيرة (مستخدم النظام)')) {
        n.message = n.message.replace('سجلت السكرتيرة (مستخدم النظام)', 'سجلت الإدارة (المدير الأكاديمي)');
        updatedNotis = true;
      }
      return n;
    });
    if (updatedNotis) {
      saveToStorage('sams_admin_notifications', notisData);
    }

    // Load initially
    setAdminNotis(samsDb.getAdminNotifications());

    // Check payment reminders
    const checkPaymentReminders = () => {
      const students = samsDb.getStudents().filter(s => s.status === 'active');
      const notifications = samsDb.getAdminNotifications();
      const today = new Date();
      let addedNew = false;
      
      students.forEach(student => {
        if (!student.created_at) return;
        
        let dueDate = new Date(student.created_at);
        // Advance to next due date
        while (dueDate <= today) {
           dueDate.setMonth(dueDate.getMonth() + 1);
        }
        
        const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
        
        if (diffDays <= 5 && diffDays >= 0) {
          const reminderId = `payment-${student.id}-${dueDate.toISOString().split('T')[0]}`;
          const exists = notifications.some(n => n.metadata?.reminderId === reminderId);
          
          if (!exists) {
            samsDb.addAdminNotification({
              type: 'payment_reminder',
              message: `تذكير: اقترب موعد سداد اشتراك الطالب/ة (${student.name}). متبقي ${diffDays} يوم (تاريخ الاستحقاق: ${dueDate.toISOString().split('T')[0]}).`,
              metadata: { student_id: student.id, reminderId }
            });
            addedNew = true;
          }
        }
      });
      
      if (addedNew) {
        setAdminNotis(samsDb.getAdminNotifications());
      }
    };
    
    checkPaymentReminders();
    
    // Real-time notifications update
    const updateNotis = () => {
      setAdminNotis(samsDb.getAdminNotifications());
    };
    
    window.addEventListener('sams_admin_notifications_changed', updateNotis);
    
    const handleStorage = (e) => {
      if (e.key === 'sams_admin_notifications') {
        updateNotis();
      }
    };
    window.addEventListener('storage', handleStorage);
    
    // Fallback poll just in case
    const interval = setInterval(updateNotis, 30000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('sams_admin_notifications_changed', updateNotis);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);
  
  const handleMarkNotiRead = (id: string) => {
    samsDb.markAdminNotificationRead(id);
    setAdminNotis(samsDb.getAdminNotifications());
  };
  
  const handleMarkAllRead = () => {
    samsDb.markAllAdminNotificationsRead();
    setAdminNotis(samsDb.getAdminNotifications());
  };
  
  const displayedNotis = adminNotis.filter(n => {
    // Hide administrative logs from secretary
    if (currentUserRole === 'secretary' && n.message && n.message.includes('سجلت الإدارة')) {
      return false;
    }
    // Filter system notifications based on specified target audience
    if (n.type === 'system' && n.metadata?.recipient_type) {
      const recType = n.metadata.recipient_type;
      if (recType === 'teachers' && currentUserRole !== 'teacher') {
        return false;
      }
      if (recType === 'specific' && n.metadata?.recipient_id && n.metadata.recipient_id !== currentUserId) {
        return false;
      }
    }
    return true;
  });

  const unreadNotisCount = displayedNotis.filter(n => !n.read).length;

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // List matching students and teachers
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { students: [], teachers: [] };
    const cleanQuery = searchQuery.trim().toLowerCase();
    
    const studentsRes = samsDb.getStudents().filter(s => 
      (s.name && s.name.toLowerCase().includes(cleanQuery)) ||
      (s.registration_id && s.registration_id.toLowerCase().includes(cleanQuery)) ||
      (s.phone && s.phone.toLowerCase().includes(cleanQuery)) ||
      (s.parent_name && s.parent_name.toLowerCase().includes(cleanQuery)) ||
      (s.parent_phone && s.parent_phone.toLowerCase().includes(cleanQuery)) ||
      (s.national_id && s.national_id.includes(cleanQuery)) ||
      (s.barcode && s.barcode.toLowerCase().includes(cleanQuery))
    ).slice(0, 5);

    const teachersRes = samsDb.getTeachers().filter(t => 
      (t.name && t.name.toLowerCase().includes(cleanQuery)) ||
      (t.specialization && t.specialization.toLowerCase().includes(cleanQuery)) ||
      (t.phone && t.phone.toLowerCase().includes(cleanQuery)) ||
      (t.national_id && t.national_id.includes(cleanQuery))
    ).slice(0, 3);

    return { students: studentsRes, teachers: teachersRes };
  }, [searchQuery, refreshTrigger]);

  const forceRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleSettingsSaved = () => {
    setCustomAppName(getTenantSetting('sams_custom_app_name_v2', 'Fox System'));
    setCustomAppLogo(getTenantSetting('sams_custom_app_logo_v2', 'F'));
    setCustomHeaderTitle(getTenantSetting('sams_custom_header_title_v2', 'المنصة التعليمية المتكاملة'));
    setCustomHeaderSubtitle(getTenantSetting('sams_custom_header_subtitle_v2', 'بوابة التحكم الإدارية والحصص الأكاديمية'));
    forceRefresh();
  };

  const handleLogout = () => {
    localStorage.removeItem('sams_logged_in_role');
    localStorage.removeItem('sams_logged_in_name');
    localStorage.removeItem('sams_logged_in_id');
    localStorage.setItem('sams_current_tenant_id', 'default');
    
    // Reset state to default
    setCurrentUserRole(null);
    setCurrentUserName('');
    setCurrentUserId(null);

    // Reset local custom names to defaults
    setCustomAppName('Fox System');
    setCustomAppLogo('F');
    setCustomHeaderTitle('المنصة التعليمية المتكاملة');
    setCustomHeaderSubtitle('بوابة التحكم الإدارية والحصص الأكاديمية');
  };

  const [openNavGroups, setOpenNavGroups] = useState<string[]>([]);

  const currentRole = samsDb.getCurrentRole();
  const getRoleBadge = (role: string) => {
    if (currentUserRole === 'secretary') {
      return { name: 'سكرتيرة الإدارة', style: 'bg-sky-50 text-sky-800 border border-sky-200 font-bold' };
    }
    return {
      admin: { name: 'مدير النظام الأعلى', style: 'bg-red-50 text-[#C0152A] border border-[#E8192C]/20' },
      principal: { name: 'مدير السنتر', style: 'bg-[#0D5C8C]/10 text-[#0D5C8C] border border-[#1A7FAA]/20' },
      teacher: { name: 'الإدارة الأكاديمية (مسؤول)', style: 'bg-amber-50 text-amber-805 text-amber-800 border border-amber-200' },
      parent: { name: 'ولي الأمر', style: 'bg-indigo-50 text-indigo-800 border border-indigo-200' },
      student: { name: 'طالب مقيد', style: 'bg-emerald-50 text-emerald-800 border border-emerald-200' }
    }[role] || { name: 'زائر', style: 'bg-gray-50 text-gray-700' };
  };

  const navCategories = [
    { id: 'dashboard', label: 'لوحة التحكم والمؤشرات', icon: <LayoutDashboard className="w-4 h-4" />, roles: ['teacher'] },
    {
      id: 'students_group',
      label: 'شؤون الطلاب',
      icon: <GraduationCap className="w-4 h-4" />,
      roles: ['teacher', 'secretary'],
      subItems: [
        { id: 'students', label: 'إدارة الطلاب والقبول', roles: ['teacher', 'secretary'] },
        { id: 'parents', label: 'إدارة أولياء الأمور', roles: ['teacher', 'secretary'] },
        { id: 'barcodes', label: 'باركود الطلاب', roles: ['teacher', 'secretary'] },
        { id: 'attendance', label: 'الحضور والانتظام اليومي', roles: ['teacher', 'secretary'] },
        { id: 'exams', label: 'الامتحانات والواجبات', roles: ['teacher', 'secretary'] },
        { id: 'books', label: 'المذكرات والملازم', roles: ['teacher', 'secretary'] },
      ]
    },
    {
      id: 'classes_group',
      label: 'المجموعات والحصص',
      icon: <BookOpen className="w-4 h-4" />,
      roles: ['teacher'],
      subItems: [
        { id: 'classes', label: 'المجموعات والجدول والمقررات', roles: ['teacher'] },
      ]
    },
    {
      id: 'finance_group',
      label: 'الحسابات والتواصل',
      icon: <DollarSign className="w-4 h-4" />,
      roles: ['teacher', 'secretary'],
      subItems: [
        { id: 'salaries', label: 'المرتبات والمصروفات', roles: ['teacher'] },
        { id: 'fees', label: 'اشتراكات الشهر والحسابات', roles: ['teacher', 'secretary'] },
        { id: 'notifications', label: 'بث الرسائل وتواصل الآباء', roles: ['teacher', 'secretary'] },
        { id: 'announcements', label: 'الإعلانات واللوحات الجدارية', roles: ['teacher', 'secretary'] },
      ]
    },
    {
      id: 'management_group',
      label: 'الإدارة والصلاحيات',
      icon: <Users className="w-4 h-4" />,
      roles: ['teacher'],
      subItems: [
        { id: 'roles', label: 'الصلاحيات وتدقيق الأمان', roles: ['teacher'] },
        { id: 'audit', label: 'سجل المعاملات الحية', roles: ['teacher'] },
      ]
    },
    { id: 'privacy', label: 'سياسة الخصوصية', icon: <ShieldCheck className="w-4 h-4" />, roles: ['teacher', 'secretary'] },
    { id: 'settings', label: 'إعدادات السنتر', icon: <Settings className="w-4 h-4" />, roles: ['teacher'] }
  ];

  // Flat list for checking permissions
  const fullNavItems = navCategories.reduce((acc, cat) => {
    if (cat.subItems) {
      return [...acc, ...cat.subItems];
    }
    return [...acc, cat];
  }, [] as any[]);

  const allowedNavItems = useMemo(() => {
    let baseItems = [];
    let users: any[] = [];
    try {
      const saved = localStorage.getItem('sams_system_users');
      if (saved) users = JSON.parse(saved);
    } catch (e) {}
    
    const user = users.find(u => u.id === currentUserId);
    if (user && user.permissions && user.permissions.length > 0) {
      const perms = [...user.permissions, 'books', 'announcements'];
      baseItems = fullNavItems.filter(item => perms.includes(item.id));
    } else {
      baseItems = fullNavItems.filter(item => item.roles.includes(currentUserRole || 'teacher'));
    }
    
    // المدرس المشترك في السيستم (المالك) هو الوحيد اللي بيظهرله الإعدادات
    if (user) {
      baseItems = baseItems.filter(item => item.id !== 'settings');
    }

    // Tenant custom feature mask filter
    const tenantId = localStorage.getItem('sams_current_tenant_id');
    if (tenantId && tenantId !== 'super-admin' && tenantId !== 'default') {
      try {
        const savedTenants = localStorage.getItem('sams_system_tenants');
        if (savedTenants) {
          const tenants = JSON.parse(savedTenants);
          const currentTenant = tenants.find((t: any) => t.id === tenantId);
          if (currentTenant && currentTenant.features) {
            const allowedIds = [...currentTenant.features, 'privacy', 'books', 'settings'];
            return baseItems.filter(item => allowedIds.includes(item.id));
          }
        }
      } catch (e) {}
    }

    return baseItems;
  }, [currentUserId, currentUserRole, fullNavItems]);

  const toggleNavGroup = (groupId: string) => {
    setOpenNavGroups(prev => 
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  // Security tab guard for Secretary role
  const currentTabAllowed = allowedNavItems.some(item => item.id === activeTab);
  if (!currentTabAllowed && allowedNavItems.length > 0) {
    setActiveTab(allowedNavItems[0].id as TabType);
  }

  // If initial loading screen is active, render the premium loader
  if (isInitialLoading) {
    return (
      <div className="fixed inset-0 bg-[#0B3047] bg-gradient-to-b from-[#06243A] via-[#0A3D5C] to-[#0D5C8C] flex flex-col items-center justify-center p-6 z-[9999] font-sans overflow-hidden select-none" dir="rtl">
        {/* Ambient glow backgrounds */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full animate-fade-in">
          {/* Logo Brand Animation */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#1A7FAA] to-[#F5C453] rounded-full blur-xl opacity-40 animate-pulse" />
            <div className="relative w-24 h-24 bg-gradient-to-tr from-[#1A7FAA] to-[#F5C453] rounded-full flex items-center justify-center shadow-2xl text-white ring-4 ring-white/10 hover:scale-105 transition-transform duration-300">
              <GraduationCap className="w-12 h-12 text-white stroke-[1.5]" />
            </div>
            {/* Tiny stylized orbital star pins */}
            <div className="absolute -top-1 -right-1 text-amber-300 animate-ping text-lg font-bold">
              <Star className="w-4 h-4 fill-current" />
            </div>
            <div className="absolute -bottom-1 -left-1 text-sky-300 animate-pulse text-lg font-bold">
              <Star className="w-4 h-4 fill-current" />
            </div>
          </div>

          {/* Luxury Typography */}
          <h1 className="text-3xl font-extrabold text-white tracking-wide drop-shadow-md">{customAppName}</h1>
          <p className="text-sm font-bold text-[#FCF6BA] mt-2 px-4 py-1.5 bg-white/10 rounded-full select-none tracking-wider shadow-inner">
            لإدارة السناتر التعليمية والطلاب
          </p>

          {/* Premium Loading Progress Panel */}
          <div className="mt-12 w-full px-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-sky-100/90 tracking-wide font-sans">{loadingText}</span>
              <span className="text-xs font-bold text-amber-300 font-mono tracking-wider">{loadingProgress}%</span>
            </div>
            
            {/* Smooth linear progress bar */}
            <div className="w-full h-2.5 bg-slate-950/45 rounded-full p-0.5 overflow-hidden border border-white/5 shadow-inner">
              <div 
                className="h-full bg-gradient-to-l from-[#1A7FAA] via-[#F5C453] to-[#E2A62C] rounded-full transition-all duration-300 relative"
                style={{ width: `${loadingProgress}%` }}
              >
                {/* Gloss high-end shine reflect */}
                <span className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full" />
              </div>
            </div>
          </div>
          
          {/* Minimal professional metadata info */}
          <div className="mt-16 text-[9.5px] font-bold tracking-widest text-sky-200/50 uppercase flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>نظام الإدارة التعليمية الأكاديمي v2.5</span>
          </div>
        </div>
      </div>
    );
  }

  // If not logged in, force LoginScreen immediately
  if (!currentUserRole) {
    return (
      <LoginScreen
        onLoginSuccess={(role, name, userId) => {
          if (userId) localStorage.setItem('sams_logged_in_id', userId);
          setCurrentUserId(userId || null);
          localStorage.setItem('sams_logged_in_role', role);
          localStorage.setItem('sams_logged_in_name', name);
          if (role === 'teacher') {
            samsDb.setCurrentRole('principal'); // full admin
          } else if (role === 'super_admin') {
            // super admin role
          } else {
            samsDb.setCurrentRole('teacher'); // restricted admin
          }
          setCurrentUserRole(role);
          setCurrentUserName(name);
          if (role === 'secretary') {
            setActiveTab('attendance');
          } else {
            setActiveTab('dashboard');
          }
          // Dynamic brand update upon successful login
          setCustomAppName(getTenantSetting('sams_custom_app_name_v2', 'Fox System'));
          setCustomAppLogo(getTenantSetting('sams_custom_app_logo_v2', 'F'));
          setCustomHeaderTitle(getTenantSetting('sams_custom_header_title_v2', 'المنصة التعليمية المتكاملة'));
          setCustomHeaderSubtitle(getTenantSetting('sams_custom_header_subtitle_v2', 'بوابة التحكم الإدارية والحصص الأكاديمية'));
        }}
      />
    );
  }

  // If logged in as Super Admin, show the central Tenant Management portal directly
  if (currentUserRole === 'super_admin') {
    return (
      <SuperAdminDashboard 
        onLogout={handleLogout} 
      />
    );
  }

  return (
    <div className="h-screen bg-[#F4F6F8] text-[#1A1A2E] flex overflow-hidden font-sans theme-transition" dir="rtl">
      
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-45 lg:hidden animate-fade-in"
        />
      )}

      {/* Navigation Sidebar (RTL: right side) */}
      <aside className={`
        fixed lg:static inset-y-0 right-0 bg-[#0D5C8C] text-white flex flex-col p-0 shadow-lg z-50 lg:z-auto transition-all duration-300 border-l border-[#1A7FAA]/20 shrink-0 h-full overflow-y-auto no-scrollbar
        ${mobileMenuOpen ? 'translate-x-0 w-64' : 'translate-x-full lg:translate-x-0'}
        ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}
      `}>
        
        {/* Logo Brand Header */}
        <div className={`py-5 px-4 border-b border-[#1A7FAA]/30 shrink-0 select-none bg-[#0a4d75] flex flex-col items-center justify-center text-center w-full transition-all duration-300 ${isSidebarCollapsed ? 'hidden' : 'flex'}`}>
          <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center shadow-lg text-white mb-3 ring-4 ring-white/10 overflow-hidden">
            {customAppLogo && customAppLogo.length > 5 ? (
              <img src={customAppLogo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-[#1A7FAA] to-[#F5C453] flex items-center justify-center">
                <GraduationCap className="w-8 h-8 text-white stroke-[1.5]" />
              </div>
            )}
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-wide">{customAppName}</h1>
          <p className="text-xs font-semibold text-[#FCF6BA] mt-1.5 px-3 py-1 bg-white/10 rounded-full select-none">لادارة السناتر التعليمية</p>
        </div>

        {isSidebarCollapsed && (
          <div className="py-5 px-2 border-b border-[#1A7FAA]/30 shrink-0 select-none bg-[#0a4d75] flex flex-col items-center justify-center text-center w-full transition-all duration-300">
             <div className="w-10 h-10 bg-gradient-to-tr from-[#1A7FAA] to-[#F5C453] rounded-full flex items-center justify-center shadow-lg text-white ring-2 ring-white/10">
              <GraduationCap className="w-5 h-5 text-white stroke-[1.5]" />
            </div>
          </div>
        )}

        {/* Mobile close button inside sidebar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#1A7FAA]/20 lg:hidden font-sans border-b border-[#1A7FAA]/30 shrink-0">
          <span className="font-bold text-[11px] text-blue-100">القائمة الأساسية</span>
          <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-blue-100 hover:text-white cursor-pointer">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-2 overflow-y-auto no-scrollbar">
          {navCategories.map((category) => {
            if (!category.roles.includes(currentUserRole || 'teacher')) return null;

            if (category.subItems) {
              const isOpen = openNavGroups.includes(category.id);
              const allowedSubItems = category.subItems.filter(sub => 
                sub.roles.includes(currentUserRole || 'teacher') &&
                allowedNavItems.some(allowed => allowed.id === sub.id)
              );
              if (allowedSubItems.length === 0) return null;

              const isAnyChildActive = allowedSubItems.some(sub => activeTab === sub.id);

              return (
                <div key={category.id} className="space-y-1">
                  <button
                    onClick={() => {
                      if (isSidebarCollapsed) {
                        setIsSidebarCollapsed(false);
                        if (!openNavGroups.includes(category.id)) {
                          toggleNavGroup(category.id);
                        }
                      } else {
                        toggleNavGroup(category.id);
                      }
                    }}
                    className={`w-full text-right ${isSidebarCollapsed ? 'px-0 justify-center py-3' : 'px-4 py-2.5'} text-xs rounded-xl font-bold flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} transition-all cursor-pointer ${
                      isAnyChildActive && !isOpen
                        ? 'bg-[#1A7FAA]/30 text-white'
                        : 'text-blue-100 hover:bg-[#1A7FAA]/20 hover:text-white'
                    }`}
                    title={isSidebarCollapsed ? category.label : undefined}
                  >
                    <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
                      <span className={`text-sm shrink-0 ${isAnyChildActive ? 'text-amber-300' : ''}`}>{category.icon}</span>
                      {!isSidebarCollapsed && <span>{category.label}</span>}
                    </div>
                    {!isSidebarCollapsed && (isOpen ? <ChevronUp className="w-3.5 h-3.5 opacity-60" /> : <ChevronDown className="w-3.5 h-3.5 opacity-60" />)}
                  </button>
                  
                  {isOpen && !isSidebarCollapsed && (
                    <div className="pl-4 pr-11 space-y-1 animate-fade-in mt-1">
                      {allowedSubItems.map(subItem => {
                        const isActive = activeTab === subItem.id;
                        return (
                          <button
                            key={subItem.id}
                            onClick={() => {
                              setActiveTab(subItem.id as TabType);
                              setMobileMenuOpen(false);
                            }}
                            className={`w-full text-right px-3 py-2 text-[11px] rounded-lg font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                              isActive
                                ? 'bg-[#1A7FAA] text-white shadow-xs'
                                : 'text-blue-200 hover:bg-[#1A7FAA]/40 hover:text-white'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-amber-300' : 'bg-blue-400'}`} />
                            {subItem.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Standalone category item
            const isAllowedStandalone = allowedNavItems.some(allowed => allowed.id === category.id);
            if (!isAllowedStandalone) return null;

            const isActive = activeTab === category.id;
            return (
              <button
                key={category.id}
                onClick={() => {
                  setActiveTab(category.id as TabType);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-right ${isSidebarCollapsed ? 'px-0 justify-center py-3' : 'px-4 py-3'} text-xs rounded-xl font-bold flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#1A7FAA] text-white shadow-xs'
                    : 'text-blue-100 hover:bg-[#1A7FAA]/50 hover:text-white'
                }`}
                title={isSidebarCollapsed ? category.label : undefined}
              >
                <span className={`text-sm shrink-0 ${isActive ? 'text-amber-300' : ''}`}>{category.icon}</span>
                {!isSidebarCollapsed && <span>{category.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Sidebar bottom status block - streamlined to maximize space */}
        <div className={`p-4 border-t border-[#1A7FAA]/40 mt-auto shrink-0 bg-[#073c5dd0] backdrop-blur-md ${isSidebarCollapsed ? 'px-2 flex justify-center' : ''}`}>
          <button 
            type="button" 
            onClick={handleLogout}
            className={`w-full py-2.5 ${isSidebarCollapsed ? 'px-0 justify-center' : 'px-4'} bg-rose-500/10 hover:bg-rose-600 border border-rose-500/30 hover:border-rose-600 text-rose-300 hover:text-white rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2.5 group shadow-3xs`}
            title={isSidebarCollapsed ? "تسجيل الخروج" : undefined}
          >
            <LogOut className={`w-4 h-4 ${!isSidebarCollapsed ? 'group-hover:-translate-x-1' : ''} transition-transform`} />
            {!isSidebarCollapsed && <span className="font-sans">تسجيل الخروج من النظام</span>}
          </button>
        </div>

      </aside>

      {/* Main Content Area Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Upper Main Header inside the content wrapper */}
        <header className="h-16 bg-white border-b border-gray-100 px-6 flex items-center justify-between shrink-0 shadow-xs z-30">
          
          {/* Logo and Branding section (User Customizable) */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 ml-1 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg lg:hidden cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop Sidebar Toggle */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden lg:flex p-2 ml-1 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
              title={isSidebarCollapsed ? "توسيع القائمة" : "طي القائمة"}
            >
              {isSidebarCollapsed ? <PanelRightOpen className="w-5 h-5" /> : <PanelRightClose className="w-5 h-5" />}
            </button>
          </div>

          {/* Sleek Search bar */}
          <div className="hidden md:block relative z-50">
            <motion.div 
              initial={false}
              animate={{ 
                width: isSearchFocused ? 384 : 280,
                borderColor: isSearchFocused ? '#1A7FAA' : '#E2E8F0',
                boxShadow: isSearchFocused ? '0 10px 25px -5px rgba(26, 127, 170, 0.15), 0 8px 10px -6px rgba(26, 127, 170, 0.15)' : 'none'
              }}
              transition={{ type: 'spring', stiffness: 350, damping: 26 }}
              className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl py-2 px-3.5"
            >
              <motion.span 
                animate={{ 
                  scale: isSearchFocused ? 1.2 : 1,
                  rotate: isSearchFocused ? 15 : 0,
                  color: isSearchFocused ? '#1A7FAA' : '#94A3B8'
                }}
                className="shrink-0 cursor-pointer"
              >
                <Search className="w-4 h-4" />
              </motion.span>
              <input 
                type="text" 
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => {
                  // Delay blur slightly so clicks on items register
                  setTimeout(() => setIsSearchFocused(false), 200);
                }}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="البحث السريع عن طالب، معلم، أو رقم قيد..." 
                className="w-full bg-transparent border-none text-xs text-slate-700 outline-none focus:ring-0 placeholder:text-slate-400 text-right font-sans"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </motion.div>

            {/* Suggestions Dropdown Card */}
            <AnimatePresence>
              {isSearchFocused && searchQuery.trim() && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 5, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute right-0 top-full mt-2 w-[400px] bg-white border border-gray-150 rounded-2xl shadow-xl overflow-hidden py-3 text-right z-50"
                  dir="rtl"
                >
                  <div className="space-y-4 max-h-[350px] overflow-y-auto no-scrollbar">
                      
                    {/* Students list */}
                    {searchResults.students.length > 0 && (
                      <div>
                        <div className="px-4 py-1.5 text-[11px] font-bold text-[#0D5C8C] bg-slate-50/50 flex items-center justify-between">
                          <span>الطلاب المطابقون ({searchResults.students.length})</span>
                          <span className="text-[9px] text-slate-400 font-normal">اضغط للملف</span>
                        </div>
                        <div className="divide-y divide-gray-50">
                          {searchResults.students.map((student) => (
                            <button
                              key={student.id}
                              onClick={() => {
                                localStorage.setItem('sams_global_search', student.name);
                                setActiveTab('students');
                                setSearchQuery('');
                              }}
                              className="w-full px-4 py-2 text-right hover:bg-sky-50/50 transition-all flex items-center justify-between text-xs cursor-pointer group"
                            >
                              <div className="space-y-0.5">
                                <div className="font-bold text-slate-800 group-hover:text-[#0D5C8C] transition-colors">{student.name}</div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-2 font-mono">
                                  <span>قيد: {student.registration_id}</span>
                                  <span>•</span>
                                  <span>{student.grade_level}</span>
                                </div>
                              </div>
                              <span className="text-[10px] text-[#0D5C8C] font-semibold bg-blue-50 px-2 py-0.5 rounded-md">
                                {student.status === 'active' ? 'نشط' : student.status === 'suspended' ? 'موقوف' : 'مؤجل'}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {searchResults.students.length === 0 && (
                      <div className="p-6 text-center text-slate-400 text-xs space-y-2 font-sans flex flex-col items-center justify-center">
                        <SearchX className="w-8 h-8 opacity-40" />
                        <p>لم نعثر على أي نتائج مطابقة</p>
                        <p className="text-[10px] text-slate-400">تأكد من كتابة الاسم أو الرقم القومي بشكل صحيح وطبق المحاولة</p>
                      </div>
                    )}

                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Info badges, User details */}
          
          {/* Notifications & User Details */}
          <div className="flex items-center gap-4">
            
            {/* Professional Quick Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-50 rounded-full cursor-pointer transition-all duration-300 relative overflow-hidden group shadow-3xs"
              title={isDarkMode ? "تفعيل الوضع المضيء" : "تفعيل الوضع الليلي"}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isDarkMode ? "dark" : "light"}
                  initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="flex items-center justify-center"
                >
                  {isDarkMode ? (
                    <Sun className="w-5 h-5 text-amber-400 hover:scale-110 transition-transform" />
                  ) : (
                    <Moon className="w-5 h-5 text-indigo-600 hover:scale-110 transition-transform" />
                  )}
                </motion.div>
              </AnimatePresence>
            </button>

            <div className="relative" ref={notiDropdownRef}>
              <button 
                onClick={() => setShowNotiDropdown(!showNotiDropdown)}
                className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-full cursor-pointer transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadNotisCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                )}
              </button>
              
              <AnimatePresence>
                {showNotiDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full mt-2 w-[350px] bg-white border border-gray-150 rounded-2xl shadow-xl overflow-hidden z-50 flex flex-col max-h-[400px]"
                    dir="rtl"
                  >
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                      <div className="font-bold text-slate-800 text-sm">الإشعارات</div>
                      {unreadNotisCount > 0 && (
                        <button 
                          onClick={handleMarkAllRead}
                          className="text-xs text-[#0D5C8C] hover:text-sky-700 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          تحديد الكل كمقروء
                        </button>
                      )}
                    </div>
                    
                    <div className="overflow-y-auto flex-1 no-scrollbar p-2 space-y-1">
                      {displayedNotis.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xs font-sans">
                          لا توجد إشعارات حالياً
                        </div>
                      ) : (
                        displayedNotis.map(noti => (
                          <div 
                            key={noti.id} 
                            className={`p-3 rounded-xl border ${noti.read ? 'border-transparent opacity-60 bg-white' : 'border-blue-100 bg-blue-50/30'} flex gap-3 transition-colors text-right relative`}
                          >
                            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${noti.type === 'absence' ? 'bg-orange-100 text-orange-600' : 'bg-rose-100 text-rose-600'}`}>
                              {noti.type === 'absence' ? <Bell className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 space-y-1 pr-1">
                              <p className={`text-xs leading-relaxed ${noti.read ? 'text-slate-600' : 'text-slate-900 font-bold'}`}>
                                {noti.message}
                              </p>
                              <div className="text-[10px] text-slate-400 font-sans">
                                {new Date(noti.created_at).toLocaleDateString('ar-EG')} - {new Date(noti.created_at).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}
                              </div>
                            </div>
                            {!noti.read && (
                              <button 
                                onClick={() => handleMarkNotiRead(noti.id)}
                                className="absolute left-3 top-3 p-1.5 text-slate-400 hover:text-[#0D5C8C] hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
                                title="تحديد كمقروء"
                              >
                                <CheckCheck className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Clock moved to Dashboard & Footer as requested */}
          </div>

        </header>

        {/* Viewport scroll area containing current Tab view */}
        <main className="flex-1 p-6 overflow-y-auto no-scrollbar w-full space-y-6">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <Dashboard onNavigateToTab={(tab) => { setActiveTab(tab as TabType); }} />}
            {activeTab === 'students' && <StudentsList />}
            {activeTab === 'parents' && <ParentsList />}
            {activeTab === 'books' && <BooksManager />}
            {activeTab === 'barcodes' && <StudentBarcodes />}
            {activeTab === 'classes' && <ClassesManager />}
            {activeTab === 'exams' && <ExamsAndAssignments />}
            {activeTab === 'attendance' && <AttendanceTracker />}
            {activeTab === 'salaries' && <SalariesManager />}
            {activeTab === 'fees' && <FeesTracker />}
            {activeTab === 'notifications' && <NotificationsCenter />}
            {activeTab === 'announcements' && <AnnouncementsManager />}
            {activeTab === 'roles' && <SystemRoles onRefreshAllData={forceRefresh} />}
            {activeTab === 'audit' && <SystemAuditLogs />}
            {activeTab === 'privacy' && <PrivacyPolicy />}
            {activeTab === 'settings' && (
              <SettingsManager 
                onSettingsSaved={handleSettingsSaved}
                onLogout={handleLogout}
                userRole={currentUserRole}
                userName={currentUserName}
                isDarkMode={isDarkMode}
                onToggleDarkMode={toggleDarkMode}
              />
            )}
          </div>
        </main>



      </div>

      {/* Suspension Modal */}
      <AnimatePresence>
        {showSuspendedModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            dir="rtl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center space-y-6"
            >
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <AlertCircle className="w-10 h-10" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">تم إيقاف الحساب</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                  عذراً، لقد تم إيقاف تفعيل حسابك مؤقتاً من قبل الإدارة العامة. 
                  يرجى مراجعة الدعم الفني أو الإدارة لتفعيل الاشتراك الخاص بك.
                </p>
              </div>

              <button 
                onClick={() => {
                  setShowSuspendedModal(false);
                  handleLogout();
                }}
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                تسجيل الخروج
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
