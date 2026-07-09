import re

with open('src/components/SystemAuditLogs.tsx', 'r') as f:
    content = f.read()

old_hook = """  useEffect(() => {
    setAuditLogs(samsDb.getAuditLogs());
    const saved = localStorage.getItem('sams_system_users');
    if (saved) {
      setSystemUsers(JSON.parse(saved));
    }
  }, []);"""

new_hook = """  useEffect(() => {
    const handleDataLoad = () => {
      setAuditLogs(samsDb.getAuditLogs());
      const saved = localStorage.getItem('sams_system_users');
      if (saved) {
        setSystemUsers(JSON.parse(saved));
      }
    };
    handleDataLoad();
    window.addEventListener('sams_data_changed', handleDataLoad);
    return () => window.removeEventListener('sams_data_changed', handleDataLoad);
  }, []);"""

content = content.replace(old_hook, new_hook)

with open('src/components/SystemAuditLogs.tsx', 'w') as f:
    f.write(content)
