import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

end_str = """            {activeTab === 'settings' && (
              <SettingsManager 
                onSettingsSaved={handleSettingsSaved}
                onLogout={handleLogout}
                userRole={currentUserRole}
                userName={currentUserName}
                isDarkMode={isDarkMode}
                onToggleDarkMode={toggleDarkMode}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}"""

if end_str in content:
    print("Found exact end string")
else:
    print("Not found exactly")
