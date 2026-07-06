/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuditLog } from '../types';
import { samsDb } from '../utils/db';
import { 
  History, 
  User, 
  FileText, 
  Clock, 
  Search, 
  Filter, 
  Database, 
  ShieldAlert, 
  Trash2, 
  Plus, 
  Edit3, 
  UserCheck, 
  RefreshCw, 
  CheckCircle,
  Eye,
  Calendar,
  Layers,
  ArrowRightLeft
} from 'lucide-react';

export default function SystemAuditLogs() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'insert' | 'update' | 'delete'>('all');
  const [actorFilter, setActorFilter] = useState<string>('all');
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [tableFilter, setTableFilter] = useState<string>('all');
  const [successMsg, setSuccessMsg] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setAuditLogs(samsDb.getAuditLogs());
    const saved = localStorage.getItem('sams_system_users');
    if (saved) {
      setSystemUsers(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setAuditLogs(samsDb.getAuditLogs());
      setIsRefreshing(false);
      setSuccessMsg('تم تحديث سجل المعاملات الحية بنجاح!');
    }, 500);
  };

  // Stat counters
  const totalLogs = auditLogs.length;
  
  // Secretary is identified by user_role === 'secretary' or user_name containing 'سارة'
  const secretaryLogs = auditLogs.filter(log => 
    log.user_role === 'secretary' || 
    log.user_name.includes('سارة') || 
    log.user_name.includes('سكرتير')
  );
  
  // Deletions / Updates
  const deletionsCount = auditLogs.filter(log => log.action_type === 'DELETE' || log.action_type === 'SOFT_DELETE').length;
  const updatesCount = auditLogs.filter(log => log.action_type === 'UPDATE').length;
  const insertsCount = auditLogs.filter(log => log.action_type === 'INSERT').length;

  // Filter & Search Logic
  const filteredLogs = auditLogs.filter(log => {
    // 1. Action Type Filter
    if (activeFilter === 'insert' && log.action_type !== 'INSERT') return false;
    if (activeFilter === 'update' && log.action_type !== 'UPDATE') return false;
    if (activeFilter === 'delete' && log.action_type !== 'DELETE' && log.action_type !== 'SOFT_DELETE') return false;

    // 2. Actor Filter
    const isSec = log.user_role === 'secretary' || log.user_name.includes('سارة') || log.user_name.includes('سكرتير');
    if (actorFilter === 'admin' && isSec) return false;
    if (actorFilter !== 'all' && actorFilter !== 'admin') {
      // It's a specific secretary name
      if (log.user_name !== actorFilter) return false;
    }

    // 3. Table Category Filter
    if (tableFilter !== 'all') {
      if (tableFilter === 'students' && log.table_name !== 'students') return false;
      if (tableFilter === 'attendance' && log.table_name !== 'attendance') return false;
      if (tableFilter === 'grades' && log.table_name !== 'grades') return false;
      if (tableFilter === 'fees' && log.table_name !== 'fees') return false;
    }

    // 4. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        log.details.toLowerCase().includes(q) ||
        log.user_name.toLowerCase().includes(q) ||
        log.timestamp.toLowerCase().includes(q) ||
        log.table_name.toLowerCase().includes(q)
      );
    }

    return true;
  });

  return (
    <div className="space-y-6" id="sams_audit_logs_tab">
      
      {/* Header card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#0D5C8C]" />
            <h2 className="text-xl font-bold text-slate-800">سجل المعاملات والعمليات العام</h2>
          </div>
          <p className="text-xs text-slate-500">
            تتبع شامل لجميع الإجراءات التي تمت داخل المنصة (إضافة، تعديل، حذف) بواسطة السكرتارية أو إدارة السنتر بالوقت والتاريخ الدقيق.
          </p>
        </div>
        
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3.5 py-2 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            تحديث السجل
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Operations */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-400 font-bold">إجمالي العمليات المسجلة</p>
            <p className="text-xl font-black text-slate-800">{totalLogs}</p>
            <p className="text-[9px] text-[#0D5C8C] font-semibold">بصمات أمان مشفرة</p>
          </div>
          <div className="p-3 bg-blue-50 text-[#0D5C8C] rounded-lg">
            <Database className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* Secretary Operations */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-400 font-bold">عمليات السكرتارية (أ. سارة)</p>
            <p className="text-xl font-black text-emerald-600">{secretaryLogs.length}</p>
            <p className="text-[9px] text-slate-500 font-semibold">إدخال حضور، تحصيل مالي</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <UserCheck className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* Total inserts/Additions */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-400 font-bold">إجمالي عمليات الإضافة</p>
            <p className="text-xl font-black text-indigo-600">{insertsCount}</p>
            <p className="text-[9px] text-slate-500 font-semibold">تسجيل جديد للطاقة الأكاديمية</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Plus className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* Total Deletions / Alerts */}
        <div className="bg-[#FEF2F2] p-4 rounded-xl border border-red-50 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-red-500 font-bold">إجراءات الحذف والأرشفة</p>
            <p className="text-xl font-black text-red-600">{deletionsCount}</p>
            <p className="text-[9px] text-red-400 font-semibold">تتطلب إشراف ومراجعة الإدارة</p>
          </div>
          <div className="p-3 bg-red-100/60 text-red-600 rounded-lg">
            <ShieldAlert className="w-5.5 h-5.5" />
          </div>
        </div>

      </div>

      {/* Success Alert */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Logs and Filters Grid */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
        
        {/* Advanced Filter Box */}
        <div className="p-5 border-b border-gray-100 bg-slate-50/50 space-y-4">
          
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
              <input
                type="text"
                placeholder="ابحث باسم الطالب، نوع الإجراء، أو الموظف، أو اليوم..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs font-sans border border-slate-200 pr-9 pl-4 py-3 rounded-xl text-slate-700 placeholder-slate-400 bg-white hover:border-slate-300 focus:border-[#0D5C8C] focus:ring-1 focus:ring-[#0D5C8C] outline-none transition-all"
              />
            </div>

            {/* Quick stats on filter */}
            <p className="text-[11px] text-slate-400 font-semibold">
              تم العثور على <strong className="text-[#0D5C8C] text-xs font-black">{filteredLogs.length}</strong> معاملة مطابقة للبحث
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            
            {/* 1. Filter by Action Type */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold block">تصفية بحسب نوع العملية</label>
              <div className="flex bg-white rounded-lg p-1 border border-slate-200">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`flex-1 text-center py-1.5 rounded-md text-[10px] font-bold cursor-pointer transition-all ${
                    activeFilter === 'all' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  الكل
                </button>
                <button
                  onClick={() => setActiveFilter('insert')}
                  className={`flex-1 text-center py-1.5 rounded-md text-[10px] font-bold cursor-pointer transition-all ${
                    activeFilter === 'insert' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  إضافة
                </button>
                <button
                  onClick={() => setActiveFilter('update')}
                  className={`flex-1 text-center py-1.5 rounded-md text-[10px] font-bold cursor-pointer transition-all ${
                    activeFilter === 'update' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  تعديل
                </button>
                <button
                  onClick={() => setActiveFilter('delete')}
                  className={`flex-1 text-center py-1.5 rounded-md text-[10px] font-bold cursor-pointer transition-all ${
                    activeFilter === 'delete' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  حذف
                </button>
              </div>
            </div>

            {/* 2. Filter by Actor */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold block">تصفية بحسب القائم بالعملية (المستخدم)</label>
              <select
                value={actorFilter}
                onChange={(e) => setActorFilter(e.target.value)}
                className="w-full text-xs font-sans border border-slate-200 rounded-lg p-2.5 bg-white text-slate-700 outline-none hover:border-slate-300 transition-all cursor-pointer"
              >
                <option value="all">كل المستخدمين</option>
                <option value="admin">الإدارة والأكاديمي</option>
                {systemUsers.filter(u => u.role === 'secretary').map(u => (
                  <option key={u.id} value={u.name}>سكرتيرة: {u.name}</option>
                ))}
              </select>
            </div>

            {/* 3. Filter by Table/Category */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold block">تصفية بحسب القسم/الجدول</label>
              <select
                value={tableFilter}
                onChange={(e) => setTableFilter(e.target.value)}
                className="w-full text-xs font-sans border border-slate-200 rounded-lg p-2.5 bg-white text-slate-700 outline-none hover:border-slate-300 transition-all cursor-pointer"
              >
                <option value="all">كل الأقسام والجداول</option>
                <option value="students">شؤون الطلاب (Students)</option>
                <option value="attendance">الغياب والحضور (Attendance)</option>
                <option value="grades">العلامات والدرجات (Grades)</option>
                <option value="fees">الحسابات والدفوعات المالية (Fees)</option>
              </select>
            </div>

          </div>

        </div>

        {/* List of Audit Logs */}
        <div className="p-5 space-y-3 max-h-[600px] overflow-y-auto no-scrollbar">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => {
              const actionBadge = {
                INSERT: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                UPDATE: 'bg-sky-50 text-sky-700 border-sky-100',
                DELETE: 'bg-red-50 text-red-700 border-red-100',
                SOFT_DELETE: 'bg-amber-50 text-amber-700 border-amber-150',
                QUERY: 'bg-gray-50 text-gray-700 border-gray-150'
              }[log.action_type] || 'bg-slate-50 text-slate-600 border-slate-100';

              const isSecretaryAction = log.user_role === 'secretary' || log.user_name.includes('سارة') || log.user_name.includes('سكرتيرة');

              return (
                <div
                  key={log.id}
                  className={`p-4 border rounded-xl hover:shadow-xs transition-all flex flex-col md:flex-row md:items-start justify-between gap-4 text-xs leading-relaxed text-right ${
                    isSecretaryAction
                      ? 'bg-emerald-50/25 border-emerald-100/50'
                      : 'bg-white border-slate-100'
                  }`}
                >
                  <div className="space-y-2 flex-1">
                    {/* Log detail line */}
                    <div className="flex items-start gap-2">
                      <div className="mt-1 shrink-0">
                        {log.action_type === 'INSERT' && (
                          <span className="p-1.5 bg-emerald-100/60 text-emerald-700 rounded-md block">
                            <Plus className="w-3.5 h-3.5" />
                          </span>
                        )}
                        {log.action_type === 'UPDATE' && (
                          <span className="p-1.5 bg-sky-100/60 text-sky-700 rounded-md block">
                            <Edit3 className="w-3.5 h-3.5" />
                          </span>
                        )}
                        {(log.action_type === 'DELETE' || log.action_type === 'SOFT_DELETE') && (
                          <span className="p-1.5 bg-red-100/60 text-red-700 rounded-md block">
                            <Trash2 className="w-3.5 h-3.5" />
                          </span>
                        )}
                        {log.action_type === 'QUERY' && (
                          <span className="p-1.5 bg-slate-100 text-slate-500 rounded-md block">
                            <Eye className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-slate-800 font-bold font-sans">
                          {log.details}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">
                          كود المعاملة الفريد: <span className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">{log.id}</span>
                        </p>
                      </div>
                    </div>

                    {/* Metadata line */}
                    <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 text-[10px] text-slate-400 font-sans border-t border-slate-50 pt-2 mt-2">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] flex items-center gap-1 ${
                        isSecretaryAction
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-indigo-50 text-indigo-800'
                      }`}>
                        <User className="w-3 h-3 shrink-0" />
                        القائم بالإجراء: {log.user_name} ({isSecretaryAction ? 'السكرتارية والحسابات' : 'إدارة النظام الأعلى'})
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5 font-bold text-slate-500">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        الوقت والتاريخ بالثانية: {log.timestamp}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <Layers className="w-3 h-3 text-slate-400" />
                        القسم المتأثر: <strong className="text-slate-600 font-mono">{log.table_name}</strong>
                      </span>
                    </div>

                  </div>

                  {/* Status badge */}
                  <span className={`px-3 py-1.5 border rounded-lg font-black text-[9px] shrink-0 self-start md:self-auto uppercase tracking-wider text-center ${actionBadge}`}>
                    {log.action_type === 'SOFT_DELETE' ? 'حذف مؤقت / أرشفة' : log.action_type === 'INSERT' ? 'عملية إضافة' : log.action_type === 'UPDATE' ? 'عملية تعديل' : log.action_type}
                  </span>

                </div>
              );
            })
          ) : (
            <div className="text-center py-16 space-y-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <div className="text-4xl text-slate-300">🔍</div>
              <p className="text-xs font-bold text-slate-500">لا توجد سجلات معاملات مطابقة لخيارات البحث أو التصفية الحالية</p>
              <p className="text-[10px] text-slate-400 max-w-sm mx-auto">
                قم بمراجعة كلمات البحث، أو اختر فلاتر أخرى مثل "الكل" لعرض المعاملات الحية المسجلة.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
