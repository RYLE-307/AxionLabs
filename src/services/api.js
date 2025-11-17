const API_BASE_URL = process.env.NODE_ENV === 'development' ? '/api' : 'http://localhost:8080/api/v1';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  request = async (endpoint, options = {}) => {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    // For GET requests, avoid cached 304 responses by default — ensure fresh data
    const method = (config.method || 'GET').toString().toUpperCase();
    if (method === 'GET') {
      config.cache = config.cache || 'no-store';
    }

    const response = await fetch(url, config);
    const text = await response.text();

    if (!response.ok) {
      // For GET requests, treat 404 as empty list to allow UI to continue gracefully
      const method = (config.method || 'GET').toString().toUpperCase();
      if (response.status === 404 && method === 'GET') {
        try {
          // if response body contains JSON, try parse it; otherwise return empty array
          return text ? JSON.parse(text) : [];
        } catch (e) {
          return [];
        }
      }

      const err = new Error(text || `HTTP error! status: ${response.status}`);
      err.status = response.status;
      err.bodyText = text;
      console.error('API request failed', { url, status: response.status, body: text });
      throw err;
    }

    return text ? JSON.parse(text) : null;
  }

  // Try multiple endpoints in order until one succeeds
  requestMultiple = async (endpoints, options = {}) => {
    let lastError;
    for (const ep of endpoints) {
      try {
        return await this.request(ep, options);
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError;
  }

  // Projects
  listProjects = async () => {
    return this.request('/projects');
  }

  getProject = async (id) => {
    return this.request(`/projects/${id}`);
  }

  createProject = async (projectData) => {
    return this.request('/projects', {
      method: 'POST',
      body: projectData,
    });
  }

  updateProject = async (id, projectData) => {
    return this.request(`/projects/${id}`, {
      method: 'PUT',
      body: projectData,
    });
  }

  deleteProject = async (id) => {
    return this.request(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Test Cases
  listTestCases = async (projectId) => {
    const candidates = [
      `/projects/${projectId}/test-cases`,
      `/projects/${projectId}/testcases`,
      `/projects/${projectId}/test-cases/list`
    ];
    return this.requestMultiple(candidates.map(p => p));
  }

  createTestCase = async (projectId, testCaseData) => {
    const payload = {
      key: testCaseData.key || testCaseData.Key || `TC-${Date.now()}`,
      title: testCaseData.Title || testCaseData.title || testCaseData.name || 'Untitled',
      description: testCaseData.Description || testCaseData.description || testCaseData.desc || '',
      category_id: testCaseData.category_id || testCaseData.categoryId || null,
      project_id: projectId
    };
    
    let response;
    try {
      response = await this.request(`/projects/${projectId}/test-cases`, {
        method: 'POST',
        body: payload
      });
    } catch (err) {
      throw err;
    }

  // If backend returned id, try to fetch versions to provide a richer object
  // If this is a locally mocked object (dev proxy), skip server-side version creation.
    if (response && response.id) {
      const versionPayload = testCaseData.initial_version || {
        version: testCaseData.Version || 1,
        title: testCaseData.Title,
        description: testCaseData.Description,
        steps: testCaseData.Steps,
        expected: testCaseData.Expected,
        priority: testCaseData.Priority,
        status: testCaseData.Status
      };

      // create initial version
      try {
        await this.addTestCaseVersion(response.id, versionPayload);
      } catch (e) {
        // ignore version creation errors here
      }

      // try to fetch versions and attach latest_version
      try {
        const versions = await this.listTestCaseVersions(response.id);
        const latest = Array.isArray(versions) && versions.length ? versions.sort((a,b)=>b.version-a.version)[0] : null;
        return { ...response, latest_version: latest };
      } catch (e) {
        return response;
      }
    }

    return response;
  }

  // Helper: normalize UI test-case payloads and create
  createTestCaseNormalized = async (projectId, uiData) => {
    const payload = {
      key: uiData.key || `TC-${Date.now()}`,
      Title: uiData.Title || uiData.title || 'Untitled',
      Description: uiData.Description || uiData.description || '',
      Steps: uiData.Steps || uiData.steps || '',
      Expected: uiData.Expected || uiData.expected || '',
      Priority: uiData.Priority || uiData.priority || 'medium',
      Status: uiData.Status || uiData.status || 'active',
    };

    return this.createTestCase(projectId, payload);
  }

  // createTemporaryTestCase removed — use real createTestCase APIs

  // Test Case Versions
  addTestCaseVersion = async (testCaseId, versionData) => {
    return this.request(`/test-cases/${testCaseId}/versions`, {
      method: 'POST',
      body: versionData,
    });
  }

  listTestCaseVersions = async (testCaseId) => {
    return this.request(`/test-cases/${testCaseId}/versions`);
  }

  // Test Case Categories
  // Categories removed: UI no longer uses category endpoints.

  // Helper: create a test-case, create its initial version (if provided), then create a one-off run.
  // Returns { testCase, run } where testCase is the created case (possibly mocked) and run is the created run object.
  createTestCaseAndRun = async (projectId, testCaseData, runOptions = {}) => {
    // Create test case (this will attempt to create a real one or return a local fallback)
    const testCase = await this.createTestCase(projectId, testCaseData);

    // If the testCase is real (not a mock) and an initial version payload was provided,
    // create the first version via POST /test-cases/:id/versions
  if (testCase && testCase.id && testCaseData && testCaseData.initial_version) {
      try {
        const createdVersion = await this.addTestCaseVersion(testCase.id, testCaseData.initial_version);
        // attach latest_version if server returned it
        if (createdVersion) {
          testCase.latest_version = createdVersion;
        }
      } catch (err) {
        // Non-fatal: log and continue; run can still be created using case id
        console.warn('createTestCaseAndRun: failed to create initial version, continuing with run creation', err);
      }
    }

    // If testCase is mocked or invalid, still allow creating a local run object
    const runPayload = {
      project_id: projectId,
      plan_id: runOptions.plan_id || null,
      run_type: runOptions.run_type || 'manual',
      status: runOptions.status || 'queued',
      name: runOptions.name || `Run for ${testCase.key || testCase.id}`,
      description: runOptions.description || null,
      initiated_by: runOptions.initiated_by || null,
      openqa_profile_id: runOptions.openqa_profile_id || null,
      settings: runOptions.settings || {},
      stats: {},
      created_at: new Date().toISOString()
    };

    const run = await this.createRun({ ...runPayload, project_id: projectId });

    return { testCase, run };
  }

  // Test Runs
  listTestRuns = async (projectId) => {
    const query = projectId ? `?project_id=${projectId}` : '';
    return this.request(`/runs${query}`);
  }

  // Some backends expect POST /runs with project_id in body, others accept /projects/:id/runs
  createTestRun = async (projectId, runData) => {
    const payload1 = { ...runData, project_id: projectId };
    // normalize keys to backend expectations
    const normalized = {
      project_id: Number(payload1.project_id) || null,
      plan_id: payload1.plan_id ? Number(payload1.plan_id) : (payload1.planId ? Number(payload1.planId) : null),
      run_type: payload1.run_type || payload1.type || payload1.RunType || 'manual',
      status: payload1.status || 'queued',
      name: payload1.name || payload1.title || `Run ${Date.now()}`,
      description: payload1.description || payload1.desc || null,
      initiated_by: payload1.initiated_by || payload1.initiatedBy || null,
      openqa_profile_id: payload1.openqa_profile_id || payload1.OpenQAProfileID || payload1.openqaProfileId || null,
      settings: payload1.settings || payload1.configuration || {},
      stats: payload1.stats || {}
    };

    // try /runs first (common), then /projects/:id/runs
    try {
      return await this.request('/runs', { method: 'POST', body: normalized });
    } catch (err) {
      // fallback to project-scoped endpoint using same normalized payload
      return this.request(`/projects/${projectId}/runs`, { method: 'POST', body: normalized });
    }
  }

  createRun = async (payload) => {
    // Normalize payload shape to match DB columns
    const normalized = {
      project_id: Number(payload.project_id) || (payload.projectId ? Number(payload.projectId) : null),
      plan_id: payload.plan_id ? Number(payload.plan_id) : (payload.planId ? Number(payload.planId) : null),
      run_type: payload.run_type || payload.type || payload.RunType || 'manual',
      status: payload.status || 'queued',
      name: payload.name || payload.title || `Run ${Date.now()}`,
      description: payload.description || payload.desc || null,
      initiated_by: payload.initiated_by || payload.initiatedBy || null,
  // include test_case_ids if provided (array of ids)
  test_case_ids: Array.isArray(payload.test_case_ids) ? payload.test_case_ids.map(x => Number(x)) : (Array.isArray(payload.selectedTestCases) ? payload.selectedTestCases.map(x => Number(x)) : (payload.testCaseIds || payload.test_case_ids || [])),
      openqa_profile_id: payload.openqa_profile_id || payload.OpenQAProfileID || payload.openqaProfileId || null,
      settings: payload.settings || {},
      stats: payload.stats || {}
    };

    const response = await this.request('/runs', {
      method: 'POST',
      body: normalized
    });

    // If backend returned id, fetch the full run by id to ensure we have all fields
    if (response && response.id) {
      try {
        const full = await this.getRun(response.id);
        return full || response;
      } catch (e) {
        return response;
      }
    }

    return response;
  }

  getRun = async (id) => {
    return this.request(`/runs/${id}`);
  }

  updateRun = async (runId, runData) => {
    const endpoints = [`/runs/${runId}`, `/projects/runs/${runId}`];
    return this.requestMultiple(endpoints, { method: 'PUT', body: runData });
  }

  listRunItems = async (runId) => {
    return this.request(`/runs/${runId}/items`);
  }

  // Test Plans
  listTestPlans = async (projectId) => {
    return this.request(`/projects/${projectId}/test-plans`);
  }

  createTestPlan = async (projectId, testPlanData) => {
    return this.request(`/projects/${projectId}/test-plans`, {
      method: 'POST',
      body: testPlanData,
    });
  }

  updateTestPlan = async (planId, planData) => {
    const endpoints = [`/test-plans/${planId}`, `/projects/test-plans/${planId}`];
    return this.requestMultiple(endpoints, { method: 'PUT', body: planData });
  }

  // Project Statuses
  listProjectStatuses = async (projectId) => {
    return this.request(`/projects/${projectId}/statuses`);
  }

  createProjectStatus = async (projectId, statusData) => {
    return this.request(`/projects/${projectId}/statuses`, {
      method: 'POST',
      body: statusData
    });
  }

  // Helper: ensure required fields for project status
  createProjectStatusNormalized = async (projectId, data) => {
    const payload = {
      code: data.code || (data.name || 'status').toLowerCase().replace(/\s+/g, '_'),
      name: data.name || data.code || 'Unnamed status',
      category: data.category || 'general',
      color: data.color || null
    };

    return this.createProjectStatus(projectId, payload);
  }

  // OpenQA Profiles
  listOpenQAProfiles = async (projectId) => {
    if (!projectId) throw new Error('projectId is required');
    return this.request(`/projects/${projectId}/openqa/profiles`);
  }

  createOpenQAProfile = async (projectId, profileData) => {
    if (!projectId) throw new Error('projectId is required');
    // ensure types and required fields match DB
    const payload = {
      project_id: Number(projectId),
      name: (profileData.name || profileData.Name || '').toString(),
      base_url: profileData.baseUrl || profileData.base_url || profileData.BaseURL || 'https://openqa.example.com',
      api_key: profileData.api_key || profileData.apiKey || null,
      api_secret: profileData.api_secret || profileData.apiSecret || null,
      verify_tls: typeof profileData.verify_tls === 'boolean' ? profileData.verify_tls : (profileData.verifyTLS === false ? false : true),
      mode: profileData.mode || profileData.Mode || 'template',
      job_group_id: profileData.job_group_id ? Number(profileData.job_group_id) : (profileData.jobGroupId ? Number(profileData.jobGroupId) : null),
      defaults: profileData.defaults || profileData.configuration || {},
      configuration: profileData.configuration || profileData.defaults || {}
    };

    // basic validation before sending to backend
    if (!payload.name || !payload.base_url) {
      throw new Error('OpenQA profile requires name and base_url');
    }

    try {
      return await this.request(`/projects/${projectId}/openqa/profiles`, {
        method: 'POST',
        body: payload
      });
    } catch (err) {
      const text = (err && err.message) ? err.message : String(err);
      // attach payload to thrown error for easier debugging in UI
      err.requestBody = payload;
      throw err;
    }
  }

  // Helper: normalize OpenQA profile payloads coming from UI
  createOpenQAProfileNormalized = async (projectId, uiData) => {
    const payload = {
      name: uiData.name || uiData.Name || `Profile ${Date.now()}`,
      base_url: uiData.base_url || uiData.baseUrl || uiData.BaseURL || 'https://openqa.example.com',
      api_key: uiData.api_key || uiData.apiKey || null,
      api_secret: uiData.api_secret || uiData.apiSecret || null,
      verify_tls: typeof uiData.verify_tls === 'boolean' ? uiData.verify_tls : (uiData.verifyTLS === false ? false : true),
      mode: uiData.mode || uiData.Mode || 'template',
      job_group_id: uiData.job_group_id || uiData.jobGroupId || null,
      defaults: uiData.defaults || uiData.configuration || {}
    };

    return this.createOpenQAProfile(projectId, payload);
  }

  // Runs methods
  getRun = async (id) => {
    return this.request(`/runs/${id}`);
  }

  listRunItems = async (runId) => {
    return this.request(`/runs/${runId}/items`);
  }

  // Delete run
  deleteRun = async (id) => {
    return this.request(`/runs/${id}`, { method: 'DELETE' });
  }

  // Users
  listUsers = async () => {
    const candidates = ['/users', '/api/users', '/accounts'];
    return this.requestMultiple(candidates);
  }

  // Distributions
  listDistributions = async (projectId) => {
    const candidates = [
      `/projects/${projectId}/distributions`,
      `/projects/${projectId}/distros`,
      `/projects/${projectId}/packages`
    ];
    return this.requestMultiple(candidates.map(p => p));
  }

  createDistribution = async (projectId, distroData) => {
  const endpoints = [`/projects/${projectId}/distributions`, `/projects/${projectId}/distros`];
  const resp = await this.requestMultiple(endpoints, { method: 'POST', body: distroData });
  // normalize response: if backend returns created object, return it; otherwise return distroData with generated id
  return resp;
  }

  deleteDistribution = async (distroId) => {
    const endpoints = [`/distributions/${distroId}`, `/projects/distributions/${distroId}`, `/distros/${distroId}`];
    return this.requestMultiple(endpoints.map(p => p), { method: 'DELETE' });
  }

  // Delete test run / test case / category / plan helpers
  deleteTestCase = async (testCaseId) => {
    return this.request(`/test-cases/${testCaseId}`, { method: 'DELETE' });
  }

  deleteTestCaseCategory = async (categoryId) => {
    const endpoints = [`/test-case-categories/${categoryId}`, `/categories/${categoryId}`, `/projects/categories/${categoryId}`];
    return this.requestMultiple(endpoints, { method: 'DELETE' });
  }

  deleteTestPlan = async (planId) => {
    const endpoints = [`/test-plans/${planId}`, `/projects/test-plans/${planId}`];
    return this.requestMultiple(endpoints, { method: 'DELETE' });
  }
}

const apiService = new ApiService();
export default apiService;