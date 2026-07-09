import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

end_old = """    </div>
  );
}"""

modal_ui = """      {/* Suspension Modal */}
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
}"""

content = content.replace(end_old, modal_ui)

with open('src/App.tsx', 'w') as f:
    f.write(content)
