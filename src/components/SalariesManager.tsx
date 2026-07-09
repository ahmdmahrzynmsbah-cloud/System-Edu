import React, { useState, useEffect } from 'react';
import { DollarSign, User, Plus, Search, Trash2, Calendar, FileText, CheckCircle } from 'lucide-react';
import { addAuditLog } from '../utils/db';

interface UserData {
  id: string;
  name: string;
  role: string;
}

interface SalaryPayment {
  id: string;
  secretary_id: string;
  secretary_name: string;
  amount: number;
  date: string;
  month: string;
  notes: string;
}

export default function SalariesManager() {
  const [secretaries, setSecretaries] = useState<UserData[]>([]);
  const [payments, setPayments] = useState<SalaryPayment[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentToDelete, setPaymentToDelete] = useState<SalaryPayment | null>(null);
  
  const [formData, setFormData] = useState({
    secretary_id: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    month: new Date().toISOString().slice(0, 7),
    notes: ''
  });

  const loadData = () => {
    try {
      const usersSaved = localStorage.getItem('sams_system_users');
      if (usersSaved) {
        const parsedUsers: UserData[] = JSON.parse(usersSaved);
        const secs = parsedUsers.filter(u => u.role === 'secretary');
        setSecretaries(secs);
      }
      
      const paymentsSaved = localStorage.getItem('sams_salaries');
      if (paymentsSaved) {
        setPayments(JSON.parse(paymentsSaved));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('sams_data_changed', loadData);
    return () => window.removeEventListener('sams_data_changed', loadData);
  }, []);

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.secretary_id || !formData.amount || !formData.date) return;
    
    const sec = secretaries.find(s => s.id === formData.secretary_id);
    if (!sec) return;

    const newPayment: SalaryPayment = {
      id: 'sal-' + Date.now().toString(),
      secretary_id: sec.id,
      secretary_name: sec.name,
      amount: Number(formData.amount),
      date: formData.date,
      month: formData.month,
      notes: formData.notes
    };

    const updatedPayments = [newPayment, ...payments];
    setPayments(updatedPayments);
    localStorage.setItem('sams_salaries', JSON.stringify(updatedPayments));
    
    addAuditLog('INSERT', 'salaries', newPayment.id, `صرف راتب بقيمة ${newPayment.amount} للسكرتيرة: ${newPayment.secretary_name}`);
    
    setShowAddForm(false);
    setFormData({ secretary_id: '', amount: '', date: new Date().toISOString().split('T')[0], month: new Date().toISOString().slice(0, 7), notes: '' });
  };

  const confirmDelete = () => {
    if (!paymentToDelete) return;
    const paymentId = paymentToDelete.id;
    const updated = payments.filter(p => p.id !== paymentId);
    setPayments(updated);
    localStorage.setItem('sams_salaries', JSON.stringify(updated));
    addAuditLog('DELETE', 'salaries', paymentId, `حذف سجل راتب بقيمة ${paymentToDelete.amount} للسكرتيرة: ${paymentToDelete.secretary_name}`);
    setPaymentToDelete(null);
  };

  const filteredPayments = payments.filter(p => p.secretary_name.includes(searchTerm) || p.notes.includes(searchTerm));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-500" />
            رواتب السكرتارية
          </h2>
          <p className="text-sm text-slate-500 mt-1">إدارة وصرف رواتب الموظفين والسكرتيرات</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-sm text-sm"
        >
          <Plus className="w-4 h-4" />
          صرف راتب جديد
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-emerald-100 shadow-sm mb-6">
          <h3 className="font-bold text-emerald-800 text-sm mb-4 border-b border-slate-50 pb-2">صرف راتب جديد</h3>
          <form onSubmit={handleSavePayment} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">السكرتيرة</label>
              <select
                value={formData.secretary_id}
                onChange={e => setFormData({ ...formData, secretary_id: e.target.value })}
                className="w-full text-sm border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-emerald-500"
                required
              >
                <option value="">-- اختر السكرتيرة --</option>
                {secretaries.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">المبلغ (ج.م)</label>
              <input
                type="number"
                min="0"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                className="w-full text-sm border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">عن شهر</label>
              <input
                type="month"
                value={formData.month}
                onChange={e => setFormData({ ...formData, month: e.target.value })}
                className="w-full text-sm border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">تاريخ الصرف</label>
              <input
                type="date"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full text-sm border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">ملاحظات (اختياري)</label>
              <input
                type="text"
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                className="w-full text-sm border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="lg:col-span-5 flex justify-end gap-2 mt-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-5 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle className="w-4 h-4" />
                تأكيد الصرف
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-slate-50 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ابحث باسم السكرتيرة أو الملاحظات..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-white text-slate-500 text-xs font-bold border-b border-gray-100">
              <tr>
                <th className="p-4">السكرتيرة</th>
                <th className="p-4">المبلغ</th>
                <th className="p-4">عن شهر</th>
                <th className="p-4">التاريخ</th>
                <th className="p-4">ملاحظات</th>
                <th className="p-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredPayments.length > 0 ? (
                filteredPayments.map(payment => (
                  <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-800 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      {payment.secretary_name}
                    </td>
                    <td className="p-4 font-bold text-emerald-600 font-sans">
                      {payment.amount} ج.م
                    </td>
                                        <td className="p-4 text-slate-600 font-bold">
                      {payment.month}
                    </td>
                    <td className="p-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-sans">{payment.date}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 text-xs">
                      {payment.notes || '-'}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => setPaymentToDelete(payment)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer inline-flex"
                        title="إلغاء المعاملة وحذفها"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    لا توجد مدفوعات سابقة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {paymentToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" dir="rtl">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-md w-full p-6 text-right space-y-4 animate-scale-up">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-950 text-sm">إلغاء وحذف سجل راتب</h3>
                <p className="text-[11px] text-slate-500 font-sans font-medium">سيتم حذف المعاملة من السجلات المالية</p>
              </div>
            </div>
            
            <div className="text-xs text-slate-700 leading-relaxed font-sans space-y-1.5 py-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <p>هل أنت متأكد من رغبتك في حذف سجل راتب بقيمة <strong className="text-red-700">{paymentToDelete.amount} ج.م</strong> للسكرتيرة <strong className="text-red-700">{paymentToDelete.secretary_name}</strong>؟</p>
              <p className="text-[10px] text-slate-400">تحذير: سيتم حذف هذا السجل نهائياً ولن يمكن التراجع عن هذا الإجراء.</p>
            </div>
            
            <div className="flex gap-2 pt-2 border-t border-slate-50">
              <button 
                type="button" 
                onClick={() => setPaymentToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                تراجع وإلغاء
              </button>
              <button 
                type="button" 
                onClick={confirmDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm shadow-red-200 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>نعم، تأكيد الحذف</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
