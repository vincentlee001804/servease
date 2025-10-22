import axios from 'axios';

// Configure axios base URL for the API
axios.defaults.baseURL = 'http://localhost:5000';

// Add request interceptor for debugging
axios.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to: ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('Response error:', error);
    if (error.response?.status === 404) {
      console.error('API endpoint not found. Check if backend is running on port 5000');
    }
    return Promise.reject(error);
  }
);

export default axios;
