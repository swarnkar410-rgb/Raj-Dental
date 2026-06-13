'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ShieldAlert, Loader2 } from 'lucide-react';
import { apiRequest, saveTokens } from '../../utils/api';

import logoLight from '../../../../../assets/pms/logo-light.png';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (data.success) {
        saveTokens(data.accessToken, data.refreshToken);
        router.replace('/dashboard');
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err: any) {
      setError(err.message || 'Server connection failed. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0B1220] relative overflow-hidden px-4">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#145DA0]/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#3B82F6]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md glass-panel p-8 sm:p-10 rounded-3xl shadow-2xl relative border-white/10">
        {/* Glow strip */}
        <div className="absolute top-0 left-10 right-10 h-[2px] bg-gradient-to-r from-transparent via-[#3B82F6]/50 to-transparent" />

        {/* Logo block */}
        <div className="flex flex-col items-center space-y-3 mb-8 text-center">
          <div className="relative w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl shadow-lg p-2">
            <img 
              src={typeof logoLight === 'object' ? logoLight.src : logoLight} 
              alt="Raj Dental Logo" 
              className="w-full h-full object-contain" 
            />
          </div>
          <div>
            <h1 className="font-black text-white text-2xl tracking-wide">PMS PORTAL</h1>
            <p className="text-gray-400 text-xs mt-1 uppercase font-semibold tracking-wider">Raj Dental & Implant Hospital</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs sm:text-sm font-semibold flex items-center space-x-2">
            <ShieldAlert size={16} className="text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Doctor Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                <Mail size={16} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="manoj@rajdental.com"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-[#3B82F6] transition-all text-sm"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Password</label>
              <button 
                type="button" 
                onClick={() => alert('Default credentials are: manoj@rajdental.com / manoj@456')}
                className="text-[10px] font-bold text-[#D4AF37] hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                <Lock size={16} />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-[#3B82F6] transition-all text-sm"
              />
            </div>
          </div>

          {/* Remember me */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-white/10 bg-white/5 text-[#3B82F6] focus:ring-[#3B82F6]"
            />
            <label htmlFor="rememberMe" className="ml-2 text-xs font-semibold text-gray-300 select-none cursor-pointer">
              Remember my session
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#145DA0] to-[#3B82F6] hover:from-[#1b76ca] hover:to-[#5ea0ff] text-white font-bold text-sm tracking-wide shadow-[0_4px_15px_rgba(59,130,246,0.3)] transition-all cursor-pointer flex justify-center items-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Verifying credentials...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
