import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Events from './pages/Events';
import Resources from './pages/Resources';
import Contact from './pages/Contact';
import Membership from './pages/Membership';
import Legal from './pages/Legal';
import StudentApplication from './pages/StudentApplication';
import ChapterApplication from './pages/ChapterApplication';
import JoinAproApplication from './pages/JoinApplication';
import AdminLogin from './pages/adminLogin';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import AdminDashboard from './pages/AdminDashboard';
import StudentApplicationsPage from './pages/StudentApplicationsPage';
import ChapterApplicationsPage from './pages/ChapterApplicationsPage';
import CareerApplicationsPage from './pages/CareerApplicationsPage';
import UserLogin from './pages/userLogin';
import ResetPassword from './pages/ResetPassword';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="events" element={<Events />} />
          <Route path="resources" element={<Resources />} />
          <Route path="contact" element={<Contact />} />
          <Route path="membership" element={<Membership />} />
          <Route path="legal" element={<Legal />} />
          <Route path="student" element={<StudentApplication />} />
          <Route path="chapter" element={<ChapterApplication />} />
          <Route path="join" element={<JoinAproApplication />} />
          <Route path="admin" element={<AdminLogin />} />
          <Route path="login" element={<UserLogin />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            } />
            <Route
              path="/admin/students"
              element={
                <ProtectedAdminRoute>
                  <StudentApplicationsPage />
                </ProtectedAdminRoute>
              }
              />
              <Route
                path="/admin/chapters"
                element={
                  <ProtectedAdminRoute>
                    <ChapterApplicationsPage />
                  </ProtectedAdminRoute>
                } />
                <Route
                path="/admin/careers"
                element={
                  <ProtectedAdminRoute>
                    <CareerApplicationsPage />
                  </ProtectedAdminRoute>
                } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
