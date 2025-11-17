const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.json());

// In-memory storage
const db = {
  projects: [],
  testCases: [],
  testCaseVersions: [],
  runs: [],
  openqaProfiles: [],
  testPlans: [],
  distributions: [],
  statuses: []
};

let ids = {
  project: 1,
  testCase: 1,
  version: 1,
  run: 1,
  profile: 1,
  plan: 1
};

// Helpers
function nextId(type) { return ids[type]++; }

// Basic routes
app.get('/api/v1/projects', (req, res) => {
  res.json(db.projects);
});

app.post('/api/v1/projects', (req, res) => {
  const p = { id: nextId('project'), name: req.body.name || `Project ${Date.now()}`, slug: req.body.slug || `project-${Date.now()}` };
  db.projects.push(p);
  res.status(201).json(p);
});

app.get('/api/v1/projects/:id', (req, res) => {
  const id = Number(req.params.id);
  const p = db.projects.find(x => x.id === id);
  if (!p) return res.status(404).json({ error: 'project not found' });
  res.json(p);
});

// Test cases
app.get('/api/v1/projects/:id/test-cases', (req, res) => {
  const pid = Number(req.params.id);
  const list = db.testCases.filter(tc => tc.project_id === pid);
  res.json(list);
});

app.post('/api/v1/projects/:id/test-cases', (req, res) => {
  const pid = Number(req.params.id);
  const body = req.body || {};
  // minimal validation
  if (!body.key && !body.Key) return res.status(400).json({ error: 'Key is required' });
  if (!body.title && !body.Title) return res.status(400).json({ error: 'Title is required' });

  const tc = {
    id: nextId('testCase'),
    project_id: pid,
    key: body.key || body.Key,
    title: body.title || body.Title,
    description: body.description || body.Description || '',
    created_at: new Date().toISOString()
  };
  db.testCases.push(tc);
  // If plan_id provided, attach this test case id to the plan
  if (body.plan_id) {
    const planId = Number(body.plan_id);
    const plan = db.testPlans.find(p => p.id === planId && p.project_id === pid);
    if (plan) {
      plan.test_case_ids = plan.test_case_ids || [];
      if (!plan.test_case_ids.includes(tc.id)) plan.test_case_ids.push(tc.id);
    }
  }
  res.status(201).json(tc);
});

// Versions
app.post('/api/v1/test-cases/:id/versions', (req, res) => {
  const id = Number(req.params.id);
  const vc = {
    id: nextId('version'),
    test_case_id: id,
    version: req.body.version || 1,
    title: req.body.title || req.body.Title || '',
    description: req.body.description || req.body.Description || '',
    created_at: new Date().toISOString()
  };
  db.testCaseVersions.push(vc);
  res.status(201).json(vc);
});

// GET versions for a test case
app.get('/api/v1/test-cases/:id/versions', (req, res) => {
  const id = Number(req.params.id);
  const list = db.testCaseVersions.filter(v => v.test_case_id === id);
  res.json(list);
});

// Runs
app.get('/api/v1/runs', (req, res) => {
  const projectId = req.query.project_id ? Number(req.query.project_id) : null;
  if (projectId) {
    const list = db.runs.filter(r => r.project_id === projectId).map(r => {
      const testIds = r.test_case_ids || r.testCaseIds || [];
      const tests = Array.isArray(testIds) ? testIds.map(id => db.testCases.find(tc => tc.id === Number(id))).filter(Boolean) : [];
      return { ...r, tests };
    });
    return res.json(list);
  }
  const list = db.runs.map(r => {
    const testIds = r.test_case_ids || r.testCaseIds || [];
    const tests = Array.isArray(testIds) ? testIds.map(id => db.testCases.find(tc => tc.id === Number(id))).filter(Boolean) : [];
    return { ...r, tests };
  });
  res.json(list);
});

app.post('/api/v1/runs', (req, res) => {
  const body = req.body || {};
  const test_case_ids = Array.isArray(body.test_case_ids) ? body.test_case_ids.map(x => Number(x)) : (body.test_case_ids ? [Number(body.test_case_ids)] : []);

  const run = {
    id: nextId('run'),
    project_id: Number(body.project_id) || null,
    name: body.name || body.title || `Run ${Date.now()}`,
    status: body.status || 'queued',
    run_type: body.run_type || body.type || body.RunType || 'manual',
    openqa_profile_id: body.openqa_profile_id || body.OpenQAProfileID || null,
    test_case_ids,
    created_at: new Date().toISOString()
  };

  // attach lightweight test objects if test cases exist in DB
  run.tests = test_case_ids.map(id => db.testCases.find(tc => tc.id === Number(id))).filter(Boolean);

  db.runs.push(run);
  res.status(201).json(run);
});

// OpenQA profiles
app.get('/api/v1/projects/:id/openqa/profiles', (req, res) => {
  const pid = Number(req.params.id);
  res.json(db.openqaProfiles ? db.openqaProfiles.filter(p => p.project_id === pid) : []);
});

app.post('/api/v1/projects/:id/openqa/profiles', (req, res) => {
  const pid = Number(req.params.id);
  const body = req.body || {};
  if (!body.name && !body.Name) return res.status(400).json({ error: 'name required' });
  const profile = {
    id: nextId('profile'),
    project_id: pid,
    name: body.name || body.Name,
    base_url: body.base_url || body.BaseURL || body.baseUrl || '',
    api_key: body.api_key || body.apiKey || null
  };
  db.openqaProfiles.push(profile);
  res.status(201).json(profile);
});

// Test plans
app.get('/api/v1/projects/:id/test-plans', (req, res) => {
  const pid = Number(req.params.id);
  const list = db.testPlans.filter(p => p.project_id === pid).map(plan => ({
    ...plan,
    test_case_ids: plan.test_case_ids || [],
    tests: (plan.test_case_ids || []).map(id => db.testCases.find(tc => tc.id === Number(id))).filter(Boolean)
  }));
  res.json(list);
});
app.post('/api/v1/projects/:id/test-plans', (req, res) => {
  const pid = Number(req.params.id);
  const body = req.body || {};
  const plan = {
    id: nextId('plan'),
    project_id: pid,
    name: body.name || `Plan ${Date.now()}`,
    description: body.description || body.desc || '',
    version: body.version || body.ver || null,
    objective: body.objective || null,
    scope: body.scope || null,
    selected_distributions: Array.isArray(body.selected_distributions) ? body.selected_distributions.map(x => Number(x)) : (body.selected_distributions ? [Number(body.selected_distributions)] : [])
  };
  db.testPlans.push(plan);
  res.status(201).json(plan);
});

// Update test plan
app.put('/api/v1/test-plans/:id', (req, res) => {
  const id = Number(req.params.id);
  const body = req.body || {};
  const plan = db.testPlans.find(p => p.id === id);
  if (!plan) return res.status(404).json({ error: 'not found' });
  plan.name = body.name || plan.name;
  plan.description = body.description || plan.description || '';
  plan.version = body.version || plan.version || null;
  plan.objective = body.objective || plan.objective || null;
  plan.scope = body.scope || plan.scope || null;
  plan.selected_distributions = Array.isArray(body.selected_distributions) ? body.selected_distributions.map(x => Number(x)) : (body.selected_distributions || plan.selected_distributions || []);
  res.json(plan);
});

// Associate test-case with plan
app.post('/api/v1/test-plans/:id/test-cases', (req, res) => {
  const id = Number(req.params.id);
  const body = req.body || {};
  const plan = db.testPlans.find(p => p.id === id);
  if (!plan) return res.status(404).json({ error: 'plan not found' });
  const tcId = Number(body.test_case_id || body.testCaseId || body.test_case || body.testCase);
  if (!tcId) return res.status(400).json({ error: 'test_case_id required' });
  // keep simple: attach list of test_case_ids
  plan.test_case_ids = plan.test_case_ids || [];
  if (!plan.test_case_ids.includes(tcId)) plan.test_case_ids.push(tcId);
  res.status(201).json({ plan_id: plan.id, test_case_id: tcId });
});

// Project statuses
app.get('/api/v1/projects/:id/statuses', (req, res) => {
  const pid = Number(req.params.id);
  const list = db.statuses.filter(s => s.project_id === pid);
  res.json(list);
});

app.post('/api/v1/projects/:id/statuses', (req, res) => {
  const pid = Number(req.params.id);
  const body = req.body || {};
  const status = {
    id: nextId('plan'),
    project_id: pid,
    code: body.code || (body.name || 'status').toLowerCase().replace(/\s+/g,'_'),
    name: body.name || body.code || 'Unnamed status',
    category: body.category || 'general',
    color: body.color || null
  };
  db.statuses.push(status);
  res.status(201).json(status);
});

// Distributions (and alias distros)
app.get('/api/v1/projects/:id/distributions', (req, res) => {
  const pid = Number(req.params.id);
  const list = db.distributions.filter(d => d.project_id === pid);
  res.json(list);
});

app.post('/api/v1/projects/:id/distributions', (req, res) => {
  const pid = Number(req.params.id);
  const body = req.body || {};
  const distro = {
    id: nextId('plan'),
    project_id: pid,
    name: body.name || body.title || `distro-${Date.now()}`,
    description: body.description || ''
  };
  db.distributions.push(distro);
  res.status(201).json(distro);
});

// alias endpoint used by some frontends
app.post('/api/v1/projects/:id/distros', (req, res) => {
  // reuse distributions logic
  const pid = Number(req.params.id);
  const body = req.body || {};
  const distro = {
    id: nextId('plan'),
    project_id: pid,
    name: body.name || body.title || `distro-${Date.now()}`,
    description: body.description || ''
  };
  db.distributions.push(distro);
  res.status(201).json(distro);
});

// Basic deletes
app.delete('/api/v1/projects/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = db.projects.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  db.projects.splice(idx, 1);
  res.status(204).end();
});

app.delete('/api/v1/test-cases/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = db.testCases.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  db.testCases.splice(idx, 1);
  res.status(204).end();
});

// health
app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(port, () => console.log(`Back-mock listening on ${port}`));
