# Подключение PostgreSQL к проекту AxionLabs

## Описание изменений

Проект был переконфигурирован с использования мок-данных в памяти на реальную базу данных PostgreSQL.

### Изменённые файлы:

1. **back-mock/package.json** - Добавлены зависимости:
   - `pg` - драйвер PostgreSQL
   - `dotenv` - для управления переменными окружения

2. **back-mock/db.js** - Новый файл с конфигурацией подключения к БД

3. **back-mock/.env.example** - Пример конфигурации (переименуйте в `.env` и заполните)

4. **back-mock/index.js** - Полностью переписан для работы с PostgreSQL

## Требования

- PostgreSQL 12 или выше
- Node.js 14 или выше

## Установка и настройка

### 1. Установите PostgreSQL

**Windows**: [PostgreSQL Windows Installer](https://www.postgresql.org/download/windows/)

### 2. Создайте базу данных

```bash
# Подключитесь к PostgreSQL (используйте pgAdmin или командную строку)
psql -U postgres

# Создайте базу данных
CREATE DATABASE axionlabs;

# Выход
\q
```

### 3. Инициализируйте схему БД

```bash
# В директории AxionLabs выполните:
psql -U postgres -d axionlabs -f axion.sql
```

### 4. Настройте окружение

1. Скопируйте файл `back-mock/.env.example` в `back-mock/.env`
2. Отредактируйте `.env` с ваши учётные данные PostgreSQL:

```env
# Database Configuration
DB_USER=postgres
DB_PASSWORD=ваш_пароль
DB_HOST=localhost
DB_PORT=5432
DB_NAME=axionlabs

# Server Configuration
PORT=8080
NODE_ENV=development
```

### 5. Установите зависимости

```bash
cd back-mock
npm install
```

### 6. Запустите сервер

```bash
# Развитие (с автоперезагрузкой)
npm run dev

# Продакшн
npm start
```

Сервер будет доступен по адресу: `http://localhost:8080`

## API Endpoints

### Проекты
- `GET /api/v1/projects` - Получить все проекты
- `POST /api/v1/projects` - Создать проект
- `GET /api/v1/projects/:id` - Получить проект по ID
- `PUT /api/v1/projects/:id` - Обновить проект
- `DELETE /api/v1/projects/:id` - Удалить проект

### Тест-кейсы
- `GET /api/v1/projects/:projectId/test-cases` - Получить тест-кейсы проекта
- `POST /api/v1/projects/:projectId/test-cases` - Создать тест-кейс
- `PUT /api/v1/test-cases/:id` - Обновить тест-кейс
- `DELETE /api/v1/test-cases/:id` - Удалить тест-кейс

### Тест-планы
- `GET /api/v1/projects/:projectId/test-plans` - Получить тест-планы
- `POST /api/v1/projects/:projectId/test-plans` - Создать тест-план
- `PUT /api/v1/test-plans/:id` - Обновить тест-план
- `DELETE /api/v1/test-plans/:id` - Удалить тест-план

### Дистрибутивы
- `GET /api/v1/projects/:projectId/distributions` - Получить дистрибутивы
- `POST /api/v1/projects/:projectId/distributions` - Создать дистрибутив
- `DELETE /api/v1/distributions/:id` - Удалить дистрибутив

### Тест-раны
- `GET /api/v1/projects/:projectId/test-runs` - Получить тест-раны
- `POST /api/v1/projects/:projectId/test-runs` - Создать тест-ран
- `DELETE /api/v1/test-runs/:id` - Удалить тест-ран

### OpenQA профили
- `GET /api/v1/projects/:projectId/openqa/profiles` - Получить профили
- `POST /api/v1/projects/:projectId/openqa/profiles` - Создать профиль
- `DELETE /api/v1/openqa/profiles/:id` - Удалить профиль

### Отчёты
- `GET /api/v1/projects/:projectId/reports` - Получить отчёты
- `POST /api/v1/projects/:projectId/reports` - Создать отчёт

## Примеры запросов

### Создать проект
```bash
curl -X POST http://localhost:8080/api/v1/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Project",
    "description": "Test project",
    "test_environment": "staging",
    "test_type": "manual"
  }'
```

### Создать тест-кейс
```bash
curl -X POST http://localhost:8080/api/v1/projects/1/test-cases \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Login Test",
    "description": "Test login functionality",
    "steps": "1. Open app\n2. Enter credentials\n3. Click login",
    "expected_result": "User is logged in",
    "priority": 1
  }'
```

## Решение проблем

### Ошибка подключения к БД
- Проверьте, что PostgreSQL запущен
- Проверьте учётные данные в `.env`
- Проверьте, что база данных `axionlabs` существует

### Ошибка схемы БД
```bash
# Пересоздайте схему
psql -U postgres -d axionlabs -f axion.sql
```

### Порт уже в использовании
Измените `PORT` в файле `.env` на другой (например, 3001)

## Миграция данных (если были старые моки)

Если у вас были данные в памяти, их нужно будет вручную импортировать в БД через API endpoints.

## Примечания

- Все пути используют `project_name` (строковое имя) вместо ID для некоторых таблиц
- Поддерживаются связи с каскадным удалением
- Все даты хранятся в UTC

## Контакты

Для вопросов или проблем создайте issue в репозитории.
