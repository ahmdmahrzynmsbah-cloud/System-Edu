import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add import
if 'StudentExamPortal' not in content:
    content = content.replace("import LoginScreen from './components/LoginScreen';", "import LoginScreen from './components/LoginScreen';\nimport StudentExamPortal from './components/StudentExamPortal';")

# Update App component
old_app = "export default function App() {"
new_app = """export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('exam_id')) {
    return <StudentExamPortal />;
  }
"""

if "urlParams.has('exam_id')" not in content:
    content = content.replace(old_app, new_app)

with open('src/App.tsx', 'w') as f:
    f.write(content)
