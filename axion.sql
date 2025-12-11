--Пользователи
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'tester',
    
    CONSTRAINT valid_role CHECK (role IN ('admin', 'senior_admin', 'tester', 'senior_tester', 'manager', 'viewer')),
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);


CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);


COMMENT ON TABLE users IS 'Таблица пользователей системы тестирования';
COMMENT ON COLUMN users.username IS 'Логин для входа в систему';
COMMENT ON COLUMN users.email IS 'Электронная почта';
COMMENT ON COLUMN users.password IS 'пароль';
COMMENT ON COLUMN users.role IS 'Роль: admin, senior_admin, tester, senior_tester, manager, viewer';


--Проекты

CREATE TABLE IF NOT EXISTS projects (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    test_environment VARCHAR(100) NOT NULL,
    test_type VARCHAR(100) NOT NULL
);


CREATE INDEX idx_projects_name ON projects(name);


COMMENT ON TABLE projects IS 'Таблица проектов для тестирования';
COMMENT ON COLUMN projects.id IS 'Первичный ключ (primary key)';
COMMENT ON COLUMN projects.name IS 'Название проекта';
COMMENT ON COLUMN projects.description IS 'Описание проекта';
COMMENT ON COLUMN projects.test_environment IS 'Тестовая среда (например: dev, staging, production)';
COMMENT ON COLUMN projects.test_type IS 'Вид тестирования (например: manual, automated, performance)';

        ALTER TABLE projects ADD CONSTRAINT unique_project_name UNIQUE (name);

-- Дистрибутивы проекта
CREATE TABLE IF NOT EXISTS distributions (
    id BIGSERIAL PRIMARY KEY,
    project_name VARCHAR(100) NOT NULL REFERENCES projects(name) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    version VARCHAR(50) NOT NULL,
    os_type VARCHAR(50) NOT NULL,
    description TEXT,
    
   
    CONSTRAINT unique_distribution_per_project UNIQUE(project_name, name, version)
);

-- Тест-планы проекта 
CREATE TABLE IF NOT EXISTS test_plans (
    id BIGSERIAL PRIMARY KEY,
    project_name VARCHAR(100) NOT NULL REFERENCES projects(name) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    goals TEXT,
    scope TEXT,
    plan_version VARCHAR(50), 
    distribution_name VARCHAR(100),
    distribution_version VARCHAR(50),
    
    
    CONSTRAINT fk_test_plan_distribution 
        FOREIGN KEY (project_name, distribution_name, distribution_version) 
        REFERENCES distributions(project_name, name, version) 
        ON DELETE SET NULL,
    
    CONSTRAINT unique_test_plan_per_project UNIQUE(project_name, name)
);

-- OpenQA профили проекта 
CREATE TABLE IF NOT EXISTS openqa_profiles (
    id BIGSERIAL PRIMARY KEY,
    project_name VARCHAR(100) NOT NULL REFERENCES projects(name) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    base_url VARCHAR(255) NOT NULL,
    description TEXT,
    mode VARCHAR(50),
    priority INTEGER DEFAULT 1,
    configuration TEXT,
    
    CONSTRAINT unique_profile_per_project UNIQUE(project_name, name)
);

-- Отчеты 
CREATE TABLE IF NOT EXISTS reports (
    id BIGSERIAL PRIMARY KEY,
    project_name VARCHAR(100) NOT NULL REFERENCES projects(name) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    report_date DATE DEFAULT CURRENT_DATE,
    test_environment VARCHAR(100),
    overall_status VARCHAR(20) CHECK (overall_status IN ('passed', 'failed', 'blocked', 'skipped')),
    description TEXT,
    results TEXT,
    recommendations TEXT,
    test_plan_name VARCHAR(100),
    
  
    CONSTRAINT fk_report_test_plan 
        FOREIGN KEY (project_name, test_plan_name) 
        REFERENCES test_plans(project_name, name) 
        ON DELETE SET NULL,
    
    CONSTRAINT unique_report_per_project UNIQUE(project_name, name)
);

-- Тест-кейсы 
CREATE TABLE IF NOT EXISTS test_cases (
    id BIGSERIAL PRIMARY KEY,
    project_name VARCHAR(100) NOT NULL REFERENCES projects(name) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    priority INTEGER CHECK (priority BETWEEN 1 AND 5),
    steps TEXT NOT NULL,
    expected_result TEXT NOT NULL,
    description TEXT,
    
    CONSTRAINT unique_test_case_per_project UNIQUE(project_name, name)
);

-- Группы тест-кейсов 
CREATE TABLE IF NOT EXISTS test_case_groups (
    id BIGSERIAL PRIMARY KEY,
    project_name VARCHAR(100) NOT NULL REFERENCES projects(name) ON DELETE CASCADE,
    test_plan_name VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
  
    CONSTRAINT fk_group_test_plan 
        FOREIGN KEY (project_name, test_plan_name) 
        REFERENCES test_plans(project_name, name) 
        ON DELETE CASCADE,
    
    CONSTRAINT unique_group_per_plan UNIQUE(project_name, test_plan_name, name)
);

-- Связь групп и тест-кейсов
CREATE TABLE IF NOT EXISTS group_test_cases (
    project_name VARCHAR(100) NOT NULL,
    test_plan_name VARCHAR(100) NOT NULL,
    group_name VARCHAR(100) NOT NULL,
    test_case_name VARCHAR(200) NOT NULL,
    order_index INTEGER DEFAULT 0,
    
    
    CONSTRAINT fk_group_test_case_case 
        FOREIGN KEY (project_name, test_case_name) 
        REFERENCES test_cases(project_name, name) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_group_test_case_group 
        FOREIGN KEY (project_name, test_plan_name, group_name) 
        REFERENCES test_case_groups(project_name, test_plan_name, name) 
        ON DELETE CASCADE,
    
    CONSTRAINT pk_group_test_cases 
        PRIMARY KEY (project_name, test_plan_name, group_name, test_case_name)
);

--  Тест-раны 
CREATE TABLE IF NOT EXISTS test_runs (
    id BIGSERIAL PRIMARY KEY,
    project_name VARCHAR(100) NOT NULL REFERENCES projects(name) ON DELETE CASCADE,
    test_plan_name VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    run_type VARCHAR(50),
    
    
    CONSTRAINT fk_test_run_plan 
        FOREIGN KEY (project_name, test_plan_name) 
        REFERENCES test_plans(project_name, name) 
        ON DELETE CASCADE,
    
    CONSTRAINT unique_test_run_per_plan UNIQUE(project_name, test_plan_name, name)
);

-- Результаты тест-ранов 
CREATE TABLE IF NOT EXISTS test_run_cases (
    id BIGSERIAL PRIMARY KEY,
    project_name VARCHAR(100) NOT NULL,
    test_plan_name VARCHAR(100) NOT NULL,
    test_run_name VARCHAR(100) NOT NULL,
    test_case_name VARCHAR(200) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('passed', 'failed', 'blocked', 'skipped')),
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    
   
    CONSTRAINT fk_test_run_case_run 
        FOREIGN KEY (project_name, test_plan_name, test_run_name) 
        REFERENCES test_runs(project_name, test_plan_name, name) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_test_run_case_case 
        FOREIGN KEY (project_name, test_case_name) 
        REFERENCES test_cases(project_name, name) 
        ON DELETE CASCADE,
    
    CONSTRAINT unique_case_per_run UNIQUE(project_name, test_plan_name, test_run_name, test_case_name)
);


COMMENT ON TABLE distributions IS 'Дистрибутивы проекта с ссылкой на проект (уникальность: проект+название+версия)';
COMMENT ON COLUMN distributions.name IS 'Название дистрибутива';
COMMENT ON COLUMN distributions.version IS 'Версия дистрибутива';

COMMENT ON TABLE test_plans IS 'Тест-планы проекта с ссылкой на проект и конкретную версию дистрибутива';
COMMENT ON COLUMN test_plans.distribution_name IS 'Название дистрибутива для тест-плана';
COMMENT ON COLUMN test_plans.distribution_version IS 'Конкретная версия дистрибутива';

COMMENT ON TABLE test_case_groups IS 'Группы тест-кейсов с ссылкой на тест-план';
COMMENT ON TABLE group_test_cases IS 'Связь групп и тест-кейсов (состав кейсов)';
COMMENT ON TABLE test_runs IS 'Тест-раны с ссылкой на тест-план';
COMMENT ON TABLE test_run_cases IS 'Тест-кейсы в тест-ранах с результатами';


