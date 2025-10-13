import React, { useState } from 'react';

const DistributionModal = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    version: '',
    type: 'linux',
    description: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({
      id: Date.now(),
      ...formData,
      createdAt: new Date().toISOString()
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
          <h2 className="modal-title">Добавление дистрибутива</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="distroName">Название дистрибутива</label>
            <input 
              type="text" 
              id="distroName" 
              name="name"
              value={formData.name}
              onChange={handleChange}
              required 
              placeholder="Например: Ubuntu, Windows, macOS" 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="distroVersion">Версия</label>
            <input 
              type="text" 
              id="distroVersion" 
              name="version"
              value={formData.version}
              onChange={handleChange}
              required 
              placeholder="Например: 22.04, 11, 14.0" 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="distroType">Тип ОС</label>
            <select 
              id="distroType" 
              name="type"
              value={formData.type}
              onChange={handleChange}
            >
              <option value="linux">Linux</option>
              <option value="windows">Windows</option>
              <option value="macos">macOS</option>
              <option value="android">Android</option>
              <option value="ios">iOS</option>
              <option value="other">Другая</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="distroDescription">Описание</label>
            <textarea 
              id="distroDescription" 
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Дополнительная информация о дистрибутиве" 
              rows="3"
            />
          </div>
          
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary">
              Добавить дистрибутив
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DistributionModal;