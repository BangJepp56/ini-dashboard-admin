import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Doctors from './pages/Doctors';
import Schedules from './pages/Schedules';
import FollowUpAppointments from './pages/FollowUpAppointments';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ProtectedRoute>
          <div className="min-h-screen bg-gray-50">
            <Sidebar />
            <main className="ml-64 p-6">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/patients" element={<Patients />} />
                <Route path="/doctors" element={<Doctors />} />
                <Route path="/schedules" element={<Schedules />} />
                <Route path="/follow-up" element={<FollowUpAppointments />} />
              </Routes>
            </main>
          </div>
        </ProtectedRoute>
      </Router>
    </AuthProvider>
  );
}

export default App;