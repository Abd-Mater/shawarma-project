import { useState } from 'react';
import { Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';

export function AdminLoginPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const { login } = useStore();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(pin)) {
      // Login successful - App.tsx will switch to AdminPage automatically
      // But we can also redirect to root just in case
      navigate('/');
    } else {
      setError(true);
      setPin('');
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">الدخول للإدارة</h1>
          <p className="text-gray-400">أدخل الرمز السري للمتابعة</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative">
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError(false);
              }}
              className={`w-full bg-white/5 border text-center text-3xl tracking-[1em] font-bold text-white py-6 rounded-2xl focus:outline-none focus:ring-2 transition-all ${
                error 
                  ? 'border-red-500 focus:ring-red-500/50' 
                  : 'border-white/10 focus:border-orange-500 focus:ring-orange-500/50'
              }`}
              placeholder="••••"
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center justify-center gap-2 text-red-400 text-sm animate-bounce">
              <AlertCircle className="w-4 h-4" />
              <span>الرمز السري غير صحيح</span>
            </div>
          )}

          <div className="space-y-3">
            <button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl transition-all active:scale-95"
            >
              دخول
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full bg-white/5 hover:bg-white/10 text-white/60 font-medium py-4 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              العودة للرئيسية
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
