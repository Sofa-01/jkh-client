import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import { usersApi, User } from '../api/users';
import './UsersPage.css';

const InspectorsPage: React.FC = () => {
  const [inspectors, setInspectors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadInspectors();
  }, []);

  const loadInspectors = async () => {
    try {
      setLoading(true);
      const data = await usersApi.list('Inspector');
      setInspectors(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка загрузки инспекторов');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого инспектора?')) {
      return;
    }

    try {
      await usersApi.delete(id);
      await loadInspectors();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка удаления инспектора');
    }
  };

  const filteredInspectors = inspectors.filter((inspector) => {
    const search = searchTerm.toLowerCase();
    return (
      inspector.first_name.toLowerCase().includes(search) ||
      inspector.last_name.toLowerCase().includes(search) ||
      inspector.email.toLowerCase().includes(search)
    );
  });

  return (
    <Layout>
      <div className="users-page">
        <div className="page-header">
          <h1 className="page-title">Инспекторы</h1>
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
                {filteredInspectors.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="empty-state">
                      {searchTerm ? 'Инспекторы не найдены' : 'Нет инспекторов'}
                    </td>
                  </tr>
                ) : (
                  filteredInspectors.map((inspector) => (
                    <tr key={inspector.id}>
                      <td>{inspector.last_name}</td>
                      <td>{inspector.first_name}</td>
                      <td>{inspector.email}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-edit"
                            onClick={() => navigate(`/users/${inspector.id}/edit`)}
                          >
                            Изменить
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDelete(inspector.id)}
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

export default InspectorsPage;

