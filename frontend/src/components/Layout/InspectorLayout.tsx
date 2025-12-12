import React from 'react';
import InspectorSidebar from './InspectorSidebar';
import './Layout.css';

interface InspectorLayoutProps {
  children: React.ReactNode;
}

const InspectorLayout: React.FC<InspectorLayoutProps> = ({ children }) => {
  return (
    <div className="layout">
      <InspectorSidebar />
      <main className="layout-main">
        {children}
      </main>
    </div>
  );
};

export default InspectorLayout;

