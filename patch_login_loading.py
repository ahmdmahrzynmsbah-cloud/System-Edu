import re

with open('src/components/LoginScreen.tsx', 'r') as f:
    content = f.read()

old_state = "  const [tenants, setTenants] = useState<any[]>([]);"
new_state = """  const [tenants, setTenants] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);"""

content = content.replace(old_state, new_state)

old_load_end = """        }
      }
    };
    loadUsers();"""
new_load_end = """        }
      }
      setIsLoadingData(false);
    };
    loadUsers();"""

content = content.replace(old_load_end, new_load_end)

old_btn = """            <button
              type="submit"
              className="w-full py-3 bg-[#0D5C8C] hover:bg-[#1A7FAA] text-white text-xs font-black rounded-xl transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              تأكيد الدخول وفتح لوحة العمل
            </button>"""
new_btn = """            <button
              type="submit"
              disabled={isLoadingData}
              className={`w-full py-3 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 ${isLoadingData ? 'bg-gray-400 cursor-not-allowed opacity-70' : 'bg-[#0D5C8C] hover:bg-[#1A7FAA] active:scale-98 cursor-pointer'}`}
            >
              <Sparkles className={`w-4 h-4 ${isLoadingData ? 'animate-pulse' : ''}`} />
              {isLoadingData ? 'جاري تهيئة النظام...' : 'تأكيد الدخول وفتح لوحة العمل'}
            </button>"""

content = content.replace(old_btn, new_btn)

with open('src/components/LoginScreen.tsx', 'w') as f:
    f.write(content)
