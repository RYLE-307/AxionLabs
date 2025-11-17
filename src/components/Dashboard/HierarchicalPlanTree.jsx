import React, { useState } from 'react';

const HierarchicalPlanTree = ({
  project,
  distributions = [],
  testPlans = [],
  testCaseGroups = [],
  testCases = [],
  testRuns = [],
  canCreate = () => false,
  canRun = () => false,
  onCreatePlan = () => {},
  onCreateGroup = () => {},
  onCreateTestCase = () => {},
  onCreateRun = () => {},
  onCreateReport = () => {},
  onViewReport = () => {},
  onDeletePlan = () => {},
  onDeleteGroup = () => {},
  onDeleteTestCase = () => {},
  onDeleteRun = () => {},
  onRunTestRun = () => {},
  onMoveTestCaseToGroup = () => {},
  onViewTestCase = () => {},
  dragOverGroupId,
  setDragOverGroupId,
  draggedTestCase,
  setDraggedTestCase,
}) => {
  const [expandedPlans, setExpandedPlans] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});
  const [expandedRuns, setExpandedRuns] = useState({});
  const [activeTab, setActiveTab] = useState({});
  const [localDraggedTestCase, setLocalDraggedTestCase] = useState(null);
  const [localDragOverGroupId, setLocalDragOverGroupId] = useState(null);

  const realDragged = typeof setDraggedTestCase === 'function' ? draggedTestCase : localDraggedTestCase;
  const realDragOver = typeof setDragOverGroupId === 'function' ? dragOverGroupId : localDragOverGroupId;

  const setRealDragged = (id) => {
    if (typeof setDraggedTestCase === 'function') setDraggedTestCase(id); else setLocalDraggedTestCase(id);
  };
  const setRealDragOver = (id) => {
    if (typeof setDragOverGroupId === 'function') setDragOverGroupId(id); else setLocalDragOverGroupId(id);
  };

  const togglePlanExpanded = (planId) => {
    setExpandedPlans(prev => ({ ...prev, [planId]: !prev[planId] }));
    if (!expandedPlans[planId]) setActiveTab(prev => ({ ...prev, [planId]: 'test-cases' }));
  };

  const toggleGroupExpanded = (groupId) => {
    const key = String(groupId);
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleRunExpanded = (runId) => {
    setExpandedRuns(prev => ({ ...prev, [runId]: !prev[runId] }));
  };

  const handleDragStart = (e, testCase) => {
    const id = typeof testCase === 'object' ? testCase.id : testCase;
    setRealDragged(id);
    try { e.dataTransfer.setData('text/plain', String(id)); } catch (err) {}
  };

  const handleDragOver = (e, groupId) => { e.preventDefault(); setRealDragOver(String(groupId)); };
  const handleDragLeave = () => setRealDragOver(null);
  const handleDrop = (e, groupId) => {
    e.preventDefault();
    const id = realDragged || (e.dataTransfer && e.dataTransfer.getData && e.dataTransfer.getData('text/plain'));
    if (id) onMoveTestCaseToGroup(id, groupId);
    setRealDragOver(null);
    setRealDragged(null);
  };

  if (!project) return <div className="empty-state"><p>Проект не выбран</p></div>;

  const projectPlans = testPlans.filter(p => Number(p.projectId) === Number(project.id));

  return (
    <div className="hierarchical-tree">
      <div className="stats">
        <div className="stat-card"><h3>Всего тест-кейсов</h3><div className="number">{testCases.length}</div></div>
        <div className="stat-card"><h3>Всего тест-ранов</h3><div className="number">{testRuns.length}</div></div>
      </div>

      <div className="plan-list">
        <h2>Тест-Планы</h2>
        {projectPlans.length === 0 ? (
          <p className="no-plans">Нет тест-планов для этого проекта.</p>
        ) : (
          <div className="plan-items">
            {projectPlans.map(plan => {
              const groupsInPlan = testCaseGroups.filter(g => Number(g.plan_id) === Number(plan.id));
              const ungroupedInPlan = testCases.filter(tc => !tc.group_id && (Number(tc.plan_id || tc.planId) === Number(plan.id) || !tc.plan_id));

              return (
                <div key={plan.id} className="plan-item">
                  <div className="plan-header">
                    <div className="plan-title-row">
                      <div className="plan-info"><strong>{plan.name}</strong> {plan.version ? `v${plan.version}` : ''}</div>
                      <div className="plan-header-actions">
                        <button className="btn btn-sm btn-outline" onClick={() => togglePlanExpanded(plan.id)}>
                          {expandedPlans[plan.id] ? 'Свернуть' : 'Развернуть'}
                        </button>
                        {canCreate('testPlan') && <button className="btn btn-sm btn-danger" onClick={() => onDeletePlan(plan.id)}>Удалить</button>}
                      </div>
                    </div>
                    {expandedPlans[plan.id] && <div>


                      <div className="plan-desc">
                       <p  className="plan-desc-name">Описание</p>
                      <div>{plan.description || 'Описание отсутствует'}</div>
                        </div>
                 
                      <div className="plan-desc">
                      <p className="plan-desc-name">Цели тестирования</p>
                      <div>{plan.objective || 'Описание отсутствует'}</div>
                      </div>

                      <div className="plan-desc">
                       <p className="plan-desc-name">Область тестирования</p>
                      <div >{plan.scope || 'Описание отсутствует'}</div>
                      </div>

                      </div>}
                  </div>

                  {expandedPlans[plan.id] && (
                    <div className="plan-content">
                      <div className="plan-distributions">
                        <h4>Дистрибутивы в плане</h4>
                        {plan.selectedDistributions && plan.selectedDistributions.length > 0 ? (
                          <ul>
                            {plan.selectedDistributions.map(id => {
                              const d = distributions.find(x => Number(x.id) === Number(id));
                              return <li key={id}>{d ? `${d.name} ${d.version || ''}` : `#${id} (не найден)`}</li>;
                            })}
                          </ul>
                        ) : (<p className="muted">Дистрибутивы не выбраны для этого плана.</p>)}
                      </div>

                      <div className="tabs-block">
                        <div className="tabs-header">
                          <button className={`tab-btn ${activeTab[plan.id] === 'test-cases' ? 'active' : ''}`} onClick={() => setActiveTab(prev => ({ ...prev, [plan.id]: 'test-cases' }))}>Тест-кейсы</button>
                          <button className={`tab-btn ${activeTab[plan.id] === 'test-runs' ? 'active' : ''}`} onClick={() => setActiveTab(prev => ({ ...prev, [plan.id]: 'test-runs' }))}>Тест-раны</button>
                          <button className={`tab-btn ${activeTab[plan.id] === 'history' ? 'active' : ''}`} onClick={() => setActiveTab(prev => ({ ...prev, [plan.id]: 'history' }))}>История</button>
                        </div>

                        <div className="tabs-content">
                          {activeTab[plan.id] === 'test-cases' && (
                            <div className="tab-pane">
                              <h3>Управление тест-кейсами</h3>

                              <div className="category-controls" style={{ marginBottom: 16 }}>
                                {canCreate('testCase') && (
                                  <button className="btn btn-outline" onClick={() => onCreateGroup(plan.id)} style={{ marginLeft: 8 }}>
                                    <i className="fas fa-folder-plus" /> Новая группа
                                  </button>
                                )}
                              </div>

                              <div className="test-case-list">
                                {groupsInPlan.length === 0 && ungroupedInPlan.length === 0 ? (
                                  <div className="empty-state"><h3>Нет тест-кейсов</h3><p>Создайте первый тест-кейс для плана.</p></div>
                                ) : (
                                  <>
                                    {groupsInPlan.map(group => {
                                      const groupTests = testCases.filter(tc => Number(tc.group_id) === Number(group.id));
                                      const isCollapsed = expandedGroups[String(group.id)] === false;
                                      const passedCount = groupTests.filter(tc => tc.passed === true).length;
                                      const failedCount = groupTests.filter(tc => tc.passed === false).length;
                                      const runningCount = groupTests.filter(tc => tc.status === 'running').length;

                                      return (
                                        <div key={group.id} className={`test-case-category ${isCollapsed ? 'collapsed' : ''} ${realDragOver === String(group.id) ? 'drag-over' : ''}`}>
                                          <div
                                            className="category-header"
                                            onDragOver={(e) => handleDragOver(e, String(group.id))}
                                            onDragEnter={(e) => handleDragOver(e, String(group.id))}
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => handleDrop(e, group.id)}
                                          >
                                            <h3 className="category-title">{group.name} <span className="muted">({groupTests.length})</span></h3>
                                            <div>
                                              <button className="btn btn-sm btn-outline collapse-toggle" onClick={() => toggleGroupExpanded(group.id)} aria-label={isCollapsed ? 'Развернуть группу' : 'Свернуть группу'} style={{ marginRight: 8 }}>
                                                <i className={`fas ${isCollapsed ? 'fa-chevron-right' : 'fa-chevron-down'}`} />
                                              </button>
                                              {canCreate('testCase') && <button className="btn btn-sm btn-outline" onClick={() => onCreateTestCase(group.id)}><i className="fas fa-plus" /></button>}
                                              <button className="btn btn-sm btn-danger" onClick={() => onDeleteGroup(group.id)} style={{ marginLeft: 8 }}><i className="fas fa-trash" /></button>
                                            </div>
                                          </div>

                                          {!isCollapsed && (
                                            <div className="category-test-cases">
                                              {groupTests.map(testCase => (
                                                <div key={testCase.id || testCase.key} className="test-case-item" draggable={canCreate('testCase')} onDragStart={(e) => handleDragStart(e, testCase)} onDragEnd={() => { setRealDragged(null); setRealDragOver(null); }} onClick={() => onViewTestCase(testCase)}>
                                                  <div className="test-case-content">
                                                    <h4>{testCase.latest_version?.title || testCase.title || testCase.key}</h4>
                                                    <p>{testCase.latest_version?.description || testCase.description || ''}</p>
                                                  </div>
                                                  <div className="test-case-meta">
                                                    <span className={`priority-${testCase.latest_version?.priority || 'low'}`}>
                                                      {testCase.latest_version?.priority === 'high' ? 'Высокий' : testCase.latest_version?.priority === 'medium' ? 'Средний' : 'Низкий'} приоритет
                                                    </span>
                                                    <span className="test-case-key">{testCase.key}</span>
                                                  </div>
                                                  <div className="test-case-actions">
                                                    {canCreate('testCase') && (
                                                      <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); onDeleteTestCase(testCase.id); }}><i className="fas fa-trash" /></button>
                                                    )}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}

                                    {ungroupedInPlan.length > 0 && (() => {
                                      const groupTests = ungroupedInPlan;
                                      const passedCount = groupTests.filter(tc => tc.passed === true).length;
                                      const failedCount = groupTests.filter(tc => tc.passed === false).length;
                                      const runningCount = groupTests.filter(tc => tc.status === 'running').length;
                                      return (
                                        <div key="ungrouped" className={`test-case-category ${expandedGroups['ungrouped'] === false ? 'collapsed' : ''} ${realDragOver === 'ungrouped' ? 'drag-over' : ''}`} onDragOver={(e) => handleDragOver(e, 'ungrouped')} onDragEnter={(e) => handleDragOver(e, 'ungrouped')} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, null)}>
                                          <div className="category-header">
                                            <h3 className="category-title">Без группы <span className="muted">({ungroupedInPlan.length})</span></h3>
                                            <div>
                                              <button className="btn btn-sm btn-outline collapse-toggle" onClick={() => toggleGroupExpanded('ungrouped')} aria-label="Свернуть раздел без группы"><i className={`fas ${expandedGroups['ungrouped'] === false ? 'fa-chevron-right' : 'fa-chevron-down'}`} /></button>
                                            </div>
                                          </div>

                                          {expandedGroups['ungrouped'] !== false && (
                                            <div className="category-test-cases">
                                              {ungroupedInPlan.map(testCase => (
                                                <div key={testCase.id || testCase.key} className="test-case-item" draggable={canCreate('testCase')} onDragStart={(e) => handleDragStart(e, testCase)} onDragEnd={() => { setRealDragged(null); setRealDragOver(null); }} onClick={() => onViewTestCase(testCase)}>
                                                  <div className="test-case-content">
                                                    <h4>{testCase.latest_version?.title || testCase.title || testCase.key}</h4>
                                                    <p>{testCase.latest_version?.description || testCase.description || ''}</p>
                                                  </div>
                                                  <div className="test-case-meta">
                                                    <span className={`priority-${testCase.latest_version?.priority || 'low'}`}>{testCase.latest_version?.priority === 'high' ? 'Высокий' : testCase.latest_version?.priority === 'medium' ? 'Средний' : 'Низкий'} приоритет</span>
                                                    <span className="test-case-key">{testCase.key}</span>
                                                  </div>
                                                  <div className="test-case-actions">
                                                    {canCreate('testCase') && (<button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); onDeleteTestCase(testCase.id); }}><i className="fas fa-trash" /></button>)}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </>
                                )}
                              </div>
                            </div>
                          )}

                          {activeTab[plan.id] === 'test-runs' && (
                            <div className="tab-pane">
                              <h3>Управление тест-ранами</h3>
                              <div className="controls" style={{ marginBottom: 16 }}>{canCreate('testRun') && (<button className="btn btn-new-run btn-primary" onClick={() => onCreateRun(plan.id)}><i className="fas fa-plus" /> Создать тест-ран</button>)}</div>

                              <div id="testRunsList">
                                {testRuns.filter(r => Number(r.plan_id || r.planId) === Number(plan.id)).length === 0 ? (
                                  <div className="empty-state"><h3>Нет тест-ранов</h3><p>Создайте первый тест-ран для запуска тестирования</p></div>
                                ) : (
                                  testRuns.filter(r => Number(r.plan_id || r.planId) === Number(plan.id)).map(testRun => {
                                    const total = testRun.total || testRun.tests?.length || 0;
                                    const passed = typeof testRun.passed === 'number' ? testRun.passed : (Array.isArray(testRun.tests) ? testRun.tests.filter(t => t.passed === true).length : 0);
                                    const failed = typeof testRun.failed === 'number' ? testRun.failed : (Array.isArray(testRun.tests) ? testRun.tests.filter(t => t.passed === false).length : 0);
                                    const isExpanded = !!expandedRuns[String(testRun.id)];

                                    return (
                                      <div key={testRun.id} className="test-run">
                                        <div className="test-run-header">
                                          <div className="test-run-title">{testRun.name}</div>
                                          <div className="run-stats">
                                            <span className="muted">Всего: <strong>{total}</strong></span>
                                            <span className="muted">Пройдено: <strong>{passed}</strong></span>
                                            <span className="muted">Не пройдено: <strong>{failed}</strong></span>
                                          </div>
                                          <div className="test-run-date">{testRun.date}</div>
                                          <div className="test-run-actions">
                                            <button className="btn btn-sm btn-outline" onClick={() => toggleRunExpanded(testRun.id)} aria-label={isExpanded ? 'Свернуть' : 'Развернуть'}>
                                              <i className={`fas ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`} />
                                            </button>
                                            {testRun.status !== 'running' ? (
                                              <button className="btn btn-sm btn-outline" onClick={() => onRunTestRun(testRun.id)} disabled={!canRun()}>Запустить</button>
                                            ) : (
                                              <button className="btn btn-sm btn-outline" disabled>Выполняется...</button>
                                            )}
                                            {testRun.status === 'completed' && (
                                              <button className="btn btn-sm btn-outline" onClick={() => onViewReport(testRun)} title="Просмотреть отчет">
                                                <i className="fas fa-chart-bar"></i> Отчет
                                              </button>
                                            )}
                                            {canCreate('report') && testRun.status !== 'running' && (
                                              <button className="btn btn-sm btn-outline" onClick={() => onCreateReport(testRun)} title="Создать новый отчет">
                                                <i className="fas fa-file-alt"></i> Создать отчет
                                              </button>
                                            )}
                                            {canCreate('testRun') && (<button className="btn btn-sm btn-danger" onClick={() => onDeleteRun(testRun.id)}><i className="fas fa-trash" /></button>)}
                                          </div>
                                        </div>

                                        {isExpanded && Array.isArray(testRun.tests) && (
                                          <div className="run-test-list">
                                            {testRun.tests.map((t, idx) => {
                                              // normalize t: it can be an object, or a primitive id/string
                                              const raw = t;
                                              const statusClass = (raw && raw.status === 'running') ? 'running' : (raw && raw.passed === true ? 'passed' : (raw && raw.passed === false ? 'failed' : 'unknown'));

                                              // collect candidate ids/keys from multiple possible shapes
                                              const candidates = [];
                                              const candidateKeys = [];

                                              const pushIf = (v) => { if (v !== undefined && v !== null && String(v) !== '') candidates.push(String(v)); };
                                              const pushKeyIf = (k) => { if (k) candidateKeys.push(String(k)); };

                                              if (raw === null || raw === undefined) {
                                                // nothing
                                              } else if (typeof raw === 'string' || typeof raw === 'number') {
                                                pushIf(raw);
                                              } else if (typeof raw === 'object') {
                                                pushIf(raw.id);
                                                pushIf(raw.testCaseId);
                                                pushIf(raw.test_case_id);
                                                pushIf(raw.caseId);
                                                pushIf(raw.case_id);
                                                // nested references
                                                if (raw.test_case && (raw.test_case.id || raw.test_case.key)) pushIf(raw.test_case.id);
                                                if (raw.test && (raw.test.id || raw.test.key)) pushIf(raw.test.id);

                                                // keys
                                                if (raw.key) pushKeyIf(raw.key);
                                                if (raw.testCaseKey) pushKeyIf(raw.testCaseKey);
                                                if (raw.test_case_key) pushKeyIf(raw.test_case_key);
                                                if (raw.tcKey) pushKeyIf(raw.tcKey);
                                              }

                                              // search in global testCases by any candidate id or key
                                              let globalMatch = null;
                                              if (Array.isArray(testCases)) {
                                                for (const cid of candidates) {
                                                  globalMatch = testCases.find(tc => (tc.id !== undefined && String(tc.id) === cid) || (tc.latest_version && String(tc.latest_version.id) === cid));
                                                  if (globalMatch) break;
                                                }
                                                if (!globalMatch) {
                                                  for (const ck of candidateKeys) {
                                                    globalMatch = testCases.find(tc => (tc.key && String(tc.key) === ck) || (tc.latest_version && tc.latest_version.key && String(tc.latest_version.key) === ck));
                                                    if (globalMatch) break;
                                                  }
                                                }
                                              }

                                              // fallback titles
                                              const displayTitle = (raw && raw.latest_version && raw.latest_version.title) || raw?.title || globalMatch?.latest_version?.title || globalMatch?.title || globalMatch?.key || (typeof raw === 'string' || typeof raw === 'number' ? String(raw) : '—');
                                              const displayDesc = (raw && raw.latest_version && raw.latest_version.description) || raw?.description || globalMatch?.latest_version?.description || globalMatch?.description || '';

                                              const priority = (raw && raw.latest_version && raw.latest_version.priority) || (globalMatch && globalMatch.latest_version && globalMatch.latest_version.priority) || (globalMatch && globalMatch.priority) || 'low';

                                              return (
                                                <div key={(raw && (raw.id || raw.key)) || idx} className={`test-case-item ${statusClass}`} onClick={() => onViewTestCase(raw)}>
                                                  <div className="test-case-content">
                                                    <h4>{displayTitle}</h4>
                                                    {displayDesc ? <p>{displayDesc}</p> : null}
                                                  </div>
                                                  <div className="test-case-meta">
                                                    <span className={`priority-${priority}`}>{priority === 'high' ? 'Высокий' : priority === 'medium' ? 'Средний' : 'Низкий'}</span>
                                                    <span className="test-case-key">{(raw && raw.key) || globalMatch?.key || ''}</span>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          )}

                          {activeTab[plan.id] === 'history' && (
                            <div className="tab-pane">
                              <h3>История запусков тестирования</h3>
                              <div className="test-results">
                                <div className="result-content" id="historyOutput">
                                  {testRuns.filter(r => Number(r.plan_id || r.planId) === Number(plan.id)).length === 0 ? (
                                    <div className="result-line result-success">Нет данных о запусках</div>
                                  ) : (
                                    testRuns.filter(r => Number(r.plan_id || r.planId) === Number(plan.id)).slice(0, 10).map(run => (
                                      <div key={run.id} className={`result-line ${run.status === 'completed' ? 'result-success' : run.status === 'running' ? 'result-warning' : 'result-error'}`}>
                                        {run.date} - {run.name} ({run.passed}/{run.tests?.length || 0} пройдено) - {run.status}
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {canCreate('testPlan') && (
        <button className="btn btn-primary" onClick={onCreatePlan} style={{ marginTop: 16 }}><i className="fas fa-plus" /> Создать план</button>
      )}
    </div>
  );
};

export default HierarchicalPlanTree;
