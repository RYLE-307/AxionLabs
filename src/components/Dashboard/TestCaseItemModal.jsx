import React, { useState } from 'react';

const TestCaseItemModal = ({ onClose, onCreate, categories }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'functional',
    priority: 'medium',
    expectedResult: '',
    categoryId: categories.length > 0 ? categories[0].id : '',
    steps: [{ step: '', expected: '' }]
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(formData);
    onClose();
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const addStep = () => {
    setFormData({
      ...formData,
      steps: [...formData.steps, { step: '', expected: '' }]
    });
  };

  const removeStep = (index) => {
    const newSteps = formData.steps.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      steps: newSteps
    });
  };

  const updateStep = (index, field, value) => {
    const newSteps = formData.steps.map((step, i) => 
      i === index ? { ...step, [field]: value } : step
    );
    setFormData({
      ...formData,
      steps: newSteps
    });
  };

  return (
    <div className="modal active">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Создание тест-кейса</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="testCaseCategory">Группа</label>
            <select 
              id="testCaseCategory" 
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              required
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="testCaseName">Название тест-кейса</label>
            <input 
              type="text" 
              id="testCaseName" 
              name="name"
              value={formData.name}
              onChange={handleChange}
              required 
              placeholder="Введите название тест-кейса" 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="testCaseDescription">Описание</label>
            <textarea 
              id="testCaseDescription" 
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Опишите цель тест-кейса" 
            />
          </div>

          {/* Шаги тестирования */}
          <div className="form-group">
            <label>Шаги тестирования</label>
            {formData.steps.map((step, index) => (
              <div key={index} className="test-step">
                <div className="step-header">
                  <strong>Шаг {index + 1}</strong>
                  {formData.steps.length > 1 && (
                    <button 
                      type="button" 
                      className="btn btn-sm btn-danger"
                      onClick={() => removeStep(index)}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>
                <div className="step-fields">
                  <div className="form-group">
                    <label>Действие</label>
                    <input 
                      type="text" 
                      value={step.step}
                      onChange={(e) => updateStep(index, 'step', e.target.value)}
                      placeholder="Опишите действие для выполнения"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Ожидаемый результат</label>
                    <input 
                      type="text" 
                      value={step.expected}
                      onChange={(e) => updateStep(index, 'expected', e.target.value)}
                      placeholder="Опишите ожидаемый результат"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
            <button 
              type="button" 
              className="btn btn-outline btn-sm"
              onClick={addStep}
            >
              <i className="fas fa-plus"></i> Добавить шаг
            </button>
          </div>
          
          <div className="form-group">
            <label htmlFor="testCaseType">Тип тест-кейса</label>
            <select 
              id="testCaseType" 
              name="type"
              value={formData.type}
              onChange={handleChange}
            >
              <option value="functional">Функциональный</option>
              <option value="api">API</option>
              <option value="performance">Производительность</option>
              <option value="ui">UI</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="testCasePriority">Приоритет</label>
            <select 
              id="testCasePriority" 
              name="priority"
              value={formData.priority}
              onChange={handleChange}
            >
              <option value="high">Высокий</option>
              <option value="medium">Средний</option>
              <option value="low">Низкий</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="testCaseExpected">Общий ожидаемый результат</label>
            <textarea 
              id="testCaseExpected" 
              name="expectedResult"
              value={formData.expectedResult}
              onChange={handleChange}
              required 
              placeholder="Опишите общий ожидаемый результат тест-кейса" 
            />
          </div>
          
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary">
              Создать тест-кейс
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TestCaseItemModal;