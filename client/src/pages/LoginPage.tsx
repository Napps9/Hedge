import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { authAPI } from '../services/api';

function LoginPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check for OAuth callback
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code) {
      handleOAuthCallback(code);
    }
  }, []);

  const handleOAuthCallback = async (code: string) => {
    try {
      const response = await authAPI.handleCallback(code);
      const { token } = response.data;
      localStorage.setItem('token', token);
      navigate('/');
    } catch (error) {
      console.error('OAuth callback failed:', error);
    }
  };

  const handleLoginClick = async () => {
    try {
      const response = await authAPI.getAuthUrl();
      const { url } = response.data;
      window.location.href = url;
    } catch (error) {
      console.error('Failed to get auth URL:', error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center">
        <h1 className="text-4xl font-light mb-4">Hedge</h1>
        <p className="text-gray-600 mb-8">Your AI Lifestyle Assistant</p>

        <button
          onClick={handleLoginClick}
          className="px-8 py-3 bg-black text-white rounded hover:bg-gray-800 transition"
        >
          Sign in with Google
        </button>

        <p className="text-sm text-gray-500 mt-8">
          Discover places to visit based on your calendar and preferences
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
