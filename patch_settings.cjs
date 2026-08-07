const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsManager.tsx', 'utf8');

// Add state
code = code.replace(
  /const \[appName, setAppName\] = useState\(\(\) => getTenantSetting\('sams_custom_app_name_v2', 'Fox System'\)\);/,
  "const [appName, setAppName] = useState(() => getTenantSetting('sams_custom_app_name_v2', 'Fox System'));\n  const [appSubtitle, setAppSubtitle] = useState(() => getTenantSetting('sams_custom_app_subtitle_v2', 'لادارة السناتر التعليمية'));"
);

// Add save logic
code = code.replace(
  /saveToStorage\('sams_custom_app_name_v2', appName\.trim\(\)\);/,
  "saveToStorage('sams_custom_app_name_v2', appName.trim());\n      saveToStorage('sams_custom_app_subtitle_v2', appSubtitle.trim());"
);

// UI Update
const uiBlock = `              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">شعار السنتر (اللوجو):</label>`;
                
const newUiBlock = `              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">وصف التطبيق الفرعي (أسفل الاسم):</label>
                <input
                  type="text"
                  value={appSubtitle}
                  onChange={(e) => setAppSubtitle(e.target.value)}
                  placeholder="لادارة السناتر التعليمية"
                  className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-lg text-right outline-none focus:border-[#0D5C8C] shadow-3xs"
                />
                <span className="text-[10px] text-slate-400 block">(الوصف المصغر أسفل اسم السنتر)</span>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">شعار السنتر (اللوجو):</label>`;

code = code.replace(uiBlock, newUiBlock);

fs.writeFileSync('src/components/SettingsManager.tsx', code);
