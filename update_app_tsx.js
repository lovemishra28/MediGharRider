const fs = require('fs');

const appPath = 'App.tsx';

let appContent = fs.readFileSync(appPath, 'utf8');

// Update imports
if (!appContent.includes('import SplashScreen from')) {
  appContent = appContent.replace(
    /import ErrorBoundary from '\.\/src\/components\/ErrorBoundary';/,
    `import ErrorBoundary from './src/components/ErrorBoundary';\nimport SplashScreen from './src/screens/SplashScreen';\nimport { useState } from 'react';`
  );
}

// Ensure useState is imported if it wasn't there
if (!appContent.includes('useState')) {
  appContent = appContent.replace(/import React, \{ useEffect \} from 'react';/, "import React, { useEffect, useState } from 'react';");
}

// Add state to AppNavigation
if (!appContent.includes('isSplashVisible')) {
  appContent = appContent.replace(
    /const \{ isAuthenticated, isLoading, accessToken, rider, hydrate \} = useAuthStore\(\);/,
    `const { isAuthenticated, isLoading, accessToken, rider, hydrate } = useAuthStore();\n  const [isSplashVisible, setIsSplashVisible] = useState(true);`
  );
}

// Update useEffect with timer
if (!appContent.includes('setTimeout')) {
  appContent = appContent.replace(
    /useEffect\(\(\) => \{\n\s*hydrate\(\);\n\s*\}, \[\]\);/,
    `useEffect(() => {
    hydrate();
    const timer = setTimeout(() => {
      setIsSplashVisible(false);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);`
  );
}

// Update socket useEffect
if (appContent.includes('if (isAuthenticated && accessToken) {')) {
  appContent = appContent.replace(
    /if \(isAuthenticated && accessToken\) \{/,
    `if (!isSplashVisible && isAuthenticated && accessToken) {`
  );
  appContent = appContent.replace(
    /\[isAuthenticated, accessToken\]/,
    `[isSplashVisible, isAuthenticated, accessToken]`
  );
}

// Replace the ActivityIndicator rendering with the SplashScreen component
appContent = appContent.replace(
  /if \(isLoading\) \{\n\s*return \(\n\s*<View[\s\S]*?<\/View>\n\s*\);\n\s*\}/,
  `if (isLoading || isSplashVisible) {
    return <SplashScreen />;
  }`
);

fs.writeFileSync(appPath, appContent, 'utf8');
console.log('App.tsx updated for Splash screen');
