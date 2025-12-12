import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import { elementsApi, Element } from '../api/elements';
import './ElementsPage.css';

const ElementsPage: React.FC = () => {
  const [elements, setElements] = useState<Element[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadElements();
  }, []);

  const loadElements = async () => {
    try {
      setLoading(true);
      const data = await elementsApi.list();
      setElements(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка загрузки элементов');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот элемент?')) {
      return;
    }

    try {
      await elementsApi.delete(id);
      await loadElements();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка удаления элемента');
    }
  };

  const filteredElements = elements.filter((element) => {
    const search = searchTerm.toLowerCase();
    return (
      element.name.toLowerCase().includes(search) ||
      element.category.toLowerCase().includes(search)
    );
  });

  return (
    <Layout>
      <div className="elements-page">
        <div className="page-header">
          <h1 className="page-title">Элементы чек-листов</h1>
          <div className="page-actions">
            <button
              className="btn-add"
              onClick={() => navigate('/elements/new')}
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
          <div className="elements-table-container">
            <table className="elements-table">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Категория</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredElements.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="empty-state">
                      {searchTerm ? 'Элементы не найдены' : 'Нет элементов'}
                    </td>
                  </tr>
                ) : (
                  filteredElements.map((element) => (
                    <tr key={element.id}>
                      <td>{element.name}</td>
                      <td>
                        {element.category ? (
                          <span className="category-badge">{element.category}</span>
                        ) : (
                          <span className="no-category">—</span>
                        )}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-edit"
                            onClick={() => navigate(`/elements/${element.id}/edit`)}
                          >
                            Изменить
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDelete(element.id)}
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

export default ElementsPage;

