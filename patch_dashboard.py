import re

with open('src/components/Dashboard.tsx', 'r') as f:
    content = f.read()

state_hook = """  const [currentTime, setCurrentTime] = useState(new Date());"""
state_new = """  const [currentTime, setCurrentTime] = useState(new Date());
  const [, setForceRender] = useState(0);

  useEffect(() => {
    const handleDataChange = () => setForceRender(prev => prev + 1);
    window.addEventListener('sams_data_changed', handleDataChange);
    return () => window.removeEventListener('sams_data_changed', handleDataChange);
  }, []);"""

content = content.replace(state_hook, state_new)

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(content)
