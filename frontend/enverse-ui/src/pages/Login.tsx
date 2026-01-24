import React, { useState } from 'react';
import { Mail, ArrowRight, Shield, Zap, Lock, CheckCircle2 } from 'lucide-react';
import { getApiUrl, API_ENDPOINTS } from '../config/api';

interface LoginProps {
  onLoginSuccess: (token: string, email: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOTP = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(getApiUrl(API_ENDPOINTS.SEND_OTP), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (data.success) {
        setStep('otp');
      } else {
        setError(data.message || 'Failed to send OTP');
      }
    } catch {
      setError('Connection error. Please check backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(getApiUrl(API_ENDPOINTS.VERIFY_OTP), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('enverse_token', data.token);
        localStorage.setItem('enverse_email', data.user.email);
        onLoginSuccess(data.token, data.user.email);
      } else {
        setError(data.message || 'Invalid OTP');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Smooth animated background - sky & cyan glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-40 w-80 h-80 bg-gradient-to-br from-sky-500/20 to-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 -right-40 w-80 h-80 bg-gradient-to-tl from-sky-400/15 to-blue-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.01)_1px,transparent_1px)] bg-[size:50px_50px] opacity-20"></div>
      </div>

      <div className="relative w-full max-w-md z-10">
        {/* Premium Logo/Brand with glow */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6 group">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/40 group-hover:shadow-orange-500/60 transition-all duration-300 transform group-hover:scale-110">
              <Zap className="text-white" size={28} />
            </div>
            <h1 className="text-5xl font-black text-white tracking-tight">Enverse</h1>
          </div>
          <p className="text-slate-300 text-sm font-medium tracking-wide">AI-Powered Energy Intelligence</p>
        </div>

        {/* Main premium card with glow border */}
        <div className="bg-white/[0.06] backdrop-blur-2xl border border-white/15 rounded-3xl p-8 sm:p-10 shadow-2xl relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-sky-500/20 to-cyan-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500 -z-10"></div>
          
          <div className="relative">
            {step === 'email' ? (
              <>
                <div className="mb-8">
                  <h2 className="text-3xl font-black text-white mb-2">Welcome Back</h2>
                  <p className="text-slate-300 text-sm font-medium">Enter your email to receive a secure login code</p>
                </div>

                <div className="space-y-4">
                  <div className="relative group/input">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-400/60 group-focus-within/input:text-sky-400 transition-colors duration-300" size={20} />
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendOTP()}
                      className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50 focus:bg-white/10 focus:ring-2 focus:ring-sky-500/20 transition-all duration-300 font-medium"
                    />
                  </div>

                  {error && (
                    <div className="text-rose-300 text-sm bg-rose-500/20 border border-rose-500/40 rounded-xl p-3.5 flex items-start gap-2 animate-pulse">
                      <Shield size={16} className="mt-0.5 flex-shrink-0 text-rose-400" />
                      <span className="font-medium">{error}</span>
                    </div>
                  )}

                  <button
                    onClick={handleSendOTP}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3.5 rounded-2xl font-bold text-base transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/30 hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        Continue <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-8 flex items-center justify-center gap-2 text-slate-400 text-xs">
                  <Lock size={14} className="text-green-400/70" />
                  <span className="font-medium">Secure • No passwords • Instant verification</span>
                </div>
              </>
            ) : (
              <>
                <div className="mb-8 flex items-start gap-3">
                  <CheckCircle2 size={28} className="text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h2 className="text-3xl font-black text-white mb-1">Verify Code</h2>
                    <p className="text-slate-300 text-sm">6-digit code sent to <span className="font-semibold text-sky-300">{email}</span></p>
                  </div>
                </div>

                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtp(val);
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleVerifyOTP()}
                    className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-center text-4xl font-bold tracking-widest placeholder-slate-600 focus:outline-none focus:border-sky-500/50 focus:bg-white/10 focus:ring-2 focus:ring-sky-500/20 transition-all duration-300 font-mono"
                    maxLength={6}
                  />

                  {error && (
                    <div className="text-rose-300 text-sm bg-rose-500/20 border border-rose-500/40 rounded-xl p-3.5 flex items-start gap-2 animate-pulse">
                      <Shield size={16} className="mt-0.5 flex-shrink-0 text-rose-400" />
                      <span className="font-medium">{error}</span>
                    </div>
                  )}

                  <button
                    onClick={handleVerifyOTP}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3.5 rounded-2xl font-bold text-base transition-all duration-300 hover:shadow-xl hover:shadow-green-500/30 hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        Verify & Login <ArrowRight size={18} />
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setStep('email')}
                    className="w-full text-slate-400 hover:text-sky-300 text-sm transition-colors py-2 font-medium"
                  >
                    ← Use different email
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer with badges */}
        <div className="mt-8 text-center">
          <p className="text-slate-400 text-xs font-medium mb-3">
            🔒 Enterprise-grade security
          </p>
          <div className="flex justify-center gap-3 text-xs text-slate-500">
            <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">Real-time</span>
            <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">Secure</span>
            <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">Passwordless</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
