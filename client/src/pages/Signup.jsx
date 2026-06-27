import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

function Signup() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const signup = useAuthStore((state) => state.signup);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signup(fullName, username, email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e1621] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🗣️</div>
          <h1 className="text-3xl font-bold text-white">Samvaad</h1>
          <p className="text-[#7a8fa6] mt-2">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#17212b] border border-[#2b5278] rounded-lg text-white placeholder-[#546778] focus:outline-none focus:border-[#2AABEE]"
            />
          </div>

          <div>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#17212b] border border-[#2b5278] rounded-lg text-white placeholder-[#546778] focus:outline-none focus:border-[#2AABEE]"
            />
          </div>

          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#17212b] border border-[#2b5278] rounded-lg text-white placeholder-[#546778] focus:outline-none focus:border-[#2AABEE]"
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-[#17212b] border border-[#2b5278] rounded-lg text-white placeholder-[#546778] focus:outline-none focus:border-[#2AABEE]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2AABEE] text-white py-3 rounded-lg font-medium hover:bg-[#229ED9] transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-[#7a8fa6] mt-6">
          Already have an account?{' '}
          <a href="/login" className="text-[#2AABEE] hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}

export default Signup;
