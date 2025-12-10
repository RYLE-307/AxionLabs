import React, { useState, useEffect } from 'react';

const TestCaseItemModal = ({ onClose, onCreate, projectId, groups = [], defaultGroupId = null }) => {
  const [formData, setFormData] = useState({
    key: '',
    Title: '',
    Description: '',
    Steps: '',
    Expected: '',
    Priority: 'medium',
    Status: 'active',
    Version: 1
  });

  const [selectedGroupId, setSelectedGroupId] = useState(defaultGroupId);

  useEffect(() => {
    setSelectedGroupId(defaultGroupId || null);
  }, [defaultGroupId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.Title) {
      alert('Название тест-кейса обязательно для заполнения');
      return;
    }

    // Enforce having a group when creating a test-case
    if (!selectedGroupId) {
      alert('Выберите группу для тест-кейса. Создание без группы запрещено.');
      return;
    }
    const timestamp = Date.now();
    const defaultKey = `TC-${timestamp}`;

    // Build payload compatible with api.createTestCaseNormalized/createTestCase
    const testCaseData = {
      key: formData.key || defaultKey,
      Title: formData.Title.trim(),
      Description: formData.Description || '',
      Steps: formData.Steps || '',
      Expected: formData.Expected || '',
      Priority: formData.Priority || 'medium',
      Status: formData.Status || 'active',
      Version: formData.Version || 1,
      groupId: selectedGroupId,
      // also provide an initial_version object so backend implementations that expect versions will get it
      initial_version: {
        version: formData.Version || 1,
        title: formData.Title.trim(),
        description: formData.Description || '',
        steps: formData.Steps || '',
        expected: formData.Expected || '',
        priority: formData.Priority || 'medium',
        status: formData.Status || 'active'
      }
    };

    onCreate(testCaseData);
    onClose();
  };

  return (
    <div className="modal active">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Создание тест-кейса</h2>
          <button type="button" className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{display:'none'}}>
            <label htmlFor="testCaseKey">Идентификатор</label>
            <input
              type="text"
              id="testCaseKey"
              name="key"
              value={formData.key}
              onChange={handleChange}
              placeholder="Например: TC-001 (генерируется автоматически)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="testCaseTitle">Название *</label>
            <input
              type="text"
              id="testCaseTitle"
              name="Title"
              value={formData.Title}
              onChange={handleChange}
              required
              placeholder="Введите название тест-кейса"
              style={{ borderColor: formData.Title ? '' : '#ffa9a9' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="testCaseGroup">Группа</label>
            <select
              id="testCaseGroup"
              value={selectedGroupId || ''}
              onChange={(e) => setSelectedGroupId(e.target.value ? e.target.value : null)}
            >
              <option value="">-- Без группы --</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="testCaseDescription">Описание</label>
            <textarea
              id="testCaseDescription"
              name="Description"
              value={formData.Description}
              onChange={handleChange}
              placeholder="Введите описание"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="testCaseSteps">Шаги</label>
            <textarea
              id="testCaseSteps"
              name="Steps"
              value={formData.Steps}
              onChange={handleChange}
              placeholder="Введите шаги выполнения"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="testCaseExpected">Ожидаемый результат</label>
            <textarea
              id="testCaseExpected"
              name="Expected"
              value={formData.Expected}
              onChange={handleChange}
              placeholder="Введите ожидаемый результат"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="testCasePriority">Приоритет</label>
            <select
              id="testCasePriority"
              name="Priority"
              value={formData.Priority}
              onChange={handleChange}
            >
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
              <option value="critical">Критический</option>
            </select>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">Создать</button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Отмена</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TestCaseItemModal;