import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import InspectorLayout from '../../components/Layout/InspectorLayout';
import { tasksApi, TaskDetail } from '../../api/tasks';
import { inspectionActApi } from '../../api/inspectionAct';
import '../UserEditPage.css';
import '../coordinator/TaskDetailPage.css';

const InspectorTaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadTask();
    }
  }, [id]);

  const loadTask = async () => {
    try {
      setLoading(true);
      setError(null);
      const taskData = await tasksApi.get(parseInt(id!));
      setTask(taskData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка загрузки задания');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTask = async () => {
    if (!id) return;
    setActionLoading(true);
    setError(null);
    try {
      await tasksApi.acceptTask(parseInt(id));
      await loadTask();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка принятия задания');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitTask = async () => {
    if (!id) return;
    setActionLoading(true);
    setError(null);
    try {
      await tasksApi.submitTask(parseInt(id));
      await loadTask();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка отправки задания на проверку');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadAct = async () => {
    if (!id) return;
    setActionLoading(true);
    setError(null);
    try {
      const blob = await inspectionActApi.downloadAct(parseInt(id));
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `inspection_act_${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка скачивания акта осмотра');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'New': 'Новое',
      'Pending': 'В ожидании',
      'InProgress': 'В работе',
      'OnReview': 'На проверке',
      'Approved': 'Утверждено',
      'ForRevision': 'На доработку',
      'Canceled': 'Отменено',
    };
    return labels[status] || status;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'New':
        return 'status-badge new';
      case 'Pending':
        return 'status-badge pending';
      case 'InProgress':
        return 'status-badge inprogress';
      case 'OnReview':
        return 'status-badge onreview';
      case 'Approved':
        return 'status-badge approved';
      case 'ForRevision':
        return 'status-badge revision';
      case 'Canceled':
        return 'status-badge canceled';
      default:
        return 'status-badge';
    }
  };

  if (loading) {
    return (
      <InspectorLayout>
        <div className="loading">Загрузка...</div>
      </InspectorLayout>
    );
  }

  if (error && !task) {
    return (
      <InspectorLayout>
        <div className="error-message">{error}</div>
        <button className="btn-back" onClick={() => navigate('/inspector/tasks')}>
          Назад к списку заданий
        </button>
      </InspectorLayout>
    );
  }

  if (!task) {
    return (
      <InspectorLayout>
        <div className="empty-state">Задание не найдено.</div>
        <button className="btn-back" onClick={() => navigate('/inspector/tasks')}>
          Назад к списку заданий
        </button>
      </InspectorLayout>
    );
  }

  const canAccept = task.status === 'Pending';
  const canStartInspection = task.status === 'InProgress';
  const canSubmit = task.status === 'InProgress'; // TODO: проверка что все элементы заполнены
  const canDownloadAct = task.status === 'OnReview' || task.status === 'Approved';

  return (
    <InspectorLayout>
      <div className="task-detail-page">
        <div className="page-header">
          <h1 className="page-title">Задание: {task.title}</h1>
          <button className="btn-back" onClick={() => navigate('/inspector/tasks')}>
            Назад к списку
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="task-info-grid">
          <div className="info-card">
            <h3>Основная информация</h3>
            <p><strong>ID:</strong> {task.id}</p>
            <p><strong>Название:</strong> {task.title}</p>
            <p><strong>Статус:</strong> <span className={getStatusBadgeClass(task.status)}>{getStatusLabel(task.status)}</span></p>
            <p><strong>Приоритет:</strong> {task.priority}</p>
            <p><strong>Описание:</strong> {task.description || 'Нет описания'}</p>
            <p><strong>Планируемая дата:</strong> {new Date(task.scheduled_date).toLocaleString()}</p>
            <p><strong>Создано:</strong> {new Date(task.created_at).toLocaleString()}</p>
            <p><strong>Обновлено:</strong> {new Date(task.updated_at).toLocaleString()}</p>
          </div>

          <div className="info-card">
            <h3>Связанные сущности</h3>
            <p><strong>Здание:</strong> {task.building.address} (ID: {task.building.id})</p>
            <p><strong>Чек-лист:</strong> {task.checklist.title} ({task.checklist.inspection_type}) (ID: {task.checklist.id})</p>
          </div>
        </div>

        <div className="task-actions-section">
          <h3>Действия</h3>
          <div className="action-buttons-group">
            {canAccept && (
              <button
                className="btn-action"
                onClick={handleAcceptTask}
                disabled={actionLoading}
              >
                {actionLoading ? 'Принятие...' : 'Принять задание'}
              </button>
            )}
            {canStartInspection && (
              <button
                className="btn-action"
                onClick={() => navigate(`/inspector/tasks/${task.id}/inspection`)}
                disabled={actionLoading}
              >
                Начать осмотр
              </button>
            )}
            {canSubmit && (
              <button
                className="btn-action"
                onClick={handleSubmitTask}
                disabled={actionLoading}
              >
                {actionLoading ? 'Отправка...' : 'Отправить на проверку'}
              </button>
            )}
            {canDownloadAct && (
              <button
                className="btn-action"
                onClick={handleDownloadAct}
                disabled={actionLoading}
              >
                {actionLoading ? 'Скачивание...' : 'Скачать акт осмотра'}
              </button>
            )}
          </div>
        </div>
      </div>
    </InspectorLayout>
  );
};

export default InspectorTaskDetailPage;

