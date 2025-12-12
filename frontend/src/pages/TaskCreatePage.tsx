import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CoordinatorLayout from '../../components/Layout/CoordinatorLayout';
import { tasksApi, CreateTaskRequest } from '../../api/tasks';
import { buildingsApi, Building } from '../../api/buildings';
import { checklistsApi, Checklist } from '../../api/checklists';
import { inspectorUnitsApi } from '../../api/inspectorunits';
import { User } from '../../types/api';
import '../UserEditPage.css';

const TaskCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreateTaskRequest>({
    building_id: 0,
    checklist_id: 0,
    inspector_id: 0,
    title: '',
    priority: 'обычный',
    description: '',
    scheduled_date: '',
  });

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [inspectors, setInspectors] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingInspectors, setLoadingInspectors] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setInitialLoading(true);
        setError(null);
        console.log('Loading buildings and checklists...');
        
        const [buildingsData, checklistsData] = await Promise.all([
          buildingsApi.list(),
          checklistsApi.list(),
        ]);

        console.log('Loaded buildings:', buildingsData);
        console.log('Loaded checklists:', checklistsData);

        setBuildings(buildingsData);
        setChecklists(checklistsData);
      } catch (err: any) {
        console.error('Error loading data:', err);
        const errorMessage = err.response?.data?.error || err.message || 'Ошибка загрузки данных';
        setError(errorMessage);
        console.error('Error details:', {
          status: err.response?.status,
          data: err.response?.data,
          url: err.config?.url,
        });
      } finally {
        setInitialLoading(false);
      }
    };
    loadData();
  }, []);

  // Загружаем инспекторов при выборе здания
  useEffect(() => {
    const loadInspectors = async () => {
      if (formData.building_id > 0) {
        try {
          setLoadingInspectors(true);
          setError(null);
          const inspectorsData = await inspectorUnitsApi.getInspectorsForBuilding(formData.building_id);
          setInspectors(inspectorsData);
          // Если текущий инспектор не в списке, сбрасываем выбор
          if (formData.inspector_id > 0 && !inspectorsData.find(i => i.id === formData.inspector_id)) {
            setFormData(prev => ({ ...prev, inspector_id: 0 }));
          }
        } catch (err: any) {
          setError(err.response?.data?.error || 'Ошибка загрузки инспекторов');
          setInspectors([]);
        } finally {
          setLoadingInspectors(false);
        }
      } else {
        setInspectors([]);
        setFormData(prev => ({ ...prev, inspector_id: 0 }));
      }
    };
    loadInspectors();
  }, [formData.building_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Форматируем дату в ISO 8601
      const scheduledDate = new Date(formData.scheduled_date).toISOString();
      
      await tasksApi.create({
        ...formData,
        scheduled_date: scheduledDate,
        priority: formData.priority || 'обычный',
      });
      
      navigate('/coordinator/tasks');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка создания задания');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'building_id' || name === 'checklist_id' || name === 'inspector_id' 
        ? parseInt(value) || 0 
        : value,
    }));
  };

  if (initialLoading) {
    return (
      <CoordinatorLayout>
        <div className="user-edit-page">
          <div className="loading">Загрузка...</div>
        </div>
      </CoordinatorLayout>
    );
  }

  return (
    <CoordinatorLayout>
      <div className="user-edit-page">
        <div className="page-header">
          <h1 className="page-title">Создание задания</h1>
        </div>

        {error && !initialLoading && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="user-form">
          <div className="form-group">
            <label htmlFor="building_id">Здание *</label>
            <select
              id="building_id"
              name="building_id"
              value={formData.building_id}
              onChange={handleChange}
              required
              className="form-input"
            >
              <option value={0}>Выберите здание</option>
              {buildings.map(building => (
                <option key={building.id} value={building.id}>
                  {building.address}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="inspector_id">Инспектор *</label>
            <select
              id="inspector_id"
              name="inspector_id"
              value={formData.inspector_id}
              onChange={handleChange}
              required
              className="form-input"
              disabled={!formData.building_id || loadingInspectors}
            >
              <option value={0}>
                {loadingInspectors 
                  ? 'Загрузка инспекторов...' 
                  : !formData.building_id 
                    ? 'Сначала выберите здание' 
                    : inspectors.length === 0
                      ? 'Нет доступных инспекторов для этого здания'
                      : 'Выберите инспектора'}
              </option>
              {inspectors.map(inspector => (
                <option key={inspector.id} value={inspector.id}>
                  {inspector.last_name} {inspector.first_name} ({inspector.email})
                </option>
              ))}
            </select>
            {formData.building_id && inspectors.length === 0 && !loadingInspectors && (
              <small style={{ color: '#f57c00' }}>
                Нет инспекторов, назначенных на ЖЭУ этого здания. Обратитесь к специалисту для назначения инспекторов.
              </small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="checklist_id">Чек-лист *</label>
            <select
              id="checklist_id"
              name="checklist_id"
              value={formData.checklist_id}
              onChange={handleChange}
              required
              className="form-input"
            >
              <option value={0}>Выберите чек-лист</option>
              {checklists.map(checklist => (
                <option key={checklist.id} value={checklist.id}>
                  {checklist.title} ({checklist.inspection_type})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="title">Название задания *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="priority">Приоритет</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="form-input"
            >
              <option value="срочный">Срочный</option>
              <option value="высокий">Высокий</option>
              <option value="обычный">Обычный</option>
              <option value="низкий">Низкий</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="scheduled_date">Планируемая дата и время *</label>
            <input
              type="datetime-local"
              id="scheduled_date"
              name="scheduled_date"
              value={formData.scheduled_date}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Описание</label>
            <textarea
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              rows={4}
              className="form-input"
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/coordinator/tasks')}
              className="btn-back"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-submit"
            >
              {loading ? 'Создание...' : 'Создать задание'}
            </button>
          </div>
        </form>
      </div>
    </CoordinatorLayout>
  );
};

export default TaskCreatePage;

