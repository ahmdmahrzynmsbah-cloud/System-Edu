import React, { useState, useEffect, useMemo } from 'react';
import { Book, BookOpen, Plus, Search, Edit, Trash2, CheckCircle2, User, X, DollarSign, Calendar, Eye, Filter } from 'lucide-react';
import { samsDb } from '../utils/db';
import { Book as BookType, BookPayment, Student } from '../types';
import { AnimatePresence, motion } from 'motion/react';

export default function BooksManager() {
  const [activeTab, setActiveTab] = useState<'books' | 'payments'>('books');
  
  // Data states
  const [books, setBooks] = useState<BookType[]>([]);
  const [payments, setPayments] = useState<BookPayment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  // UI states
  const [showAddBook, setShowAddBook] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Confirm Delete states
  const [bookToDelete, setBookToDelete] = useState<string | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);

  // Forms
  const [bookForm, setBookForm] = useState({
    id: '',
    name: '',
    grade_level: 'الأول الإعدادي',
    subject: '',
    price: 0
  });

  const [paymentForm, setPaymentForm] = useState({
    student_id: '',
    book_id: '',
    amount_paid: 0,
    payment_date: new Date().toISOString().split('T')[0]
  });

  // Messages
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setBooks(samsDb.getBooks());
    setPayments(samsDb.getBookPayments());
    setStudents(samsDb.getStudents());
  };

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!bookForm.name || bookForm.price <= 0) {
      setErrorMessage('يرجى إدخال اسم المذكرة وسعر صحيح');
      return;
    }

    if (bookForm.id) {
      const updated: BookType = {
        ...bookForm,
        id: bookForm.id,
        created_at: books.find(b => b.id === bookForm.id)?.created_at || new Date().toISOString()
      };
      samsDb.updateBook(updated);
      setSuccessMessage('تم تحديث بيانات المذكرة بنجاح');
    } else {
      samsDb.addBook({
        name: bookForm.name,
        grade_level: bookForm.grade_level,
        subject: bookForm.subject,
        price: bookForm.price
      });
      setSuccessMessage('تمت إضافة المذكرة بنجاح');
    }
    
    setShowAddBook(false);
    setBookForm({ id: '', name: '', grade_level: 'الأول الإعدادي', subject: '', price: 0 });
    loadData();
  };

  const handleDeleteBook = (id: string) => {
    setBookToDelete(id);
  };

  const confirmDeleteBook = () => {
    if (bookToDelete) {
      samsDb.deleteBook(bookToDelete);
      loadData();
      setBookToDelete(null);
    }
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!paymentForm.student_id || !paymentForm.book_id || paymentForm.amount_paid < 0) {
      setErrorMessage('يرجى استكمال البيانات المطلوبة وتحديد مبلغ صحيح');
      return;
    }

    const selectedBook = books.find(b => b.id === paymentForm.book_id);
    if (!selectedBook) {
      setErrorMessage('المذكرة غير موجودة');
      return;
    }

    let status: 'fully_paid' | 'partially_paid' | 'not_paid' = 'not_paid';
    if (paymentForm.amount_paid >= selectedBook.price) {
      status = 'fully_paid';
    } else if (paymentForm.amount_paid > 0) {
      status = 'partially_paid';
    }

    samsDb.addBookPayment({
      student_id: paymentForm.student_id,
      book_id: paymentForm.book_id,
      amount_paid: paymentForm.amount_paid,
      total_price: selectedBook.price,
      payment_date: paymentForm.payment_date,
      status: status
    });

    setSuccessMessage('تم تسجيل استلام المذكرة والدفع بنجاح');
    setShowAddPayment(false);
    setPaymentForm({ student_id: '', book_id: '', amount_paid: 0, payment_date: new Date().toISOString().split('T')[0] });
    loadData();
  };

  const handleDeletePayment = (id: string) => {
    setPaymentToDelete(id);
  };

  const confirmDeletePayment = () => {
    if (paymentToDelete) {
      samsDb.deleteBookPayment(paymentToDelete);
      loadData();
      setPaymentToDelete(null);
    }
  };

  const getStudentName = (id: string) => students.find(s => s.id === id)?.name || 'طالب محذوف';
  const getBookName = (id: string) => books.find(b => b.id === id)?.name || 'مذكرة محذوفة';

  const filteredBooks = books.filter(b => b.name.includes(searchTerm) || b.subject.includes(searchTerm));
  const filteredPayments = payments.filter(p => {
    const studentName = getStudentName(p.student_id);
    const bookName = getBookName(p.book_id);
    return studentName.includes(searchTerm) || bookName.includes(searchTerm);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-[#1A7FAA]" />
            إدارة المذكرات والملازم
          </h2>
          <p className="text-sm text-slate-500 mt-1">تسجيل المذكرات وتتبع تسليمها ودفع رسومها للطلاب</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('books')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'books' ? 'bg-[#1A7FAA] text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
          >
            المذكرات
          </button>
          <button 
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'payments' ? 'bg-[#1A7FAA] text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
          >
            سجلات التسليم والدفع
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-100 flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-50 text-rose-700 p-4 rounded-xl border border-rose-100 flex items-center gap-2 font-medium">
          <X className="w-5 h-5 shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder={activeTab === 'books' ? "بحث عن مذكرة..." : "بحث باسم الطالب أو المذكرة..."}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-sm focus:ring-2 focus:ring-[#1A7FAA]/30 outline-none"
          />
        </div>

        {activeTab === 'books' ? (
          <button 
            onClick={() => {
              setBookForm({ id: '', name: '', grade_level: 'الأول الإعدادي', subject: '', price: 0 });
              setShowAddBook(true);
            }}
            className="w-full sm:w-auto px-4 py-2 bg-[#1A7FAA] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:bg-[#0D5C8C] transition-all"
          >
            <Plus className="w-4 h-4" />
            إضافة مذكرة جديدة
          </button>
        ) : (
          <button 
            onClick={() => setShowAddPayment(true)}
            className="w-full sm:w-auto px-4 py-2 bg-[#1A7FAA] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:bg-[#0D5C8C] transition-all"
          >
            <Plus className="w-4 h-4" />
            تسجيل تسليم مذكرة
          </button>
        )}
      </div>

      {/* Content */}
      {activeTab === 'books' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBooks.length > 0 ? filteredBooks.map((book) => (
            <div key={book.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center border border-sky-100">
                  <Book className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setBookForm(book); setShowAddBook(true); }} className="p-1.5 text-slate-400 hover:text-amber-500 bg-slate-50 hover:bg-amber-50 rounded-lg">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteBook(book.id)} className="p-1.5 text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-slate-800 text-lg mb-1">{book.name}</h3>
              <div className="flex flex-wrap gap-2 mb-4 text-xs font-semibold">
                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded">{book.grade_level}</span>
                {book.subject && <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded">{book.subject}</span>}
              </div>
              <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                <span className="text-slate-500 text-sm">السعر المحدد</span>
                <span className="font-black text-emerald-600 text-lg">{book.price} <span className="text-xs font-bold text-emerald-500">ج.م</span></span>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-2xl border border-dashed border-slate-200">
              <Book className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="font-medium text-slate-600">لم يتم إضافة أي مذكرات بعد</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden text-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-600">
                <tr>
                  <th className="px-4 py-4 font-bold">الطالب</th>
                  <th className="px-4 py-4 font-bold">المذكرة المستلمة</th>
                  <th className="px-4 py-4 font-bold">التاريخ</th>
                  <th className="px-4 py-4 font-bold">السعر / المدفوع</th>
                  <th className="px-4 py-4 font-bold">حالة الدفع</th>
                  <th className="px-4 py-4 pl-6 text-left font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredPayments.length > 0 ? filteredPayments.map(payment => (
                  <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="font-bold text-slate-800">{getStudentName(payment.student_id)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Book className="w-4 h-4 text-[#1A7FAA]" />
                        <span className="font-semibold text-slate-700">{getBookName(payment.book_id)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                      {payment.payment_date}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col text-xs">
                        <span className="text-slate-500">الإجمالي: {payment.total_price} ج.م</span>
                        <span className="font-bold text-emerald-600">المدفوع: {payment.amount_paid} ج.م</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {payment.status === 'fully_paid' && <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-xs font-bold inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> خالص</span>}
                      {payment.status === 'partially_paid' && <span className="bg-amber-50 text-amber-600 px-2 py-1 rounded text-xs font-bold">متبقي {payment.total_price - payment.amount_paid} ج.م</span>}
                      {payment.status === 'not_paid' && <span className="bg-rose-50 text-rose-600 px-2 py-1 rounded text-xs font-bold">لم يدفع</span>}
                    </td>
                    <td className="px-4 py-3 pl-6 text-left">
                      <button onClick={() => handleDeletePayment(payment.id)} className="p-1.5 text-slate-400 hover:text-red-500 bg-white hover:bg-red-50 rounded-lg shadow-sm border border-slate-100 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <DollarSign className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                      <p>لا توجد سجلات تسليم أو دفع للمذكرات حالياً</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Book Modal */}
      <AnimatePresence>
        {showAddBook && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <h3 className="font-bold text-lg text-slate-800">
                  {bookForm.id ? 'تعديل بيانات المذكرة' : 'إضافة مذكرة جديدة'}
                </h3>
                <button onClick={() => setShowAddBook(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleBookSubmit} className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 block">اسم المذكرة <span className="text-rose-500">*</span></label>
                  <input type="text" value={bookForm.name} onChange={e => setBookForm({...bookForm, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#1A7FAA]/30 outline-none" placeholder="مثال: مذكرة الباب الأول كيمياء" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 block">الصف الدراسي</label>
                    <select value={bookForm.grade_level} onChange={e => setBookForm({...bookForm, grade_level: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none">
                      <option value="الأول الإعدادي">الأول الإعدادي</option>
                      <option value="الثاني الإعدادي">الثاني الإعدادي</option>
                      <option value="الثالث الإعدادي">الثالث الإعدادي</option>
                      <option value="الأول الثانوي">الأول الثانوي</option>
                      <option value="الثاني الثانوي">الثاني الثانوي</option>
                      <option value="الثالث الثانوي">الثالث الثانوي</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 block">سعر المذكرة <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <input type="number" min="0" value={bookForm.price || ''} onChange={e => setBookForm({...bookForm, price: parseFloat(e.target.value) || 0})} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#1A7FAA]/30 outline-none" required />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">ج.م</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 block">المادة (اختياري)</label>
                  <input type="text" value={bookForm.subject} onChange={e => setBookForm({...bookForm, subject: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none" placeholder="مثال: لغة عربية" />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowAddBook(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-xl">إلغاء</button>
                  <button type="submit" className="px-6 py-2.5 bg-[#1A7FAA] text-white rounded-xl text-sm font-bold shadow-md hover:bg-[#0D5C8C]">حفظ المذكرة</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Payment Modal */}
      <AnimatePresence>
        {showAddPayment && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <h3 className="font-bold text-lg text-slate-800">تسجيل استلام مذكرة</h3>
                <button onClick={() => setShowAddPayment(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handlePaymentSubmit} className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 block">الطالب <span className="text-rose-500">*</span></label>
                  <select value={paymentForm.student_id} onChange={e => setPaymentForm({...paymentForm, student_id: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none" required>
                    <option value="">-- اختر الطالب --</option>
                    {students.filter(s => s.status === 'active').map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.grade_level})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 block">المذكرة المستلمة <span className="text-rose-500">*</span></label>
                  <select value={paymentForm.book_id} onChange={e => {
                    const bId = e.target.value;
                    const b = books.find(x => x.id === bId);
                    setPaymentForm({...paymentForm, book_id: bId, amount_paid: b ? b.price : 0});
                  }} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none" required>
                    <option value="">-- اختر المذكرة --</option>
                    {books.map(b => (
                      <option key={b.id} value={b.id}>{b.name} - {b.price} ج.م</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 block">المبلغ المدفوع <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <input type="number" min="0" value={paymentForm.amount_paid === 0 && paymentForm.book_id === '' ? '' : paymentForm.amount_paid} onChange={e => setPaymentForm({...paymentForm, amount_paid: parseFloat(e.target.value) || 0})} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#1A7FAA]/30 outline-none" required />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">ج.م</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 block">تاريخ التسليم</label>
                    <input type="date" value={paymentForm.payment_date} onChange={e => setPaymentForm({...paymentForm, payment_date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none" required />
                  </div>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowAddPayment(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-xl">إلغاء</button>
                  <button type="submit" className="px-6 py-2.5 bg-[#1A7FAA] text-white rounded-xl text-sm font-bold shadow-md hover:bg-[#0D5C8C]">حفظ السجل</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Book Confirmation Modal */}
      <AnimatePresence>
        {bookToDelete && (
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
              <h3 className="font-bold text-lg text-slate-800 mb-2">تأكيد الحذف</h3>
              <p className="text-sm text-slate-500 mb-6">هل أنت متأكد من حذف هذه المذكرة؟ ستظل المدفوعات المسجلة لها موجودة.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setBookToDelete(null)} className="px-5 py-2 text-slate-500 font-semibold hover:bg-slate-50 rounded-xl transition-colors">إلغاء</button>
                <button onClick={confirmDeleteBook} className="px-5 py-2 bg-red-500 text-white font-bold rounded-xl shadow-md hover:bg-red-600 transition-colors">نعم، احذف المذكرة</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Payment Confirmation Modal */}
      <AnimatePresence>
        {paymentToDelete && (
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
              <h3 className="font-bold text-lg text-slate-800 mb-2">تأكيد الحذف</h3>
              <p className="text-sm text-slate-500 mb-6">هل أنت متأكد من حذف سجل تسليم المذكرة هذا؟</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setPaymentToDelete(null)} className="px-5 py-2 text-slate-500 font-semibold hover:bg-slate-50 rounded-xl transition-colors">إلغاء</button>
                <button onClick={confirmDeletePayment} className="px-5 py-2 bg-red-500 text-white font-bold rounded-xl shadow-md hover:bg-red-600 transition-colors">نعم، احذف السجل</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
