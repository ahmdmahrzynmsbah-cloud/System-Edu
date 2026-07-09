import React, { useState, useEffect } from 'react';
import { Announcement } from '../types';
import { samsDb } from '../utils/db';
import { 
  Megaphone, 
  Plus, 
  Edit, 
  Trash2, 
  Pin, 
  Eye, 
  X, 
  Check, 
  Calendar, 
  Users, 
  GraduationCap, 
  Phone, 
  AlertCircle, 
  Search, 
  Filter,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AnnouncementsManager() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [audienceFilter, setAudienceFilter] = useState<string>('all-filter');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Success / error feedback
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState<Partial<Announcement>>({
    title: '',
    content: '',
    target_audience: 'all',
    color_theme: 'blue',
    is_pinned: false,
    status: 'active',
    expiry_date: ''
  });

  useEffect(() => {
    loadAnnouncements();
    window.addEventListener('sams_announcements_changed', loadAnnouncements);
    return () => window.removeEventListener('sams_announcements_changed', loadAnnouncements);
  }, []);

  const loadAnnouncements = () => {
    setAnnouncements(samsDb.getAnnouncements());
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 4000);
  };

  const handleOpenAdd = () => {
    setEditingAnnouncement(null);
    setFormData({
      title: '',
      content: '',
      target_audience: 'all',
      color_theme: 'blue',
      is_pinned: false,
      status: 'active',
      expiry_date: ''
    });
    setShowForm(true);
  };

  const handleOpenEdit = (ann: Announcement) => {
    setEditingAnnouncement(ann);
    setFormData({
      title: ann.title,
      content: ann.content,
      target_audience: ann.target_audience,
      color_theme: ann.color_theme || 'blue',
      is_pinned: ann.is_pinned,
      status: ann.status,
      expiry_date: ann.expiry_date || ''
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim() || !formData.content?.trim()) {
      showError('يرجى ملء الحقول الإجبارية: العنوان ومحتوى الإعلان.');
      return;
    }

    try {
      const updated: Omit<Announcement, 'publish_date' | 'views_count'> & { publish_date?: string, views_count?: number } = {
        id: editingAnnouncement?.id || '',
        title: formData.title.trim(),
        content: formData.content.trim(),
        target_audience: formData.target_audience || 'all',
        color_theme: formData.color_theme as any || 'blue',
        is_pinned: formData.is_pinned || false,
        status: formData.status || 'active',
        expiry_date: formData.expiry_date || undefined
      };

      if (editingAnnouncement) {
        updated.publish_date = editingAnnouncement.publish_date;
        updated.views_count = editingAnnouncement.views_count;
      }

      samsDb.saveAnnouncement(updated);
      showSuccess(editingAnnouncement ? 'تم تعديل الإعلان بنجاح!' : 'تم نشر الإعلان الجديد بنجاح!');
      setShowForm(false);
      setEditingAnnouncement(null);
      loadAnnouncements();
    } catch (err: any) {
      showError('حدث خطأ أثناء حفظ الإعلان.');
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا الإعلان نهائياً؟')) {
      samsDb.deleteAnnouncement(id);
      showSuccess('تم حذف الإعلان بنجاح.');
      loadAnnouncements();
    }
  };

  const handleTogglePin = (ann: Announcement) => {
    const updated = {
      ...ann,
      is_pinned: !ann.is_pinned
    };
    samsDb.saveAnnouncement(updated);
    showSuccess(updated.is_pinned ? 'تم تثبيت الإعلان في الأعلى!' : 'تم إلغاء تثبيت الإعلان.');
    loadAnnouncements();
  };

  const handleToggleStatus = (ann: Announcement) => {
    const updated = {
      ...ann,
      status: ann.status === 'active' ? 'archived' : 'active' as any
    };
    samsDb.saveAnnouncement(updated);
    showSuccess(updated.status === 'active' ? 'تم تنشيط الإعلان مجدداً.' : 'تم أرشفة الإعلان بنجاح.');
    loadAnnouncements();
  };

  // Filtered list
  const filteredAnnouncements = announcements.filter(ann => {
    const matchesSearch = ann.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          ann.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAudience = audienceFilter === 'all-filter' || ann.target_audience === audienceFilter;
    const matchesStatus = statusFilter === 'all' || ann.status === statusFilter;

    return matchesSearch && matchesAudience && matchesStatus;
  });

  // Sort: Pinned first, then by publish date desc
  const sortedAnnouncements = [...filteredAnnouncements].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.publish_date).getTime() - new Date(a.publish_date).getTime();
  });

  const getAudienceLabel = (aud: Announcement['target_audience']) => {
    return {
      all: { label: 'الجميع', style: 'bg-indigo-50 text-indigo-700 border border-indigo-100' },
      teachers: { label: 'المعلمين والمشتركين', style: 'bg-amber-50 text-amber-700 border border-amber-100' },
      students: { label: 'الطلاب فقط', style: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
      parents: { label: 'أولياء الأمور فقط', style: 'bg-sky-50 text-sky-700 border border-sky-100' }
    }[aud] || { label: 'الجميع', style: 'bg-gray-50 text-gray-700' };
  };

  const themeClasses = {
    blue: {
      bg: 'bg-blue-50/40 border-blue-100 hover:bg-blue-50/70',
      accent: 'bg-blue-500',
      text: 'text-blue-800',
      border: 'border-blue-200'
    },
    emerald: {
      bg: 'bg-emerald-50/40 border-emerald-100 hover:bg-emerald-50/70',
      accent: 'bg-emerald-500',
      text: 'text-emerald-800',
      border: 'border-emerald-200'
    },
    amber: {
      bg: 'bg-amber-50/40 border-amber-100 hover:bg-amber-50/70',
      accent: 'bg-amber-500',
      text: 'text-amber-800',
      border: 'border-amber-200'
    },
    rose: {
      bg: 'bg-rose-50/40 border-rose-100 hover:bg-rose-50/70',
      accent: 'bg-rose-500',
      text: 'text-rose-800',
      border: 'border-rose-200'
    },
    indigo: {
      bg: 'bg-indigo-50/40 border-indigo-100 hover:bg-indigo-50/70',
      accent: 'bg-indigo-500',
      text: 'text-indigo-800',
      border: 'border-indigo-200'
    },
    purple: {
      bg: 'bg-purple-50/40 border-purple-100 hover:bg-purple-50/70',
      accent: 'bg-purple-500',
      text: 'text-purple-800',
      border: 'border-purple-200'
    }
  };

  return (
    <div className="space-y-6" id="sams_announcements_module" dir="rtl">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[#0D5C8C]" />
            بوابة الإعلانات واللوحات الجدارية العامة
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            صمم وانشر الإعلانات، العروض الترويجية، أو جداول الامتحانات والقرارات الإدارية للمشتركين والطلاب
          </p>
        </div>
        
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#0D5C8C] hover:bg-[#1A7FAA] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          إضافة إعلان جديد
        </button>
      </div>

      {/* Success alert */}
      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-fade-in shadow-3xs"
          >
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-bold">{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error alert */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3.5 bg-red-50 border border-red-200 text-[#C0152A] rounded-xl text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-[#E8192C] shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter and Search Box */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search Input */}
        <div className="relative w-full md:w-96 shrink-0">
          <input 
            type="text" 
            placeholder="البحث في عناوين ومحتويات الإعلانات..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#1A7FAA]/30 outline-none transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
        </div>

        {/* Filters Group */}
        <div className="flex w-full md:w-auto items-center gap-3 overflow-x-auto no-scrollbar justify-end">
          
          {/* Audience Filter */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select 
              value={audienceFilter} 
              onChange={e => setAudienceFilter(e.target.value)} 
              className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all-filter">كل الفئات المستهدفة</option>
              <option value="all">الجميع</option>
              <option value="teachers">المعلمين</option>
              <option value="students">الطلاب</option>
              <option value="parents">أولياء الأمور</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)} 
              className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">كل الحالات</option>
              <option value="active">نشط فقط</option>
              <option value="archived">مؤرشف فقط</option>
            </select>
          </div>

        </div>
      </div>

      {/* Announcements Bento Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedAnnouncements.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-dashed border-slate-200 text-slate-400 space-y-3">
            <Megaphone className="w-12 h-12 mx-auto opacity-30 text-slate-400" />
            <p className="text-sm font-bold">لا يوجد أي إعلانات حالية مطابقة للمرشحات.</p>
            <p className="text-xs">اضغط على زر "إضافة إعلان جديد" بالأعلى لإنشاء أول إعلان حائط جداري.</p>
          </div>
        ) : (
          sortedAnnouncements.map((ann) => {
            const currentTheme = themeClasses[ann.color_theme || 'blue'];
            const audInfo = getAudienceLabel(ann.target_audience);
            const isArchived = ann.status === 'archived';

            return (
              <motion.div
                key={ann.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`p-5 rounded-2xl border ${currentTheme.bg} transition-all relative flex flex-col justify-between shadow-2xs group min-h-[220px] ${ann.is_pinned ? 'ring-2 ring-[#0D5C8C]' : ''}`}
              >
                <div>
                  {/* Pin status badge, Audience status */}
                  <div className="flex items-center justify-between mb-3.5">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${audInfo.style}`}>
                      {audInfo.label}
                    </span>
                    
                    <div className="flex items-center gap-1.5">
                      {ann.is_pinned && (
                        <span className="bg-amber-100 text-amber-800 p-1 rounded-lg text-xxs font-extrabold flex items-center gap-0.5" title="مثبت في الأعلى">
                          <Pin className="w-3 h-3 fill-current rotate-45 text-amber-600" />
                          مثبت
                        </span>
                      )}
                      
                      {isArchived && (
                        <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md text-[10px] font-bold">
                          مؤرشف
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title and Content */}
                  <h3 className="font-extrabold text-slate-800 text-sm leading-snug mb-2 group-hover:text-[#0D5C8C] transition-colors">
                    {ann.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans line-clamp-4 whitespace-pre-line mb-4">
                    {ann.content}
                  </p>
                </div>

                {/* Footer details & Actions */}
                <div className="border-t border-slate-100 pt-3.5 mt-auto flex items-center justify-between text-[10px] text-slate-400">
                  <div className="flex items-center gap-1 font-sans">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>
                      {new Date(ann.publish_date).toLocaleDateString('ar-EG', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  {/* Action buttons inside the card */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    
                    {/* Pin Action */}
                    <button
                      onClick={() => handleTogglePin(ann)}
                      className={`p-1.5 rounded-lg border hover:bg-white transition-colors cursor-pointer ${ann.is_pinned ? 'text-amber-600 border-amber-200 bg-amber-50' : 'text-slate-400 border-transparent'}`}
                      title={ann.is_pinned ? 'إلغاء التثبيت' : 'تثبيت في الأعلى'}
                    >
                      <Pin className="w-3.5 h-3.5 rotate-45" />
                    </button>

                    {/* Archive Action */}
                    <button
                      onClick={() => handleToggleStatus(ann)}
                      className={`p-1.5 rounded-lg border hover:bg-white transition-colors cursor-pointer ${isArchived ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-slate-400 border-transparent'}`}
                      title={isArchived ? 'تنشيط الإعلان' : 'أرشفة الإعلان'}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>

                    {/* Edit Action */}
                    <button
                      onClick={() => handleOpenEdit(ann)}
                      className="p-1.5 rounded-lg border border-transparent text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors cursor-pointer"
                      title="تعديل الإعلان"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Action */}
                    <button
                      onClick={() => handleDelete(ann.id)}
                      className="p-1.5 rounded-lg border border-transparent text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="حذف الإعلان نهائياً"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* MODAL FORM FOR ADDING / EDITING ANNOUNCEMENT */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xl max-w-2xl w-full space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar text-right"
          >
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-[#0D5C8C] text-sm flex items-center gap-2">
                <Megaphone className="w-4.5 h-4.5" />
                {editingAnnouncement ? 'تعديل الإعلان الجداري' : 'إنشاء إعلان أو قرار جداري جديد'}
              </h3>
              
              <button 
                onClick={() => { setShowForm(false); setEditingAnnouncement(null); }} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Title input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">عنوان الإعلان الرئيسي *</label>
                <input 
                  type="text" 
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="مثال: بدء التسجيل في المراجعات النهائية للصف الثالث الثانوي"
                  className="w-full text-xs font-sans border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-700 focus:ring-2 focus:ring-[#0D5C8C]/25 focus:border-[#0D5C8C] outline-none text-right"
                  required
                />
              </div>

              {/* Content text area */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">تفاصيل ومحتوى الإعلان بالتفصيل *</label>
                <textarea 
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={5}
                  placeholder="اكتب هنا كافة تفاصيل القرار، المواعيد، التكاليف، أو شروط الحضور..."
                  className="w-full text-xs font-sans border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-700 focus:ring-2 focus:ring-[#0D5C8C]/25 focus:border-[#0D5C8C] outline-none text-right min-h-[120px]"
                  required
                />
              </div>

              {/* Grid with Target Audience and Theme selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Target Audience selection */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">الفئة المستهدفة</label>
                  <select
                    value={formData.target_audience}
                    onChange={(e) => setFormData({ ...formData, target_audience: e.target.value as any })}
                    className="w-full text-xs font-sans border border-slate-200 p-2.5 rounded-xl text-slate-700 bg-white cursor-pointer focus:ring-2 focus:ring-[#0D5C8C]/25"
                  >
                    <option value="all">الجميع (كافة مستخدمي السنتر والمنصة)</option>
                    <option value="teachers">المعلمين / السكرتارية والمشتركين</option>
                    <option value="students">الطلاب فقط</option>
                    <option value="parents">أولياء الأمور فقط</option>
                  </select>
                </div>

                {/* Expiry date selection */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">تاريخ انتهاء الإعلان (اختياري)</label>
                  <input 
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    className="w-full text-xs font-sans border border-slate-200 p-2.5 rounded-xl text-slate-700 bg-white cursor-pointer focus:ring-2 focus:ring-[#0D5C8C]/25"
                  />
                </div>

              </div>

              {/* Color Theme Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">قالب المظهر واللون المفضل</label>
                <div className="flex flex-wrap gap-3">
                  {(['blue', 'emerald', 'amber', 'rose', 'indigo', 'purple'] as const).map((color) => {
                    const colorProps = {
                      blue: { bg: 'bg-blue-500', name: 'أزرق هادئ' },
                      emerald: { bg: 'bg-emerald-500', name: 'أخضر مبهج' },
                      amber: { bg: 'bg-amber-500', name: 'برتقالي دافئ' },
                      rose: { bg: 'bg-rose-500', name: 'أحمر تنبيهي' },
                      indigo: { bg: 'bg-indigo-500', name: 'نيلي كلاسيكي' },
                      purple: { bg: 'bg-purple-500', name: 'بنفسجي ملكي' }
                    }[color];

                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color_theme: color })}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xxs font-bold cursor-pointer transition-all ${
                          formData.color_theme === color
                            ? 'border-slate-800 ring-2 ring-slate-800/10 scale-105'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full ${colorProps.bg}`} />
                        <span>{colorProps.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Toggles: Pin and status */}
              <div className="flex flex-wrap items-center gap-6 pt-2">
                
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input 
                    type="checkbox"
                    checked={formData.is_pinned}
                    onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                    className="w-4 h-4 rounded text-[#0D5C8C] border-slate-300 focus:ring-[#0D5C8C] cursor-pointer"
                  />
                  <span>تثبيت هذا الإعلان دائماً في المقدمة</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input 
                    type="checkbox"
                    checked={formData.status === 'archived'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'archived' : 'active' })}
                    className="w-4 h-4 rounded text-[#0D5C8C] border-slate-300 focus:ring-[#0D5C8C] cursor-pointer"
                  />
                  <span>أرشفة هذا الإعلان مباشرة (عدم عرضه في الجدار)</span>
                </label>

              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingAnnouncement(null); }}
                  className="px-4 py-2 text-xs border border-gray-200 rounded-xl hover:bg-gray-50 text-slate-600 font-bold cursor-pointer transition-colors"
                >
                  إلغاء الأمر
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0D5C8C] hover:bg-[#1A7FAA] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
                >
                  {editingAnnouncement ? 'حفظ وتعديل الإعلان' : 'نشر وتثبيت الإعلان الآن'}
                </button>
              </div>

            </form>

          </motion.div>
        </div>
      )}

    </div>
  );
}
