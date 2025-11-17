import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import ProjectModal from '../components/Dashboard/ProjectModal';
import ManualReportModal from '../components/Dashboard/ManualReportModal';
import TestRunModal from '../components/Dashboard/TestRunModal';
import ReportModal from '../components/Dashboard/ReportModal';
import TestCaseItemModal from '../components/Dashboard/TestCaseItemModal';
import TestCaseViewModal from '../components/Dashboard/TestCaseViewModal';
import TestCaseCategoryModal from '../components/Dashboard/TestCaseCategoryModal';
import HierarchicalPlanTree from '../components/Dashboard/HierarchicalPlanTree';
// TestCaseCategoryModal removed
import '../styles/global.css';
import '../styles/dashboard.css';
import '../styles/reports.css';
import TestPlanModal from '../components/Dashboard/TestPlanModal';
import DistributionModal from '../components/Dashboard/DistributionModal';
import TestExecutionModal from '../components/Dashboard/TestExecutionModal';
import UserManagementModal from '../components/Dashboard/UserManagementModal';
import { getRoleDisplayName } from '../utils/roles';
import apiService from '../services/api';
import { useToast } from '../components/UI/ToastContext';

const Dashboard = ({ currentUser, onLogout, theme, toggleTheme, hasPermission }) => {
  // Состояния
  const [activeTab, setActiveTab] = useState('test-cases');
  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [testCases, setTestCases] = useState([]);
  const [testCaseGroups, setTestCaseGroups] = useState([]);
  const [testRuns, setTestRuns] = useState([]);
  const [testPlans, setTestPlans] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [manualReports, setManualReports] = useState([]);
  // categories removed
  const [currentPlanId, setCurrentPlanId] = useState(null);
  
  // Модальные окна
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTestRunModal, setShowTestRunModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedTestRun, setSelectedTestRun] = useState(null);
  const [showTestPlanModal, setShowTestPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showDistributionModal, setShowDistributionModal] = useState(false);
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [currentExecutingTestRun, setCurrentExecutingTestRun] = useState(null);
  const [showUserManagementModal, setShowUserManagementModal] = useState(false);
  // categories removed
  const [showTestCaseItemModal, setShowTestCaseItemModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showManualReportModal, setShowManualReportModal] = useState(false);
  const [modalDefaultGroupId, setModalDefaultGroupId] = useState(null);
  const [showTestCaseView, setShowTestCaseView] = useState(false);
  const [viewingTestCase, setViewingTestCase] = useState(null);
  
  // UI состояния
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draggedTestCase, setDraggedTestCase] = useState(null);
  const [dragOverGroupId, setDragOverGroupId] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [users, setUsers] = useState([]);
  const [creatingDistribution, setCreatingDistribution] = useState(false);
  const [expandedPlans, setExpandedPlans] = useState({});
  const [expandedRuns, setExpandedRuns] = useState({});
  const [visibleCounts, setVisibleCounts] = useState({ total: 0, passed: 0, failed: 0, running: 0 });
  // фильтрация будет происходить автоматически, когда выбран план

  const { addToast } = useToast();

  const handleDeleteProject = async (projectId) => {
    if (!projectId) return;
    if (!window.confirm('Вы уверены, что хотите удалить проект? Это действие необратимо.')) return;
    try {
      await apiService.deleteProject(projectId);
      setProjects(prev => (Array.isArray(prev) ? prev.filter(p => p.id !== projectId) : []));
      if (currentProjectId === projectId) {
        setCurrentProjectId((Array.isArray(projects) && projects.length > 0) ? projects[0].id : null);
      }
      addToast('Проект успешно удалён', 'success');
    } catch (err) {
      console.error('Failed to delete project:', err);
      addToast('Не удалось удалить проект', 'error');
    }
  };

  
  useEffect(() => {
    initializeData();
  }, []);


      
  useEffect(() => {
    if (currentProjectId) {
      loadProjectData(currentProjectId);
    }
  }, [currentProjectId]);

  const initializeData = async () => {
  try {
    setLoading(true);
    setError(null);

    // Load projects first so we have a currentProjectId
    const projectsData = await loadProjects();

    // Ensure currentProjectId is set from loaded projects if not present
    const pid = projectsData && projectsData.length > 0 ? (currentProjectId || projectsData[0].id) : currentProjectId;
    if (pid && !currentProjectId) {
      setCurrentProjectId(pid);
    }

    // Load users and distributions for the selected project
    await Promise.all([
      loadUsers(),
      loadDistributions(pid)
    ]);

    if (pid) {
      await loadProjectData(pid);
    }

  } catch (err) {
    console.error('Failed to initialize data:', err);
    setError('Ошибка загрузки данных. Проверьте подключение к серверу.');
    
    
  addToast('Не удалось загрузить данные. Проверьте подключение к интернету.', 'error');
  } finally {
    setLoading(false);
  }
};

const handleApiError = (err, context) => {
  console.error(`Failed to ${context}:`, err);
  
  if (err.response) {
    switch (err.response.status) {
      case 401:
        return 'Требуется авторизация';
      case 403:
        return `Недостаточно прав для ${context}`;
      case 404:
        return `Ресурс не найден (${context})`;
      case 500:
        return `Ошибка сервера при ${context}`;
      default:
        return `Ошибка ${err.response.status} при ${context}`;
    }
  } else if (err.request) {
    return 'Нет соединения с сервером';
  } else {
    return `Ошибка при ${context}`;
  }
};


  const loadProjects = async () => {
    try {
      const projectsData = await apiService.listProjects();
      setProjects(projectsData);
      
      if (projectsData.length > 0 && !currentProjectId) {
        setCurrentProjectId(projectsData[0].id);
      }
  return projectsData;
    } catch (err) {
      console.error('Failed to load projects:', err);
      
      setCurrentProjectId(1);
    }
  };

  const loadProjectData = async (projectId) => {
    try {
      await Promise.all([
        loadTestCases(projectId),
        loadTestRuns(projectId),
        loadTestPlans(projectId),
        loadDistributions(projectId),
        loadProjectStatuses(projectId)
      ]);
    } catch (err) {
      console.error('Failed to load project data:', err);
    }
  };

const loadTestCases = async (projectId) => {
  try {
    const testCasesData = await apiService.listTestCases(projectId);
    // Optionally enrich with latest_version if backend supports versions listing
    const enriched = await Promise.all((testCasesData || []).map(async (tc) => {
      try {
        const versions = await apiService.listTestCaseVersions(tc.id);
        const latest = Array.isArray(versions) && versions.length ? versions.sort((a,b)=>b.version-a.version)[0] : null;
        return { ...tc, latest_version: latest };
      } catch (e) {
        return { ...tc, latest_version: null };
      }
    }));
    setTestCases(enriched);
  } catch (err) {
    console.error('Failed to load test cases:', err);
    setTestCases([]);
  }
};

const loadTestPlans = async (projectId) => {
  try {
    const plans = await apiService.listTestPlans(projectId) || [];
    // normalize to include projectId for consistent filtering in UI
    const formatted = plans.map(p => ({
      ...p,
      projectId: p.project_id || p.projectId || projectId,
  selectedDistributions: (p.selected_distributions || p.selectedDistributions || []).map(id => Number(id))
    }));
    setTestPlans(formatted);
    return formatted;
  } catch (err) {
    console.error('Failed to load test plans:', err);
    setTestPlans([]);
    return [];
  }
};

const loadTestRuns = async (projectId) => {
  try {
    const testRunsData = await apiService.listTestRuns(projectId);

    const formattedTestRuns = (testRunsData || []).map(testRun => ({
      id: testRun.id,
      projectId: testRun.project_id || projectId,
      name: testRun.name,
      description: testRun.description || '',
      // prefer run_type from backend, fall back to various aliases; default to 'manual'
      type: testRun.run_type || testRun.type || testRun.RunType || 'manual',
  planId: testRun.plan_id || testRun.planId || null,
      status: testRun.status || 'not-run',
      date: testRun.created_at ? new Date(testRun.created_at).toLocaleString() : new Date().toLocaleString(),
      tests: testRun.test_cases || testRun.tests || [],
      passed: testRun.passed_count || testRun.passed || 0,
      failed: testRun.failed_count || testRun.failed || 0,
      total: testRun.total_tests || testRun.tests?.length || 0,
      started_at: testRun.started_at || null,
      finished_at: testRun.finished_at || testRun.completed_at || null
    }));

    setTestRuns(formattedTestRuns);
  } catch (err) {
    console.error('Failed to load test runs:', err);
    setTestRuns([]);
  }
};

const loadProjectStatuses = async (projectId) => {
  try {
    const statuses = await apiService.listProjectStatuses(projectId);
    
    
    if (statuses && statuses.length > 0) {
      const latestStatus = statuses[statuses.length - 1]; 
      setProjects(prev => prev.map(project => 
        project.id === projectId 
          ? { ...project, status: latestStatus.status }
          : project
      ));
    }
    
  } catch (err) {
    console.error('Failed to load project statuses:', err);
  }
};

const loadUsers = async () => {
  try {
    if (!hasPermission(currentUser, 'viewUsers')) {
      setUsers([currentUser]);
      return;
    }
    
    const usersData = await apiService.listUsers();
    
    const formattedUsers = usersData.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      assignedProjects: user.assigned_projects || [],
      isActive: user.is_active !== false,
      lastLogin: user.last_login
    }));
    
    setUsers(formattedUsers);
    
  } catch (err) {
    console.error('Failed to load users:', err);
    setUsers([currentUser]);
  }
};

const loadDistributions = async (projectIdParam) => {
  try {
    const pid = projectIdParam || currentProjectId;
    if (!pid) {
      setDistributions([]);
      return [];
    }

    if (!hasPermission(currentUser, 'viewDistributions')) {
  // Не затираем локальный state — если у пользователя нет права просмотра,
  // оставим предыдущий список (возможно оптимистично добавлённых элементов).
  return distributions || [];
    }

    const distributionsData = await apiService.listDistributions(pid) || [];

    const formattedDistributions = distributionsData.map(dist => ({
  id: dist.id,
  projectId: Number(dist.project_id || pid),
      name: dist.name,
      version: dist.version,
      type: dist.type || 'release',
      status: dist.status || 'stable',
      description: dist.description || '',
      downloadUrl: dist.download_url,
      createdAt: dist.created_at
    }));

    setDistributions(formattedDistributions);
    return formattedDistributions;

  } catch (err) {
    console.error('Failed to load distributions:', err);
    setDistributions([]);
    return [];
  }
};

  
  const hasAccessToCurrentProject = () => {
    if (!currentUser) return false;
    if (currentUser.role === 'senior_admin') return true;
    if (currentUser.role === 'admin') {
      return currentUser.assignedProjects?.includes(currentProjectId) || true;
    }
    return true;
  };

  const canCreate = (type) => {
    if (!currentUser) return false;
    
    const permissions = {
      'project': hasPermission(currentUser, 'createProject'),
      'testRun': hasPermission(currentUser, 'createTestRun') && hasAccessToCurrentProject(),
      'testCase': hasPermission(currentUser, 'createTestCase') && hasAccessToCurrentProject(),
      'testPlan': hasPermission(currentUser, 'createTestPlan') && hasAccessToCurrentProject(),
      'report': hasPermission(currentUser, 'createTestRun') && hasAccessToCurrentProject(),
    };
    
    return permissions[type] || false;
  };

  const canRun = () => {
    return hasPermission(currentUser, 'runTestRun') && hasAccessToCurrentProject();
  };

  const canManageUsers = () => {
    return hasPermission(currentUser, 'manageUsers');
  };

  const canManageDistributions = () => {
    // Показ управления дистрибутивами — для пользователей с соответствующим правом
    // или для тех, кто может управлять проектами/планами (более широкий доступ)
    if (!currentUser) return false;
    return hasPermission(currentUser, 'manageDistributions') || hasPermission(currentUser, 'createProject') || hasPermission(currentUser, 'createTestPlan');
  };

  
const createProject = async (projectData) => {
  console.log('createProject called with:', projectData); 
  
    if (!canCreate('project')) {
    addToast('У вас нет прав для создания проектов', 'error');
    return;
  }

    try {
    console.log('Sending API request...'); 
    // ensure slug present — backend requires Slug
    const slugify = (s = '') => s.toString().toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const slug = projectData.slug || slugify(projectData.name);

    const payload = {
      name: projectData.name,
      slug,
      description: projectData.description,
      environment: projectData.environment,
      environment1: projectData.environment1,
    };
    console.debug('createProject payload:', payload);
    const newProject = await apiService.createProject(payload);

    console.log('API response:', newProject); 

  setProjects(prev => ([...(Array.isArray(prev) ? prev : []), newProject]));
    setCurrentProjectId(newProject.id);
  setShowProjectModal(false);
  addToast('Проект успешно создан!', 'success');
  } catch (err) {
    console.error('Failed to create project:', err);
    addToast('Не удалось создать проект на сервере', 'error');
  }
};

  // categories removed

  // Временные тест-кейсы удалены — используйте обычные createTestCase / createTestCaseInCategory

  // Метод создания тест-кейса (раньше: createTestCaseInCategory)
  const createTestCase = async (testCaseData) => {
    if (!canCreate('testCase')) {
      addToast('У вас нет прав для создания тест-кейсов', 'error');
      return;
    }
    try {
        // create only test case
      const payload = { ...testCaseData };
      // attach group information if provided
      if (testCaseData.groupId) payload.group_id = testCaseData.groupId;
  if (currentPlanId) payload.plan_id = currentPlanId;
  let created = null;
  try {
    created = await apiService.createTestCase(currentProjectId, payload);
  } catch (err) {
    console.warn('createTestCase: API create failed, will create local test-case object', err);
  }

  // If backend did not attach plan info, ensure the created object has the current plan set
    if (created) {
    if ((!created.plan_id && !created.planId) && currentPlanId) {
      // attach plan id so UI will show it under the selected plan
      created.plan_id = currentPlanId;
      created.planId = currentPlanId;
    }
    // attach group info if API didn't include it but we provided one
    if (testCaseData.groupId && !(created.group_id || created.group)) {
      const g = (testCaseGroups || []).find(x => String(x.id) === String(testCaseData.groupId));
      created.group_id = testCaseData.groupId;
      created.group = g ? g.name : null;
      created.category = g ? g.name : null;
      // ensure the test-case plan follows the group plan (groups are plan-scoped)
      if (g && (g.plan_id || g.planId)) {
        created.plan_id = g.plan_id || g.planId;
        created.planId = g.plan_id || g.planId;
      }
    }
    // If server didn't return a latest_version but we provided initial_version, attach it so UI can display steps/expected
    if ((!created.latest_version || Object.keys(created.latest_version).length === 0) && testCaseData && testCaseData.initial_version) {
      created.latest_version = created.latest_version || {};
      // copy fields from provided initial_version where missing on created.latest_version
      const iv = testCaseData.initial_version;
      created.latest_version.version = iv.version || iv.Version || created.latest_version.version;
      created.latest_version.title = created.latest_version.title || iv.title || iv.Title || created.title || created.key;
      created.latest_version.description = created.latest_version.description || iv.description || iv.Description || created.description || '';
      created.latest_version.steps = created.latest_version.steps || iv.steps || iv.Steps || '';
      created.latest_version.expected = created.latest_version.expected || iv.expected || iv.Expected || '';
      created.latest_version.priority = created.latest_version.priority || iv.priority || iv.Priority || 'low';
      // also ensure top-level title/description exist for older UI consumers
      created.title = created.title || created.latest_version.title;
      created.description = created.description || created.latest_version.description;
    }
  } else {
    // create a local fallback test-case so UI remains responsive
      created = {
      id: `local-tc-${Date.now()}`,
      key: payload.key || `TC-${Date.now()}`,
      title: payload.Title || payload.title || payload.name || '',
      description: payload.Description || payload.description || '',
      project_id: currentProjectId,
      plan_id: currentPlanId || null,
      group_id: payload.group_id || null,
      group: payload.group || null,
      category: payload.group || null,
      latest_version: payload.initial_version || null
    };
    addToast('Тест-кейс создан локально (сервер не вернул объект)', 'warning');
  }

  // if initial version provided, try creating version
  if (created && created.id && testCaseData && testCaseData.initial_version) {
        try {
          const v = await apiService.addTestCaseVersion(created.id, testCaseData.initial_version);
          created.latest_version = v || created.latest_version;
        } catch (verr) {
          console.warn('Failed to add initial version for test case:', verr);
        }
      }

  setTestCases(prev => ([...(Array.isArray(prev) ? prev : []), created]));
  setShowTestCaseItemModal(false);
      addToast('Тест-кейс успешно создан.', 'success');
    } catch (err) {
      console.error('Failed to create test case:', err);
      addToast('Не удалось создать тест-кейс', 'error');
    }
  };

  const handleCreateRun = async (formData) => {
  console.debug('handleCreateRun called with', formData);
    if (!canCreate('testRun')) {
      addToast('У вас нет прав для создания тест-ранов', 'error');
      return;
    }

    // prepare payload so we can reuse it for local fallback
    // Backend requires OpenQAProfileID and RunType (validated server-side).
    let openqaProfiles = [];
    try {
      openqaProfiles = await apiService.listOpenQAProfiles(currentProjectId) || [];
    } catch (e) {
      // ignore — we'll handle empty list below
      openqaProfiles = [];
    }

    // For automatic runs, an OpenQA profile is required; for manual runs it's optional
    let openqaId = null;
    if (formData.type === 'automatic') {
      if (!openqaProfiles || openqaProfiles.length === 0) {
        addToast('Нужен OpenQA профиль для автоматического прогона. Создайте OpenQA профиль в настройках проекта.', 'error');
        return;
      }
      openqaId = openqaProfiles[0].id;
    }

    const payload = {
      project_id: currentProjectId,
      name: formData.name,
      description: formData.description,
    type: formData.type,
    run_type: formData.type === 'automatic' ? 'automatic' : 'manual',
      OpenQAProfileID: openqaId,
  test_case_ids: formData.selectedTestCases,
  plan_id: currentPlanId || null
    };

    // require at least one selected test case
    if (!formData.selectedTestCases || formData.selectedTestCases.length === 0) {
      addToast('Выберите тест-кейсы для запуска', 'error');
      return;
    }

    try {
      const res = await apiService.createRun(payload);
      console.debug('createRun response:', res);

      // If the server did not persist plan_id, attach it locally so run is visible under the selected plan
      let createdRun = res;
      if (createdRun && !(createdRun.plan_id || createdRun.planId) && currentPlanId) {
        createdRun.plan_id = currentPlanId;
        createdRun.planId = currentPlanId;
      }

      if (createdRun && createdRun.id) {
        // try to reload runs from server; if server did not persist plan info, also add local fallback
        try {
          await loadTestRuns(currentProjectId);
          // ensure run appears under plan filter by checking and adding locally if missing
          const exists = (testRuns || []).some(r => String(r.id) === String(createdRun.id));
          if (!exists) {
            setTestRuns(prev => ([...(Array.isArray(prev) ? prev : []), createdRun]));
          }
        } catch (e) {
          setTestRuns(prev => ([...(Array.isArray(prev) ? prev : []), createdRun]));
        }
      } else {
        // server didn't return id — create a temporary local run
        const tempRun = {
          id: `local-run-${Date.now()}`,
          projectId: currentProjectId,
          name: payload.name,
          description: payload.description,
          type: payload.run_type,
          planId: currentPlanId || null,
          plan_id: currentPlanId || null,
          status: payload.status || 'queued',
          tests: payload.test_case_ids || []
        };
        setTestRuns(prev => ([...(Array.isArray(prev) ? prev : []), tempRun]));
        addToast('Тест-ран создан локально (сервер не вернул объект)', 'warning');
      }

      setShowTestRunModal(false);
    } catch (err) {
      console.error('Failed to create test run:', err);
      addToast('Не удалось создать тест-ран на сервере', 'error');
    }
  };

  const runTestRun = async (testRunId) => {
    if (!canRun()) {
      addToast('У вас нет прав для запуска тест-ранов', 'error');
      return;
    }

  const testRun = Array.isArray(testRuns) ? testRuns.find(run => run.id === testRunId) : null;
    if (!testRun) return;

    const runType = (testRun.run_type || testRun.type || '').toString().toLowerCase();
    const isManual = ['manual', 'hand', 'human'].includes(runType) || runType.startsWith('man');
    if (isManual) {
      runManualTestRun(testRunId);
    } else {
      await startAutomatedTestRun(testRunId);
    }
  };

  const toggleRunExpanded = (runId) => {
    setExpandedRuns(prev => ({ ...prev, [runId]: !prev[runId] }));
  };

  const runManualTestRun = (testRunId) => {
  const testRun = Array.isArray(testRuns) ? testRuns.find(run => run.id === testRunId) : null;
    
    if (!testRun || !testRun.tests || testRun.tests.length === 0) {
      addToast('В тест-ране нет тест-кейсов для выполнения', 'error');
      return;
    }

    setTestRuns(prev =>
      prev.map(run =>
        run.id === testRunId
          ? {
              ...run,
              status: "running",
              tests: run.tests.map(test => ({ 
                ...test, 
                status: "not-run",
                passed: false,
                steps: test.steps || [],
                stepResults: test.stepResults || []
              })),
              passed: 0,
              failed: 0,
              startTime: new Date().toISOString()
            }
          : run
      )
    );

    // Also update global testCases state so dashboard stats reflect running tests
    try {
      const runTestIds = (testRun.tests || []).map(t => ({ id: t.id, key: t.key }));
      setTestCases(prev => (Array.isArray(prev) ? prev.map(tc => {
        // match by id or key
        const found = runTestIds.find(r => (r.id !== undefined && r.id !== null && String(r.id) !== '' && String(r.id) === String(tc.id)) || (r.key && String(r.key) === String(tc.key)));
        if (found) {
          return { ...tc, status: 'running' };
        }
        return tc;
      }) : prev));
    } catch (e) {
      console.warn('runManualTestRun: failed to update global testCases status', e);
    }

    setCurrentExecutingTestRun(testRunId);
    setShowExecutionModal(true);
  };

  const startAutomatedTestRun = async (testRunId) => {
    try {
      setTestRuns(prevRuns =>
        prevRuns.map(run => {
          if (run.id !== testRunId) return run;
          
          const updatedTests = run.tests.map(test => ({
            ...test,
            status: 'running'
          }));
          
          return { ...run, status: 'running', tests: updatedTests };
        })
      );

      
      setTimeout(() => {
        completeAutomatedTestRun(testRunId);
      }, 3000);

    } catch (err) {
      console.error('Failed to start automated test run:', err);
    }
  };

  const completeAutomatedTestRun = (testRunId) => {
    setTestRuns(prevRuns =>
      prevRuns.map(run => {
        if (run.id !== testRunId) return run;
        
        const updatedTests = run.tests.map(test => {
          const passed = Math.random() > 0.3;
          return {
            ...test,
            status: passed ? 'passed' : 'failed',
            passed: passed
          };
        });
        
        const passedCount = updatedTests.filter(t => t.passed).length;
        const failedCount = updatedTests.filter(t => !t.passed).length;
        
        return {
          ...run, 
          status: 'completed', 
          tests: updatedTests,
          passed: passedCount,
          failed: failedCount,
          endTime: new Date().toISOString()
        };
      })
    );
  };

  const handleTestRunExecutionComplete = (executionData) => {
    console.debug('Dashboard.handleTestRunExecutionComplete received:', executionData);
    const { testRunId, results } = executionData;
    
    setTestRuns(prev =>
      prev.map(run => {
        if (run.id !== testRunId) return run;
        
        // build lookup maps for results: by numeric id and by key
        const byIdMap = {};
        const byKeyMap = {};
        if (results && Array.isArray(results)) {
          results.forEach(r => {
            if (r.testCaseId !== null && r.testCaseId !== undefined) {
              byIdMap[String(r.testCaseId)] = r;
            }
            if (r.testCaseKey !== null && r.testCaseKey !== undefined) {
              byKeyMap[String(r.testCaseKey)] = r;
            }
          });
        }

        const updatedTests = run.tests.map((test, idx) => {
          // prepare possible keys that TestExecutionModal may have used
          const possibleKeys = [];
          if (test && (test.id !== undefined && test.id !== null)) possibleKeys.push(String(test.id));
          if (test && test.key) possibleKeys.push(String(test.key));
          if (test && test.latest_version && (test.latest_version.id !== undefined && test.latest_version.id !== null)) possibleKeys.push(String(test.latest_version.id));
          if (test && test.latest_version && test.latest_version.key) possibleKeys.push(String(test.latest_version.key));
          possibleKeys.push(`tc-${idx}`);

          // find result by id first
          let result = null;
          if (test && test.id !== undefined && test.id !== null) {
            result = byIdMap[String(test.id)];
          }

          // if not found by id, try keys
          if (!result) {
            for (const k of possibleKeys) {
              if (byKeyMap[k]) { result = byKeyMap[k]; break; }
            }
          }

          if (!result) return test;

          // Merge stepResults/passed fields without overwriting existing identifiers
          const merged = {
            ...test,
            passed: result.passed !== undefined ? result.passed : test.passed,
            stepResults: result.stepResults || test.stepResults || [],
            completed: true
          };
          return merged;
        });
        
        const passedCount = updatedTests.filter(t => t.passed).length;
        const failedCount = updatedTests.filter(t => !t.passed).length;
        
        return {
          ...run,
          tests: updatedTests,
          passed: passedCount,
          failed: failedCount,
          status: 'completed',
          endTime: new Date().toISOString()
        };
      })
    );

    // Update global testCases statuses so the dashboard counts (in process / completed / waiting) update
    try {
      setTestCases(prev => {
        if (!Array.isArray(prev)) return prev;
        // build result maps
        const byId = {};
        const byKey = {};
        if (results && Array.isArray(results)) {
          results.forEach(r => {
            if (r.testCaseId !== null && r.testCaseId !== undefined) byId[String(r.testCaseId)] = r;
            if (r.testCaseKey !== null && r.testCaseKey !== undefined) byKey[String(r.testCaseKey)] = r;
          });
        }

        return prev.map((tc, idx) => {
          // possible keys the modal may have used
          const possibleKeys = [];
          if (tc && (tc.id !== undefined && tc.id !== null)) possibleKeys.push(String(tc.id));
          if (tc && tc.key) possibleKeys.push(String(tc.key));
          possibleKeys.push(`tc-${idx}`);

          // find result
          let res = null;
          if (tc && tc.id !== undefined && tc.id !== null) res = byId[String(tc.id)];
          if (!res) {
            for (const k of possibleKeys) {
              if (byKey[k]) { res = byKey[k]; break; }
            }
          }

          if (!res) return tc;

          // update status/passed
          const passed = res.passed === true;
          return {
            ...tc,
            status: passed ? 'passed' : 'failed',
            passed: passed,
            stepResults: res.stepResults || tc.stepResults || []
          };
        });
      });
    } catch (e) {
      console.warn('handleTestRunExecutionComplete: failed to update global testCases', e);
    }

  setShowExecutionModal(false);
  setCurrentExecutingTestRun(null);
  addToast('Тест-ран завершен!', 'success');
  };

  const deleteTestRun = (testRunId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот тест-ран?')) return;
    const remove = async () => {
      try {
        await apiService.deleteRun(testRunId);
        // Refresh runs from server
        await loadTestRuns(currentProjectId);
        addToast('Тест-ран удалён', 'success');
        // If deleted run was the one currently executing, clear execution state
        if (currentExecutingTestRun && String(currentExecutingTestRun) === String(testRunId)) {
          setCurrentExecutingTestRun(null);
          setShowExecutionModal(false);
        }
      } catch (err) {
        console.warn('deleteTestRun: API delete failed, removing run locally', err);
        // Fallback: remove run locally so UI reflects deletion even if backend mock doesn't support it
        setTestRuns(prev => (Array.isArray(prev) ? prev.filter(r => String(r.id) !== String(testRunId)) : []));
        if (currentExecutingTestRun && String(currentExecutingTestRun) === String(testRunId)) {
          setCurrentExecutingTestRun(null);
          setShowExecutionModal(false);
        }
        addToast('Тест-ран удалён локально', 'warning');
      }
    };
    remove();
  };

  const deleteTestCase = (testCaseId, categoryId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот тест-кейс?')) return;
    const remove = async () => {
      try {
  await apiService.deleteTestCase(testCaseId);
  await loadTestCases(currentProjectId);
  addToast('Тест-кейс успешно удалён', 'success');
      } catch (err) {
        console.error('Failed to delete test case:', err);
  addToast('Не удалось удалить тест-кейс', 'error');
      }
    };
    remove();
  };

  // Group management: create/delete/move groups locally (backend may not support categories)
  const createTestCaseGroup = (groupData) => {
    // Ensure group is bound to a specific plan. If no plan selected in modal, default to currentPlanId.
    const planIdForGroup = groupData.plan_id || currentPlanId || null;
    const group = {
      id: groupData.id || `local-group-${Date.now()}`,
      name: groupData.name,
      description: groupData.description || '',
      plan_id: planIdForGroup,
      projectId: currentProjectId
    };
    setTestCaseGroups(prev => ([...(Array.isArray(prev) ? prev : []), group]));
    addToast('Группа тест-кейсов создана', 'success');
  };

  const deleteTestCaseGroup = (groupId) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту группу? Тест-кейсы останутся без группы.')) return;
    setTestCaseGroups(prev => (Array.isArray(prev) ? prev.filter(g => String(g.id) !== String(groupId)) : []));
    // Unassign group from test cases
    setTestCases(prev => (Array.isArray(prev) ? prev.map(tc => (String(tc.group_id) === String(groupId) ? { ...tc, group_id: null, group: null, category: null } : tc)) : prev));
    addToast('Группа удалена. Тест-кейсы перемещены в раздел "Без группы".', 'warning');
  };

  const moveTestCaseToGroup = (testCaseId, targetGroupId) => {
    // If targetGroupId is null/empty, unassign group but keep plan_id as-is
    const target = (testCaseGroups || []).find(g => String(g.id) === String(targetGroupId));

    console.debug('moveTestCaseToGroup called', { testCaseId, targetGroupId, target });

    const matchTestCase = (tc, id) => {
      if (tc == null) return false;
      const candidates = [];
      if (tc.id !== undefined && tc.id !== null) candidates.push(String(tc.id));
      if (tc.key) candidates.push(String(tc.key));
      if (tc.latest_version && tc.latest_version.id) candidates.push(String(tc.latest_version.id));
      if (tc.latest_version && tc.latest_version.key) candidates.push(String(tc.latest_version.key));
      // also allow matching by provided id/key strings
      return candidates.includes(String(id));
    };

    setTestCases(prev => (Array.isArray(prev) ? prev.map(tc => {
      if (matchTestCase(tc, testCaseId)) {
        if (!targetGroupId) {
          return { ...tc, group_id: null, group: null, category: null };
        }
        // Prevent moving into a group that belongs to another plan
        if (target && currentPlanId && String(target.plan_id) !== String(currentPlanId)) {
          addToast('Нельзя перемещать кейс в группу другого тест-плана', 'error');
          return tc;
        }
        // Apply group and ensure test-case plan follows the group's plan
        return { ...tc, group_id: targetGroupId, group: target ? target.name : null, category: target ? target.name : null, plan_id: target ? (target.plan_id || target.planId) : tc.plan_id };
      }
      return tc;
    }) : prev));
    addToast('Тест-кейс перемещён в выбранную группу', 'success');
  };

  // categories/groups removed: functionality no longer available

  const saveManualReport = (reportData) => {
    const newReport = {
      id: Date.now(),
      ...reportData,
      projectId: currentProjectId
    };
    setManualReports([...manualReports, newReport]);
  setShowManualReportModal(false);
  addToast('Отчет успешно сохранен!', 'success');
  };

  const handleViewTestCase = (testCase) => {
    // If caller passed a primitive id/key or a minimal object, try to resolve full object from global testCases
    let resolved = testCase;
    try {
      if (!testCase) {
        resolved = null;
      } else if (typeof testCase === 'string' || typeof testCase === 'number') {
        resolved = (testCases || []).find(tc => String(tc.id) === String(testCase) || String(tc.key) === String(testCase)) || { id: testCase };
      } else if (typeof testCase === 'object') {
        // if object doesn't contain title/description, try to find richer record
        const hasTitle = !!(testCase.title || testCase.Title || (testCase.latest_version && (testCase.latest_version.title || testCase.latest_version.description)));
        if (!hasTitle) {
          const candidates = [];
          if (testCase.id) candidates.push(String(testCase.id));
          if (testCase.testCaseId) candidates.push(String(testCase.testCaseId));
          if (testCase.key) candidates.push(String(testCase.key));
          let found = null;
          for (const c of candidates) {
            found = (testCases || []).find(tc => String(tc.id) === c || (tc.latest_version && String(tc.latest_version.id) === c) || String(tc.key) === c);
            if (found) { resolved = { ...found, ...testCase }; break; }
          }
          if (!found) {
            // try by nested shapes
            const keyCandidates = [testCase.testCaseKey, testCase.test_case_key, testCase.tcKey].filter(Boolean);
            for (const k of keyCandidates) {
              const f = (testCases || []).find(tc => String(tc.key) === String(k) || (tc.latest_version && tc.latest_version.key && String(tc.latest_version.key) === String(k)));
              if (f) { resolved = { ...f, ...testCase }; break; }
            }
          }
        }
      }
    } catch (e) {
      console.warn('handleViewTestCase: resolution failed', e);
    }

    setViewingTestCase(resolved || testCase);
    setShowTestCaseView(true);
  };

  const closeViewTestCase = () => {
    setViewingTestCase(null);
    setShowTestCaseView(false);
  };

  const createTestPlan = (planData) => {
    const create = async () => {
      // client-side guard: if no distributions exist for project, block creation; otherwise require selection
      const availableDist = (distributions || []).filter(d => Number(d.projectId) === Number(currentProjectId));
      if (availableDist.length === 0) {
        addToast('Нельзя создать тест-план пока не добавлены дистрибутивы для проекта. Сначала добавьте дистрибутивы.', 'error');
        return;
      }
      if (!planData.selectedDistributions || planData.selectedDistributions.length === 0) {
        addToast('Выберите хотя бы один дистрибутив для тест-плана', 'error');
        return;
      }
      try {
        const payload = {
          name: planData.name,
          description: planData.description,
          version: planData.version,
          objective: planData.objective,
          scope: planData.scope,
          selected_distributions: planData.selectedDistributions || []
        };
        let created = null;
        try {
          created = await apiService.createTestPlan(currentProjectId, payload);
        } catch (err) {
          console.warn('createTestPlan: API create failed, will create local plan object as fallback', err);
        }

        // If backend didn't return a created object, create a local temporary plan
        if (!created || !created.id) {
          const temp = {
            id: `local-plan-${Date.now()}`,
            name: payload.name,
            description: payload.description,
            version: payload.version,
            objective: payload.objective,
            scope: payload.scope,
            projectId: currentProjectId,
            selectedDistributions: payload.selected_distributions || []
          };
          setTestPlans(prev => ([...(Array.isArray(prev) ? prev : []), temp]));
          setCurrentPlanId(temp.id);
          addToast('Тест-план добавлен локально (сервер не вернул объект)', 'warning');
        } else {
          // reload plans to reflect creation on server
          await loadTestPlans(currentProjectId);
          // if there are selected distributions, update the created plan to attach them
          if (payload.selected_distributions && payload.selected_distributions.length > 0 && created && created.id) {
            try {
              await apiService.updateTestPlan(created.id, { selected_distributions: payload.selected_distributions });
              await loadTestPlans(currentProjectId);
            } catch (e) {
              console.warn('Failed to attach distributions to created plan:', e);
            }
          }
          setCurrentPlanId(created.id);
          addToast('Тест-план успешно создан', 'success');
        }

        setShowTestPlanModal(false);
      } catch (err) {
        console.error('Failed to create test plan:', err);
        addToast('Не удалось создать тест-план на сервере', 'error');
      }
    };
    create();
  };

  const updateTestPlan = (planId, planData) => {
    const update = async () => {
      try {
        await apiService.updateTestPlan(planId, {
          name: planData.name,
          description: planData.description,
          selected_distributions: planData.selectedDistributions || []
        });
        await loadTestPlans(currentProjectId);
      } catch (err) {
        console.error('Failed to update test plan:', err);
        addToast('Не удалось обновить тест-план', 'error');
      }
    };
    update();
  };

  const editTestPlan = (plan) => {
    setEditingPlan(plan);
    setShowTestPlanModal(true);
  };

  const togglePlanExpanded = (planId) => {
    setExpandedPlans(prev => ({ ...prev, [planId]: !prev[planId] }));
  };

  const deleteTestPlan = (planId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот тест-план?')) return;
    const remove = async () => {
      try {
        await apiService.deleteTestPlan(planId);
        // reload server state
        await loadTestPlans(currentProjectId);
        // if deleted plan was selected, clear selection
        if (Number(currentPlanId) === Number(planId)) {
          setCurrentPlanId(null);
        }
        addToast('Тест-план удалён', 'success');
      } catch (err) {
        console.warn('deleteTestPlan: API delete failed, removing plan locally', err);
        // fallback: remove locally so UI reflects deletion even if backend mock doesn't support it
        setTestPlans(prev => (Array.isArray(prev) ? prev.filter(p => String(p.id) !== String(planId)) : []));
        if (String(currentPlanId) === String(planId)) setCurrentPlanId(null);
        addToast('Тест-план удалён локально', 'warning');
      }
    };
    remove();
  };

  const createDistribution = (distroData) => {
    const create = async () => {
  setCreatingDistribution(true);
      try {
  const created = await apiService.createDistribution(Number(currentProjectId), { ...distroData, project_id: Number(currentProjectId) });
  console.debug('createDistribution response:', created);
  if (created) {
          // Добавляем сразу в state, чтобы пользователь увидел новый элемент без дополнительного ручного обновления
          setDistributions(prev => ([...(Array.isArray(prev) ? prev : []), {
            id: created.id,
            projectId: created.project_id || created.projectId || currentProjectId,
            name: created.name,
            version: created.version,
            type: created.type || 'release',
            status: created.status || 'stable',
            description: created.description || '',
            downloadUrl: created.download_url,
            createdAt: created.created_at
          }]));

          // Попытка синхронизировать с сервером (на случай, если API возвращает только success)
          try {
            if (hasPermission(currentUser, 'viewDistributions')) {
              await loadDistributions(currentProjectId);
            }
          } catch (e) {
            // ignore
          }

          setShowDistributionModal(false);
          addToast('Дистрибутив успешно создан', 'success');
        } else {
          // если сервер не вернул объект, создаём оптимистичный локальный объект чтобы пользователь увидел результат
          const temp = {
            id: `local-${Date.now()}`,
            projectId: Number(currentProjectId),
            name: distroData.name,
            version: distroData.version,
            type: distroData.type || 'release',
            status: 'local',
            description: distroData.description || ''
          };
          setDistributions(prev => ([...(Array.isArray(prev) ? prev : []), temp]));
          addToast('Дистрибутив добавлен локально (сервер не вернул объект)', 'warning');
        }
      } catch (err) {
        console.error('Failed to create distribution:', err);
  addToast('Не удалось создать дистрибутив', 'error');
      } finally {
        setCreatingDistribution(false);
      }
    };
    create();
  };

  const deleteDistribution = (distroId) => {
    if (!window.confirm('Вы уверены, что хотите удалить дистрибутив?')) return;
    const remove = async () => {
      try {
        await apiService.deleteDistribution(distroId);
        setDistributions(prev => prev.filter(d => d.id !== distroId));
        
        setTestPlans(prev => prev.map(plan => ({
          ...plan,
          selectedDistributions: (plan.selectedDistributions || []).filter(id => id !== distroId)
        })));
      } catch (err) {
        console.error('Failed to delete distribution:', err);
        addToast('Не удалось удалить дистрибутив', 'error');
      }
    };
    remove();
  };

  
  const viewTestRunReport = (testRun) => { setSelectedTestRun(testRun); setShowReportModal(true); };

 
  const currentProject = Array.isArray(projects) ? projects.find(p => p.id === currentProjectId) : null;
  const currentProjectTests = testCases || [];

  // If filtering by plan is enabled, find selected plan and use its test_case_ids to filter tests
  // derive visible counts (total/passed/failed/running) from testCases + selected plan
  useEffect(() => {
    try {
      let visibleTests = currentProjectTests;
      if (currentPlanId) {
        const plan = (testPlans || []).find(p => Number(p.id) === Number(currentPlanId));
        const planTestIds = plan && Array.isArray(plan.test_case_ids) ? plan.test_case_ids.map(id => Number(id)) : [];
        visibleTests = currentProjectTests.filter(tc => {
          const tcId = Number(tc.id);
          const tcPlanId = Number(tc.plan_id || tc.planId || 0);
          if (planTestIds.length > 0) {
            return planTestIds.includes(tcId) || tcPlanId === Number(currentPlanId);
          }
          return tcPlanId === Number(currentPlanId);
        });
      }

      const total = Array.isArray(visibleTests) ? visibleTests.length : 0;
      const passed = Array.isArray(visibleTests) ? visibleTests.filter(t => t.status === 'passed' || t.passed === true).length : 0;
      const failed = Array.isArray(visibleTests) ? visibleTests.filter(t => t.status === 'failed' || t.passed === false).length : 0;
      const running = Array.isArray(visibleTests) ? visibleTests.filter(t => t.status === 'running').length : 0;

      setVisibleCounts({ total, passed, failed, running });
    } catch (e) {
      console.warn('Failed to compute visibleCounts', e);
      setVisibleCounts({ total: 0, passed: 0, failed: 0, running: 0 });
    }
  }, [testCases, testPlans, currentPlanId]);

  const visibleTotalTests = visibleCounts.total;
  const visiblePassedTests = visibleCounts.passed;
  const visibleFailedTests = visibleCounts.failed;
  const visibleInProgressTests = visibleCounts.running;

  // compute visibleTests array for rendering (used by test-case list below)
  let visibleTests = currentProjectTests;
  if (currentPlanId) {
    const plan = (testPlans || []).find(p => Number(p.id) === Number(currentPlanId));
    const planTestIds = plan && Array.isArray(plan.test_case_ids) ? plan.test_case_ids.map(id => Number(id)) : [];
    visibleTests = currentProjectTests.filter(tc => {
      const tcId = Number(tc.id);
      const tcPlanId = Number(tc.plan_id || tc.planId || 0);
      if (planTestIds.length > 0) {
        return planTestIds.includes(tcId) || tcPlanId === Number(currentPlanId);
      }
      return tcPlanId === Number(currentPlanId);
    });
  }

  // Filter runs by project and optionally by selected plan
  const currentProjectRuns = (testRuns.filter(run => run.projectId === currentProjectId)).filter(run => {
    if (!currentPlanId) return true;
    return Number(run.planId || run.plan_id || 0) === Number(currentPlanId);
  });
  const totalRuns = currentProjectRuns.length;
  const completedRuns = currentProjectRuns.filter(run => run.status === 'completed').length;
  const runningRuns = currentProjectRuns.filter(run => run.status === 'running').length;
  const notRunRuns = currentProjectRuns.filter(run => run.status === 'not-run').length;

  
  // real loaders (use apiService) are used elsewhere; no mock loaders

  if (loading) {
    return (
      <div className="main-content">
        <Header 
          currentUser={currentUser} 
          onLogout={onLogout} 
          theme={theme} 
          toggleTheme={toggleTheme}
          projects={projects}
          currentProjectId={currentProjectId}
          setCurrentProjectId={setCurrentProjectId}
          setShowProjectModal={setShowProjectModal}
          canCreateProject={canCreate('project')}
          onDeleteProject={handleDeleteProject}
        />
        <div className="container">
          <div className="loading">
            <h3>Загрузка данных...</h3>
          </div>
        </div>
      </div>
    );
  }

  if (!hasAccessToCurrentProject()) {
    return (
      <div className="main-content">
        <Header 
          currentUser={currentUser} 
          onLogout={onLogout} 
          theme={theme} 
          toggleTheme={toggleTheme}
          projects={projects.filter(project => 
            currentUser.role === 'senior_admin' || 
            currentUser.assignedProjects?.includes(project.id)
          )}
          currentProjectId={currentProjectId}
          setCurrentProjectId={setCurrentProjectId}
          setShowProjectModal={setShowProjectModal}
          canCreateProject={canCreate('project')}
          onDeleteProject={handleDeleteProject}
        />
        <div className="container">
          <div className="access-denied">
            <h2>Доступ запрещен</h2>
            <p>У вас нет доступа к выбранному проекту.</p>
            <p>Пожалуйста, выберите другой проект или обратитесь к администратору.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <Header 
        currentUser={currentUser} 
        onLogout={onLogout} 
        theme={theme} 
        toggleTheme={toggleTheme}
        projects={projects}
        currentProjectId={currentProjectId}
        setCurrentProjectId={setCurrentProjectId}
        setShowProjectModal={setShowProjectModal}
        canCreateProject={canCreate('project')}
  onDeleteProject={handleDeleteProject}
      />

      {/* Баннер с информацией о роли */}
      <div className="role-banner">
        <div className="container">
          <div className='role-banner-container'>
            <span>
              <strong>Роль:</strong> {getRoleDisplayName(currentUser.role)} | 
              <strong> Проект:</strong> {currentProject?.name || 'Не выбран'}
            </span>
            {canManageUsers() && (
              <button 
                className="btn btn-outline btn-sm"
                onClick={() => setShowUserManagementModal(true)}
              >
                <i className="fas fa-users"></i> Управление пользователями
              </button>
            )}
          </div>
        </div>
      </div>

      <section className="hero">
        <div className="container">
          <div className='container_title'>
            <h1>Платформа для управления тестированием</h1>
            <p>Создавайте, запускайте и анализируйте тесты для ваших проектов</p>
            <h1>Проект: {currentProject?.name || 'Проект не найден'}</h1>
            <p>{currentProject?.description || 'Описание отсутствует'}</p>
            <p>Среда: {currentProject?.environment || 'Не указана'}</p>
            <p>Тип тестирования: {currentProject?.environment1 || 'Не указан'}</p>
          </div>         
           
          <div className="hero-buttons">
            <button className="btn btn-outline" onClick={() => setActiveTab('reports')}>
              Посмотреть отчеты
            </button>
          </div>
        </div>
      </section>

      <section className="dashboard">
        <div className="container">
          <div className="dashboard-header">
            <h1 className="dashboard-title">Панель управления</h1>
          </div>
          
          {activeTab === 'reports' ? (
            <div className="reports-section">
              <div className="reports-header">
                <h2>Отчеты о тестировании</h2>
                {canCreate('report') && (
                  <button className="btn btn-primary" onClick={() => setActiveTab('test-cases')}>
                    <i className="fas fa-arrow-left"></i> Вернуться на панель
                  </button>
                )}
              </div>
              
              <div className="reports-list">
                {Array.isArray(manualReports) && manualReports.length > 0 ? (
                  <div className="manual-reports">
                    <h3>Ручные отчеты ({manualReports.length})</h3>
                    <div className="reports-grid">
                      {manualReports.map(report => (
                        <div key={report.id} className="report-card">
                          <div className="report-card-header">
                            <h4>{report.title}</h4>
                            <span className={`report-status report-status-${report.status}`}>
                              {report.status === 'passed' ? 'Успешно' : report.status === 'failed' ? 'С ошибками' : 'Частично успешно'}
                            </span>
                          </div>
                          <div className="report-card-meta">
                            <p><strong>Дата:</strong> {new Date(report.date).toLocaleDateString('ru-RU')}</p>
                            <p><strong>Среда:</strong> {report.environment}</p>
                            <p><strong>Тестировщик:</strong> {report.tester || 'Не указан'}</p>
                          </div>
                          <div className="report-card-description">
                            <p>{report.description}</p>
                          </div>
                          <div className="report-card-actions">
                            <button className="btn btn-sm btn-outline" onClick={() => {
                              setSelectedTestRun(report);
                              setShowReportModal(true);
                            }}>
                              <i className="fas fa-eye"></i> Просмотреть
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">
                    <h3>Нет отчетов</h3>
                    <p>Отчеты о тестировании будут отображаться здесь.</p>
                    <button className="btn btn-outline" onClick={() => setActiveTab('test-cases')}>
                      <i className="fas fa-arrow-left"></i> Вернуться на панель
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
          {canManageDistributions() && (
            <button className="btn btn-outline" onClick={() => setShowDistributionModal(true)} style={{ marginBottom: 12 }}>
              <i className="fas fa-server"></i> Управление дистрибутивами ({distributions.filter(d => Number(d.projectId) === Number(currentProjectId)).length})
            </button>
          )}
          {/* Иерархическое дерево: Проект → Дистрибутивы → Планы → Группы → Кейсы + Раны */}
          <HierarchicalPlanTree
            project={currentProject}
            distributions={distributions.filter(d => Number(d.projectId) === Number(currentProjectId))}
            testPlans={testPlans.filter(p => Number(p.projectId) === Number(currentProjectId))}
            testCaseGroups={testCaseGroups}
            testCases={testCases}
            testRuns={testRuns}
            canCreate={canCreate}
            canRun={canRun}
            onCreatePlan={() => setShowTestPlanModal(true)}
            onCreateGroup={(planId) => { setCurrentPlanId(planId); setShowCategoryModal(true); }}
            onCreateTestCase={(groupId) => { setModalDefaultGroupId(groupId); setShowTestCaseItemModal(true); }}
            onCreateRun={(planId) => { setCurrentPlanId(planId); setShowTestRunModal(true); }}
            onCreateReport={(testRun) => { setSelectedTestRun(testRun); setShowManualReportModal(true); }}
            onViewReport={(testRun) => { setSelectedTestRun(testRun); setShowReportModal(true); }}
            onDeletePlan={deleteTestPlan}
            onDeleteGroup={deleteTestCaseGroup}
            onDeleteTestCase={deleteTestCase}
            onDeleteRun={deleteTestRun}
            onRunTestRun={runTestRun}
            onMoveTestCaseToGroup={moveTestCaseToGroup}
            onDragStart={() => {}}
            onDragEnd={() => {}}
            dragOverGroupId={dragOverGroupId}
            setDragOverGroupId={setDragOverGroupId}
            setDraggedTestCase={setDraggedTestCase}
            draggedTestCase={draggedTestCase}
            onViewTestCase={handleViewTestCase}
          />
            </>
          )}
        </div>
      </section>

      {/* Модальные окна */}
      {showProjectModal && (
        <ProjectModal 
          onClose={() => setShowProjectModal(false)} 
          onCreate={createProject}
        />
      )}
      {showTestCaseView && viewingTestCase && (
        <TestCaseViewModal testCase={viewingTestCase} onClose={closeViewTestCase} />
      )}

      {showTestCaseItemModal && (
        <TestCaseItemModal 
          onClose={() => { setShowTestCaseItemModal(false); setModalDefaultGroupId(null); }} 
          onCreate={createTestCase}
          projectId={currentProjectId}
          groups={(testCaseGroups || []).filter(g => Number(g.projectId) === Number(currentProjectId) && ((currentPlanId && Number(g.plan_id) === Number(currentPlanId)) || (!currentPlanId && !g.plan_id)))}
          defaultGroupId={modalDefaultGroupId}
        />
      )}

      {showCategoryModal && (
        <TestCaseCategoryModal 
          onClose={() => setShowCategoryModal(false)}
          onCreate={(g) => { createTestCaseGroup(g); setShowCategoryModal(false); }}
          testPlans={testPlans.filter(p => p.projectId === currentProjectId)}
          currentProjectId={currentProjectId}
          defaultPlanId={currentPlanId}
        />
      )}

      {showTestRunModal && (
        <TestRunModal 
          onClose={() => setShowTestRunModal(false)} 
          onCreate={handleCreateRun}
          testCases={testCases}
          projectId={currentProjectId}
          groups={(testCaseGroups || []).filter(g => Number(g.projectId) === Number(currentProjectId) && ((currentPlanId && Number(g.plan_id) === Number(currentPlanId)) || (!currentPlanId && !g.plan_id)))}
          currentPlanId={currentPlanId}
        />
      )}

      {showManualReportModal && selectedTestRun && (
        <ManualReportModal 
          testRun={selectedTestRun}
          onClose={() => setShowManualReportModal(false)}
          onSave={saveManualReport}
        />
      )}

      {showTestPlanModal && (
        <TestPlanModal 
          onClose={() => { setShowTestPlanModal(false); setEditingPlan(null); }} 
          onCreate={createTestPlan}
          onSave={updateTestPlan}
          distributions={distributions}
          currentProjectId={currentProjectId}
          initialData={editingPlan}
        />
      )}

      {showDistributionModal && (
        <DistributionModal 
          onClose={() => setShowDistributionModal(false)} 
          onCreate={createDistribution}
          onDelete={deleteDistribution}
          distributions={distributions}
          currentProjectId={currentProjectId}
          isCreating={creatingDistribution}
        />
      )}

    {showExecutionModal && currentExecutingTestRun && (
        <TestExecutionModal 
      testRun={Array.isArray(testRuns) ? testRuns.find(run => run.id === currentExecutingTestRun) : null}
          onClose={() => {
            setShowExecutionModal(false);
            setCurrentExecutingTestRun(null);
          }}
          onComplete={handleTestRunExecutionComplete}
        />
      )}

      {showUserManagementModal && (
        <UserManagementModal 
          onClose={() => setShowUserManagementModal(false)}
          users={users}
          projects={projects}
          currentUser={currentUser}
          onUpdateUser={(userId, updates) => {
            // Реализация обновления пользователя
            console.log('Update user:', userId, updates);
          }}
        />
      )}

      {showReportModal && selectedTestRun && (
        <ReportModal 
          testRun={selectedTestRun} 
          onClose={() => setShowReportModal(false)} 
        />
      )}

      
    </div>
  );
};

export default Dashboard;