import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import { districtsApi, CreateDistrictRequest } from '../api/districts';
import './DistrictEditPage.css';

const DistrictEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const isEdit = location.pathname.includes('/edit') || (id !== undefined && id !== 'new');
  const navigate = useNavigate();

  const [formData, setFormData] = useState<CreateDistrictRequest>({
    name: '',
  });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit && id) {
      loadDistrict(parseInt(id));
    } else {
      setInitialLoading(false);
    }
  }, [id, isEdit]);

  const loadDistrict = async (districtId: number) => {
    try {
      setInitialLoading(true);
      setError(null);
      const district = await districtsApi.get(districtId);
      setFormData({
        name: district.name,
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Ошибка загрузки района';
      setError(errorMessage);
      if (err.response?.status === 404) {
        setTimeout(() => {
          navigate('/districts');
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
      if (isEdit && id) {
        await districtsApi.update(parseInt(id), formData);
      } else {
        await districtsApi.create(formData);
      }
      navigate('/districts');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка сохранения района');
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
      <div className="district-edit-page">
        <h1 className="page-title">
          {isEdit ? 'Редактирование района' : 'Добавление района'}
        </h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="district-form">
          <div className="form-group">
            <label htmlFor="name">Введите наименование района</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Наименование района"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-submit" disabled={loading}>
              {isEdit ? 'Изменить' : 'Добавить'}
            </button>
            <button
              type="button"
              className="btn-back"
              onClick={() => navigate('/districts')}
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

export default DistrictEditPage;

