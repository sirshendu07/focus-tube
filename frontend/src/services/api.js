const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api` 
  : '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('focustube_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {})
    }
  };

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      // If unauthorized, clear token if expired
      if (data.message?.toLowerCase().includes('expired') || data.message?.toLowerCase().includes('denied')) {
        localStorage.removeItem('focustube_token');
        localStorage.removeItem('focustube_user');
      }
    }
    const error = new Error(data.message || 'Something went wrong');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  register: (name, email, password) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    }),

  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  getMe: () => request('/auth/me'),

  // Playlists
  getPlaylists: () => request('/playlists'),
  getPlaylist: (id) => request(`/playlists/${id}`),
  createPlaylist: (playlistData) =>
    request('/playlists', {
      method: 'POST',
      body: JSON.stringify(playlistData)
    }),
  updatePlaylist: (id, playlistData) =>
    request(`/playlists/${id}`, {
      method: 'PUT',
      body: JSON.stringify(playlistData)
    }),
  deletePlaylist: (id) =>
    request(`/playlists/${id}`, {
      method: 'DELETE'
    }),

  // Videos
  previewVideo: (url) =>
    request(`/videos/preview?url=${encodeURIComponent(url)}`),

  getVideos: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.playlistId) params.append('playlistId', filters.playlistId);
    if (filters.search) params.append('search', filters.search);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return request(`/videos${queryString}`);
  },

  createVideo: (videoData) =>
    request('/videos', {
      method: 'POST',
      body: JSON.stringify(videoData)
    }),

  getVideo: (id) => request(`/videos/${id}`),

  updateRevisionStatus: (id, revisionStatus) =>
    request(`/videos/${id}/revision`, {
      method: 'PATCH',
      body: JSON.stringify({ revisionStatus })
    }),

  updateNotes: (id, { notes, timestamps }) =>
    request(`/videos/${id}/notes`, {
      method: 'PATCH',
      body: JSON.stringify({ notes, timestamps })
    }),

  updateProgress: (id, position) =>
    request(`/videos/${id}/progress`, {
      method: 'PATCH',
      body: JSON.stringify({ position })
    }),

  updateVideo: (id, data) =>
    request(`/videos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteVideo: (id) =>
    request(`/videos/${id}`, {
      method: 'DELETE'
    }),

  reorderVideos: (orderedIds) =>
    request('/videos/reorder', {
      method: 'POST',
      body: JSON.stringify({ orderedIds })
    })
};
