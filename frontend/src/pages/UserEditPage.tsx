import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import { usersApi, CreateUserRequest, UpdateUserRequest } from '../api/users';
import './UserEditPage.css';

const UserEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  // Определяем режим: если путь содержит '/new' или id отсутствует/равен 'new', то создание, иначе редактирование
  const isEdit = location.pathname.includes('/edit') || (id !== undefined && id !== 'new');
  const navigate = useNavigate();

  const [formData, setFormData] = useState<CreateUserRequest>({
    email: '',
    login: '',
    password: '',
    first_name: '',
    last_name: '',
    role_name: 'Inspector',
  });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit); // Для начальной загрузки данных при редактировании
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit && id) {
      loadUser(parseInt(id));
    } else {
      // Если создание нового пользователя, сразу убираем initialLoading
      setInitialLoading(false);
    }
  }, [id, isEdit]);

  const loadUser = async (userId: number) => {
    try {
      setInitialLoading(true);
      setError(null);
      const user = await usersApi.get(userId);
      setFormData({
        email: user.email,
        login: user.login,
        password: '', // Не загружаем пароль
        first_name: user.first_name,
        last_name: user.last_name,
        role_name: user.role_name as 'Coordinator' | 'Inspector',
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Ошибка загрузки пользователя';
      setError(errorMessage);
      // Если пользователь не найден, возвращаемся на список через 2 секунды
      if (err.response?.status === 404) {
        setTimeout(() => {
          navigate('/users');
        }, 2000);
      }
    } finally {
      setInitialLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      if (isEdit && id) {
        const updateData: UpdateUserRequest = {
          email: formData.email,
          login: formData.login,
          first_name: formData.first_name,
          last_name: formData.last_name,
          role_name: formData.role_name,
        };
        // Добавляем пароль только если он был введен
        if (formData.password) {
          updateData.password = formData.password;
        }
        await usersApi.update(parseInt(id), updateData);
      } else {
        await usersApi.create(formData);
      }
      navigate('/users');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка сохранения пользователя');
    } finally {
      setLoading(false);
    }
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
      <div className="user-edit-page">
        <h1 className="page-title">
          {isEdit ? 'Редактирование данных о пользователе' : 'Добавление данных о пользователе'}
        </h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="user-form">
          <div className="form-grid">
            <div className="form-column">
              <div className="form-group">
                <label htmlFor="last_name">Введите фамилию</label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="first_name">Введите имя</label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-column">
              <div className="form-group">
                <label htmlFor="role_name">Выберите роль</label>
                <select
                  id="role_name"
                  name="role_name"
                  value={formData.role_name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="Inspector">Инспектор</option>
                  <option value="Coordinator">Координатор</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="email">Введите электронную почту</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  Введите пароль {isEdit && '(оставьте пустым, чтобы не менять)'}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required={!isEdit}
                  disabled={loading}
                  minLength={8}
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="login">Логин</label>
            <input
              id="login"
              name="login"
              type="text"
              value={formData.login}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-submit" disabled={loading}>
              {isEdit ? 'Изменить' : 'Добавить'}
            </button>
            <button
              type="button"
              className="btn-back"
              onClick={() => navigate('/users')}
              disabled={loading}
            >
              Назад
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default UserEditPage;

