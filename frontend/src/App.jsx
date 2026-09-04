import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import Applications from './pages/Applications';
import InterviewsOffers from './pages/InterviewsOffers';
import Announcements from './pages/Announcements';
import Profile from './pages/Profile';
import CompanyProfile from './pages/CompanyProfile';
import Students from './pages/Students';
import Companies from './pages/Companies';
import OfficerOffers from './pages/OfficerOffers';
import { Loading } from './components/ui';

function Shell({ children }) {
  const { loading } = useAuth();
  if (loading) return <Loading text="Loading CampusFlow…" />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />

      <Route path="/" element={<ProtectedRoute><Shell><Dashboard /></Shell></ProtectedRoute>} />
      <Route path="/jobs" element={<ProtectedRoute><Shell><Jobs /></Shell></ProtectedRoute>} />
      <Route
        path="/applications"
        element={<ProtectedRoute roles={['STUDENT']}><Shell><Applications /></Shell></ProtectedRoute>}
      />
      <Route
        path="/interviews"
        element={<ProtectedRoute roles={['STUDENT']}><Shell><InterviewsOffers /></Shell></ProtectedRoute>}
      />
      <Route path="/announcements" element={<ProtectedRoute><Shell><Announcements /></Shell></ProtectedRoute>} />
      <Route
        path="/profile"
        element={<ProtectedRoute roles={['STUDENT']}><Shell><Profile /></Shell></ProtectedRoute>}
      />
      <Route
        path="/company"
        element={<ProtectedRoute roles={['RECRUITER']}><Shell><CompanyProfile /></Shell></ProtectedRoute>}
      />
      <Route
        path="/students"
        element={<ProtectedRoute roles={['PLACEMENT_OFFICER', 'FACULTY']}><Shell><Students /></Shell></ProtectedRoute>}
      />
      <Route
        path="/companies"
        element={<ProtectedRoute roles={['PLACEMENT_OFFICER']}><Shell><Companies /></Shell></ProtectedRoute>}
      />
      <Route
        path="/offers"
        element={<ProtectedRoute roles={['PLACEMENT_OFFICER']}><Shell><OfficerOffers /></Shell></ProtectedRoute>}
      />
    </Routes>
  );
}
