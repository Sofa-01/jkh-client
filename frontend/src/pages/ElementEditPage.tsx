import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import { elementsApi, CreateElementRequest } from '../api/elements';
import './ElementEditPage.css';

const ElementEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const isEdit = location.pathname.includes('/edit') || (id !== undefined && id !== 'new');
  const navigate = useNavigate();

  const [formData, setFormData] = useState<CreateElementRequest>({
    name: '',
    category: '',
  });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit && id) {
      loadElement(parseInt(id));
    } else {
      setInitialLoading(false);
    }
  }, [id, isEdit]);

  const loadElement = async (elementId: number) => {
    try {
      setInitialLoading(true);
      setError(null);
      const element = await elementsApi.get(elementId);
      setFormData({
        name: element.name,
        category: element.category || '',
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Ошибка загрузки элемента';
      setError(errorMessage);
      if (err.response?.status === 404) {
        setTimeout(() => {
          navigate('/elements');
        }, 2000);
      }
    } finally {
      setInitialLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        name: formData.name,
        category: formData.category || undefined,
      };

      if (isEdit && id) {
        await elementsApi.update(parseInt(id), submitData);
      } else {
        await elementsApi.create(submitData);
      }
      navigate('/elements');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка сохранения элемента');
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
      <div className="element-edit-page">
        <h1 className="page-title">
          {isEdit ? 'Редактирование элемента' : 'Добавление элемента'}
        </h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="element-form">
          <div className="form-group">
            <label htmlFor="name">Название элемента</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Например: Кровля, Фундамент, Стены"
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Категория (необязательно)</label>
            <input
              id="category"
              name="category"
              type="text"
              value={formData.category}
              onChange={handleChange}
              disabled={loading}
              placeholder="Категория элемента"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-submit" disabled={loading}>
              {isEdit ? 'Изменить' : 'Добавить'}
            </button>
            <button
              type="button"
              className="btn-back"
              onClick={() => navigate('/elements')}
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

export default ElementEditPage;

