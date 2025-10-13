import React, { useState } from 'react';

const TestPlanModal = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    version: '1.0'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({
      id: Date.now(),
      ...formData,
      createdAt: new Date().toISOString(),
      testCaseCategories: []
    });
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
          <h2 className="modal-title">Создание тест-плана</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="testPlanName">Название тест-плана</label>
            <input 
              type="text" 
              id="testPlanName" 
              name="name"
              value={formData.name}
              onChange={handleChange}
              required 
              placeholder="Введите название тест-плана" 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="testPlanDescription">Описание тест-плана</label>
            <textarea 
              id="testPlanDescription" 
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Опишите цели тест-плана" 
              rows="4"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="testPlanVersion">Версия</label>
            <input 
              type="text" 
              id="testPlanVersion" 
              name="version"
              value={formData.version}
              onChange={handleChange}
              placeholder="Версия тест-плана" 
            />
          </div>
          
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary">
              Создать тест-план
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TestPlanModal;