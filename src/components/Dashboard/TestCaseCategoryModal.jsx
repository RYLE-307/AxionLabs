import React, { useState } from 'react';

const TestCaseCategoryModal = ({ onClose, onCreate, testPlans = [], currentProjectId = null, defaultPlanId = null }) => {
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState(defaultPlanId || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return;
    // Enforce that a plan is selected when creating a group
    if (!selectedPlanId) {
      alert('Группа должна быть привязана к тест-плану. Создайте группу из заголовка соответствующего плана.');
      return;
    }

    onCreate({
      id: Date.now(),
      name: categoryName,
      description: categoryDescription,
      plan_id: selectedPlanId,
      testCases: []
    });
    onClose();
  };

  return (
    <div className="modal active">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Создание группы тест-кейсов</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="categoryName">Название</label>
            <input 
              type="text" 
              id="categoryName"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              required 
              placeholder="Введите название" 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="categoryDescription">Описание группы</label>
            <textarea 
              id="categoryDescription"
              value={categoryDescription}
              onChange={(e) => setCategoryDescription(e.target.value)}
              placeholder="Опишите назначение" 
            />
          </div>

          <div className="form-group">
            {defaultPlanId ? (
            
              <>
                <label>Привязать к тест-плану</label>
                <div className="muted">
                  { (testPlans.find(p => String(p.id) === String(defaultPlanId)) || { name: 'Выбранный план' }).name }
                </div>
              </>
            ) : (
              <>
                <label htmlFor="categoryPlan">Привязать к тест-плану</label>
                <select id="categoryPlan" value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)}>
                  <option value="">-- Выберите план --</option>
                  {testPlans.map(plan => (
                    <option key={plan.id} value={plan.id}>{plan.name}</option>
                  ))}
                </select>
              </>
            )}
          </div>
          
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary">
              Создать группу кейсов
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TestCaseCategoryModal;