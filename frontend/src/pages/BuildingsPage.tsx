import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import { buildingsApi, Building } from '../api/buildings';
import './BuildingsPage.css';

const BuildingsPage: React.FC = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadBuildings();
  }, []);

  const loadBuildings = async () => {
    try {
      setLoading(true);
      const data = await buildingsApi.list();
      setBuildings(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка загрузки объектов ЖКХ');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот объект ЖКХ?')) {
      return;
    }

    try {
      await buildingsApi.delete(id);
      await loadBuildings();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка удаления объекта ЖКХ');
    }
  };

  const filteredBuildings = buildings.filter((building) => {
    const search = searchTerm.toLowerCase();
    return (
      building.address.toLowerCase().includes(search) ||
      building.district_name.toLowerCase().includes(search) ||
      building.jkh_unit_name.toLowerCase().includes(search)
    );
  });

  return (
    <Layout>
      <div className="buildings-page">
        <div className="page-header">
          <h1 className="page-title">Объекты ЖКХ</h1>
          <div className="page-actions">
            <button
              className="btn-add"
              onClick={() => navigate('/buildings/new')}
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
          <div className="buildings-table-container">
            <table className="buildings-table">
              <thead>
                <tr>
                  <th>Адрес</th>
                  <th>Район</th>
                  <th>ЖЭУ</th>
                  <th>Год постройки</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredBuildings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-state">
                      {searchTerm ? 'Объекты ЖКХ не найдены' : 'Нет объектов ЖКХ'}
                    </td>
                  </tr>
                ) : (
                  filteredBuildings.map((building) => (
                    <tr key={building.id}>
                      <td>{building.address}</td>
                      <td>{building.district_name}</td>
                      <td>{building.jkh_unit_name}</td>
                      <td>{building.construction_year || '-'}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-edit"
                            onClick={() => navigate(`/buildings/${building.id}/edit`)}
                          >
                            Изменить
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDelete(building.id)}
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

export default BuildingsPage;

