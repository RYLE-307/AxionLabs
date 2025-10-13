import React, { useState } from 'react';

const TestExecutionModal = ({ testRun, onClose, onComplete }) => {
  const [currentTestCaseIndex, setCurrentTestCaseIndex] = useState(0);
  const [stepResults, setStepResults] = useState({});
  const [testCaseResults, setTestCaseResults] = useState({});

  const currentTestCase = testRun.tests[currentTestCaseIndex];

  // Инициализация результатов шагов для текущего тест-кейса
  const initializeStepResults = (testCaseId) => {
    if (!stepResults[testCaseId] && currentTestCase.steps) {
      setStepResults(prev => ({
        ...prev,
        [testCaseId]: currentTestCase.steps.map(step => ({
          step: step.step,
          expected: step.expected,
          actualResult: '',
          passed: null,
          comments: ''
        }))
      }));
    }
  };

  // Инициализируем при загрузке или смене тест-кейса
  React.useEffect(() => {
    if (currentTestCase) {
      initializeStepResults(currentTestCase.id);
    }
  }, [currentTestCase]);

  const handleStepResult = (testCaseId, stepIndex, field, value) => {
    setStepResults(prev => ({
      ...prev,
      [testCaseId]: prev[testCaseId].map((step, idx) =>
        idx === stepIndex ? { ...step, [field]: value } : step
      )
    }));
  };

  const handleTestCaseResult = (testCaseId, passed) => {
    const currentStepResults = stepResults[testCaseId] || [];
    const allStepsCompleted = currentStepResults.every(step => step.passed !== null);
    
    if (!allStepsCompleted) {
      alert('Пожалуйста, заполните результаты для всех шагов перед завершением теста.');
      return;
    }

    setTestCaseResults(prev => ({
      ...prev,
      [testCaseId]: {
        passed,
        stepResults: currentStepResults,
        completedAt: new Date().toISOString()
      }
    }));

    // Автоматически переходим к следующему тест-кейсу
    if (currentTestCaseIndex < testRun.tests.length - 1) {
      setCurrentTestCaseIndex(currentTestCaseIndex + 1);
    } else {
      // Все тест-кейсы завершены
      completeTestRun();
    }
  };

  const completeTestRun = () => {
    const completedResults = Object.entries(testCaseResults).map(([testCaseId, result]) => ({
      testCaseId: parseInt(testCaseId),
      passed: result.passed,
      stepResults: result.stepResults,
      completedAt: result.completedAt
    }));

    onComplete({
      testRunId: testRun.id,
      results: completedResults
    });
  };

  const currentStepResults = stepResults[currentTestCase?.id] || [];

  if (!currentTestCase) {
    return null;
  }

  return (
    <div className="modal active">
      <div className="modal-content" style={{ maxWidth: '900px' }}>
        <div className="modal-header">
          <h2 className="modal-title">Выполнение тест-рана: {testRun.name}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="test-execution">
          {/* Прогресс по тест-кейсам */}
          <div className="test-run-progress">
            <div className="progress-info">
              Тест-кейс {currentTestCaseIndex + 1} из {testRun.tests.length}
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${((currentTestCaseIndex + 1) / testRun.tests.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Информация о текущем тест-кейсе */}
          <div className="current-test-case">
            <h3>{currentTestCase.name}</h3>
            {currentTestCase.description && (
              <p className="test-case-description">{currentTestCase.description}</p>
            )}
            <div className="test-case-meta">
              <span className={`priority-${currentTestCase.priority}`}>
                Приоритет: {currentTestCase.priority === 'high' ? 'Высокий' : 
                         currentTestCase.priority === 'medium' ? 'Средний' : 'Низкий'}
              </span>
              <span className={`type-${currentTestCase.type}`}>
                Тип: {currentTestCase.type === 'functional' ? 'Функциональный' : 
                      currentTestCase.type === 'api' ? 'API' : 
                      currentTestCase.type === 'performance' ? 'Производительность' : 'UI'}
              </span>
            </div>
          </div>

          {/* Шаги тестирования */}
          <div className="test-steps">
            <h4>Шаги тестирования:</h4>
            {currentTestCase.steps && currentTestCase.steps.map((step, stepIndex) => (
              <div key={stepIndex} className="test-step">
                <div className="step-header">
                  <strong>Шаг {stepIndex + 1}: {step.step}</strong>
                </div>
                <div className="step-expected">
                  <strong>Ожидаемый результат:</strong> {step.expected}
                </div>

                <div className="step-execution">
                  <div className="form-group">
                    <label>Фактический результат:</label>
                    <textarea 
                      value={currentStepResults[stepIndex]?.actualResult || ''}
                      onChange={(e) => handleStepResult(
                        currentTestCase.id, 
                        stepIndex, 
                        'actualResult', 
                        e.target.value
                      )}
                      placeholder="Опишите фактический результат выполнения шага"
                      rows="3"
                    />
                  </div>

                  <div className="form-group">
                    <label>Комментарии:</label>
                    <textarea 
                      value={currentStepResults[stepIndex]?.comments || ''}
                      onChange={(e) => handleStepResult(
                        currentTestCase.id, 
                        stepIndex, 
                        'comments', 
                        e.target.value
                      )}
                      placeholder="Дополнительные комментарии к шагу"
                      rows="2"
                    />
                  </div>

                  <div className="step-actions">
                    <button 
                      className={`btn ${currentStepResults[stepIndex]?.passed === false ? 'btn-danger' : 'btn-outline'}`}
                      onClick={() => handleStepResult(currentTestCase.id, stepIndex, 'passed', false)}
                    >
                      Шаг не пройден
                    </button>
                    <button 
                      className={`btn ${currentStepResults[stepIndex]?.passed === true ? 'btn-success' : 'btn-outline'}`}
                      onClick={() => handleStepResult(currentTestCase.id, stepIndex, 'passed', true)}
                    >
                      Шаг пройден
                    </button>
                  </div>

                  {/* Статус шага */}
                  {currentStepResults[stepIndex]?.passed !== null && (
                    <div className={`step-status ${currentStepResults[stepIndex]?.passed ? 'passed' : 'failed'}`}>
                      Статус: {currentStepResults[stepIndex]?.passed ? 'Пройден' : 'Не пройден'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Навигация и завершение тест-кейса */}
          <div className="execution-navigation">
            <button 
              className="btn btn-outline" 
              onClick={() => setCurrentTestCaseIndex(Math.max(0, currentTestCaseIndex - 1))}
              disabled={currentTestCaseIndex === 0}
            >
              Предыдущий тест-кейс
            </button>

            <div className="test-case-completion">
              <button 
                className="btn btn-danger"
                onClick={() => handleTestCaseResult(currentTestCase.id, false)}
              >
                Тест-кейс провален
              </button>
              <button 
                className="btn btn-success"
                onClick={() => handleTestCaseResult(currentTestCase.id, true)}
              >
                Тест-кейс пройден
              </button>
            </div>

            <button 
              className="btn btn-outline" 
              onClick={() => setCurrentTestCaseIndex(Math.min(testRun.tests.length - 1, currentTestCaseIndex + 1))}
              disabled={currentTestCaseIndex === testRun.tests.length - 1}
            >
              Следующий тест-кейс
            </button>
          </div>

          {/* Обзор прогресса */}
          <div className="execution-overview">
            <h5>Прогресс выполнения:</h5>
            <div className="test-cases-overview">
              {testRun.tests.map((testCase, index) => (
                <div 
                  key={testCase.id}
                  className={`test-case-overview ${index === currentTestCaseIndex ? 'current' : ''} ${
                    testCaseResults[testCase.id] ? 
                    (testCaseResults[testCase.id].passed ? 'passed' : 'failed') : 'pending'
                  }`}
                  onClick={() => setCurrentTestCaseIndex(index)}
                >
                  <span>{index + 1}. {testCase.name}</span>
                  <span className="test-case-status">
                    {testCaseResults[testCase.id] ? 
                     (testCaseResults[testCase.id].passed ? '✓' : '✗') : '○'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestExecutionModal;