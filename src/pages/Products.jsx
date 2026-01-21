import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/global.css';
import '../styles/home.css';
const firstImg = process.env.PUBLIC_URL + '/img/first.jpg';
const secondImg = process.env.PUBLIC_URL + '/img/second.jpg';
const thirdImg = process.env.PUBLIC_URL + '/img/third.jpg';
const fourthImg = process.env.PUBLIC_URL + '/img/fourth.jpg';


const Products = ({ theme, toggleTheme }) => {
  const logoPath = theme === 'dark' ? process.env.PUBLIC_URL + '/logo_dark.svg' : process.env.PUBLIC_URL + '/logo_Theme.svg';
  const [selectedImage, setSelectedImage] = useState(null);

  const openModal = (src) => setSelectedImage(src);
  const closeModal = () => setSelectedImage(null);

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="container">
          <nav className="landing-nav">
            <Link to="/" className="landing-logo">
              <img className='logo home_logo' src={logoPath} alt="AxionLabs Logo" />
            </Link>
            <div className="landing-auth">
              <Link to="/" className="btn btn-primary">Главная</Link>
              <button className={`theme-toggle ${theme}`} onClick={toggleTheme}>
                <i className="fas fa-circle-half-stroke"></i>
              </button>

            </div>
          </nav>
        </div>
      </header>

      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">Наши продукты</h1>
             

              
            </div>
          </div>
        </div>
      </section>

      <section className="products-section">
        <div className="container">
          <h2 className="section-title">AxionTMP (Test Management Platform) <span className="status-badge status-developing"><i className="fas fa-tools"></i> В разработке</span></h2>
          <p className="status-description">
            <strong>Статус проекта:</strong> Активная разработка. Мы работаем над созданием полнофункциональной платформы для управления тестированием. 
            Ожидаемый релиз:2026 год. Следите за обновлениями!
          </p>
          <p className="product-description">
           AxionTMP - это современное веб-приложение от компании AxionLabs для управления процессом тестирования программного обеспечения. Платформа предоставляет комплексный инструментарий для создания, организации и выполнения тестов, а также генерации детальных отчетов. 
          </p>
          <p className="product-description">
            Организация тестов - Структурированное хранение и категоризация тест-кейсов
          </p>
          <ul className="product-list">
            <li><strong>Управление проектами</strong> - Создание и настройка отдельных проектов тестирования</li>
            <li><strong>Управление командой</strong> - Распределение ролей и прав доступа пользователей</li>
            <li><strong>Автоматизация процессов</strong> - Запуск автоматических и ручных тестов</li>
            <li><strong>Анализ результатов</strong> - Генерация отчетов и метрик тестирования</li>
            <li><strong>Отслеживание дефектов</strong> - Ведение истории найденных ошибок и их статусов</li>
          </ul>

          <h3>Назначение</h3>
          <p className="product-description">
            AxionTMP предназначена для централизованного управления процессом QA и тестирования в организациях. Платформа решает следующие задачи: организация тестов, управление проектами, управление командой, автоматизация процессов, анализ результатов и отслеживание дефектов.
          </p>

          <h3>Почему AxionTMP?</h3>
          <ul className="product-list">
            <li><strong>Интеграция в один инструмент</strong> - Все процессы QA в одном месте</li>
            <li><strong>Удобный интерфейс</strong> - Интуитивный дизайн для быстрого освоения</li>
            <li><strong>Гибкость</strong> - Адаптация под различные методологии тестирования</li>
            <li><strong>Масштабируемость</strong> - Поддержка как малых, так и крупных проектов</li>
            <li><strong>Аналитика</strong> - Детальные отчеты и метрики для улучшения качества</li>
          </ul>

          <h3>Основные возможности</h3>
          <div className="features-details">
            <h4><i className="fas fa-clipboard-list"></i> Управление тест-кейсами</h4>
            <p>Категории тест-кейсов, Drag & Drop, гибкая классификация, приоритизация и теги для быстрого поиска.</p>

            <h4><i className="fas fa-play-circle"></i> Тестовые прогоны</h4>
            <p>Автоматические и ручные прогоны, интеллектуальный выбор тестов, отслеживание прогресса и история прогонов.</p>

            <h4><i className="fas fa-chart-bar"></i> Отчетность и аналитика</h4>
            <p>Автоматические и ручные отчеты, визуализация данных, экспорт в PDF/CSV и метрики качества.</p>

            <h4><i className="fas fa-users"></i> Управление пользователями и ролями</h4>
            <p>Роли пользователей, детальное распределение прав, приглашение членов команды и профили пользователей.</p>

            <h4><i className="fas fa-folder-open"></i> Управление проектами</h4>
            <p>Создание проектов, иерархия плана тестирования, распределение ответственности и версионирование.</p>
          </div>

                   <div className="screenshots-section">
            <h3>Скриншоты</h3>
            <div className="screenshots-scroll">
               <div className="screenshot-placeholder">
                <img src={firstImg} alt="Скриншот 1" onClick={() => openModal(firstImg)} style={{ cursor: 'pointer' }} />
              </div>
              <div className="screenshot-placeholder">
                <img src={secondImg} alt="Скриншот 2" onClick={() => openModal(secondImg)} style={{ cursor: 'pointer' }} />
              </div>
               <div className="screenshot-placeholder">
                <img src={thirdImg} alt="Скриншот 3" onClick={() => openModal(thirdImg)} style={{ cursor: 'pointer' }} />
              </div>
               <div className="screenshot-placeholder">
                <img src={fourthImg} alt="Скриншот 4" onClick={() => openModal(fourthImg)} style={{ cursor: 'pointer' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3 className="footer-title">AxionLabs</h3>
              <p>Профессиональная разработка программного обеспечения</p>
                <img src={logoPath} alt="AxionLabs Logo" className="footer-logo" />
            </div>

            <div className="footer-section">
              <h3 className="footer-title">Контакты</h3>
              <ul className="footer-links">
                <li><i className="fas fa-envelope"></i><a href="mailto:info@AxionLabs.ru">info@AxionLabs.ru</a></li>
                <li><i className="fas fa-phone"></i> <a href="tel:+7(999)672-67-47">+7 (999) 672-67-47</a></li>
                <li><i className="fas fa-map-marker-alt"></i> Москва, Россия</li>
              </ul>
            </div>

            <div className="footer-section">
              <h3 className="footer-title">Быстрые ссылки</h3>
              <ul className="footer-links">
                <li><Link to="/">Главная</Link></li>
                <li><Link to="/products">Продукты</Link></li>
               
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2026 AxionLabs. Все права защищены.</p>
          </div>
        </div>
      </footer>

      {selectedImage && (
        <div className="modal" onClick={closeModal}>
          <img src={selectedImage} alt="Увеличенное изображение" className="modal-img" />
        </div>
      )}
    </div>
  );
};

export default Products;