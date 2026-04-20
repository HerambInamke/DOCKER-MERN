import { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completeOAuthLogin } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      navigate('/login');
      return;
    }

    completeOAuthLogin(token).then((result) => {
      navigate(result.success ? '/' : '/login');
    });
  }, [completeOAuthLogin, navigate, searchParams]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-24">
      <div className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <h1 className="mt-6 text-2xl font-bold text-slate-950">Signing you in</h1>
        <p className="mt-2 text-slate-600">Finishing your social login and loading your profile.</p>
        <Link to="/login" className="mt-6 inline-flex text-sm font-medium text-blue-600 hover:text-blue-700">
          Back to login
        </Link>
      </div>
    </div>
  );
};

export default AuthCallback;
