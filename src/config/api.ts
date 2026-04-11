// ─── API Configuration ───────────────────────────────────
// For Android Emulator: 10.0.2.2 maps to host machine's localhost
// For Physical Device:  Replace with your machine's local IP (e.g., 192.168.1.100)
// For Production:       Replace with your deployed server URL

const DEV_HOST = '10.0.2.2';
const DEV_PORT = 5000;

export const API_BASE_URL = `http://${DEV_HOST}:${DEV_PORT}/api`;
export const SOCKET_URL = `http://${DEV_HOST}:${DEV_PORT}`;
