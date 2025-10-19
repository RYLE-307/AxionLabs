// services/api.js
const API_BASE_URL = 'http://localhost:8080/api'; // Исправьте порт

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Добавляем токен авторизации если есть
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        // Перенаправление на страницу авторизации
        window.location.href = '/auth';
        return;
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Projects (уже есть)
async createProject(projectData) {
  console.log('Sending project data to API:', projectData);
  return this.request('/projects', {
    method: 'POST',
    body: projectData,
  });
}
  async listProjects() {
    return this.request('/projects');
  }

  async getProject(id) {
    return this.request(`/projects/${id}`);
  }

  async updateProject(id, projectData) {
    return this.request(`/projects/${id}`, {
      method: 'PUT',
      body: projectData,
    });
  }

  async deleteProject(id) {
    return this.request(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Test Cases (расширяем)
  async createTestCase(projectId, testCaseData) {
    return this.request(`/projects/${projectId}/test-cases`, {
      method: 'POST',
      body: testCaseData,
    });
  }

  async listTestCases(projectId) {
    return this.request(`/projects/${projectId}/test-cases`);
  }

  async addTestCaseVersion(testCaseId, versionData) {
    return this.request(`/test-cases/${testCaseId}/versions`, {
      method: 'POST',
      body: versionData,
    });
  }

  async listTestCaseVersions(testCaseId) {
    return this.request(`/test-cases/${testCaseId}/versions`);
  }

  // Test Case Categories
  async createTestCaseCategory(projectId, categoryData) {
    return this.request(`/projects/${projectId}/test-case-categories`, {
      method: 'POST',
      body: categoryData,
    });
  }

  async listTestCaseCategories(projectId) {
    return this.request(`/projects/${projectId}/test-case-categories`);
  }

  // Test Runs
  async createTestRun(projectId, testRunData) {
    return this.request(`/projects/${projectId}/test-runs`, {
      method: 'POST',
      body: testRunData,
    });
  }

  async listTestRuns(projectId) {
    return this.request(`/projects/${projectId}/test-runs`);
  }

  async getTestRun(projectId, runId) {
    return this.request(`/projects/${projectId}/test-runs/${runId}`);
  }

  // Test Plans
  async createTestPlan(projectId, testPlanData) {
    return this.request(`/projects/${projectId}/test-plans`, {
      method: 'POST',
      body: testPlanData,
    });
  }

  async listTestPlans(projectId) {
    return this.request(`/projects/${projectId}/test-plans`);
  }

  // Users
  async listUsers() {
    return this.request('/users');
  }

  async createUser(userData) {
    return this.request('/users', {
      method: 'POST',
      body: userData,
    });
  }

  async updateUser(userId, userData) {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: userData,
    });
  }

  // Distributions
  async listDistributions() {
    return this.request('/distributions');
  }

  async createDistribution(distributionData) {
    return this.request('/distributions', {
      method: 'POST',
      body: distributionData,
    });
  }

  // OpenQA Profiles (уже есть)
  async createOpenQAProfile(projectId, profileData) {
    return this.request(`/projects/${projectId}/openqa/profiles`, {
      method: 'POST',
      body: profileData,
    });
  }

  async listOpenQAProfiles(projectId) {
    return this.request(`/projects/${projectId}/openqa/profiles`);
  }

  // Runs (уже есть - возможно это тест-раны)
  async createRun(runData) {
    return this.request('/runs', {
      method: 'POST',
      body: runData,
    });
  }

  async getRun(id) {
    return this.request(`/runs/${id}`);
  }

  async listRunItems(runId) {
    return this.request(`/runs/${runId}/items`);
  }

  // Project Statuses (уже есть)
  async createProjectStatus(projectId, statusData) {
    return this.request(`/projects/${projectId}/statuses`, {
      method: 'POST',
      body: statusData,
    });
  }

  async listProjectStatuses(projectId) {
    return this.request(`/projects/${projectId}/statuses`);
  }
}

export default new ApiService();