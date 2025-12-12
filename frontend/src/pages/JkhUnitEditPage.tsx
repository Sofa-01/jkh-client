import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import { jkhUnitsApi, CreateJkhUnitRequest } from '../api/jkhunits';
import { districtsApi, District } from '../api/districts';
import './JkhUnitEditPage.css';

const JkhUnitEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const isEdit = location.pathname.includes('/edit') || (id !== undefined && id !== 'new');
  const navigate = useNavigate();

  const [formData, setFormData] = useState<CreateJkhUnitRequest>({
    name: '',
    district_id: 0,
  });

  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDistricts();
    if (isEdit && id) {
      loadJkhUnit(parseInt(id));
    } else {
      setInitialLoading(false);
    }
  }, [id, isEdit]);

  const loadDistricts = async () => {
    try {
      const data = await districtsApi.list();
      setDistricts(data);
    } catch (err: any) {
      setError('Ошибка загрузки списка районов');
    }
  };

  const loadJkhUnit = async (jkhUnitId: number) => {
    try {
      setInitialLoading(true);
      setError(null);
      const jkhUnit = await jkhUnitsApi.get(jkhUnitId);
      setFormData({
        name: jkhUnit.name,
        district_id: jkhUnit.district_id,
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Ошибка загрузки ЖЭУ';
      setError(errorMessage);
      if (err.response?.status === 404) {
        setTimeout(() => {
          navigate('/jkhunits');
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
      [name]: name === 'district_id' ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isEdit && id) {
        await jkhUnitsApi.update(parseInt(id), formData);
      } else {
        await jkhUnitsApi.create(formData);
      }
      navigate('/jkhunits');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка сохранения ЖЭУ');
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
      <div className="jkhunit-edit-page">
        <h1 className="page-title">
          {isEdit ? 'Редактирование ЖЭУ' : 'Добавление ЖЭУ'}
        </h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="jkhunit-form">
          <div className="form-grid">
            <div className="form-column">
              <div className="form-group">
                <label htmlFor="name">Введите наименование ЖЭУ</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Наименование"
                />
              </div>
            </div>

            <div className="form-column">
              <div className="form-group">
                <label htmlFor="district_id">Выберите район</label>
                <select
                  id="district_id"
                  name="district_id"
                  value={formData.district_id}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value={0}>Выбрать</option>
                  {districts.map((district) => (
                    <option key={district.id} value={district.id}>
                      {district.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-submit" disabled={loading}>
              {isEdit ? 'Изменить' : 'Добавить'}
            </button>
            <button
              type="button"
              className="btn-back"
              onClick={() => navigate('/jkhunits')}
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

export default JkhUnitEditPage;

