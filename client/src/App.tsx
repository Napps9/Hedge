import { useEffect, useState } from 'react';
import './index.css';
import DashboardPage from './pages/DashboardPage';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const ensureSession = async () => {
      let token = localStorage.getItem('token');

      if (!token) {
        // Auto-create a session
        try {
          const response = await axios.post(`${API_BASE}/auth/demo`);
          token = response.data.token;
          localStorage.setItem('token', token!);
        } catch (error) {
          console.error('Failed to create session:', error);
        }
      }

      setReady(true);
    };

    ensureSession();
  }, []);

  if (!ready) {
    return null;
  }

  return <DashboardPage />;
}

export default App;
