import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import { usersApi, User } from '../api/users';
import './UsersPage.css';

const CoordinatorsPage: React.FC = () => {
  const [coordinators, setCoordinators] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadCoordinators();
  }, []);

  const loadCoordinators = async () => {
    try {
      setLoading(true);
      const data = await usersApi.list('Coordinator');
      setCoordinators(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка загрузки координаторов');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого координатора?')) {
      return;
    }

    try {
      await usersApi.delete(id);
      await loadCoordinators();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка удаления координатора');
    }
  };

  const filteredCoordinators = coordinators.filter((coordinator) => {
    const search = searchTerm.toLowerCase();
    return (
      coordinator.first_name.toLowerCase().includes(search) ||
      coordinator.last_name.toLowerCase().includes(search) ||
      coordinator.email.toLowerCase().includes(search)
    );
  });

  return (
    <Layout>
      <div className="users-page">
        <div className="page-header">
          <h1 className="page-title">Координаторы</h1>
          <div className="page-actions">
            <button
              className="btn-add"
              onClick={() => navigate('/users/new')}
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
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Фамилия</th>
                  <th>Имя</th>
                  <th>Email</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredCoordinators.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="empty-state">
                      {searchTerm ? 'Координаторы не найдены' : 'Нет координаторов'}
                    </td>
                  </tr>
                ) : (
                  filteredCoordinators.map((coordinator) => (
                    <tr key={coordinator.id}>
                      <td>{coordinator.last_name}</td>
                      <td>{coordinator.first_name}</td>
                      <td>{coordinator.email}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-edit"
                            onClick={() => navigate(`/users/${coordinator.id}/edit`)}
                          >
                            Изменить
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDelete(coordinator.id)}
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

export default CoordinatorsPage;

