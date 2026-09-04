import { useAuth } from '../context/AuthContext';
import StudentDashboard from './dashboards/StudentDashboard';
import RecruiterDashboard from './dashboards/RecruiterDashboard';
import OfficerDashboard from './dashboards/OfficerDashboard';
import FacultyDashboard from './dashboards/FacultyDashboard';

export default function Dashboard() {
  const { user } = useAuth();
  switch (user.role) {
    case 'STUDENT':
      return <StudentDashboard />;
    case 'RECRUITER':
      return <RecruiterDashboard />;
    case 'PLACEMENT_OFFICER':
      return <OfficerDashboard />;
    case 'FACULTY':
      return <FacultyDashboard />;
    default:
      return null;
  }
}
