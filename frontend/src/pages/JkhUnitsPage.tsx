import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import { jkhUnitsApi, JkhUnit } from '../api/jkhunits';
import './JkhUnitsPage.css';

const JkhUnitsPage: React.FC = () => {
  const [jkhUnits, setJkhUnits] = useState<JkhUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadJkhUnits();
  }, []);

  const loadJkhUnits = async () => {
    try {
      setLoading(true);
      const data = await jkhUnitsApi.list();
      setJkhUnits(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка загрузки ЖЭУ');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить это ЖЭУ?')) {
      return;
    }

    try {
      await jkhUnitsApi.delete(id);
      await loadJkhUnits();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка удаления ЖЭУ');
    }
  };

  const filteredJkhUnits = jkhUnits.filter((unit) => {
    const search = searchTerm.toLowerCase();
    return (
      unit.name.toLowerCase().includes(search) ||
      unit.district_name.toLowerCase().includes(search)
    );
  });

  return (
    <Layout>
      <div className="jkhunits-page">
        <div className="page-header">
          <h1 className="page-title">ЖЭУ</h1>
          <div className="page-actions">
            <button
              className="btn-add"
              onClick={() => navigate('/jkhunits/new')}
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
          <div className="jkhunits-table-container">
            <table className="jkhunits-table">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Район</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredJkhUnits.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="empty-state">
                      {searchTerm ? 'ЖЭУ не найдены' : 'Нет ЖЭУ'}
                    </td>
                  </tr>
                ) : (
                  filteredJkhUnits.map((unit) => (
                    <tr key={unit.id}>
                      <td>{unit.name}</td>
                      <td>{unit.district_name}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-edit"
                            onClick={() => navigate(`/jkhunits/${unit.id}/edit`)}
                          >
                            Изменить
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDelete(unit.id)}
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

export default JkhUnitsPage;

