import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import ProjectModal from '../components/Dashboard/ProjectModal';
import ManualReportModal from '../components/Dashboard/ManualReportModal';
import TestRunModal from '../components/Dashboard/TestRunModal';
import ReportModal from '../components/Dashboard/ReportModal';
import TestCaseItemModal from '../components/Dashboard/TestCaseItemModal';
import TestCaseCategoryModal from '../components/Dashboard/TestCaseCategoryModal';
import '../styles/global.css';
import '../styles/dashboard.css';
import '../styles/reports.css';
import TestPlanModal from '../components/Dashboard/TestPlanModal';
import DistributionModal from '../components/Dashboard/DistributionModal';
import TestExecutionModal from '../components/Dashboard/TestExecutionModal';
import UserManagementModal from '../components/Dashboard/UserManagementModal';
import { getRoleDisplayName } from '../utils/roles';
import apiService from '../services/api';

const Dashboard = ({ currentUser, onLogout, theme, toggleTheme, hasPermission }) => {
  // Состояния
  const [activeTab, setActiveTab] = useState('test-cases');
  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [testCases, setTestCases] = useState([]);
  const [testRuns, setTestRuns] = useState([]);
  const [testPlans, setTestPlans] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [manualReports, setManualReports] = useState([]);
  const [testCaseCategories, setTestCaseCategories] = useState([]);
  const [currentPlanId, setCurrentPlanId] = useState(null);
  
  // Модальные окна
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTestRunModal, setShowTestRunModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedTestRun, setSelectedTestRun] = useState(null);
  const [showTestPlanModal, setShowTestPlanModal] = useState(false);
  const [showDistributionModal, setShowDistributionModal] = useState(false);
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [currentExecutingTestRun, setCurrentExecutingTestRun] = useState(null);
  const [showUserManagementModal, setShowUserManagementModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTestCaseItemModal, setShowTestCaseItemModal] = useState(false);
  const [showManualReportModal, setShowManualReportModal] = useState(false);
  
  // UI состояния
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draggedTestCase, setDraggedTestCase] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [users, setUsers] = useState([]);

  // Загрузка данных при монтировании
  useEffect(() => {
    initializeData();
  }, []);

  // Загрузка данных проекта при смене проекта
  useEffect(() => {
    if (currentProjectId) {
      loadProjectData(currentProjectId);
    }
  }, [currentProjectId]);

  const initializeData = async () => {
  try {
    setLoading(true);
    setError(null);
    
    // Загружаем данные параллельно для скорости
    await Promise.all([
      loadProjects(),
      loadUsers(),
      loadDistributions()
    ]);
    
    // Если проект выбран, загружаем его данные
    if (currentProjectId) {
      await loadProjectData(currentProjectId);
    }
    
  } catch (err) {
    console.error('Failed to initialize data:', err);
    setError('Ошибка загрузки данных. Проверьте подключение к серверу.');
    
    // Показываем уведомление пользователю
    alert('Не удалось загрузить данные. Проверьте подключение к интернету.');
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
    } catch (err) {
      console.error('Failed to load projects:', err);
      // Fallback к локальным данным
      setProjects([{
        id: 1, 
        name: "Главный проект", 
        description: "Основной проект для демонстрации",
        environment: "Разработка",
        environment1: "CI/CD",
        createdAt: new Date().toISOString()
      }]);
      setCurrentProjectId(1);
    }
  };

  const loadProjectData = async (projectId) => {
    try {
      await Promise.all([
        loadTestCases(projectId),
        loadTestRuns(projectId),
        loadTestPlans(projectId),
        loadProjectStatuses(projectId)
      ]);
    } catch (err) {
      console.error('Failed to load project data:', err);
    }
  };

const loadTestCases = async (projectId) => {
  try {
  
    
    // Загружаем тест-кейсы и категории параллельно
      const [testCasesData, categoriesData] = await Promise.all([
      apiService.listTestCases(projectId),
      apiService.listTestCaseCategories(projectId)
    ]);
    
    // Форматируем категории
    const formattedCategories = categoriesData.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      projectId: category.project_id || projectId,
      planId: category.plan_id || null,
      testCases: []
    }));
    
    // Группируем тест-кейсы по категориям
    testCasesData.forEach(testCase => {
      const categoryId = testCase.category_id;
      const category = formattedCategories.find(cat => cat.id === categoryId);
      
      if (category) {
        category.testCases.push({
          id: testCase.id,
          name: testCase.title || testCase.name,
          description: testCase.description || '',
          priority: testCase.priority || 'medium',
          type: testCase.type || 'functional',
          status: testCase.status || 'not-run',
          steps: testCase.steps || [],
          projectId: testCase.project_id || projectId
        });
      }
    });
    
    setTestCaseCategories(formattedCategories);
    
  } catch (err) {
    console.error('Failed to load test cases:', err);
    
    // Fallback на демо-данные
       const demoCategories = getDemoCategories(projectId);
    setTestCaseCategories(demoCategories);
  } 
};

const loadTestRuns = async (projectId) => {
  try {
    // Используем метод listTestRuns вместо listRunItems
    const testRunsData = await apiService.listTestRuns(projectId);
    
    const formattedTestRuns = testRunsData.map(testRun => ({
      id: testRun.id,
      projectId: testRun.project_id || projectId,
      name: testRun.name,
      description: testRun.description || '',
      type: testRun.type || 'Automatic',
      status: testRun.status || 'not-run',
      date: testRun.created_at ? new Date(testRun.created_at).toLocaleString() : new Date().toLocaleString(),
      tests: testRun.test_cases || testRun.tests || [],
      passed: testRun.passed_count || testRun.passed || 0,
      failed: testRun.failed_count || testRun.failed || 0,
      total: testRun.total_tests || testRun.tests?.length || 0,
      startTime: testRun.started_at,
      endTime: testRun.completed_at
    }));
    
    setTestRuns(formattedTestRuns);
    
  } catch (err) {
    console.error('Failed to load test runs:', err);
    
    // Fallback на демо-данные
    const demoTestRuns = getDemoTestRuns(projectId);
    setTestRuns(demoTestRuns);
  }
};

const loadTestPlans = async (projectId) => {
  try {
    const testPlansData = await apiService.listTestPlans(projectId);
    
    const formattedTestPlans = testPlansData.map(plan => ({
      id: plan.id,
      projectId: plan.project_id || projectId,
      name: plan.name,
      description: plan.description || '',
      version: plan.version || '1.0',
      status: plan.status || 'active',
      createdAt: plan.created_at || new Date().toISOString(),
      testCaseCount: plan.test_case_count || 0
    }));
    
    setTestPlans(formattedTestPlans);
    
  } catch (err) {
    console.error('Failed to load test plans:', err);
    
    // Fallback на демо-данные
    const demoTestPlans = getDemoTestPlans(projectId);
    setTestPlans(demoTestPlans);
  }
};

const loadProjectStatuses = async (projectId) => {
  try {
    const statuses = await apiService.listProjectStatuses(projectId);
    
    // Обновляем статус проекта если есть актуальный статус
    if (statuses && statuses.length > 0) {
      const latestStatus = statuses[statuses.length - 1]; // берем последний статус
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

const loadDistributions = async () => {
  try {
    if (!hasPermission(currentUser, 'viewDistributions')) {
      setDistributions([]);
      return;
    }
    
    const distributionsData = await apiService.listDistributions();
    
    const formattedDistributions = distributionsData.map(dist => ({
      id: dist.id,
      name: dist.name,
      version: dist.version,
      type: dist.type || 'release',
      status: dist.status || 'stable',
      description: dist.description || '',
      downloadUrl: dist.download_url,
      createdAt: dist.created_at
    }));
    
    setDistributions(formattedDistributions);
    
  } catch (err) {
    console.error('Failed to load distributions:', err);
    
    // Fallback на демо-данные
    const demoDistributions = getDemoDistributions();
    setDistributions(demoDistributions);
  }
};

  // Проверки прав доступа
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
    };
    
    return permissions[type] || false;
  };

  const canRun = () => {
    return hasPermission(currentUser, 'runTestRun') && hasAccessToCurrentProject();
  };

  const canManageUsers = () => {
    return hasPermission(currentUser, 'manageUsers');
  };

  // Основные функции
const createProject = async (projectData) => {
  console.log('createProject called with:', projectData); // ДОБАВЬТЕ ЭТУ СТРОКУ
  
  if (!canCreate('project')) {
    alert('У вас нет прав для создания проектов');
    return;
  }

  try {
    console.log('Sending API request...'); // ДОБАВЬТЕ ЭТУ СТРОКУ
    
    const newProject = await apiService.createProject({
      name: projectData.name,
      description: projectData.description,
      environment: projectData.environment,
      environment1: projectData.environment1,
    });

    console.log('API response:', newProject); // ДОБАВЬТЕ ЭТУ СТРОКУ

    setProjects(prev => [...prev, newProject]);
    setCurrentProjectId(newProject.id);
    setShowProjectModal(false);
    alert('Проект успешно создан!');
  } catch (err) {
    console.error('Failed to create project:', err);
    alert('Ошибка при создании проекта: ' + (err.message || 'Неизвестная ошибка'));
  }
};
  const createTestCaseCategory = async (categoryData) => {
    try {
      const newCategory = {
        id: Date.now(),
        ...categoryData,
        projectId: currentProjectId,
        planId: currentPlanId,
        testCases: []
      };
      
      setTestCaseCategories(prev => [...prev, newCategory]);
      setExpandedCategories(prev => ({ ...prev, [newCategory.id]: true }));
      setShowCategoryModal(false);
    } catch (err) {
      alert('Ошибка при создании группы');
      console.error('Failed to create category:', err);
    }
  };

  const createTestCaseInCategory = async (testCaseData) => {
    if (!canCreate('testCase')) {
      alert('У вас нет прав для создания тест-кейсов');
      return;
    }

    try {
      const newTestCase = {
        id: Date.now(),
        projectId: currentProjectId,
        status: "not-run",
        passed: false,
        errorDetails: null,
        ...testCaseData,
        steps: testCaseData.steps || []
      };

      setTestCaseCategories(prevCategories =>
        prevCategories.map(category =>
          category.id === parseInt(testCaseData.categoryId)
            ? { ...category, testCases: [...category.testCases, newTestCase] }
            : category
        )
      );
      
      setShowTestCaseItemModal(false);
    } catch (err) {
      alert('Ошибка при создании тест-кейса');
      console.error('Failed to create test case:', err);
    }
  };

  const createTestRun = async (formData) => {
    if (!canCreate('testRun')) {
      alert('У вас нет прав для создания тест-ранов');
      return;
    }

    try {
      const newTestRun = {
        id: Date.now(),
        projectId: currentProjectId,
        name: formData.name,
        description: formData.description,
        type: formData.type,
        date: new Date().toLocaleString(),
        tests: formData.selectedTestCases.map(testId => ({
          id: testId,
          status: 'not-run',
          passed: false
        })),
        status: 'not-run',
        passed: 0,
        failed: 0
      };

      setTestRuns(prev => [...prev, newTestRun]);
      setShowTestRunModal(false);
    } catch (err) {
      alert('Ошибка при создании тест-рана');
      console.error('Failed to create test run:', err);
    }
  };

  const runTestRun = async (testRunId) => {
    if (!canRun()) {
      alert('У вас нет прав для запуска тест-ранов');
      return;
    }

    const testRun = testRuns.find(run => run.id === testRunId);
    if (!testRun) return;

    if (testRun.type === "Hand") {
      runManualTestRun(testRunId);
    } else {
      await startAutomatedTestRun(testRunId);
    }
  };

  const runManualTestRun = (testRunId) => {
    const testRun = testRuns.find(run => run.id === testRunId);
    
    if (!testRun || !testRun.tests || testRun.tests.length === 0) {
      alert('В тест-ране нет тест-кейсов для выполнения');
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

      // Имитация автоматического тестирования
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
    const { testRunId, results } = executionData;
    
    setTestRuns(prev =>
      prev.map(run => {
        if (run.id !== testRunId) return run;
        
        const updatedTests = run.tests.map(test => {
          const result = results.find(r => r.testCaseId === test.id);
          return result ? { ...test, ...result } : test;
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

    setShowExecutionModal(false);
    setCurrentExecutingTestRun(null);
    alert('Тест-ран завершен!');
  };

  const deleteTestRun = (testRunId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот тест-ран?')) {
      setTestRuns(prev => prev.filter(run => run.id !== testRunId));
    }
  };

  const deleteTestCase = (testCaseId, categoryId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот тест-кейс?')) {
      setTestCaseCategories(prevCategories =>
        prevCategories.map(category =>
          category.id === categoryId
            ? {
                ...category,
                testCases: category.testCases.filter(test => test.id !== testCaseId)
              }
            : category
        )
      );
    }
  };

  const deleteTestCaseCategory = (categoryId) => {
    if (window.confirm('Вы уверены, что хотите удалить эту группу? Все тест-кейсы внутри нее также будут удалены.')) {
      setTestCaseCategories(prevCategories => 
        prevCategories.filter(category => category.id !== categoryId)
      );
    }
  };

  const saveManualReport = (reportData) => {
    const newReport = {
      id: Date.now(),
      ...reportData,
      projectId: currentProjectId
    };
    setManualReports([...manualReports, newReport]);
    setShowManualReportModal(false);
    alert('Отчет успешно сохранен!');
  };

  const createTestPlan = (planData) => {
    const newTestPlan = {
      id: Date.now(),
      ...planData,
      testCaseCategories: []
    };
    setTestPlans([...testPlans, newTestPlan]);
    setShowTestPlanModal(false);
  };

  const createDistribution = (distroData) => {
    const newDistribution = {
      id: Date.now(),
      ...distroData
    };
    setDistributions([...distributions, newDistribution]);
    setShowDistributionModal(false);
  };

  // Drag & Drop функции
  const moveTestCaseToCategory = (testCaseId, fromCategoryId, toCategoryId) => {
    if (fromCategoryId === toCategoryId) return;

    setTestCaseCategories(prevCategories => {
      const updatedCategories = [...prevCategories];
      
      const fromCategory = updatedCategories.find(cat => cat.id === fromCategoryId);
      const toCategory = updatedCategories.find(cat => cat.id === toCategoryId);
      
      if (!fromCategory || !toCategory) return prevCategories;

      const testCaseToMove = fromCategory.testCases.find(tc => tc.id === testCaseId);
      if (!testCaseToMove) return prevCategories;

      return updatedCategories.map(category => {
        if (category.id === fromCategoryId) {
          return {
            ...category,
            testCases: category.testCases.filter(tc => tc.id !== testCaseId)
          };
        }
        if (category.id === toCategoryId) {
          return {
            ...category,
            testCases: [...category.testCases, testCaseToMove]
          };
        }
        return category;
      });
    });
  };

  const handleDragStart = (e, testCase, categoryId) => {
    setDraggedTestCase({ ...testCase, sourceCategoryId: categoryId });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, categoryId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetCategoryId) => {
    e.preventDefault();
    if (draggedTestCase && draggedTestCase.sourceCategoryId !== targetCategoryId) {
      moveTestCaseToCategory(draggedTestCase.id, draggedTestCase.sourceCategoryId, targetCategoryId);
    }
    setDraggedTestCase(null);
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const viewTestRunReport = (testRun) => {
    setSelectedTestRun(testRun);
    setShowReportModal(true);
  };

  // Вспомогательные функции для статистики
  const currentProject = projects.find(p => p.id === currentProjectId);
  const currentProjectTests = testCaseCategories.flatMap(category => category.testCases);
  const totalTests = currentProjectTests.length;
  const passedTests = currentProjectTests.filter(test => test.status === 'passed').length;
  const failedTests = currentProjectTests.filter(test => test.status === 'failed').length;
  const inProgressTests = currentProjectTests.filter(test => test.status === 'running').length;

  const currentProjectRuns = testRuns.filter(run => run.projectId === currentProjectId);
  const totalRuns = currentProjectRuns.length;
  const completedRuns = currentProjectRuns.filter(run => run.status === 'completed').length;
  const runningRuns = currentProjectRuns.filter(run => run.status === 'running').length;
  const notRunRuns = currentProjectRuns.filter(run => run.status === 'not-run').length;

  // Временные моковые функции
  const mockLoadTestCases = async (projectId) => {
    return [];
  };

  const mockLoadTestRuns = async (projectId) => {
    return [];
  };

  const mockLoadTestPlans = async (projectId) => {
    return [];
  };

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
        />
        <div className="container">
          <div className="loading" style={{ textAlign: 'center', padding: '50px' }}>
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
        />
        <div className="container">
          <div className="access-denied" style={{ textAlign: 'center', padding: '50px' }}>
            <h2>Доступ запрещен</h2>
            <p>У вас нет доступа к выбранному проекту.</p>
            <p>Пожалуйста, выберите другой проект или обратитесь к администратору.</p>
          </div>
        </div>
      </div>
    );
  }

// Вспомогательные функции для демо-данных (добавьте перед render)
const getDemoCategories = (projectId) => [
  {
    id: 1,
    name: "Основные функциональные тесты",
    description: "Тесты основной функциональности приложения",
    projectId: projectId,
    testCases: [
      {
        id: 1,
        name: "Авторизация пользователя",
        description: "Проверка входа в систему",
        priority: "high",
        type: "functional",
        status: "not-run",
        steps: [
          "Открыть страницу авторизации",
          "Ввести корректные учетные данные", 
          "Нажать кнопку 'Войти'",
          "Проверить переход на главную страницу"
        ],
        projectId: projectId
      },
      {
        id: 2,
        name: "Создание нового проекта",
        description: "Проверка создания проекта",
        priority: "medium",
        type: "functional",
        status: "not-run",
        steps: [
          "Перейти в раздел управления проектами",
          "Нажать кнопку 'Создать проект'",
          "Заполнить обязательные поля",
          "Сохранить проект"
        ],
        projectId: projectId
      }
    ]
  },
  {
    id: 2,
    name: "API тесты",
    description: "Тестирование REST API endpoints",
    projectId: projectId,
    testCases: [
      {
        id: 3,
        name: "GET /api/projects",
        description: "Проверка получения списка проектов",
        priority: "high",
        type: "api",
        status: "not-run",
        steps: [
          "Отправить GET запрос на /api/projects",
          "Проверить статус код 200",
          "Проверить структуру ответа",
          "Проверить наличие обязательных полей"
        ],
        projectId: projectId
      }
    ]
  }
];

const getDemoTestRuns = (projectId) => [
  {
    id: 1,
    projectId: projectId,
    name: "Регрессионное тестирование v1.0",
    description: "Полное регрессионное тестирование версии 1.0",
    type: "Automatic",
    status: "completed",
    date: new Date().toLocaleString(),
    tests: [
      { id: 1, status: 'passed', passed: true },
      { id: 2, status: 'passed', passed: true },
      { id: 3, status: 'failed', passed: false }
    ],
    passed: 2,
    failed: 1,
    total: 3,
    startTime: new Date(Date.now() - 3600000).toISOString(),
    endTime: new Date().toISOString()
  },
  {
    id: 2,
    projectId: projectId,
    name: "Дымовое тестирование",
    description: "Быстрая проверка основных функций",
    type: "Hand",
    status: "not-run",
    date: new Date().toLocaleString(),
    tests: [
      { id: 1, status: 'not-run', passed: false },
      { id: 2, status: 'not-run', passed: false }
    ],
    passed: 0,
    failed: 0,
    total: 2
  }
];

const getDemoTestPlans = (projectId) => [
  {
    id: 1,
    projectId: projectId,
    name: "Основной тест-план",
    description: "Основной план тестирования функциональности",
    version: "1.0",
    status: "active",
    createdAt: new Date().toISOString(),
    testCaseCount: 15
  },
  {
    id: 2,
    projectId: projectId,
    name: "Регрессионный тест-план", 
    description: "План для регрессионного тестирования",
    version: "2.1",
    status: "active",
    createdAt: new Date().toISOString(),
    testCaseCount: 8
  }
];

const getDemoDistributions = () => [
  {
    id: 1,
    name: "Production Release",
    version: "1.0.0",
    type: "release",
    status: "stable",
    description: "Стабильная версия для продакшена",
    downloadUrl: "http://example.com/distro/v1.0.0",
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    name: "Beta Release", 
    version: "1.1.0-beta",
    type: "beta",
    status: "testing",
    description: "Бета-версия для тестирования новых функций",
    downloadUrl: "http://example.com/distro/v1.1.0-beta",
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    name: "Development Build",
    version: "2.0.0-dev",
    type: "development", 
    status: "unstable",
    description: "Ночная сборка для разработчиков",
    downloadUrl: "http://example.com/distro/v2.0.0-dev",
    createdAt: new Date().toISOString()
  }
];


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
      />

      {/* Баннер с информацией о роли */}
      <div className="role-banner" style={{
        background: 'var(--bg-tertiary)',
        padding: '10px 0',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

          {/* Селектор тест-плана */}
          <div className="plan-selector" style={{ margin: '15px 0', padding: '15px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
            <label style={{ marginRight: '10px', fontWeight: '600' }}>Тест-план:</label>
            <select 
              value={currentPlanId || ''} 
              onChange={(e) => setCurrentPlanId(e.target.value ? parseInt(e.target.value) : null)}
              style={{ 
                background: 'var(--bg-primary)', 
                color: 'var(--text-primary)', 
                border: '1px solid var(--border-color)',
                padding: '8px 12px',
                borderRadius: '6px',
                minWidth: '200px'
              }}
            >
              <option value="">-- Без плана --</option>
              {testPlans
                .filter(plan => plan.projectId === currentProjectId)
                .map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} {plan.version ? `v${plan.version}` : ''}
                  </option>
                ))
              }
            </select>
            
            {canCreate('testPlan') && (
              <button 
                className="btn btn-outline" 
                onClick={() => setShowTestPlanModal(true)}
                style={{ marginLeft: '10px' }}
              >
                <i className="fas fa-plus"></i> Новый план
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="dashboard">
        <div className="container">
          <div className="dashboard-header">
            <h1 className="dashboard-title">Панель управления</h1>
          </div>
          
          {/* Статистика */}
          <div className="stats">
            <div className="stat-card">
              <h3>Всего тест-кейсов</h3>
              <div className="number">{totalTests}</div>
            </div>
            <div className="stat-card">
              <h3>Всего тест-ранов</h3>
              <div className="number">{totalRuns}</div>
            </div>
            <div className="stat-card">
              <h3>В процессе</h3>
              <div className="number">{runningRuns}</div>
            </div>
            <div className="stat-card">
              <h3>Завершено</h3>
              <div className="number">{completedRuns}</div>
            </div>
            <div className="stat-card">
              <h3>В ожидании</h3>
              <div className="number">{notRunRuns}</div>
            </div>
          </div>
          
          {/* Табы */}
          <div className="tabs">
            <div 
              className={`tab nav-tab ${activeTab === 'test-cases' ? 'active' : ''}`} 
              onClick={() => setActiveTab('test-cases')}
            >
              Тест-кейсы
            </div>
            <div 
              className={`tab nav-tab ${activeTab === 'test-runs' ? 'active' : ''}`} 
              onClick={() => setActiveTab('test-runs')}
            >
              Тест-раны
            </div>
            <div 
              className={`tab nav-tab ${activeTab === 'reports' ? 'active' : ''}`} 
              onClick={() => setActiveTab('reports')}
            >
              История
            </div>
          </div>
          
          {/* Контент табов */}
          {activeTab === 'test-cases' && (
            <div className="tab-content active" id="test-cases-content">
              <div className="dashboard-header">
                <h2>Управление тест-кейсами</h2>
              </div>
              <p>Создавайте группы и управляйте тест-кейсами:</p>
              
              <div className="category-controls">
                {canCreate('testPlan') && (
                  <button className="btn btn-primary" onClick={() => setShowTestPlanModal(true)}>
                    <i className="fas fa-clipboard-list"></i> Создать тест-план
                  </button>
                )}
                
                {canCreate('project') && (
                  <button className="btn btn-outline" onClick={() => setShowDistributionModal(true)}>
                    <i className="fas fa-server"></i> Управление дистрибутивами
                  </button>
                )}
                
                {canCreate('testCase') && (
                  <>
                    <button className="btn btn-primary" onClick={() => setShowCategoryModal(true)}>
                      <i className="fas fa-folder-plus"></i> Создать группу кейсов
                    </button>
                    <button className="btn btn-outline" onClick={() => setShowTestCaseItemModal(true)}>
                      <i className="fas fa-plus"></i> Создать тест-кейс
                    </button>
                  </>
                )}
              </div>

              {/* Рендер групп тест-кейсов */}
              <div className="test-case-categories">
                {testCaseCategories.length === 0 ? (
                  <div className="empty-state" style={{ textAlign: 'center', padding: '50px' }}>
                    <h3>Нет групп тест-кейсов</h3>
                    <p>Создайте первую группу для организации тест-кейсов</p>
                    {canCreate('testCase') && (
                      <button 
                        className="btn btn-primary"
                        onClick={() => setShowCategoryModal(true)}
                      >
                        Создать группу
                      </button>
                    )}
                  </div>
                ) : (
                  testCaseCategories.map(category => (
                    <div 
                      key={category.id} 
                      className="test-case-category"
                      onDragOver={(e) => handleDragOver(e, category.id)}
                      onDrop={(e) => handleDrop(e, category.id)}
                    >
                      <div className="category-header">
                        <div 
                          className="category-info"
                          onClick={() => toggleCategory(category.id)}
                          style={{ cursor: 'pointer', flex: 1 }}
                        >
                          <div className="category-title-wrapper">
                            <i 
                              className={`fas fa-chevron-${expandedCategories[category.id] ? 'down' : 'right'}`}
                              style={{ marginRight: '10px', transition: 'transform 0.3s' }}
                            ></i>
                            <h3>{category.name}</h3>
                          </div>
                          {category.description && <p>{category.description}</p>}
                          <span className="category-stats">
                            {category.testCases.length} тест-кейсов
                          </span>
                        </div>
                        <div className="category-actions">
                          {canCreate('testCase') && (
                            <button 
                              className="btn btn-sm btn-outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowTestCaseItemModal(true);
                              }}
                            >
                              <i className="fas fa-plus"></i> Добавить тест-кейс
                            </button>
                          )}
                          {canCreate('testCase') && (
                            <button 
                              className="btn btn-sm btn-danger" 
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteTestCaseCategory(category.id);
                              }}
                            >
                              <i className="fas fa-trash"></i> Удалить группу
                            </button>
                          )}
                        </div>
                      </div>

                      {expandedCategories[category.id] && (
                        <div className="category-test-cases">
                          {category.testCases.length === 0 ? (
                            <div className="empty-category">
                              <p>Нет тест-кейсов в этой группе</p>
                              <p className="drop-hint">Перетащите тест-кейсы сюда</p>
                            </div>
                          ) : (
                            category.testCases.map(testCase => (
                              <div 
                                key={testCase.id} 
                                className="test-case-item"
                                draggable
                                onDragStart={(e) => handleDragStart(e, testCase, category.id)}
                              >
                                <div className="test-case-content">
                                  <h4>{testCase.name}</h4>
                                  <p>{testCase.description}</p>
                                  <div className="test-case-meta">
                                    <span className={`priority-${testCase.priority}`}>
                                      {testCase.priority === 'high' ? 'Высокий' : 
                                       testCase.priority === 'medium' ? 'Средний' : 'Низкий'} приоритет
                                    </span>
                                    <span className={`type-${testCase.type}`}>
                                      {testCase.type === 'functional' ? 'Функциональный' : 
                                       testCase.type === 'api' ? 'API' : 
                                       testCase.type === 'performance' ? 'Производительность' : 'UI'}
                                    </span>
                                  </div>
                                </div>
                                <div className="test-case-actions">
                                  {canCreate('testCase') && (
                                    <button 
                                      className="btn btn-sm btn-danger" 
                                      onClick={() => deleteTestCase(testCase.id, category.id)}
                                    >
                                      <i className="fas fa-trash"></i>
                                    </button>
                                  )}
                                  <span className="drag-handle">
                                    <i className="fas fa-grip-vertical"></i>
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'test-runs' && (
            <div className="tab-content active" id="test-runs-content">
              <h2>Управление тест-ранами</h2>
              <p>Создавайте и запускайте тест-раны для ваших проектов:</p>
              
              <div className="controls">
                {canCreate('testRun') && (
                  <button className="btn btn-new-run btn-primary" onClick={() => setShowTestRunModal(true)}>
                    <i className="fas fa-plus"></i> Создать тест-ран
                  </button>
                )}
              </div>
              
              <div id="testRunsList">
                {currentProjectRuns.length === 0 ? (
                  <div className="empty-state" style={{ textAlign: 'center', padding: '50px' }}>
                    <h3>Нет тест-ранов</h3>
                    <p>Создайте первый тест-ран для запуска тестирования</p>
                    {canCreate('testRun') && (
                      <button 
                        className="btn btn-primary"
                        onClick={() => setShowTestRunModal(true)}
                      >
                        Создать тест-ран
                      </button>
                    )}
                  </div>
                ) : (
                  currentProjectRuns.map(testRun => (
                    <div key={testRun.id} className="test-run">
                      <div className="test-run-header">
                        <div className="test-run-title">{testRun.name}</div>
                        <div className="test-run-date">{testRun.date}</div>
                        <div className="test-meta">
                          <span>  
                            {testRun.type === 'Automatic' ? 'Автоматический прогон' : 
                             testRun.type === 'Hand' ? 'Ручной прогон' : `Неизвестный тип: ${testRun.type}`}
                          </span>
                        </div>
                      </div>
                      <div className="test-run-stats">
                        <div className="test-run-stat">
                          <div className="test-run-stat-value">{testRun.tests.length}</div>
                          <div className="test-run-stat-label">Всего тестов</div>
                        </div>
                        <div className="test-run-stat">
                          <div className="test-run-stat-value">{testRun.passed}</div>
                          <div className="test-run-stat-label">Пройдено</div>
                        </div>
                        <div className="test-run-stat">
                          <div className="test-run-stat-value">{testRun.failed}</div>
                          <div className="test-run-stat-label">Провалено</div>
                        </div>
                        <div className="test-run-stat">
                          <div className="test-run-stat-value">
                            {testRun.status === 'completed' ? 'Завершен' : 
                             testRun.status === 'running' ? 'Выполняется' : 'Не запущен'}
                          </div>
                          <div className="test-run-stat-label">Статус</div>
                        </div>
                      </div>
                      <div className="test-actions">
                        {testRun.status !== 'running' ? (
                          <button 
                            className="btn btn-sm btn-outline" 
                            onClick={() => runTestRun(testRun.id)}
                            disabled={!canRun()}
                          >
                            Запустить
                          </button>
                        ) : (
                          <button className="btn btn-sm btn-outline" disabled>
                            Выполняется...
                          </button>
                        )}

                        {testRun.status === 'completed' && (
                          <button 
                            className="btn btn-show-log btn-sm btn-primary" 
                            onClick={() => viewTestRunReport(testRun)}
                          >
                            Просмотр авто-отчета
                          </button>
                        )}

                        {testRun.status === 'completed' && (
                          <button 
                            className="btn btn-show-log btn-careateReport btn-primary" 
                            onClick={() => {
                              setSelectedTestRun(testRun);
                              setShowManualReportModal(true);
                            }}
                          >
                            <i className="fas fa-edit"></i> Создать отчет
                          </button>
                        )}

                        {canCreate('testRun') && (
                          <button 
                            className="btn btn-sm btn-danger" 
                            onClick={() => deleteTestRun(testRun.id)}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="tab-content active" id="reports-content">
              <h2>История запусков тестирования</h2>
              <p>Анализируйте результаты тестирования с помощью детальных отчетов:</p>
              
              <div className="test-results">
                <h3>История запусков</h3>
                <div className="result-content" id="historyOutput">
                  {currentProjectRuns.length === 0 ? (
                    <div className="result-line result-success">Нет данных о запусках</div>
                  ) : (
                    currentProjectRuns
                      .slice(0, 10)
                      .map(run => (
                        <div key={run.id} className={`result-line ${
                          run.status === 'completed' ? 'result-success' : 
                          run.status === 'running' ? 'result-warning' : 'result-error'
                        }`}>
                          {run.date} - {run.name} ({run.passed}/{run.tests.length} пройдено) - {run.status}
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Ручные отчеты */}
              {manualReports.filter(report => report.projectId === currentProjectId).length > 0 && (
                <div className="manual-reports" style={{ marginTop: '30px' }}>
                  <h3>Ручные отчеты</h3>
                  <div className="reports-list">
                    {manualReports
                      .filter(report => report.projectId === currentProjectId)
                      .map(report => (
                        <div key={report.id} className="report-item">
                          <h4>{report.title}</h4>
                          <p>{report.date} - {report.status}</p>
                          <p>{report.summary}</p>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Модальные окна */}
      {showProjectModal && (
        <ProjectModal 
          onClose={() => setShowProjectModal(false)} 
          onCreate={createProject}
          distributions={distributions}
        />
      )}

      {showCategoryModal && (
        <TestCaseCategoryModal 
          onClose={() => setShowCategoryModal(false)} 
          onCreate={createTestCaseCategory} 
        />
      )}

      {showTestCaseItemModal && (
        <TestCaseItemModal 
          onClose={() => setShowTestCaseItemModal(false)} 
          onCreate={createTestCaseInCategory}
          categories={testCaseCategories}
        />
      )}

      {showTestRunModal && (
        <TestRunModal 
          onClose={() => setShowTestRunModal(false)} 
          onCreate={createTestRun}
          categories={testCaseCategories}
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
          onClose={() => setShowTestPlanModal(false)} 
          onCreate={createTestPlan}
          distributions={distributions}
          currentProjectId={currentProjectId}
        />
      )}

      {showDistributionModal && (
        <DistributionModal 
          onClose={() => setShowDistributionModal(false)} 
          onCreate={createDistribution} 
        />
      )}

      {showExecutionModal && currentExecutingTestRun && (
        <TestExecutionModal 
          testRun={testRuns.find(run => run.id === currentExecutingTestRun)}
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