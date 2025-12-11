const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.json());

// ==================== PROJECTS ====================
app.get('/api/v1/projects', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/v1/projects', async (req, res) => {
  const { name, description, test_environment, test_type } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO projects (name, description, test_environment, test_type) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description || null, test_environment || '', test_type || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating project:', err);
    if (err.code === '23505') { // unique violation
      return res.status(400).json({ error: 'Project name already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/v1/projects/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching project:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/v1/projects/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, test_environment, test_type } = req.body;

  try {
    const result = await pool.query(
      'UPDATE projects SET name = COALESCE($1, name), description = COALESCE($2, description), test_environment = COALESCE($3, test_environment), test_type = COALESCE($4, test_type) WHERE id = $5 RETURNING *',
      [name, description, test_environment, test_type, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating project:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/v1/projects/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.status(204).end();
  } catch (err) {
    console.error('Error deleting project:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== TEST PLANS ====================
app.get('/api/v1/projects/:projectId/test-plans', async (req, res) => {
  const { projectId } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM test_plans WHERE project_name = (SELECT name FROM projects WHERE id = $1) ORDER BY id',
      [projectId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching test plans:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/v1/projects/:projectId/test-plans', async (req, res) => {
  const { projectId } = req.params;
  const { name, description, goals, scope, plan_version } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }

  try {
    const projectRes = await pool.query('SELECT name FROM projects WHERE id = $1', [projectId]);
    if (projectRes.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const projectName = projectRes.rows[0].name;
    const result = await pool.query(
      'INSERT INTO test_plans (project_name, name, description, goals, scope, plan_version) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [projectName, name, description || null, goals || null, scope || null, plan_version || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating test plan:', err);
    if (err.code === '23505') { // unique violation
      return res.status(400).json({ error: 'Test plan name already exists in this project' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/v1/test-plans/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, goals, scope, plan_version } = req.body;

  try {
    const result = await pool.query(
      'UPDATE test_plans SET name = COALESCE($1, name), description = COALESCE($2, description), goals = COALESCE($3, goals), scope = COALESCE($4, scope), plan_version = COALESCE($5, plan_version) WHERE id = $6 RETURNING *',
      [name, description, goals, scope, plan_version, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Test plan not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating test plan:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/v1/test-plans/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM test_plans WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Test plan not found' });
    }
    res.status(204).end();
  } catch (err) {
    console.error('Error deleting test plan:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== DISTRIBUTIONS ====================
app.get('/api/v1/projects/:projectId/distributions', async (req, res) => {
  const { projectId } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM distributions WHERE project_name = (SELECT name FROM projects WHERE id = $1) ORDER BY id',
      [projectId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching distributions:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/v1/projects/:projectId/distributions', async (req, res) => {
  const { projectId } = req.params;
  const { name, version, os_type, description } = req.body;

  if (!name || !version) {
    return res.status(400).json({ error: 'name and version are required' });
  }

  try {
    const projectRes = await pool.query('SELECT name FROM projects WHERE id = $1', [projectId]);
    if (projectRes.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const projectName = projectRes.rows[0].name;
    const result = await pool.query(
      'INSERT INTO distributions (project_name, name, version, os_type, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [projectName, name, version, os_type || '', description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating distribution:', err);
    if (err.code === '23505') { // unique violation
      return res.status(400).json({ error: 'Distribution already exists in this project' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/v1/distributions/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM distributions WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Distribution not found' });
    }
    res.status(204).end();
  } catch (err) {
    console.error('Error deleting distribution:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== TEST RUNS ====================
app.get('/api/v1/projects/:projectId/test-runs', async (req, res) => {
  const { projectId } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM test_runs WHERE project_name = (SELECT name FROM projects WHERE id = $1) ORDER BY id',
      [projectId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching test runs:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/v1/projects/:projectId/test-runs', async (req, res) => {
  const { projectId } = req.params;
  const { test_plan_name, name, run_type } = req.body;

  if (!test_plan_name || !name) {
    return res.status(400).json({ error: 'test_plan_name and name are required' });
  }

  try {
    const projectRes = await pool.query('SELECT name FROM projects WHERE id = $1', [projectId]);
    if (projectRes.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const projectName = projectRes.rows[0].name;
    const result = await pool.query(
      'INSERT INTO test_runs (project_name, test_plan_name, name, run_type) VALUES ($1, $2, $3, $4) RETURNING *',
      [projectName, test_plan_name, name, run_type || 'manual']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating test run:', err);
    if (err.code === '23505') { // unique violation
      return res.status(400).json({ error: 'Test run name already exists for this plan' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/v1/test-runs/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM test_runs WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Test run not found' });
    }
    res.status(204).end();
  } catch (err) {
    console.error('Error deleting test run:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== TEST RUNS CASES ====================
app.post('/api/v1/test-run-cases', async (req, res) => {
  const { project_name, test_plan_name, test_run_name, test_case_name, status } = req.body;

  if (!project_name || !test_plan_name || !test_run_name || !test_case_name || !status) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO test_run_cases (project_name, test_plan_name, test_run_name, test_case_name, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [project_name, test_plan_name, test_run_name, test_case_name, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating test run case:', err);
    if (err.code === '23505') { // unique violation
      return res.status(400).json({ error: 'Test case already exists in this run' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== OPENQA PROFILES ====================
app.get('/api/v1/projects/:projectId/openqa/profiles', async (req, res) => {
  const { projectId } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM openqa_profiles WHERE project_name = (SELECT name FROM projects WHERE id = $1) ORDER BY id',
      [projectId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching OpenQA profiles:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/v1/projects/:projectId/openqa/profiles', async (req, res) => {
  const { projectId } = req.params;
  const { name, base_url, description, mode, priority, configuration } = req.body;

  if (!name || !base_url) {
    return res.status(400).json({ error: 'name and base_url are required' });
  }

  try {
    const projectRes = await pool.query('SELECT name FROM projects WHERE id = $1', [projectId]);
    if (projectRes.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const projectName = projectRes.rows[0].name;
    const result = await pool.query(
      'INSERT INTO openqa_profiles (project_name, name, base_url, description, mode, priority, configuration) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [projectName, name, base_url, description || null, mode || null, priority || 1, configuration || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating OpenQA profile:', err);
    if (err.code === '23505') { // unique violation
      return res.status(400).json({ error: 'Profile name already exists in this project' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/v1/openqa/profiles/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM openqa_profiles WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.status(204).end();
  } catch (err) {
    console.error('Error deleting profile:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== REPORTS ====================
app.get('/api/v1/projects/:projectId/reports', async (req, res) => {
  const { projectId } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM reports WHERE project_name = (SELECT name FROM projects WHERE id = $1) ORDER BY report_date DESC',
      [projectId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/v1/projects/:projectId/reports', async (req, res) => {
  const { projectId } = req.params;
  const { name, test_environment, overall_status, description, results, recommendations, test_plan_name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }

  try {
    const projectRes = await pool.query('SELECT name FROM projects WHERE id = $1', [projectId]);
    if (projectRes.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const projectName = projectRes.rows[0].name;
    const result = await pool.query(
      'INSERT INTO reports (project_name, name, test_environment, overall_status, description, results, recommendations, test_plan_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [projectName, name, test_environment || null, overall_status || null, description || null, results || null, recommendations || null, test_plan_name || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating report:', err);
    if (err.code === '23505') { // unique violation
      return res.status(400).json({ error: 'Report name already exists in this project' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== HEALTH ====================
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// ==================== ERROR HANDLING ====================
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ==================== START SERVER ====================
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  console.log('Database connected!');
});
