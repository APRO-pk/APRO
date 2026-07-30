import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { CurrencyProvider } from './src/context/CurrencyContext';
import Home from './pages/Home';
import About from './pages/About';
import Events from './pages/Events';
import Resources from './pages/Resources';
import Contact from './pages/Contact';
import Membership from './pages/Membership';
import Legal from './pages/Legal';
import MemberApplication from './pages/MemberApplication';
import ChapterApplication from './pages/ChapterApplication';
import JoinAproApplication from './pages/JoinApplication';
import AdminLogin from './pages/adminLogin';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import AdminDashboard from './pages/AdminDashboard';
import Dashboard from './pages/Dashboard';
import StudentApplicationsPage from './pages/StudentApplicationsPage';
import ChapterApplicationsPage from './pages/ChapterApplicationsPage';
import CareerApplicationsPage from './pages/CareerApplicationsPage';
import CrewApplicationsPage from './pages/CrewApplicationsPage';
import UserLogin from './pages/userLogin';
import ResetPassword from './pages/ResetPassword';
import FeedbackHub from './pages/FeedbackHub';
import AdminFeedback from './pages/AdminFeedback';
import AproWorks from './pages/AproWorks';
import Pricing from './pages/Pricing';
import Certifications from './pages/Certifications';
import EventRegister from './pages/EventRegister';
import EventDetail from './pages/EventDetail';
import AdminEventsList from './pages/AdminEventsList';
import AdminEventDetail from './pages/AdminEventDetail';

// Community
import Launchpad from './src/pages/Community/Launchpad';
import NewLaunch from './src/pages/Community/NewLaunch';
import LaunchDetail from './src/pages/Community/LaunchDetail';
import UserFeed from './src/pages/Community/UserFeed';
import Signals from './src/pages/Community/Signals';
import Crew from './src/pages/Community/Crew';
import Missions from './src/pages/Community/Missions';
import Me from './src/pages/Community/Me';

function App() {
  return (
    <Router>
      <CurrencyProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="apro-works" element={<AproWorks />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="certifications" element={<Certifications />} />
            <Route path="about" element={<About />} />
            <Route path="events" element={<Events />} />
            <Route path="resources" element={<Resources />} />
            <Route path="contact" element={<Contact />} />
            <Route path="membership" element={<Membership />} />
            <Route path="legal" element={<Legal />} />
            <Route path="join" element={<MemberApplication />} />
            <Route path="chapter" element={<ChapterApplication />} />
            <Route path="join" element={<JoinAproApplication />} />
            <Route path="admin" element={<AdminLogin />} />
            <Route path="login" element={<UserLogin />} />
            <Route path="reset-password" element={<ResetPassword />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="feedback" element={<FeedbackHub />} />
            <Route path="events/:slug/register" element={<EventRegister />} />
            <Route path="events/:slug" element={<EventDetail />} />
            <Route path="community" element={<Launchpad />} />
            <Route path="community/launchpad" element={<Navigate to="/community" replace />} />
            <Route path="community/new" element={<NewLaunch />} />
            <Route path="community/post/:id" element={<LaunchDetail />} />
            <Route path="community/user/:id" element={<UserFeed />} />
            <Route path="community/signals" element={<Signals />} />
            <Route path="community/crew" element={<Crew />} />
            <Route path="community/missions" element={<Missions />} />
            <Route path="community/me" element={<Me />} />
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
                  <Route
                    path="/admin/crew"
                    element={
                      <ProtectedAdminRoute>
                        <CrewApplicationsPage />
                      </ProtectedAdminRoute>
                    } />
                  <Route
                    path="/admin/feedback"
                    element={
                      <ProtectedAdminRoute>
                        <AdminFeedback />
                      </ProtectedAdminRoute>
                    } />
                  <Route
                    path="/admin/events"
                    element={
                      <ProtectedAdminRoute>
                        <AdminEventsList />
                      </ProtectedAdminRoute>
                    } />
                  <Route
                    path="/admin/events/:id"
                    element={
                      <ProtectedAdminRoute>
                        <AdminEventDetail />
                      </ProtectedAdminRoute>
                    } />
                  <Route
                    path="/admin/events/new"
                    element={
                      <ProtectedAdminRoute>
                        <AdminEventDetail />
                      </ProtectedAdminRoute>
                    } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </CurrencyProvider>
    </Router>
  );
}

export default App;
