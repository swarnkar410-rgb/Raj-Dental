// API client wrapper for Raj Dental Express Backend

const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
};

export const getTokens = () => {
  if (typeof window === 'undefined') return { access: null, refresh: null };
  return {
    access: localStorage.getItem('access_token'),
    refresh: localStorage.getItem('refresh_token')
  };
};

export const saveTokens = (access: string, refresh: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
};

export const clearTokens = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

// Custom fetch request with automatic JWT authorization and token refresh
export const apiRequest = async (path: string, options: RequestInit = {}): Promise<any> => {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${path}`;
  const tokens = getTokens();

  // Prepare headers
  const headers = new Headers(options.headers || {});
  if (tokens.access) {
    headers.set('Authorization', `Bearer ${tokens.access}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers
  };

  try {
    let response = await fetch(url, fetchOptions);

    // If unauthorized, attempt token refresh
    if (response.status === 401 && tokens.refresh) {
      console.log('Token expired. Attempting refresh...');
      const refreshResponse = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken: tokens.refresh })
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        saveTokens(refreshData.accessToken, refreshData.refreshToken);

        // Retry initial request with new token
        headers.set('Authorization', `Bearer ${refreshData.accessToken}`);
        response = await fetch(url, { ...options, headers });
      } else {
        // Refresh token failed -> clear tokens and redirect to login
        clearTokens();
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        throw new Error('Session expired, please login again.');
      }
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error: any) {
    console.error('API Error:', error.message);
    throw error;
  }
};
