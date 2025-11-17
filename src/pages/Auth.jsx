import React, { useState } from 'react';
import '../styles/auth.css';
import '../styles/global.css';
import { useToast } from '../components/UI/ToastContext';

const AuthPage = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();


  const handleLogin = async (e) => {
    e.preventDefault();
    const email = e.target.elements.loginEmail.value;
    const password = e.target.elements.loginPassword.value;
    if (!email || !password) {
      addToast('Введите email и пароль', 'error');
      return;
    }

    try {
      setIsLoading(true);
      // Local login: backend registration/login is disabled.
      // We accept entered credentials and create a local session for a senior administrator.
      const fakeToken = 'local-token-' + Math.random().toString(36).slice(2);
      const user = {
        name: 'Senior Admin',
        email,
        role: 'senior_admin'
      };

      localStorage.setItem('authToken', fakeToken);
      localStorage.setItem('authUser', JSON.stringify(user));
      onLogin(user);
    } catch (error) {
      addToast(error.message || 'Неверный email или пароль', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="welcome-page">
      <div className="welcome-container">
        <a href="/" className="back-button">
          <i className="fas fa-arrow-left"></i> На главную
        </a>
        
        <div className="welcome-logo">
          <img className='logo logo_auth' src="/logo_dark.svg" alt="" />
        </div>
        <h1 className="welcome-title">Добро пожаловать в AxionLabs</h1>
        <p className="welcome-subtitle">Платформа для управления тестированием</p>
        
        {/* Форма входа */}
        <form 
            className="auth-form active"
          id="loginForm"
          onSubmit={handleLogin}
        >
          <h2 className='loginFormTitle'>Вход</h2>
          <div className="form-group">
            <label htmlFor="loginEmail">Email</label>
            <input type="email" id="loginEmail" required placeholder="Введите ваш email" />
          </div>
          <div className="form-group">
            <label htmlFor="loginPassword">Пароль</label>
            <input type="password" id="loginPassword" required placeholder="Введите ваш пароль" />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{width: '100%'}} disabled={isLoading}>
            {isLoading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        
      </div>
    </div>
  );
};

export default AuthPage;