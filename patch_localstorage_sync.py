import re

with open('src/components/LoginScreen.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "setTenants(dbTenants);",
    "setTenants(dbTenants);\n        localStorage.setItem('sams_system_tenants', JSON.stringify(dbTenants));"
)

with open('src/components/LoginScreen.tsx', 'w') as f:
    f.write(content)

with open('src/components/SuperAdminDashboard.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    """    const unsubscribe = subscribeToTenants((updatedList) => {
      if (updatedList.length > 0) {
        setTenants(updatedList);
        scanDatabaseIsolation(updatedList);
      }
    });""",
    """    const unsubscribe = subscribeToTenants((updatedList) => {
      if (updatedList.length > 0) {
        setTenants(updatedList);
        scanDatabaseIsolation(updatedList);
        localStorage.setItem('sams_system_tenants', JSON.stringify(updatedList));
      }
    });"""
)

with open('src/components/SuperAdminDashboard.tsx', 'w') as f:
    f.write(content)

with open('src/App.tsx', 'r') as f:
    app_content = f.read()

if "import { subscribeToTenants } from './lib/tenantsApi';" not in app_content:
    app_content = app_content.replace(
        "import { samsDb, getTenantSetting } from './utils/db';",
        "import { samsDb, getTenantSetting } from './utils/db';\nimport { subscribeToTenants } from './lib/tenantsApi';"
    )

app_useeffect = """  useEffect(() => {
    // Initial artificial delay for branding animation
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1500);

    // Simulated progress
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => Math.min(prev + 5, 100));
    }, 50);"""

app_useeffect_new = """  useEffect(() => {
    // Sync tenants to localStorage for synchronous reads across the app
    const unsubscribeTenants = subscribeToTenants((updatedList) => {
      if (updatedList.length > 0) {
        localStorage.setItem('sams_system_tenants', JSON.stringify(updatedList));
      }
    });

    // Initial artificial delay for branding animation
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1500);

    // Simulated progress
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => Math.min(prev + 5, 100));
    }, 50);"""

app_content = app_content.replace(app_useeffect, app_useeffect_new)

# Add cleanup
app_content = app_content.replace(
    "return () => { clearTimeout(timer); clearInterval(progressInterval); };",
    "return () => { clearTimeout(timer); clearInterval(progressInterval); unsubscribeTenants(); };"
)

with open('src/App.tsx', 'w') as f:
    f.write(app_content)

