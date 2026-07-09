import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Replace setRefreshTrigger with custom event dispatch
old_trigger = "                 // Trigger refresh for all components\n                 setRefreshTrigger(prev => prev + 1);"
new_trigger = "                 // Trigger silent refresh via custom event\n                 window.dispatchEvent(new Event('sams_data_changed'));"
content = content.replace(old_trigger, new_trigger)

# Remove the key from the main div so it doesn't remount on refreshTrigger
old_div = '<div key={`${activeTab}-${refreshTrigger}`} className="max-w-7xl mx-auto">'
new_div = '<div className="max-w-7xl mx-auto">'
content = content.replace(old_div, new_div)

with open('src/App.tsx', 'w') as f:
    f.write(content)
