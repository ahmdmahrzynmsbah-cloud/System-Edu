const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add state variable
code = code.replace(
  /const \[customAppName, setCustomAppName\] = useState\(\(\) => getTenantSetting\('sams_custom_app_name_v2', 'Fox System'\)\);/,
  "const [customAppName, setCustomAppName] = useState(() => getTenantSetting('sams_custom_app_name_v2', 'Fox System'));\n  const [customAppSubtitle, setCustomAppSubtitle] = useState(() => getTenantSetting('sams_custom_app_subtitle_v2', 'لادارة السناتر التعليمية'));"
);

// Update setter functions
code = code.replace(
  /setCustomAppName\(getTenantSetting\('sams_custom_app_name_v2', 'Fox System'\)\);/g,
  "setCustomAppName(getTenantSetting('sams_custom_app_name_v2', 'Fox System'));\n    setCustomAppSubtitle(getTenantSetting('sams_custom_app_subtitle_v2', 'لادارة السناتر التعليمية'));"
);

// Replace hardcoded HTML
code = code.replace(
  /<p className="text-xs font-semibold text-\[#FCF6BA\] mt-1\.5 px-3 py-1 bg-white\/10 rounded-full select-none">لادارة السناتر التعليمية<\/p>/,
  '<p className="text-xs font-semibold text-[#FCF6BA] mt-1.5 px-3 py-1 bg-white/10 rounded-full select-none text-center max-w-[90%] break-words">{customAppSubtitle}</p>'
);

fs.writeFileSync('src/App.tsx', code);
