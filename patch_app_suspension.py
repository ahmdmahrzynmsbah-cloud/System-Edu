import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

state_hook_old = "  const [refreshTrigger, setRefreshTrigger] = useState(0);"
state_hook_new = """  const [refreshTrigger, setRefreshTrigger] = useState(0);
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
  }, [currentUserRole]);"""

content = content.replace(state_hook_old, state_hook_new)

# Replace the closing of the component
end_pattern = r"            \}\)\}\n          </div>\n        </main>\n      </div>\n    </div>\n  \);\n\}"

modal_ui = """            )}\n          </div>\n        </main>\n      </div>\n\n      {/* Suspension Modal */}\n      <AnimatePresence>\n        {showSuspendedModal && (\n          <motion.div \n            initial={{ opacity: 0 }}\n            animate={{ opacity: 1 }}\n            exit={{ opacity: 0 }}\n            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"\n            dir="rtl"\n          >\n            <motion.div \n              initial={{ scale: 0.9, y: 20 }}\n              animate={{ scale: 1, y: 0 }}\n              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center space-y-6"\n            >\n              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto shadow-inner">\n                <AlertCircle className="w-10 h-10" />\n              </div>\n              \n              <div className="space-y-2">\n                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">تم إيقاف الحساب</h3>\n                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">\n                  عذراً، لقد تم إيقاف تفعيل حسابك مؤقتاً من قبل الإدارة العامة. \n                  يرجى مراجعة الدعم الفني أو الإدارة لتفعيل الاشتراك الخاص بك.\n                </p>\n              </div>\n\n              <button \n                onClick={() => {\n                  setShowSuspendedModal(false);\n                  handleLogout();\n                }}\n                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 cursor-pointer"\n              >\n                تسجيل الخروج\n              </button>\n            </motion.div>\n          </motion.div>\n        )}\n      </AnimatePresence>\n    </div>\n  );\n}"""

content = re.sub(end_pattern, modal_ui, content)

with open('src/App.tsx', 'w') as f:
    f.write(content)
