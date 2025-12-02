import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useAuth } from '../../context/AuthContext';

const PublicLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-dark-500 flex">
      {/* Sidebar - chỉ hiển thị khi đã đăng nhập */}
      {user && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        {/* offset main content to account for fixed header (h-20) */}
        <main className="flex-1 mt-20">
          {children}
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default PublicLayout;
