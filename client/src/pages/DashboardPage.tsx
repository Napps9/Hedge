import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { authAPI } from '../services/api';

function DashboardPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleLogout = async () => {
    await authAPI.logout();
    navigate('/login');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // TODO: Send query to backend
      console.log('Query:', query);
      setQuery('');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 py-4">
        <div className="container flex justify-between items-center">
          <h1 className="text-2xl font-light">Hedge</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-black transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="container py-12">
        <div className="max-w-2xl mx-auto">
          {/* Welcome message */}
          <div className="mb-12">
            <h2 className="text-3xl font-light mb-4">Find your next adventure</h2>
            <p className="text-gray-600">
              Tell me what you're looking for, and I'll recommend places based on your calendar and preferences.
            </p>
          </div>

          {/* Input area */}
          <form onSubmit={handleSubmit} className="mb-12">
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask me anything... e.g., 'Find a good restaurant for dinner this weekend'"
                className="flex-1 px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-black transition"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-black text-white rounded hover:bg-gray-800 transition"
              >
                Ask
              </button>
            </div>
          </form>

          {/* Placeholder for recommendations */}
          <div className="text-center text-gray-400">
            <p>Your recommendations will appear here</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;
