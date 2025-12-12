import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import { jkhUnitsApi, JkhUnit } from '../api/jkhunits';
import { inspectorUnitsApi } from '../api/inspectorunits';
import { usersApi, User } from '../api/users';
import './UsersPage.css';

const InspectorAssignmentsPage: React.FC = () => {
  const [jkhUnits, setJkhUnits] = useState<JkhUnit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<number>(0);
  const [assignedInspectors, setAssignedInspectors] = useState<User[]>([]);
  const [allInspectors, setAllInspectors] = useState<User[]>([]);
  const [selectedInspectorId, setSelectedInspectorId] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadJkhUnits();
    loadAllInspectors();
  }, []);

  useEffect(() => {
    if (selectedUnitId > 0) {
      loadAssignedInspectors(selectedUnitId);
    } else {
      setAssignedInspectors([]);
    }
  }, [selectedUnitId]);

  const loadJkhUnits = async () => {
    try {
      const data = await jkhUnitsApi.list();
      setJkhUnits(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка загрузки ЖЭУ');
    }
  };

  const loadAllInspectors = async () => {
    try {
      const data = await usersApi.list('Inspector');
      setAllInspectors(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка загрузки инспекторов');
    }
  };

  const loadAssignedInspectors = async (unitId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await inspectorUnitsApi.listInspectorsForUnit(unitId);
      setAssignedInspectors(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка загрузки назначенных инспекторов');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignInspector = async () => {
    if (selectedUnitId === 0 || selectedInspectorId === 0) {
      setError('Выберите ЖЭУ и инспектора');
      return;
    }

    // Проверка, не назначен ли уже этот инспектор
    if (assignedInspectors.some(i => i.id === selectedInspectorId)) {
      setError('Этот инспектор уже назначен на данное ЖЭУ');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await inspectorUnitsApi.assignInspector(selectedUnitId, selectedInspectorId);
      await loadAssignedInspectors(selectedUnitId);
      setSelectedInspectorId(0);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка назначения инспектора');
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignInspector = async (inspectorId: number) => {
    if (selectedUnitId === 0) {
      return;
    }

    if (!window.confirm('Вы уверены, что хотите открепить этого инспектора от ЖЭУ?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await inspectorUnitsApi.unassignInspector(selectedUnitId, inspectorId);
      await loadAssignedInspectors(selectedUnitId);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка открепления инспектора');
    } finally {
      setLoading(false);
    }
  };

  // Получаем список инспекторов, которые еще не назначены на это ЖЭУ
  const availableInspectors = allInspectors.filter(
    inspector => !assignedInspectors.some(assigned => assigned.id === inspector.id)
  );

  return (
    <Layout>
      <div className="users-page">
        <div className="page-header">
          <h1 className="page-title">Назначение инспекторов на ЖЭУ</h1>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div style={{ marginBottom: '30px' }}>
          <div className="form-group" style={{ maxWidth: '500px' }}>
            <label htmlFor="jkhUnit">Выберите ЖЭУ:</label>
            <select
              id="jkhUnit"
              className="form-input"
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(parseInt(e.target.value) || 0)}
              disabled={loading}
            >
              <option value={0}>Выберите ЖЭУ</option>
              {jkhUnits.map(unit => (
                <option key={unit.id} value={unit.id}>
                  {unit.name} ({unit.district_name})
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedUnitId > 0 && (
          <>
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ marginBottom: '15px' }}>Назначить нового инспектора</h2>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: '1', minWidth: '300px' }}>
                  <label htmlFor="inspector">Выберите инспектора:</label>
                  <select
                    id="inspector"
                    className="form-input"
                    value={selectedInspectorId}
                    onChange={(e) => setSelectedInspectorId(parseInt(e.target.value) || 0)}
                    disabled={loading || availableInspectors.length === 0}
                  >
                    <option value={0}>
                      {availableInspectors.length === 0
                        ? 'Нет доступных инспекторов'
                        : 'Выберите инспектора'}
                    </option>
                    {availableInspectors.map(inspector => (
                      <option key={inspector.id} value={inspector.id}>
                        {inspector.last_name} {inspector.first_name} ({inspector.email})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  className="btn-add"
                  onClick={handleAssignInspector}
                  disabled={loading || selectedInspectorId === 0 || availableInspectors.length === 0}
                >
                  Назначить
                </button>
              </div>
            </div>

            <div>
              <h2 style={{ marginBottom: '15px' }}>Назначенные инспекторы</h2>
              {loading ? (
                <div className="loading">Загрузка...</div>
              ) : assignedInspectors.length === 0 ? (
                <div className="empty-state">На данное ЖЭУ не назначено ни одного инспектора</div>
              ) : (
                <div className="users-table-container">
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Фамилия</th>
                        <th>Имя</th>
                        <th>Email</th>
                        <th>Логин</th>
                        <th>Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignedInspectors.map(inspector => (
                        <tr key={inspector.id}>
                          <td>{inspector.id}</td>
                          <td>{inspector.last_name}</td>
                          <td>{inspector.first_name}</td>
                          <td>{inspector.email}</td>
                          <td>{inspector.login}</td>
                          <td>
                            <button
                              className="btn-delete"
                              onClick={() => handleUnassignInspector(inspector.id)}
                              disabled={loading}
                            >
                              Открепить
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default InspectorAssignmentsPage;

