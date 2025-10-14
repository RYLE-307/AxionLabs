import React, { useState } from 'react';
import { getRoleDisplayName } from '../../utils/roles'; // Исправленный путь


const UserManagementModal = ({ onClose, users, projects, currentUser, onUpdateUser }) => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [userRole, setUserRole] = useState('');

  const handleAssignProject = () => {
    if (!selectedUserId || !selectedProjectId) {
      alert('Выберите пользователя и проект');
      return;
    }

    onUpdateUser(selectedUserId, {
      assignedProjects: [...(users.find(u => u.id === selectedUserId)?.assignedProjects || []), selectedProjectId]
    });
  };

  const handleChangeRole = () => {
    if (!selectedUserId || !userRole) {
      alert('Выберите пользователя и роль');
      return;
    }

    onUpdateUser(selectedUserId, { role: userRole });
  };

  return (
    <div className="modal active">
      <div className="modal-content" style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <h2 className="modal-title">Управление пользователями</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        
        <div className="user-management">
          <div className="form-group">
            <label>Выберите пользователя</label>
            <select 
              value={selectedUserId} 
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">Выберите пользователя</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email}) - {getRoleDisplayName(user.role)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Назначить проект</label>
              <select 
                value={selectedProjectId} 
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
                <option value="">Выберите проект</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <button 
                className="btn btn-outline btn-sm"
                onClick={handleAssignProject}
                style={{ marginTop: '10px' }}
              >
                Назначить проект
              </button>
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label>Изменить роль</label>
              <select 
                value={userRole} 
                onChange={(e) => setUserRole(e.target.value)}
              >
                <option value="">Выберите роль</option>
                <option value="tester">Тестировщик</option>
                <option value="senior_tester">Старший тестировщик</option>
                <option value="admin">Администратор</option>
                <option value="senior_admin">Старший администратор</option>
              </select>
              <button 
                className="btn btn-outline btn-sm"
                onClick={handleChangeRole}
                style={{ marginTop: '10px' }}
              >
                Изменить роль
              </button>
            </div>
          </div>

          <div className="user-list">
            <h4>Список пользователей</h4>
            {users.map(user => (
              <div key={user.id} className="user-item">
                <div className="user-info">
                  <strong>{user.name}</strong> ({user.email})
                  <span className="user-role">{getRoleDisplayName(user.role)}</span>
                </div>
                <div className="user-projects">
                  <strong>Проекты:</strong> {user.assignedProjects.length > 0 
                    ? user.assignedProjects.map(projectId => 
                        projects.find(p => p.id === projectId)?.name
                      ).join(', ')
                    : 'Не назначены'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button className="btn btn-primary" onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserManagementModal;