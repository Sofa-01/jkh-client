import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CoordinatorLayout from '../../components/Layout/CoordinatorLayout';
import { tasksApi, TaskDetail } from '../../api/tasks';
import { inspectorUnitsApi } from '../../api/inspectorunits';
import { inspectionResultsApi, TaskResultsSummary } from '../../api/inspectionResults';
import { inspectionActApi } from '../../api/inspectionAct';
import { User } from '../../types/api';
import '../UsersPage.css';

const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [availableInspectors, setAvailableInspectors] = useState<User[]>([]);
  const [inspectionResults, setInspectionResults] = useState<TaskResultsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [newInspectorId, setNewInspectorId] = useState<number>(0);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadTask();
    }
  }, [id]);

  // Загружаем доступных инспекторов для здания при открытии модального окна
  useEffect(() => {
    if (showAssignModal && task) {
      loadAvailableInspectors();
    }
  }, [showAssignModal, task]);

  const loadTask = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tasksApi.get(parseInt(id!));
      setTask(data);
      setNewStatus(data.status);
      setNewInspectorId(data.inspector.id);
      
      // Загружаем результаты осмотра, если задание в подходящем статусе
      if (data.status === 'OnReview' || data.status === 'Approved' || data.status === 'ForRevision') {
        loadInspectionResults();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка загрузки задания');
    } finally {
      setLoading(false);
    }
  };

  const loadInspectionResults = async () => {
    if (!id) return;
    try {
      setLoadingResults(true);
      const results = await inspectionResultsApi.getTaskResults(parseInt(id));
      setInspectionResults(results);
    } catch (err: any) {
      console.error('Ошибка загрузки результатов осмотра:', err);
      // Не показываем ошибку пользователю, просто не показываем результаты
      setInspectionResults(null);
    } finally {
      setLoadingResults(false);
    }
  };

  const handleDownloadAct = async () => {
    if (!task) return;
    try {
      setUpdating(true);
      setError(null);
      const blob = await inspectionActApi.downloadAct(task.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Акт_осмотра_задания_${task.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка скачивания акта осмотра');
    } finally {
      setUpdating(false);
    }
  };

  const loadAvailableInspectors = async () => {
    if (!task) return;
    
    try {
      const data = await inspectorUnitsApi.getInspectorsForBuilding(task.building.id);
      setAvailableInspectors(data);
    } catch (err: any) {
      console.error('Ошибка загрузки инспекторов:', err);
      setAvailableInspectors([]);
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

  // Получаем доступные статусы для перехода
  const getAvailableStatuses = (currentStatus: string): string[] => {
    const transitions: { [key: string]: string[] } = {
      'New': ['Pending', 'Canceled'],
      'Pending': ['InProgress', 'Canceled'],
      'InProgress': ['OnReview', 'Canceled'],
      'OnReview': ['Approved', 'ForRevision'],
      'ForRevision': ['OnReview', 'Canceled'],
      'Approved': [],
      'Canceled': [],
    };
    return transitions[currentStatus] || [];
  };

  const handleUpdateStatus = async () => {
    if (!task || !newStatus) return;

    try {
      setUpdating(true);
      setError(null);
      await tasksApi.updateStatus(task.id, { status: newStatus as any });
      await loadTask();
      setShowStatusModal(false);
      alert('Статус успешно обновлен');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка обновления статуса');
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignInspector = async () => {
    if (!task || !newInspectorId) return;

    try {
      setUpdating(true);
      setError(null);
      await tasksApi.assignInspector(task.id, { inspector_id: newInspectorId });
      await loadTask();
      setShowAssignModal(false);
      alert('Инспектор успешно переназначен');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка переназначения инспектора');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    
    if (!window.confirm('Вы уверены, что хотите удалить это задание?')) {
      return;
    }

    try {
      setUpdating(true);
      setError(null);
      await tasksApi.delete(task.id);
      navigate('/coordinator/tasks');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка удаления задания');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <CoordinatorLayout>
        <div className="users-page">
          <div className="loading">Загрузка...</div>
        </div>
      </CoordinatorLayout>
    );
  }

  if (!task) {
    return (
      <CoordinatorLayout>
        <div className="users-page">
          <div className="error-message">Задание не найдено</div>
        </div>
      </CoordinatorLayout>
    );
  }

  const availableStatuses = getAvailableStatuses(task.status);

  return (
    <CoordinatorLayout>
      <div className="users-page">
        <div className="page-header">
          <h1 className="page-title">Детали задания</h1>
          <button
            className="btn-edit"
            onClick={() => navigate('/coordinator/tasks')}
          >
            Назад к списку
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
          {/* Основная информация */}
          <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
            <h2 style={{ marginTop: 0 }}>Основная информация</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <strong>Название:</strong> {task.title}
              </div>
              <div>
                <strong>Статус:</strong>{' '}
                <span className={getStatusBadgeClass(task.status)}>
                  {getStatusLabel(task.status)}
                </span>
              </div>
              <div>
                <strong>Приоритет:</strong> {task.priority}
              </div>
              <div>
                <strong>Планируемая дата:</strong>{' '}
                {new Date(task.scheduled_date).toLocaleString('ru-RU')}
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <strong>Описание:</strong> {task.description || '—'}
              </div>
              <div>
                <strong>Создано:</strong> {new Date(task.created_at).toLocaleString('ru-RU')}
              </div>
              <div>
                <strong>Обновлено:</strong> {new Date(task.updated_at).toLocaleString('ru-RU')}
              </div>
            </div>
          </div>

          {/* Связанные объекты */}
          <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
            <h2 style={{ marginTop: 0 }}>Связанные объекты</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
              <div>
                <strong>Здание:</strong>
                <br />
                {task.building.address} (ID: {task.building.id})
              </div>
              <div>
                <strong>Чек-лист:</strong>
                <br />
                {task.checklist.title} ({task.checklist.inspection_type})
              </div>
              <div>
                <strong>Инспектор:</strong>
                <br />
                {task.inspector.last_name} {task.inspector.first_name}
                <br />
                {task.inspector.email}
              </div>
            </div>
          </div>

          {/* Результаты осмотра - показываем только если задание проверено */}
          {(task.status === 'OnReview' || task.status === 'Approved' || task.status === 'ForRevision') && (
            <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2 style={{ marginTop: 0 }}>Результаты осмотра</h2>
                <button
                  className="btn-add"
                  onClick={handleDownloadAct}
                  disabled={updating}
                  style={{ marginLeft: 'auto' }}
                >
                  {updating ? 'Скачивание...' : 'Скачать акт осмотра (PDF)'}
                </button>
              </div>
              
              {loadingResults ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>Загрузка результатов...</div>
              ) : inspectionResults && inspectionResults.results.length > 0 ? (
                <>
                  <div style={{ marginBottom: '15px', color: '#555' }}>
                    Заполнено: {inspectionResults.completed_elements} из {inspectionResults.total_elements} элементов
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
                      <thead>
                        <tr style={{ background: '#e0e0e0' }}>
                          <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ccc' }}>№</th>
                          <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ccc' }}>Элемент</th>
                          <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ccc' }}>Категория</th>
                          <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ccc' }}>Статус состояния</th>
                          <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ccc' }}>Комментарий</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...inspectionResults.results]
                          .sort((a, b) => a.order_index - b.order_index)
                          .map((result) => (
                            <tr key={result.checklist_element_id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                              <td style={{ padding: '12px', border: '1px solid #ccc' }}>{result.order_index}</td>
                              <td style={{ padding: '12px', border: '1px solid #ccc' }}>{result.element_name}</td>
                              <td style={{ padding: '12px', border: '1px solid #ccc' }}>{result.element_category}</td>
                              <td style={{ padding: '12px', border: '1px solid #ccc' }}>
                                <span
                                  style={{
                                    padding: '4px 12px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    color: 'white',
                                    backgroundColor:
                                      result.condition_status === 'Исправное'
                                        ? '#4CAF50'
                                        : result.condition_status === 'Удовлетворительное'
                                        ? '#FFC107'
                                        : result.condition_status === 'Неудовлетворительное'
                                        ? '#FF9800'
                                        : '#F44336',
                                  }}
                                >
                                  {result.condition_status}
                                </span>
                              </td>
                              <td style={{ padding: '12px', border: '1px solid #ccc' }}>
                                {result.comment || '—'}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                  Результаты осмотра пока не заполнены
                </div>
              )}
            </div>
          )}

          {/* Действия */}
          <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
            <h2 style={{ marginTop: 0 }}>Действия</h2>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {availableStatuses.length > 0 && (
                <button
                  className="btn-add"
                  onClick={() => setShowStatusModal(true)}
                  disabled={updating}
                >
                  Изменить статус
                </button>
              )}
              <button
                className="btn-edit"
                onClick={() => setShowAssignModal(true)}
                disabled={updating}
              >
                Переназначить инспектора
              </button>
              <button
                className="btn-delete"
                onClick={handleDelete}
                disabled={updating}
              >
                {updating ? 'Удаление...' : 'Удалить задание'}
              </button>
            </div>
          </div>
        </div>

        {/* Модальное окно изменения статуса */}
        {showStatusModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => !updating && setShowStatusModal(false)}
          >
            <div
              style={{
                background: 'white',
                padding: '30px',
                borderRadius: '8px',
                minWidth: '400px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>Изменение статуса</h2>
              <div style={{ marginBottom: '20px' }}>
                <label>
                  <strong>Текущий статус:</strong> {getStatusLabel(task.status)}
                </label>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label>
                  <strong>Новый статус:</strong>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    style={{ width: '100%', padding: '8px', marginTop: '8px' }}
                    disabled={updating}
                  >
                    <option value={task.status}>{getStatusLabel(task.status)} (текущий)</option>
                    {availableStatuses.map((status) => (
                      <option key={status} value={status}>
                        {getStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowStatusModal(false)}
                  disabled={updating}
                  className="btn-back"
                >
                  Отмена
                </button>
                <button
                  onClick={handleUpdateStatus}
                  disabled={updating || newStatus === task.status}
                  className="btn-submit"
                >
                  {updating ? 'Обновление...' : 'Обновить'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Модальное окно переназначения инспектора */}
        {showAssignModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => !updating && setShowAssignModal(false)}
          >
            <div
              style={{
                background: 'white',
                padding: '30px',
                borderRadius: '8px',
                minWidth: '400px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>Переназначение инспектора</h2>
              <div style={{ marginBottom: '20px' }}>
                <label>
                  <strong>Текущий инспектор:</strong> {task.inspector.last_name}{' '}
                  {task.inspector.first_name}
                </label>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label>
                  <strong>Новый инспектор:</strong>
                  <select
                    value={newInspectorId}
                    onChange={(e) => setNewInspectorId(parseInt(e.target.value))}
                    style={{ width: '100%', padding: '8px', marginTop: '8px' }}
                    disabled={updating}
                  >
                    <option value={task.inspector.id}>
                      {task.inspector.last_name} {task.inspector.first_name} (текущий)
                    </option>
                    {availableInspectors
                      .filter((i) => i.id !== task.inspector.id)
                      .map((inspector) => (
                        <option key={inspector.id} value={inspector.id}>
                          {inspector.last_name} {inspector.first_name} ({inspector.email})
                        </option>
                      ))}
                  </select>
                </label>
                {availableInspectors.length === 0 && (
                  <small style={{ color: '#f57c00', display: 'block', marginTop: '8px' }}>
                    Нет других инспекторов, назначенных на ЖЭУ этого здания.
                  </small>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowAssignModal(false)}
                  disabled={updating}
                  className="btn-back"
                >
                  Отмена
                </button>
                <button
                  onClick={handleAssignInspector}
                  disabled={updating || newInspectorId === task.inspector.id || availableInspectors.length === 0}
                  className="btn-submit"
                >
                  {updating ? 'Обновление...' : 'Переназначить'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CoordinatorLayout>
  );
};

export default TaskDetailPage;

