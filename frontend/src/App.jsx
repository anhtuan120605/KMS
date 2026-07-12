import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { 
  Home, 
  BookOpen, 
  FileText, 
  CheckSquare, 
  BarChart2, 
  Settings, 
  User, 
  Bell,
  Search,
  Plus,
  Users
} from 'lucide-react';

// Shared Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Pages
import HomeDashboard from './pages/HomeDashboard';
import KnowledgeBase from './pages/KnowledgeBase';
import SubmitForm from './pages/SubmitForm';
import ReviewPage from './pages/ReviewPage';
import KPIDashboard from './pages/KPIDashboard';
import KnowledgeDetail from './pages/KnowledgeDetail';
import LoginPage from './pages/LoginPage';
import UserManagement from './pages/UserManagement';

export const AuthContext = React.createContext();
export const LanguageContext = React.createContext();

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return {
    user: context.user,
    setUser: context.setUser,
    logout: () => context.setUser(null)
  };
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const context = React.useContext(AuthContext);
  const user = context?.user;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const normalizeUser = (val) => {
    if (!val) return val;
    let role = val.role;
    let position = val.position || 'FIRMWARE';
    
    if (role === 'Admin' || role === 'ADMIN' || role === 'Administrator' || role === 'ADMINISTRATOR') {
      role = 'ADMINISTRATOR';
    } else if (role === 'Project Manager' || role === 'PROJECT_MANAGER' || role === 'manager' || role === 'MANAGER') {
      role = 'MANAGER';
    } else if (role === 'Senior Engineer' || role === 'SENIOR_ENGINEER' || role === 'senior' || role === 'SENIOR') {
      role = 'SENIOR';
    } else {
      role = 'JUNIOR';
    }
    
    if (val.username === 'pilot' || position === 'FLIGHT') {
      position = 'FLIGHT';
    } else if (position === 'HARDWARE') {
      position = 'HARDWARE';
    } else {
      position = 'FIRMWARE';
    }
    
    return {
      ...val,
      role,
      position
    };
  };

  const [user, setUserState] = useState(() => {
    const saved = sessionStorage.getItem('userInfo');
    if (saved) {
      return normalizeUser(JSON.parse(saved));
    }
    return null;
  });

  const setUser = (val) => {
    const normalized = normalizeUser(val);
    setUserState(normalized);
    if (normalized) {
      sessionStorage.setItem('userInfo', JSON.stringify(normalized));
    } else {
      sessionStorage.removeItem('userInfo');
    }
  };

  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('language') || 'vi';
  });

  const setLanguage = (val) => {
    setLanguageState(val);
    localStorage.setItem('language', val);
  };

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <LanguageContext.Provider value={{ language, setLanguage }}>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <div className="flex h-screen w-screen overflow-hidden bg-background text-slate-200">
                  <Sidebar />
                  <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                    {/* Background decorative elements */}
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full pointer-events-none"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-accent/20 blur-[100px] rounded-full pointer-events-none"></div>
                    
                    <Header />
                    <main className="flex-1 overflow-y-auto p-6 z-10">
                      <Routes>
                        <Route path="/" element={<HomeDashboard />} />
                        <Route path="/library" element={<KnowledgeBase />} />
                        <Route path="/submit" element={
                          <ProtectedRoute allowedRoles={['JUNIOR', 'SENIOR', 'ADMINISTRATOR']}>
                            <SubmitForm />
                          </ProtectedRoute>
                        } />
                        <Route path="/review" element={
                          <ProtectedRoute allowedRoles={['SENIOR', 'ADMINISTRATOR']}>
                            <ReviewPage />
                          </ProtectedRoute>
                        } />
                        <Route path="/kpi" element={
                          <ProtectedRoute allowedRoles={['MANAGER', 'ADMINISTRATOR']}>
                            <KPIDashboard />
                          </ProtectedRoute>
                        } />
                        <Route path="/item/:id" element={<KnowledgeDetail />} />
                        <Route path="/users" element={
                          <ProtectedRoute allowedRoles={['ADMINISTRATOR']}>
                            <UserManagement />
                          </ProtectedRoute>
                        } />
                      </Routes>
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </LanguageContext.Provider>
    </AuthContext.Provider>
  );
}

export default App;
