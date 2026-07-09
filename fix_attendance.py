with open('src/components/AttendanceTracker.tsx', 'r') as f:
    content = f.read()

modal_start = "{/* Unpaid Payment Modal */}"
idx = content.find(modal_start)

if idx != -1:
    content = content[:idx] + """      {/* Unpaid Payment Modal */}
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
                              samsDb.saveAttendance(unpaidStudentForBarcode.id, unpaidStudentForBarcode.class_id, selectedDate, 'present');
                              setUnpaidStudentForBarcode(null);
                              loadData();
                              playSuccessBeep();
                              setScanFeedback({ type: 'success', msg: `حضور (بدون سداد): ${unpaidStudentForBarcode.name}` });
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
"""

with open('src/components/AttendanceTracker.tsx', 'w') as f:
    f.write(content)
