const fs = require('fs');

const loginPath = 'src/screens/auth/LoginScreen.tsx';
let loginContent = fs.readFileSync(loginPath, 'utf8');

// Remove the settings button rendering
loginContent = loginContent.replace(
  /<TouchableOpacity[\s\S]*?styles\.settingsButton[\s\S]*?<\/TouchableOpacity>/,
  `{/* Settings Button Removed */}`
);

// Remove the Modal rendering
loginContent = loginContent.replace(
  /{[\s\S]*?\/\* Server IP Modal \*\/[\s\S]*?<\/Modal>/g,
  `{/* Server IP Modal Removed */}`
);

// Remove the Settings import if it exists alone, or from lucide-react-native
loginContent = loginContent.replace(/, Settings/, ' ');

// Remove getCustomServerIp from imports and useEffect
loginContent = loginContent.replace(/import \{ getCustomServerIp, setCustomServerIp \} from '\.\.\/\.\.\/services\/storage';/, '');
loginContent = loginContent.replace(/\/\/ Load custom IP on mount[\s\S]*?\}, \[\]\);/, '');

// Remove handleSaveIp
loginContent = loginContent.replace(/const handleSaveIp = async \(\) => \{[\s\S]*?setShowSettings\(false\);\n  \};/, '');


fs.writeFileSync(loginPath, loginContent, 'utf8');

const apiPath = 'src/config/api.ts';
let apiContent = fs.readFileSync(apiPath, 'utf8');

// Overwrite api.ts
const newApiContent = `import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const PRODUCTION_URL = 'https://medigharrider-api.onrender.com';

export const getBaseUrl = async () => \`\${PRODUCTION_URL}/api\`;
export const getSocketUrl = async () => PRODUCTION_URL;

const api = axios.create({
  timeout: 10000,
});

api.interceptors.request.use(
  async (config) => {
    config.baseURL = await getBaseUrl();
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = \`Bearer \${token}\`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle auth errors (e.g., token expired)
    return Promise.reject(error);
  }
);

export default api;
`;

fs.writeFileSync(apiPath, newApiContent, 'utf8');
console.log('LoginScreen and api.ts updated');
