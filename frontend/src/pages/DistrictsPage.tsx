import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import { districtsApi, District } from '../api/districts';
import './DistrictsPage.css';

const DistrictsPage: React.FC = () => {
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadDistricts();
  }, []);

  const loadDistricts = async () => {
    try {
      setLoading(true);
      const data = await districtsApi.list();
      setDistricts(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка загрузки районов');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот район?')) {
      return;
    }

    try {
      await districtsApi.delete(id);
      await loadDistricts();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка удаления района');
    }
  };

  const filteredDistricts = districts.filter((district) => {
    const search = searchTerm.toLowerCase();
    return district.name.toLowerCase().includes(search);
  });

  return (
    <Layout>
      <div className="districts-page">
        <div className="page-header">
          <h1 className="page-title">Районы</h1>
          <div className="page-actions">
            <button
              className="btn-add"
              onClick={() => navigate('/districts/new')}
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
          <div className="districts-table-container">
            <table className="districts-table">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredDistricts.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="empty-state">
                      {searchTerm ? 'Районы не найдены' : 'Нет районов'}
                    </td>
                  </tr>
                ) : (
                  filteredDistricts.map((district) => (
                    <tr key={district.id}>
                      <td>{district.name}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-edit"
                            onClick={() => navigate(`/districts/${district.id}/edit`)}
                          >
                            Изменить
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDelete(district.id)}
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

export default DistrictsPage;

