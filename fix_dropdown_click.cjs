const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add useRef to imports if not there.
if (!code.includes('useRef')) {
  code = code.replace(/import React, \{ /, 'import React, { useRef, ');
}

// 2. Add ref and effect near showNotiDropdown
const hookToAdd = `
  const notiDropdownRef = React.useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notiDropdownRef.current && !notiDropdownRef.current.contains(event.target as Node)) {
        setShowNotiDropdown(false);
      }
    }
    
    if (showNotiDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotiDropdown]);
`;

code = code.replace(/const \[showNotiDropdown, setShowNotiDropdown\] = useState\(false\);/, match => match + '\n' + hookToAdd);

// 3. Attach ref to the dropdown container
code = code.replace(/<div className="relative">(\s*)<button\s*onClick=\{\(\) => setShowNotiDropdown\(!showNotiDropdown\)\}/m, 
  `<div className="relative" ref={notiDropdownRef}>$1<button \n                onClick={() => setShowNotiDropdown(!showNotiDropdown)}`);

fs.writeFileSync('src/App.tsx', code);
