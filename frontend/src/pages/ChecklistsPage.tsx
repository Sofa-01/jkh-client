import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import { checklistsApi, Checklist } from '../api/checklists';
import './ChecklistsPage.css';

const ChecklistsPage: React.FC = () => {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadChecklists();
  }, []);

  const loadChecklists = async () => {
    try {
      setLoading(true);
      const data = await checklistsApi.list();
      setChecklists(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка загрузки чек-листов');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const checklist = checklists.find(c => c.id === id);
    const checklistTitle = checklist?.title || `ID: ${id}`;
    
    if (!window.confirm(`Вы уверены, что хотите удалить чек-лист "${checklistTitle}"?`)) {
      return;
    }

    try {
      console.log(`Attempting to delete checklist ${id}`);
      await checklistsApi.delete(id);
      console.log(`Successfully deleted checklist ${id}`);
      await loadChecklists();
    } catch (err: any) {
      console.error('Delete checklist error details:', {
        checklistId: id,
        error: err,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data,
      });
      
      let errorMessage = 'Ошибка удаления чек-листа';
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

  const filteredChecklists = checklists.filter((checklist) => {
    const search = searchTerm.toLowerCase();
    return (
      checklist.title.toLowerCase().includes(search) ||
      checklist.description.toLowerCase().includes(search) ||
      getInspectionTypeLabel(checklist.inspection_type).toLowerCase().includes(search)
    );
  });

  return (
    <Layout>
      <div className="checklists-page">
        <div className="page-header">
          <h1 className="page-title">Чек-листы</h1>
          <div className="page-actions">
            <button
              className="btn-add"
              onClick={() => navigate('/checklists/new')}
            >
              Добавить
            </button>
            <div className="search-box">
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
          <div className="checklists-table-container">
            <table className="checklists-table">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Тип осмотра</th>
                  <th>Описание</th>
                  <th>Дата создания</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredChecklists.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-state">
                      {searchTerm ? 'Чек-листы не найдены' : 'Нет чек-листов'}
                    </td>
                  </tr>
                ) : (
                  filteredChecklists.map((checklist) => (
                    <tr key={checklist.id}>
                      <td>{checklist.title}</td>
                      <td>
                        <span className="inspection-type-badge">
                          {getInspectionTypeLabel(checklist.inspection_type)}
                        </span>
                      </td>
                      <td className="description-cell">
                        {checklist.description || '-'}
                      </td>
                      <td>
                        {new Date(checklist.created_at).toLocaleDateString('ru-RU')}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-edit"
                            onClick={() => navigate(`/checklists/${checklist.id}/edit`)}
                          >
                            Изменить
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDelete(checklist.id)}
                          >
                            Удалить
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
    </Layout>
  );
};

export default ChecklistsPage;

