import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import InspectorLayout from '../../components/Layout/InspectorLayout';
import { tasksApi, TaskDetail } from '../../api/tasks';
import { checklistsApi, ChecklistDetail } from '../../api/checklists';
import { inspectionResultsApi, TaskResultsSummary, CreateInspectionResultRequest } from '../../api/inspectionResults';
import '../UserEditPage.css';
import './TaskInspectionPage.css';

interface ElementFormData {
  checklist_element_id: number;
  condition_status: 'Исправное' | 'Удовлетворительное' | 'Неудовлетворительное' | 'Аварийное' | '';
  comment: string;
  existingResultId?: number; // Для отслеживания существующих результатов
}

const TaskInspectionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [checklist, setChecklist] = useState<ChecklistDetail | null>(null);
  const [resultsSummary, setResultsSummary] = useState<TaskResultsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<{ [key: number]: boolean }>({});
  const [error, setError] = useState<string | null>(null);

  // Форма данных для каждого элемента
  const [elementForms, setElementForms] = useState<{ [key: number]: ElementFormData }>({});

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Сначала загружаем задание
      const taskData = await tasksApi.get(parseInt(id!));
      setTask(taskData);

      // Затем загружаем результаты и чек-лист параллельно
      const [resultsData, checklistData] = await Promise.all([
        inspectionResultsApi.getTaskResults(parseInt(id!)),
        checklistsApi.get(taskData.checklist.id),
      ]);

      setResultsSummary(resultsData);
      setChecklist(checklistData);

      // Инициализируем формы для всех элементов
      const forms: { [key: number]: ElementFormData } = {};
      
      // Сортируем элементы по order_index
      const sortedElements = [...checklistData.elements].sort((a, b) => a.order_index - b.order_index);
      
      // Создаем мапу существующих результатов по checklist_element_id
      const resultsMap = new Map(resultsData.results.map(r => [r.checklist_element_id, r]));

      for (const element of sortedElements) {
        // Ищем существующий результат по checklist_element_id
        const existingResult = resultsMap.get(element.checklist_element_id);
        
        forms[element.checklist_element_id] = {
          checklist_element_id: element.checklist_element_id,
          condition_status: existingResult?.condition_status || '',
          comment: existingResult?.comment || '',
          existingResultId: existingResult ? existingResult.checklist_element_id : undefined,
        };
      }

      setElementForms(forms);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Ошибка загрузки данных задания';
      console.error('Error loading task data:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (checklistElementId: number, status: ElementFormData['condition_status']) => {
    setElementForms(prev => ({
      ...prev,
      [checklistElementId]: {
        ...prev[checklistElementId],
        condition_status: status,
      },
    }));
  };

  const handleCommentChange = (checklistElementId: number, comment: string) => {
    setElementForms(prev => ({
      ...prev,
      [checklistElementId]: {
        ...prev[checklistElementId],
        comment,
      },
    }));
  };

  const handleSaveResult = async (checklistElementId: number) => {
    if (!id || !elementForms[checklistElementId]) return;
    
    const formData = elementForms[checklistElementId];
    if (!formData.condition_status) {
      setError('Выберите статус состояния для элемента');
      return;
    }

    setSaving(prev => ({ ...prev, [checklistElementId]: true }));
    setError(null);

    try {
      const request: CreateInspectionResultRequest = {
        checklist_element_id: formData.checklist_element_id,
        condition_status: formData.condition_status,
        comment: formData.comment || undefined,
      };

      await inspectionResultsApi.createOrUpdateResult(parseInt(id), request);
      await loadData(); // Перезагружаем данные
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка сохранения результата');
    } finally {
      setSaving(prev => ({ ...prev, [checklistElementId]: false }));
    }
  };

  const handleDeleteResult = async (checklistElementId: number) => {
    if (!id) return;
    
    if (!window.confirm('Вы уверены, что хотите удалить результат для этого элемента?')) {
      return;
    }

    setSaving(prev => ({ ...prev, [checklistElementId]: true }));
    setError(null);

    try {
      await inspectionResultsApi.deleteResult(parseInt(id), checklistElementId);
      await loadData(); // Перезагружаем данные
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка удаления результата');
    } finally {
      setSaving(prev => ({ ...prev, [checklistElementId]: false }));
    }
  };

  const handleSubmitTask = async () => {
    if (!id || !resultsSummary) return;

    if (resultsSummary.completed_elements < resultsSummary.total_elements) {
      setError(`Заполните все элементы чек-листа. Заполнено: ${resultsSummary.completed_elements} из ${resultsSummary.total_elements}`);
      return;
    }

    if (!window.confirm('Вы уверены, что хотите отправить задание на проверку? После отправки вы не сможете редактировать результаты.')) {
      return;
    }

    setSaving({ submit: true });
    setError(null);

    try {
      await tasksApi.submitTask(parseInt(id));
      navigate(`/inspector/tasks/${id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка отправки задания на проверку');
      setSaving({});
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Исправное':
        return '#4caf50'; // Green
      case 'Удовлетворительное':
        return '#8bc34a'; // Light green
      case 'Неудовлетворительное':
        return '#ff9800'; // Orange
      case 'Аварийное':
        return '#f44336'; // Red
      default:
        return '#9e9e9e'; // Gray
    }
  };

  if (loading) {
    return (
      <InspectorLayout>
        <div className="loading">Загрузка...</div>
      </InspectorLayout>
    );
  }

  if (!task || !checklist || !resultsSummary) {
    return (
      <InspectorLayout>
        <div className="error-message">Ошибка загрузки данных задания</div>
        <button className="btn-back" onClick={() => navigate('/inspector/tasks')}>
          Назад к списку заданий
        </button>
      </InspectorLayout>
    );
  }

  const progressPercentage = resultsSummary.total_elements > 0
    ? (resultsSummary.completed_elements / resultsSummary.total_elements) * 100
    : 0;

  const sortedElements = [...checklist.elements].sort((a, b) => a.order_index - b.order_index);
  const allCompleted = resultsSummary.completed_elements >= resultsSummary.total_elements;

  return (
    <InspectorLayout>
      <div className="task-inspection-page">
        <div className="page-header">
          <h1 className="page-title">Заполнение результатов осмотра</h1>
          <button className="btn-back" onClick={() => navigate(`/inspector/tasks/${id}`)}>
            Назад к деталям задания
          </button>
        </div>

        <div className="inspection-info">
          <div className="info-section">
            <h2>{task.title}</h2>
            <p><strong>Здание:</strong> {task.building.address}</p>
            <p><strong>Чек-лист:</strong> {task.checklist.title}</p>
          </div>
          <div className="progress-section">
            <h3>Прогресс заполнения</h3>
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${progressPercentage}%` }}></div>
            </div>
            <p className="progress-text">
              {resultsSummary.completed_elements} из {resultsSummary.total_elements} элементов заполнено
            </p>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="elements-list">
          {sortedElements.map((element) => {
            const formData = elementForms[element.checklist_element_id];
            const hasResult = formData?.existingResultId !== undefined;
            const isSaving = saving[element.checklist_element_id] || false;

            return (
              <div key={element.checklist_element_id} className="element-card">
                <div className="element-header">
                  <div>
                    <h3>
                      {element.order_index}. {element.element_name}
                      {hasResult && (
                        <span
                          className="status-badge-inline"
                          style={{ backgroundColor: getStatusColor(formData.condition_status) }}
                        >
                          {formData.condition_status}
                        </span>
                      )}
                    </h3>
                    <p className="element-category">{element.category}</p>
                  </div>
                </div>

                <div className="element-form">
                  <div className="form-group">
                    <label htmlFor={`status-${element.checklist_element_id}`}>Статус состояния *</label>
                    <select
                      id={`status-${element.checklist_element_id}`}
                      value={formData?.condition_status || ''}
                      onChange={(e) => handleStatusChange(element.checklist_element_id, e.target.value as ElementFormData['condition_status'])}
                      className="form-input"
                      disabled={isSaving}
                    >
                      <option value="">Выберите статус</option>
                      <option value="Исправное">Исправное</option>
                      <option value="Удовлетворительное">Удовлетворительное</option>
                      <option value="Неудовлетворительное">Неудовлетворительное</option>
                      <option value="Аварийное">Аварийное</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor={`comment-${element.checklist_element_id}`}>Комментарий</label>
                    <textarea
                      id={`comment-${element.checklist_element_id}`}
                      value={formData?.comment || ''}
                      onChange={(e) => handleCommentChange(element.checklist_element_id, e.target.value)}
                      className="form-input"
                      rows={3}
                      disabled={isSaving}
                      placeholder="Дополнительные замечания (необязательно)"
                    />
                  </div>

                  <div className="element-actions">
                    <button
                      className="btn-submit"
                      onClick={() => handleSaveResult(element.checklist_element_id)}
                      disabled={isSaving || !formData?.condition_status}
                    >
                      {isSaving ? 'Сохранение...' : hasResult ? 'Обновить' : 'Сохранить'}
                    </button>
                    {hasResult && (
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteResult(element.checklist_element_id)}
                        disabled={isSaving}
                      >
                        Удалить
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="submit-section">
          <button
            className="btn-submit btn-submit-large"
            onClick={handleSubmitTask}
            disabled={saving.submit || !allCompleted}
          >
            {saving.submit ? 'Отправка...' : 'Отправить задание на проверку'}
          </button>
          {!allCompleted && (
            <p className="submit-hint">
              Для отправки на проверку необходимо заполнить все элементы чек-листа
            </p>
          )}
        </div>
      </div>
    </InspectorLayout>
  );
};

export default TaskInspectionPage;

