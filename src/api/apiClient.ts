import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Extend the AxiosRequestConfig type to include _retry
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Helper function to determine if a value is HTML content
const isHtmlContent = (value: unknown): boolean => {
  return typeof value === 'string' && 
    (value.startsWith('<!DOCTYPE html>') || 
     value.startsWith('<html') || 
     value.includes('</html>'));
};

// Create an Axios instance with default configuration
const apiClient = axios.create({
    baseURL: 'https://talynkbackend-8fkrb.sevalla.app',
  headers: {
    'Content-Type': 'application/json',
        'Accept': 'application/json',
  },
    withCredentials: false, // Changed to false to avoid CORS issues
  // Add response transformer to detect HTML responses
  transformResponse: [
    ...(axios.defaults.transformResponse ? [axios.defaults.transformResponse].flat() : []),
    (data, headers) => {
      // If we received HTML when expecting JSON, throw an error
      const contentType = headers['content-type'] || '';
      if (contentType.includes('application/json') && isHtmlContent(data)) {
        console.error('Received HTML when expecting JSON - likely an authentication issue');
        throw new Error('Authentication required. Please log in again.');
      }
      return data;
    }
  ]
});

// Function to check if response is HTML (indicating auth redirect)
const isHtmlResponse = (response: AxiosResponse): boolean => {
  const contentType = response?.headers?.['content-type'] || '';
  return contentType.includes('text/html') || 
         isHtmlContent(response?.data);
};

// Handle authentication error by clearing tokens and redirecting
const handleAuthError = () => {
  console.error('Authentication error detected. Clearing tokens and redirecting to login.');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  
  // Only redirect if not already on login page
  if (!window.location.pathname.includes('/login')) {
    console.log('Redirecting to login page due to auth issue');
    window.location.href = '/login';
  }
};

// Add a request interceptor to include the auth token in requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      console.log('Attaching access token to request:', token.substring(0, 10) + '...'); // Log first 10 chars
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log('No access token found in localStorage.');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common response scenarios
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;
    
    // Log error details for debugging
    console.error('Axios Interceptor: Response Error', error.response?.status, error.message, error.config?.url);
    
    // Handle token expiration
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${apiClient.defaults.baseURL}/api/auth/refresh-token`, {}, {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          });
          
          if (response.data.status === 'success' && response.data.data.accessToken) {
            const newToken = response.data.data.accessToken;
            localStorage.setItem('accessToken', newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
          }
        }
        // If we get here, either no refresh token or invalid response
        handleAuthError();
        return Promise.reject(new Error('Authentication required. Please log in again.'));
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        handleAuthError();
        return Promise.reject(new Error('Authentication required. Please log in again.'));
      }
    }
    
    // Handle other error cases
    if (error.response?.status === 500 && isHtmlResponse(error.response)) {
      handleAuthError();
      return Promise.reject(new Error('Authentication required. Please log in again.'));
    }
    
    return Promise.reject(error);
  }
);

export default apiClient; 