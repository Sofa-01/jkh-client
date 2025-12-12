import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CoordinatorLayout from '../../components/Layout/CoordinatorLayout';
import { tasksApi, Task } from '../../api/tasks';
import '../UsersPage.css'; // Используем тот же стиль для таблиц

const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadTasks();
  }, [statusFilter]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tasksApi.list(statusFilter || undefined);
      setTasks(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка загрузки заданий');
    } finally {
      setLoading(false);
    }
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

  const filteredTasks = tasks.filter((task) => {
    const search = searchTerm.toLowerCase();
    return (
      task.title.toLowerCase().includes(search) ||
      task.building_address.toLowerCase().includes(search) ||
      task.checklist_title.toLowerCase().includes(search) ||
      task.inspector_name.toLowerCase().includes(search)
    );
  });

  return (
    <CoordinatorLayout>
      <div className="users-page">
        <div className="page-header">
          <h1 className="page-title">Задания</h1>
          <div className="page-actions">
            <button
              className="btn-add"
              onClick={() => navigate('/coordinator/tasks/new')}
            >
              Создать задание
            </button>
            <div className="search-box">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="status-filter"
                style={{ marginRight: '10px', padding: '8px' }}
              >
                <option value="">Все статусы</option>
                <option value="New">Новое</option>
                <option value="Pending">В ожидании</option>
                <option value="InProgress">В работе</option>
                <option value="OnReview">На проверке</option>
                <option value="Approved">Утверждено</option>
                <option value="ForRevision">На доработку</option>
                <option value="Canceled">Отменено</option>
              </select>
              <input
                type="text"
                placeholder="Поиск"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Загрузка...</div>
        ) : (
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Адрес</th>
                  <th>Чек-лист</th>
                  <th>Инспектор</th>
                  <th>Статус</th>
                  <th>Приоритет</th>
                  <th>Дата выполнения</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="empty-state">
                      {searchTerm || statusFilter ? 'Задания не найдены' : 'Нет заданий'}
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => (
                    <tr key={task.id}>
                      <td>{task.title}</td>
                      <td>{task.building_address}</td>
                      <td>{task.checklist_title}</td>
                      <td>{task.inspector_name}</td>
                      <td>
                        <span className={getStatusBadgeClass(task.status)}>
                          {getStatusLabel(task.status)}
                        </span>
                      </td>
                      <td>{task.priority}</td>
                      <td>{new Date(task.scheduled_date).toLocaleDateString('ru-RU')}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-edit"
                            onClick={() => navigate(`/coordinator/tasks/${task.id}`)}
                          >
                            Просмотр
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </CoordinatorLayout>
  );
};

export default TasksPage;

