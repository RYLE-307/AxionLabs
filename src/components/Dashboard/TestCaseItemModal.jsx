import React, { useState } from 'react';

const TestCaseItemModal = ({ onClose, onCreate, categories }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'functional',
    priority: 'medium',
    expectedResult: '',
    categoryId: categories.length > 0 ? categories[0].id : ''
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

  return (
    <div className="modal active">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Создание тест-кейса</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="testCaseCategory">группа</label>
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
            <label htmlFor="testCaseExpected">Ожидаемый результат</label>
            <textarea 
              id="testCaseExpected" 
              name="expectedResult"
              value={formData.expectedResult}
              onChange={handleChange}
              required 
              placeholder="Опишите ожидаемый результат" 
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