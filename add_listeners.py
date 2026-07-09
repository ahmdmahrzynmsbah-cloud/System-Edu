import re
import os
import glob

files = [
    "src/components/AttendanceTracker.tsx",
    "src/components/BooksManager.tsx",
    "src/components/ClassesManager.tsx",
    "src/components/FeesTracker.tsx",
    "src/components/NotificationsCenter.tsx",
    "src/components/ParentsList.tsx",
    "src/components/SalariesManager.tsx",
    "src/components/StudentBarcodes.tsx",
    "src/components/StudentsList.tsx",
    "src/components/Dashboard.tsx",
]

for file_path in files:
    with open(file_path, 'r') as f:
        content = f.read()

    # Find the standard useEffect containing loadData()
    if 'loadData();\n  }, []);' in content:
        content = content.replace('loadData();\n  }, []);', "loadData();\n    window.addEventListener('sams_data_changed', loadData);\n    return () => window.removeEventListener('sams_data_changed', loadData);\n  }, []);")
    elif 'loadData();\n    const pendingSearch' in content:
        # For StudentsList or others that do things after loadData
        content = content.replace(
            "loadData();\n    const pendingSearch",
            "loadData();\n    window.addEventListener('sams_data_changed', loadData);\n    const pendingSearch"
        )
        content = content.replace(
            "}\n  }, []);",
            "}\n    return () => window.removeEventListener('sams_data_changed', loadData);\n  }, []);"
        )
    elif 'useEffect(() => {\n    loadData();' in content:
        content = content.replace(
            "useEffect(() => {\n    loadData();",
            "useEffect(() => {\n    loadData();\n    window.addEventListener('sams_data_changed', loadData);"
        )
        # We also need to add the cleanup, which might be tricky with regex if there are multiple useEffects.
        # Let's do a simple regex for the first empty deps array after loadData
        content = re.sub(r'(loadData\(\);\n.*?)(  \}, \[\];)', r'\1    return () => window.removeEventListener(\'sams_data_changed\', loadData);\n\2', content, flags=re.DOTALL)
        
    with open(file_path, 'w') as f:
        f.write(content)

