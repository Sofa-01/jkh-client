import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import { buildingsApi, CreateBuildingRequest } from '../api/buildings';
import { districtsApi, District } from '../api/districts';
import { jkhUnitsApi, JkhUnit } from '../api/jkhunits';
import './BuildingEditPage.css';

const BuildingEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const isEdit = location.pathname.includes('/edit') || (id !== undefined && id !== 'new');
  const navigate = useNavigate();

  const [formData, setFormData] = useState<CreateBuildingRequest>({
    address: '',
    construction_year: 0,
    description: '',
    photo_path: '',
    district_id: 0,
    jkh_unit_id: 0,
  });

  const [districts, setDistricts] = useState<District[]>([]);
  const [jkhUnits, setJkhUnits] = useState<JkhUnit[]>([]);
  const [filteredJkhUnits, setFilteredJkhUnits] = useState<JkhUnit[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingPhotoPath, setExistingPhotoPath] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      const [districtsData, jkhUnitsData] = await Promise.all([
        districtsApi.list(),
        jkhUnitsApi.list()
      ]);
      
      setDistricts(districtsData);
      setJkhUnits(jkhUnitsData);
      
      if (isEdit && id) {
        await loadBuilding(parseInt(id), districtsData, jkhUnitsData);
      } else {
        setInitialLoading(false);
      }
    };
    loadData();
  }, [id, isEdit]);

  // Фильтруем ЖЭУ по выбранному району
  useEffect(() => {
    if (formData.district_id > 0) {
      const filtered = jkhUnits.filter(unit => unit.district_id === formData.district_id);
      setFilteredJkhUnits(filtered);
      // Если текущее ЖЭУ не принадлежит выбранному району, сбрасываем его
      if (formData.jkh_unit_id > 0 && !filtered.find(u => u.id === formData.jkh_unit_id)) {
        setFormData(prev => ({ ...prev, jkh_unit_id: 0 }));
      }
    } else {
      setFilteredJkhUnits([]);
      setFormData(prev => ({ ...prev, jkh_unit_id: 0 }));
    }
  }, [formData.district_id, jkhUnits]);

  const loadBuilding = async (buildingId: number, districtsList: District[], jkhUnitsList: JkhUnit[]) => {
    try {
      setInitialLoading(true);
      setError(null);
      const building = await buildingsApi.get(buildingId);
      
      // Находим ID района и ЖЭУ по названиям
      const district = districtsList.find(d => d.name === building.district_name);
      const jkhUnit = jkhUnitsList.find(u => u.name === building.jkh_unit_name);
      
      setFormData({
        address: building.address,
        construction_year: building.construction_year || 0,
        description: building.description || '',
        photo_path: building.photo_path || '',
        district_id: district?.id || 0,
        jkh_unit_id: jkhUnit?.id || 0,
      });
      
      // Сохраняем путь к существующему фото
      if (building.photo_path) {
        setExistingPhotoPath(building.photo_path);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Ошибка загрузки объекта ЖКХ';
      setError(errorMessage);
      if (err.response?.status === 404) {
        setTimeout(() => {
          navigate('/buildings');
        }, 2000);
      }
    } finally {
      setInitialLoading(false);
    }
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'district_id' || name === 'jkh_unit_id' || name === 'construction_year' 
        ? parseInt(value) || 0 
        : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      // Очищаем существующий путь, так как выбран новый файл
      setExistingPhotoPath('');
      // Здесь можно добавить предпросмотр или загрузку файла
      // Пока просто сохраняем путь в форме (в реальности нужно загрузить на сервер)
      setFormData(prev => ({ ...prev, photo_path: e.target.files![0].name }));
    }
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setExistingPhotoPath('');
    setFormData(prev => ({ ...prev, photo_path: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        description: formData.description || undefined,
        photo_path: formData.photo_path || undefined,
        inspector_id: formData.inspector_id || undefined,
      };

      if (isEdit && id) {
        await buildingsApi.update(parseInt(id), submitData);
      } else {
        await buildingsApi.create(submitData);
      }
      navigate('/buildings');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка сохранения объекта ЖКХ');
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
      <div className="building-edit-page">
        <h1 className="page-title">
          {isEdit ? 'Редактирование объекта ЖКХ' : 'Добавление объекта ЖКХ'}
        </h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="building-form">
          <div className="form-grid">
            <div className="form-column">
              <div className="form-group">
                <label htmlFor="address">Введите адрес объекта</label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Адрес объекта"
                />
              </div>

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

              <div className="form-group">
                <label htmlFor="jkh_unit_id">Выберите ЖЭУ</label>
                <select
                  id="jkh_unit_id"
                  name="jkh_unit_id"
                  value={formData.jkh_unit_id}
                  onChange={handleChange}
                  required
                  disabled={loading || formData.district_id === 0}
                >
                  <option value={0}>Выбрать</option>
                  {filteredJkhUnits.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-column">
              <div className="form-group">
                <label htmlFor="construction_year">Введите год постройки</label>
                <input
                  id="construction_year"
                  name="construction_year"
                  type="number"
                  value={formData.construction_year || ''}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Год постройки"
                  min="1800"
                  max={new Date().getFullYear()}
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Введите описание (необязательно)</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Описание"
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label htmlFor="photo">Загрузите фото</label>
                <input
                  id="photo"
                  name="photo"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={loading}
                />
                {selectedFile && (
                  <div className="file-info">
                    <span className="file-name">Выбран новый файл: {selectedFile.name}</span>
                    <button
                      type="button"
                      className="btn-remove-file"
                      onClick={handleRemovePhoto}
                      disabled={loading}
                    >
                      Удалить
                    </button>
                  </div>
                )}
                {existingPhotoPath && !selectedFile && (
                  <div className="file-info">
                    <span className="file-name existing">Текущее фото: {existingPhotoPath}</span>
                    <button
                      type="button"
                      className="btn-remove-file"
                      onClick={handleRemovePhoto}
                      disabled={loading}
                    >
                      Удалить
                    </button>
                  </div>
                )}
                {!selectedFile && !existingPhotoPath && (
                  <span className="file-placeholder">Файл не выбран</span>
                )}
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
              onClick={() => navigate('/buildings')}
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

export default BuildingEditPage;

