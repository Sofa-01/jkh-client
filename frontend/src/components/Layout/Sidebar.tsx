import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Sidebar.css';

interface MenuItem {
  path: string;
  label: string;
  icon?: string;
}

const menuItems: MenuItem[] = [
  { path: '/users', label: 'Пользователи' },
  { path: '/districts', label: 'Районы' },
  { path: '/jkhunits', label: 'ЖЭУ' },
  { path: '/buildings', label: 'Объекты ЖКХ' },
  { path: '/checklists', label: 'Чек-листы' },
  { path: '/coordinators', label: 'Координаторы' },
  { path: '/inspectors', label: 'Инспекторы' },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { logout } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Панель специалиста по сопровождению</h2>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button onClick={logout} className="sidebar-item sidebar-exit">
          Выход
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

