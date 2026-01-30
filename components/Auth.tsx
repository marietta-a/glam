
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { compressImage } from '../services/wardrobeService';
import { 
  Sparkles, Mail, Lock, Loader2, User, HelpCircle, 
  Eye, EyeOff, ArrowRight
} from 'lucide-react';
import BrandLogo from './BrandLogo';

interface AuthProps {
  onProfileImageUpdate: (base64: string | null) => void;
  profileImage: string | null;
}

const Auth: React.FC<AuthProps> = ({ onProfileImageUpdate, profileImage }) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgotPassword'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showVerificationNotice, setShowVerificationNotice] = useState(false);
  const [isVerifiedSuccess, setIsVerifiedSuccess] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<'verification' | 'profile'>('verification');
  const [showForgotPrompt, setShowForgotPrompt] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleRedirect = async () => {
      const hash = window.location.hash;
      if (hash && (hash.includes('access_token') || hash.includes('type=signup'))) {
        setIsVerifiedSuccess(true);
        setOnboardingStep('profile');
        window.history.replaceState(null, '', window.location.pathname);
      }
    };
    handleRedirect();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setShowForgotPrompt(false);

    try {
      if (authMode === 'login') {
        const { error: loginErr } = await (supabase.auth as any).signInWithPassword({ email, password });
        if (loginErr) {
          if (loginErr.message.toLowerCase().includes('invalid')) {
            setShowForgotPrompt(true);
            throw new Error("Invalid credentials. Please verify your details.");
          }
          throw loginErr;
        }
      } else if (authMode === 'signup') {
        const { error: signupErr } = await (supabase.auth as any).signUp({ 
          email, 
          password
        });
        
        if (signupErr) {
          if (signupErr.message.includes('User already registered')) {
            throw new Error("Email already in use");
          }
          throw signupErr;
        }
        setShowVerificationNotice(true);
      } else if (authMode === 'forgotPassword') {
        const { error: resetErr } = await (supabase.auth as any).resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (resetErr) {
          if (resetErr.message.toLowerCase().includes('not found')) {
            throw new Error("Account not found");
          }
          throw resetErr;
        }
        setSuccessMessage('A luxury recovery link has been sent to your inbox.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred during boutique authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = (mode: 'login' | 'signup' | 'forgotPassword') => {
    setError(null);
    setSuccessMessage(null);
    setShowVerificationNotice(false);
    setIsVerifiedSuccess(false);
    setShowForgotPrompt(false);
    setAuthMode(mode);
  };

  const renderContent = () => {
    if (isVerifiedSuccess && onboardingStep === 'profile') {
      return (
        <div className="w-full text-center py-6 animate-in zoom-in duration-700">
          <div className="w-28 h-28 bg-teal-50 rounded-[40px] flex items-center justify-center mb-6 mx-auto relative group">
            <div className="w-full h-full rounded-[40px] overflow-hidden bg-gray-100 flex items-center justify-center border-4 border-white shadow-inner">
              {profileImage ? (
                <img src={profileImage} alt="Setup Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-gray-300" />
              )}
            </div>
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2 uppercase text-center">Verified</h2>
          <p className="text-gray-500 text-sm mb-10 px-6 text-center">Sign in to complete your profile.</p>
          <button 
            onClick={() => handleToggleMode('login')}
            className="w-full py-6 bg-[#26A69A] text-white font-black uppercase tracking-[3px] text-[11px] rounded-[32px] shadow-2xl active:scale-95 transition-transform"
          >
            Go to Login
          </button>
        </div>
      );
    }

    if (showVerificationNotice) {
      return (
        <div className="w-full text-center py-4 animate-in zoom-in duration-500">
          <div className="w-24 h-24 bg-teal-50 rounded-[32px] flex items-center justify-center mb-8 mx-auto">
            <Mail className="w-12 h-12 text-[#26A69A] animate-pulse" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">Check Email</h2>
          <p className="text-gray-500 text-sm mb-10 px-4 text-center">Verification link sent to <span className="font-bold text-gray-700">{email}</span>.</p>
          <button 
            onClick={() => handleToggleMode('login')} 
            className="w-full py-5 bg-[#1a1a1a] text-white font-black uppercase text-[11px] tracking-widest rounded-[28px] shadow-xl hover:bg-[#26A69A] transition-all active:scale-95"
          >
            Back to Login
          </button>
        </div>
      );
    }

    const title = authMode === 'signup' ? 'Create Account' : authMode === 'login' ? 'Welcome Back' : 'Recover Access';
    const subtitle = authMode === 'signup' ? 'Join the future of fashion' : authMode === 'login' ? 'Sign in to your digital wardrobe.' : 'Enter email to receive reset link.';

    return (
      <>
        <div className="mb-6 flex flex-col items-center">
          {profileImage ? (
            <div className="w-24 h-24 rounded-full border-[6px] border-white shadow-2xl overflow-hidden mb-6 animate-in zoom-in duration-1000">
              <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="mb-8 scale-110">
              <BrandLogo size="lg" />
            </div>
          )}
        </div>
        
        <h2 className="text-2xl font-black text-gray-900 tracking-tight text-center mb-2 uppercase">{title}</h2>
        <p className="text-gray-400 text-sm text-center mb-10 px-6 leading-relaxed">{subtitle}</p>
        
        <form onSubmit={handleAuth} className="w-full space-y-4">
          <div className="relative group">
            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-[#26A69A] transition-colors z-10" />
            <input 
              type="email" 
              placeholder="Email Address" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="auth-input" 
              required 
            />
          </div>
          {authMode !== 'forgotPassword' && (
            <div className="relative group">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-[#26A69A] transition-colors z-10" />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="auth-input pr-14" 
                required 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors z-10"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          )}
          
          {error && (
            <div className="p-5 bg-red-50 text-red-600 text-[11px] font-bold rounded-[24px] animate-in slide-in-from-top-2 shadow-sm border border-red-100 flex flex-col items-center space-y-3">
              <span className="text-center">{error}</span>
              {showForgotPrompt && (
                <button 
                  type="button"
                  onClick={() => handleToggleMode('forgotPassword')}
                  className="flex items-center space-x-2 text-[#26A69A] hover:text-[#1d8278] transition-colors border-t border-red-100 pt-3 w-full justify-center group"
                >
                  <span className="uppercase tracking-[1.5px] font-black">Forgot Password?</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
          )}
          
          {successMessage && (
            <div className="p-5 bg-teal-50 text-[#26A69A] text-[11px] font-bold text-center rounded-[24px] animate-in slide-in-from-top-2 shadow-sm border border-teal-100">
              {successMessage}
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-5 bg-[#1a1a1a] text-white font-black uppercase tracking-widest text-[11px] rounded-[28px] hover:bg-[#26A69A] transition-all shadow-xl active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (authMode === 'login' ? 'Sign In' : (authMode === 'signup' ? 'Create Account' : 'Send Link'))}
          </button>
        </form>
        
        <div className="flex flex-col items-center space-y-4 mt-8">
          <button 
            onClick={() => handleToggleMode(authMode === 'login' ? 'signup' : 'login')} 
            className="text-[11px] font-black uppercase text-gray-400 hover:text-gray-900 transition-colors tracking-widest"
          >
            {authMode === 'login' ? "Need an account?" : "Already member?"}
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col items-center justify-center p-6 bg-[#f7f9fa] overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2000&auto=format&fit=crop" 
          alt="Fashion Background" 
          className="w-full h-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>

      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-[48px] p-10 shadow-2xl relative z-10 flex flex-col items-center animate-in fade-in slide-in-from-bottom-8">
        {renderContent()}
      </div>

      <style>{`
        .auth-input { 
          width: 100%; 
          background: #f9fafb; 
          border: 1px solid #f3f4f6; 
          border-radius: 28px; 
          padding: 20px 24px 20px 80px; 
          font-size: 14px; 
          font-weight: 500;
          outline: none; 
          transition: 0.3s; 
          position: relative;
        }
        .auth-input:focus { 
          border-color: #26A69A; 
          background: white; 
          box-shadow: 0 0 0 4px rgba(38, 166, 154, 0.05);
        }
        .auth-input::placeholder {
           color: #cbd5e1;
           opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default Auth;
