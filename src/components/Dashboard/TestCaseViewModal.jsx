import React from 'react';

const TestCaseViewModal = ({ testCase, onClose }) => {
  if (!testCase) return null;

  const lv = testCase.latest_version || {};
  const title = lv.title || testCase.Title || testCase.title || testCase.key || 'Без названия';

  const description = lv.description || lv.desc || testCase.Description || testCase.description || '';

  // Steps:
  const steps = lv.steps || lv.Steps || lv.instructions || lv.steps_text || lv.step_list || testCase.Steps || testCase.steps || testCase.instructions || '';

  // Expected/result:
  const expected = lv.expected || lv.Expected || lv.expected_result || lv.expectedResult || lv.expected_output || testCase.Expected || testCase.expected || '';

  const priority = lv.priority || testCase.Priority || testCase.priority || 'low';

  // Helpers to render various shapes
  const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;

  const renderMultiline = (text) => {
    if (!isNonEmptyString(text)) return null;
    const parts = text.split(/\r?\n/).map(p => p.trim()).filter(Boolean);
    if (parts.length === 0) return null;
    if (parts.length === 1) return <div>{parts[0]}</div>;
    return parts.map((p, i) => <p key={i} style={{ margin: '0 0 0.6rem' }}>{p}</p>);
  };

  const renderSteps = (s) => {
    if (!s || (Array.isArray(s) && s.length === 0) || (typeof s === 'string' && !s.trim())) return <em>Не указаны</em>;

    if (Array.isArray(s)) {
      return (
        <ol>
          {s.map((item, idx) => {
            if (typeof item === 'string') return <li key={idx}>{item}</li>;
            if (typeof item === 'object' && item !== null) {
              // common keys
              const text = item.action || item.step || item.title || item.description || item.name || JSON.stringify(item);
              return <li key={idx}>{String(text)}</li>;
            }
            return <li key={idx}>{String(item)}</li>;
          })}
        </ol>
      );
    }

    if (typeof s === 'object') {
      // object with nested list
      const arr = s.steps || s.items || s.instructions || s.actions;
      if (Array.isArray(arr)) return renderSteps(arr);
      // otherwise show pretty JSON
      try { return <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(s, null, 2)}</pre>; } catch (e) { return <div>{String(s)}</div>; }
    }

    // string:
    if (isNonEmptyString(s)) {
      if (s.indexOf('\n') !== -1) {
        const lines = s.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        return (
          <ol>
            {lines.map((l, i) => <li key={i}>{l}</li>)}
          </ol>
        );
      }
      return <div>{s}</div>;
    }
    return <em>Не указаны</em>;
  };

  const renderExpected = (e) => {
    if (!e || (Array.isArray(e) && e.length === 0) || (typeof e === 'string' && !e.trim())) return <em>Не указан</em>;

    if (Array.isArray(e)) {
      return (
        <div>
          {e.map((it, i) => (
            <p key={i} style={{ margin: '0 0 0.6rem' }}>{typeof it === 'object' ? JSON.stringify(it) : it}</p>
          ))}
        </div>
      );
    }

    if (typeof e === 'object') {
      const text = e.text || e.result || e.expected || e.description;
      if (text) return renderMultiline(text);
      try { return <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(e, null, 2)}</pre>; } catch (err) { return <div>{String(e)}</div>; }
    }

    // string
    return renderMultiline(e) || <div>{e}</div>;
  };

  return (
    <div className="modal active">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Просмотр тест-кейса</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Закрыть">&times;</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Key</label>
            <div className="readonly-field">{testCase.key}</div>
          </div>
          <div className="form-group">
            <label>Название</label>
            <div className="readonly-field">{title}</div>
          </div>
          <div className="form-group">
            <label>Описание</label>
            <div className="readonly-field">{description ? renderMultiline(description) : <em>Описание отсутствует</em>}</div>
          </div>
          <div className="form-group">
            <label>Шаги</label>
            <div className="readonly-field">{renderSteps(steps)}</div>
          </div>
          <div className="form-group">
            <label>Ожидаемый результат</label>
            <div className="readonly-field">{renderExpected(expected)}</div>
          </div>
          <div className="form-group">
            <label>Приоритет</label>
            <div className="readonly-field">{priority}</div>
          </div>
        </div>
        <div className="modal-actions" style={{ padding: '1rem' }}>
          <button className="btn btn-outline" onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </div>
  );
};

export default TestCaseViewModal;
