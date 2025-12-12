import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import { checklistsApi, CreateChecklistRequest, ChecklistDetail } from '../api/checklists';
import { elementsApi, Element } from '../api/elements';
import './ChecklistEditPage.css';

const ChecklistEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const isEdit = location.pathname.includes('/edit') || (id !== undefined && id !== 'new');
  const navigate = useNavigate();

  const [formData, setFormData] = useState<CreateChecklistRequest>({
    title: '',
    inspection_type: 'partial',
    description: '',
  });

  const [checklistDetail, setChecklistDetail] = useState<ChecklistDetail | null>(null);
  const [availableElements, setAvailableElements] = useState<Element[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);
  const [showAddElementModal, setShowAddElementModal] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState<number>(0);
  const [elementOrderIndex, setElementOrderIndex] = useState<number>(0);

  useEffect(() => {
    const loadData = async () => {
      const elementsData = await elementsApi.list();
      setAvailableElements(elementsData);

      if (isEdit && id) {
        await loadChecklist(parseInt(id));
      } else {
        setInitialLoading(false);
      }
    };
    loadData();
  }, [id, isEdit]);

  const loadChecklist = async (checklistId: number) => {
    try {
      setInitialLoading(true);
      setError(null);
      const checklist = await checklistsApi.get(checklistId);
      setChecklistDetail(checklist);
      setFormData({
        title: checklist.title,
        inspection_type: checklist.inspection_type as 'spring' | 'winter' | 'partial',
        description: checklist.description || '',
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Ошибка загрузки чек-листа';
      setError(errorMessage);
      if (err.response?.status === 404) {
        setTimeout(() => {
          navigate('/checklists');
        }, 2000);
      }
    } finally {
      setInitialLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        description: formData.description || undefined,
      };

      if (isEdit && id) {
        await checklistsApi.update(parseInt(id), submitData);
        // После обновления возвращаемся к списку чек-листов
        navigate('/checklists');
        return;
      } else {
        const newChecklist = await checklistsApi.create(submitData);
        // После создания перенаправляем на редактирование для добавления элементов
        navigate(`/checklists/${newChecklist.id}/edit`);
        return;
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка сохранения чек-листа');
    } finally {
      setLoading(false);
    }
  };

  const handleAddElement = async () => {
    if (!selectedElementId || !id) return;

    try {
      await checklistsApi.addElement(parseInt(id), {
        element_id: selectedElementId,
        order_index: elementOrderIndex || undefined,
      });
      await loadChecklist(parseInt(id));
      setShowAddElementModal(false);
      setSelectedElementId(0);
      setElementOrderIndex(0);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка добавления элемента');
    }
  };

  const handleRemoveElement = async (elementId: number) => {
    if (!id) return;
    
    // Находим элемент для отображения имени в подтверждении
    const element = checklistDetail?.elements.find(e => e.element_id === elementId);
    const elementName = element?.element_name || `ID: ${elementId}`;
    
    if (!window.confirm(`Удалить элемент "${elementName}" из чек-листа?`)) return;

    try {
      console.log(`Attempting to remove element ${elementId} from checklist ${id}`);
      await checklistsApi.removeElement(parseInt(id), elementId);
      console.log(`Successfully removed element ${elementId} from checklist ${id}`);
      await loadChecklist(parseInt(id));
    } catch (err: any) {
      console.error('Remove element error details:', {
        checklistId: id,
        elementId: elementId,
        error: err,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data,
      });
      
      let errorMessage = 'Ошибка удаления элемента';
      if (err.response) {
        errorMessage = err.response.data?.error || `Ошибка сервера (${err.response.status})`;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      alert(errorMessage);
    }
  };

  const getInspectionTypeLabel = (type: string) => {
    switch (type) {
      case 'spring':
        return 'Весенний';
      case 'winter':
        return 'Зимний';
      case 'partial':
        return 'Частичный';
      default:
        return type;
    }
  };

  // Получаем элементы, которые еще не добавлены в чек-лист
  const getAvailableElementsForAdd = () => {
    if (!checklistDetail) return availableElements;
    const addedElementIds = new Set(checklistDetail.elements.map(e => e.element_id));
    return availableElements.filter(e => !addedElementIds.has(e.id));
  };

  if (initialLoading) {
    return (
      <Layout>
        <div className="loading">Загрузка...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="checklist-edit-page">
        <h1 className="page-title">
          {isEdit ? 'Редактирование чек-листа' : 'Добавление чек-листа'}
        </h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="checklist-form">
          <div className="form-grid">
            <div className="form-column">
              <div className="form-group">
                <label htmlFor="title">Введите наименование чек-листа</label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Наименование чек-листа"
                />
              </div>

              <div className="form-group">
                <label htmlFor="inspection_type">Тип осмотра</label>
                <select
                  id="inspection_type"
                  name="inspection_type"
                  value={formData.inspection_type}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="partial">Частичный</option>
                  <option value="spring">Весенний</option>
                  <option value="winter">Зимний</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="inspection_type">Выберите дату создания</label>
                <input
                  id="created_at"
                  type="date"
                  value={checklistDetail?.created_at ? new Date(checklistDetail.created_at).toISOString().split('T')[0] : ''}
                  disabled
                  className="form-input-disabled"
                />
                <span className="form-hint">Дата создания формируется автоматически</span>
              </div>
            </div>

            <div className="form-column">
              <div className="form-group">
                <label htmlFor="description">Введите описание (необязательно)</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Описание"
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label htmlFor="inspection_type">Выберите элементы чек-листа</label>
                {isEdit && id ? (
                  <div className="elements-section">
                    <button
                      type="button"
                      className="btn-add-element"
                      onClick={() => setShowAddElementModal(true)}
                      disabled={loading}
                    >
                      Добавить элемент
                    </button>
                    {checklistDetail && checklistDetail.elements.length > 0 ? (
                      <div className="elements-list">
                        {checklistDetail.elements
                          .sort((a, b) => a.order_index - b.order_index)
                          .map((element, index) => (
                            <div key={`${element.element_id}-${index}-${element.order_index}`} className="element-item">
                              <span className="element-order">{element.order_index}.</span>
                              <span className="element-name">{element.element_name}</span>
                              {element.category && (
                                <span className="element-category">{element.category}</span>
                              )}
                              <button
                                type="button"
                                className="btn-remove-element"
                                onClick={() => handleRemoveElement(element.element_id)}
                                disabled={loading}
                                title={`Удалить элемент: ${element.element_name} (ID: ${element.element_id})`}
                              >
                                Удалить
                              </button>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="no-elements">Элементы не добавлены</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      disabled
                      placeholder="Выбор"
                      className="form-input-disabled"
                    />
                    <span className="form-hint">Сначала сохраните чек-лист, затем добавьте элементы</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-submit" disabled={loading}>
              {isEdit ? 'Изменить' : 'Добавить'}
            </button>
            <button
              type="button"
              className="btn-back"
              onClick={() => navigate('/checklists')}
              disabled={loading}
            >
              Назад
            </button>
          </div>
        </form>

        {showAddElementModal && (
          <div className="modal-overlay" onClick={() => setShowAddElementModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Добавить элемент в чек-лист</h2>
              <div className="modal-form">
                <div className="form-group">
                  <label>Выберите элемент</label>
                  <select
                    value={selectedElementId}
                    onChange={(e) => setSelectedElementId(parseInt(e.target.value))}
                  >
                    <option value={0}>Выбрать</option>
                    {getAvailableElementsForAdd().map((element) => (
                      <option key={element.id} value={element.id}>
                        {element.name} {element.category && `(${element.category})`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Порядковый номер (опционально)</label>
                  <input
                    type="number"
                    value={elementOrderIndex || ''}
                    onChange={(e) => setElementOrderIndex(parseInt(e.target.value) || 0)}
                    min="1"
                    placeholder="Автоматически"
                  />
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-submit"
                    onClick={handleAddElement}
                    disabled={!selectedElementId}
                  >
                    Добавить
                  </button>
                  <button
                    type="button"
                    className="btn-back"
                    onClick={() => setShowAddElementModal(false)}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ChecklistEditPage;

