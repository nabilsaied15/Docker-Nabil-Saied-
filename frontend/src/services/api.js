const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('accessToken');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || '15';
        throw new Error(`Trop de requêtes. Veuillez réessayer dans ${retryAfter} minutes.`);
      }
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        if (!response.ok) {
          throw new Error(`Erreur serveur (${response.status})`);
        }
        throw jsonError;
      }

      if (!response.ok) {
        if (response.status === 401) {
          this.setToken(null);
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        }
        throw new Error(data.message || `Erreur ${response.status}: Une erreur est survenue`);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  async register(email, password) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.accessToken) {
      this.setToken(data.accessToken);
    }
    return data;
  }

  async refreshToken(refreshToken) {
    const data = await this.request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    if (data.accessToken) {
      this.setToken(data.accessToken);
    }
    return data;
  }

  async getProfile() {
    return this.request('/users/profile');
  }

  async updateProfile(email, currentPassword, newPassword) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify({ email, currentPassword, newPassword }),
    });
  }

  async getUsers(page = 1, limit = 10, search = '') {
    return this.request(`/users?page=${page}&limit=${limit}&search=${search}`);
  }

  async deleteUser(userId) {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async createActivity(activityData) {
    return this.request('/activities', {
      method: 'POST',
      body: JSON.stringify(activityData),
    });
  }

  async getActivities() {
    return this.request('/activities');
  }

  async getActivity(id) {
    return this.request(`/activities/${id}`);
  }

  async updateActivity(id, activityData) {
    return this.request(`/activities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(activityData),
    });
  }

  async deleteActivity(id) {
    return this.request(`/activities/${id}`, {
      method: 'DELETE',
    });
  }

  async getActivityStats(period = 'all') {
    return this.request(`/activities/stats?period=${period}`);
  }

  async createGoal(goalData) {
    return this.request('/goals', {
      method: 'POST',
      body: JSON.stringify(goalData),
    });
  }

  async getGoals(status = null) {
    const url = status ? `/goals?status=${status}` : '/goals';
    return this.request(url);
  }

  async getGoal(id) {
    return this.request(`/goals/${id}`);
  }

  async updateGoal(id, goalData) {
    return this.request(`/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(goalData),
    });
  }

  async deleteGoal(id) {
    return this.request(`/goals/${id}`, {
      method: 'DELETE',
    });
  }

  async updateGoalProgress(id) {
    return this.request(`/goals/${id}/progress`, {
      method: 'POST',
    });
  }
}

export default new ApiService();

