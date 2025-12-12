import React from 'react';
import CoordinatorSidebar from './CoordinatorSidebar';
import './Layout.css';

interface CoordinatorLayoutProps {
  children: React.ReactNode;
}

const CoordinatorLayout: React.FC<CoordinatorLayoutProps> = ({ children }) => {
  return (
    <div className="layout">
      <CoordinatorSidebar />
      <main className="layout-main">
        {children}
      </main>
    </div>
  );
};

export default CoordinatorLayout;

