import React, { useState, useEffect } from 'react';
import { useToast } from '../UI/ToastContext';
import apiService from '../../services/api';
import '../../styles/profile-form.css';

const TestRunModal = ({ onClose, onCreate, testCases, projectId, groups = [], currentPlanId = null }) => {
  const { addToast } = useToast();
  
  // no mock profiles: require backend-provided OpenQA profiles

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'manual',
    openQAProfileId: ''
  });
  // categories removed: select test-cases directly
  const [selectedTestCases, setSelectedTestCases] = useState([]);
  const [qaProfiles, setQaProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [newProfileData, setNewProfileData] = useState({
    name: '',
    description: '',
    priority: 'normal',
    status: 'active',
    baseUrl: '',
    mode: 'template',
    configuration: '' // JSON string; will be parsed before send
  });
  const [newProfileError, setNewProfileError] = useState('');
  const [formError, setFormError] = useState('');

  // `testCases` is a flat array of test case objects (no categories)
  const allTestCases = Array.isArray(testCases) ? testCases : [];
  const groupsList = Array.isArray(groups) ? groups : [];
  const planScopedGroups = groupsList.filter(g => (currentPlanId ? Number(g.plan_id) === Number(currentPlanId) : !g.plan_id));
  const loadQAProfiles = async () => {
    if (!projectId) return;
    
    setLoadingProfiles(true);
    try {
  const profiles = await apiService.listOpenQAProfiles(projectId);
  setQaProfiles(Array.isArray(profiles) ? profiles : []);
    } catch (error) {
      console.error('Failed to load QA profiles:', error);
      setQaProfiles([]);
      addToast('Ошибка при загрузке OpenQA профилей', 'error');
    } finally {
      setLoadingProfiles(false);
    }
  };

  // Загрузка QA профилей при открытии модального окна
  useEffect(() => {
    loadQAProfiles();
  }, [projectId]);

  // Обработчик создания нового профиля
  const handleCreateProfile = async () => {
    setNewProfileError('');
    if (!newProfileData.name.trim()) {
      setNewProfileError('Название профиля обязательно');
      addToast('Название профиля обязательно', 'error');
      return;
    }
  if (!newProfileData.baseUrl || !newProfileData.baseUrl.trim()) {
  setNewProfileError('Базовый URL обязателен');
  addToast('Базовый URL обязателен', 'error');
      return;
    }

    // Подготовка и валидация конфигурации
    let payload = { ...newProfileData };
    if (typeof payload.configuration === 'string' && payload.configuration.trim()) {
      try {
        payload.configuration = JSON.parse(payload.configuration);
      } catch (e) {
        addToast('Конфигурация должна быть валидным JSON', 'error');
        return;
      }
    } else {
      payload.configuration = {};
    }

    try {
      // Подготовка полного payload с алиасами полей для совместимости
      const fullPayload = {
        ...payload,
        project_id: projectId,
        base_url: payload.baseUrl,
        api_key: payload.apiKey,
        api_secret: payload.apiSecret,
        verify_tls: false,
        job_group_id: null,
        defaults: {},
        Mode: payload.mode,
        BaseURL: payload.baseUrl
      };

      const createdProfile = await apiService.createOpenQAProfile(projectId, fullPayload);
  addToast('Профиль успешно создан', 'success');
  setQaProfiles(prev => [...prev, createdProfile]);
  setFormData(prev => ({ ...prev, openQAProfileId: createdProfile.id }));
      setShowProfileForm(false);
      setNewProfileData({
        name: '',
        description: '',
        priority: 'normal',
        status: 'active',
        baseUrl: '',
        mode: 'template',
        configuration: ''
      });
      setNewProfileError('');
    } catch (error) {
      console.error('Failed to create profile:', error);
      addToast('Ошибка при создании профиля', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.debug('TestRunModal.handleSubmit', { formData, selectedTestCases });
    let testCaseIds = selectedTestCases;
    // local inline validation state
    setFormError('');
    
  // Валидация OpenQA профиля для автоматического тест рана
  if (formData.type === 'automatic' && !formData.openQAProfileId) {
      addToast('Для автоматического тест рана необходимо выбрать OpenQA профиль', 'error');
      return;
    }

    if (!testCaseIds || testCaseIds.length === 0) {
      setFormError('Выберите хотя бы один тест-кейс для запуска');
      addToast('Выберите хотя бы один тест-кейс для запуска', 'error');
      return;
    }

    try {
      if (!onCreate) throw new Error('onCreate prop is not provided');

      const payload = {
        project_id: projectId,
        name: formData.name,
        description: formData.description,
        type: formData.type,
        run_type: formData.type === 'automatic' ? 'automatic' : 'manual',
        OpenQAProfileID: formData.type === 'automatic' ? formData.openQAProfileId : null,
        selectedTestCases: testCaseIds
      };

      await onCreate(payload);
      onClose();
    } catch (err) {
      console.error('Error in TestRunModal.handleSubmit -> onCreate:', err);
      addToast('Не удалось создать тест-ран: ' + (err.message || ''), 'error');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // clear inline error when user edits
    setFormError('');
  };


  const handleTestCaseSelection = (testCaseId) => {
    if (selectedTestCases.includes(testCaseId)) {
      setSelectedTestCases(selectedTestCases.filter(id => id !== testCaseId));
    } else {
      setSelectedTestCases([...selectedTestCases, testCaseId]);
    }
  };

  const selectAllTestCases = () => {
    if (selectedTestCases.length === allTestCases.length) {
      setSelectedTestCases([]);
    } else {
      setSelectedTestCases(allTestCases.map(test => test.id));
    }
  };

  // no category selection;

  return (
    <div className="modal active">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Создание нового тест-рана</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="runName">Название</label>
            <input
              type="text"
              id="runName"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Введите название тест-рана"
              required
              className={formError && formError.includes('Название') ? 'input-error' : ''}
            />
            {formError && formError.includes('Название') && <div className="form-error">{formError}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="testRunType">Тип тест-рана</label>
            <select
              id="testRunType"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            >
              <option value="automatic">Автоматический прогон</option>
              <option value="manual">Ручной прогон</option>
            </select>
          </div>

          {formData.type === 'automatic' && (
            <div className="form-group">
              <label htmlFor="openQAProfile">OpenQA Профиль</label>
              <div className="profile-selection">
                <select
                  id="openQAProfile"
                  name="openQAProfileId"
                  value={formData.openQAProfileId}
                  onChange={handleChange}
                  required
                  disabled={loadingProfiles}
                >
                  <option value="">Выберите OpenQA профиль</option>
                  {(qaProfiles || []).map(profile => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name}
                    </option>
                  ))}
                </select>
                <div className="profile-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setShowProfileForm(true)}
                  >
                    <i className="fas fa-plus"></i> Новый профиль
                  </button>
                </div>
              </div>
              {loadingProfiles && <div className="loading-indicator">Загрузка профилей...</div>}
            </div>
          )}

          {showProfileForm && (
            <div className="modal-overlay">
              <div className="modal-content profile-form">
                <h3>Создание нового OpenQA профиля</h3>
                <div className="hint">Заполните название и Base URL. Остальные поля опциональны.</div>
                <div className="form-group row">
                  <div className="col">
                    <label htmlFor="profileName">Название профиля</label>
                    <input
                      type="text"
                      id="profileName"
                      value={newProfileData.name}
                      onChange={(e) => setNewProfileData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                    {newProfileError && newProfileError.includes('Название') && (
                      <div className="form-error">{newProfileError}</div>
                    )}
                  </div>
                  <div className="col">
                    <label htmlFor="profileBaseUrl">Базовый URL</label>
                    <input
                      id="profileBaseUrl"
                      type="text"
                      value={newProfileData.baseUrl}
                      onChange={(e) => setNewProfileData(prev => ({ ...prev, baseUrl: e.target.value }))}
                      placeholder="https://openqa.example.com"
                      required
                    />
                    {newProfileError && newProfileError.includes('Base URL') && (
                      <div className="form-error">{newProfileError}</div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="profileDescription">Описание</label>
                  <textarea
                    id="profileDescription"
                    value={newProfileData.description}
                    onChange={(e) => setNewProfileData(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                  />
                </div>

                <div className="form-group row">
                  <div className="col">
                    <label htmlFor="profileMode">Режим</label>
                    <select
                      id="profileMode"
                      value={newProfileData.mode}
                      onChange={(e) => setNewProfileData(prev => ({ ...prev, mode: e.target.value }))}
                    >
                      <option value="template">Шаблон</option>
                      <option value="job">Задача</option>
                      <option value="iso">ISO (образ)</option>
                    </select>
                  </div>
                  <div className="col">
                    <label htmlFor="profilePriority">Приоритет</label>
                    <select
                      id="profilePriority"
                      value={newProfileData.priority}
                      onChange={(e) => setNewProfileData(prev => ({ ...prev, priority: e.target.value }))}
                    >
                      <option value="low">Низкий</option>
                      <option value="normal">Нормальный</option>
                      <option value="high">Высокий</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="profileConfig">Конфигурация (JSON)</label>
                  <textarea
                    id="profileConfig"
                    value={newProfileData.configuration}
                    onChange={(e) => setNewProfileData(prev => ({ ...prev, configuration: e.target.value }))}
                    rows={4}
                    placeholder='{"key":"value"}'
                  />
                </div>
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn btn-outline"
                    onClick={() => setShowProfileForm(false)}
                  >
                    Отмена
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={handleCreateProfile}
                  >
                    Создать профиль
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Выберите тест-кейсы для запуска</label>
            <div className="test-cases-selection">
              <div className="select-all">
                <input
                  type="checkbox"
                  id="selectAll"
                  className='checkbox-run'
                  checked={selectedTestCases.length === allTestCases.length && allTestCases.length > 0}
                  onChange={selectAllTestCases}
                />
                <label htmlFor="selectAll">Выбрать все тест-кейсы</label>
              </div>

              {allTestCases.length === 0 && (
                <div className="hint">Тест-кейсы не найдены для текущего проекта.</div>
              )}

              {/* If groups are provided, render grouped selection first */}
              {planScopedGroups.length > 0 ? (
                (() => {
                  const groupsToRender = planScopedGroups.filter(g => Number(g.projectId) === Number(projectId));
                  const rendered = groupsToRender.map(g => {
                    const groupTests = allTestCases.filter(tc => String(tc.group_id) === String(g.id) || String(tc.group) === String(g.name));
                    return (
                      <div key={`gr-${g.id}`} style={{ marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong>{g.name} <span className="muted">({groupTests.length})</span></strong>
                          <div>
                            <button type="button" className="btn btn-sm btn-outline" onClick={() => {
                              // select all in group
                              const ids = groupTests.map(t => t.id).filter(Boolean);
                              const allSelected = ids.every(id => selectedTestCases.includes(id));
                              if (allSelected) {
                                setSelectedTestCases(prev => prev.filter(id => !ids.includes(id)));
                              } else {
                                setSelectedTestCases(prev => Array.from(new Set([...(prev || []), ...ids])));
                              }
                            }}>Переключить группу</button>
                          </div>
                        </div>
                        <div style={{ paddingLeft: 8, marginTop: 6 }}>
                          {groupTests.map(tc => (
                            <div key={tc.id} className="test-case-checkbox">
                              <input
                                type="checkbox"
                                className='checkbox-run'
                                id={`testCase-${tc.id}`}
                                checked={selectedTestCases.includes(tc.id)}
                                onChange={() => handleTestCaseSelection(tc.id)}
                              />
                              <label htmlFor={`testCase-${tc.id}`}>{tc.title || tc.name || tc.key}</label>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  });

                  // ungrouped
                  const ungrouped = allTestCases.filter(tc => !(tc.group_id || tc.group));
                  if (ungrouped.length > 0) {
                    rendered.push(
                      <div key="ungrouped" style={{ marginTop: 8 }}>
                        <strong>Без группы <span className="muted">({ungrouped.length})</span></strong>
                        <div style={{ paddingLeft: 8, marginTop: 6 }}>
                          {ungrouped.map(tc => (
                            <div key={tc.id} className="test-case-checkbox">
                              <input
                                type="checkbox"
                                className='checkbox-run'
                                id={`testCase-${tc.id}`}
                                checked={selectedTestCases.includes(tc.id)}
                                onChange={() => handleTestCaseSelection(tc.id)}
                              />
                              <label htmlFor={`testCase-${tc.id}`}>{tc.title || tc.name || tc.key}</label>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  return rendered;
                })()
              ) : (
                // fallback: flat list
                allTestCases.map(testCase => (
                  <div key={testCase.id} className="test-case-checkbox">
                    <input
                      type="checkbox"
                      className='checkbox-run'
                      id={`testCase-${testCase.id}`}
                      checked={selectedTestCases.includes(testCase.id)}
                      onChange={() => handleTestCaseSelection(testCase.id)}
                    />
                    <label htmlFor={`testCase-${testCase.id}`}>
                      {testCase.title || testCase.name || testCase.key}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Всего выбрано тест-кейсов: {selectedTestCases.length}</label>
            <div className="select-all">
              <input
                type="checkbox"
                id="selectAll"
                className='checkbox-run'
                checked={selectedTestCases.length === allTestCases.length}
                onChange={selectAllTestCases}
              />
              <label htmlFor="selectAll">Выбрать все тест-кейсы из всех категорий</label>
            </div>
          </div>
          
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" disabled={selectedTestCases.length === 0}>
              Создать тест-ран
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TestRunModal;