import axios from 'axios';

// Force cache busting with timestamp
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://us-central1-servease-07762363-b4f31.cloudfunctions.net/api' 
  : 'http://localhost:8000';

console.log('🔧 Axios configuration loaded with baseURL:', API_BASE_URL);
console.log('🔧 Version 1.0.3 - Fixed API routing');
console.log('🔧 Current timestamp:', new Date().toISOString());

// Create a new axios instance to avoid caching issues
const apiClient = axios.create({
  baseURL: API_BASE_URL
});

// Configure the default axios instance as well
axios.defaults.baseURL = API_BASE_URL;

// Add request interceptor for debugging
const requestInterceptor = (config) => {
  console.log(`Making ${config.method?.toUpperCase()} request to: ${config.url}`);
  return config;
};

const requestErrorInterceptor = (error) => {
  console.error('Request error:', error);
  return Promise.reject(error);
};

// Add response interceptor for error handling
const responseInterceptor = (response) => {
  return response;
};

const responseErrorInterceptor = (error) => {
  console.error('Response error:', error);
  if (error.response?.status === 404) {
    console.error('API endpoint not found. Check if backend is running on port 5000');
  }
  return Promise.reject(error);
};

// Apply interceptors to both instances
axios.interceptors.request.use(requestInterceptor, requestErrorInterceptor);
axios.interceptors.response.use(responseInterceptor, responseErrorInterceptor);

apiClient.interceptors.request.use(requestInterceptor, requestErrorInterceptor);
apiClient.interceptors.response.use(responseInterceptor, responseErrorInterceptor);

export default axios;
export { apiClient };
