import React, { useState } from 'react';
import { Lock, Mail, Globe, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Button, Input } from '../components/ui';
import { TRANSLATIONS } from '../constants';
import { User } from '../types';
import { api } from '../services/backendApi';

interface LoginProps {
  onLogin: (user: User, mustChangePassword: boolean) => void;
  lang: 'en' | 'zh';
  toggleLang: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, lang, toggleLang }) => {
  const [view, setView] = useState<'LOGIN' | 'FORGOT'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  // Forgot Password State
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  
  const t = TRANSLATIONS[lang];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.login(email, password);
      onLogin(
        {
          id: response.user.id,
          name: response.user.name,
          role: response.user.role as 'HQ' | 'TEACHER' | 'PARENT',
          email: response.user.email
        },
        response.user.mustChangePassword
      );
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
      e.preventDefault();
      // Simulate API call for password reset
      setTimeout(() => {
          setResetSuccess(true);
      }, 1000);
  };

  const demoLogin = (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
  };

  return (
    <div className="flex flex-col items-center justify-center bg-white p-4">
      <div className="max-w-[380px] w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header Section */}
        <div className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 bg-black rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-sm mb-3">
            I
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Insight EDU</h1>
          <p className="text-sm text-muted-foreground">
            {view === 'LOGIN' ? t.loginTitle : t.resetPassword}
          </p>
        </div>

        {/* Card Section */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-xl p-6">
          {view === 'LOGIN' ? (
              <form className="space-y-4" onSubmit={handleLogin}>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Input 
                      type="email" 
                      placeholder={t.emailPlaceholder} 
                      className="pl-10 h-10 bg-gray-50/50 border-gray-200 focus:bg-white transition-all" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-foreground">Password</label>
                      <button 
                        type="button"
                        onClick={() => { setView('FORGOT'); setError(''); }}
                        className="text-xs font-medium text-foreground hover:underline"
                      >
                          {t.forgotPassword}
                      </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      placeholder={t.passwordPlaceholder} 
                      className="pl-10 pr-10 h-10 bg-gray-50/50 border-gray-200 focus:bg-white transition-all" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="text-red-500 text-xs text-center bg-red-50 p-2 rounded-md font-medium">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full h-10 text-base font-semibold mt-2 bg-black text-white hover:bg-black/90 rounded-lg">
                  {t.loginButton}
                </Button>

                {/* Demo Credentials Section inside Form/Card */}
                <div className="mt-6 pt-2">
                    <div className="text-center mb-3">
                        <span className="text-xs text-muted-foreground">{t.loginFooter}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <button type="button" onClick={() => demoLogin('admin@edu.com', 'Admin123')} className="flex flex-col items-center justify-center py-2 px-1 border rounded-lg hover:bg-gray-50 transition-all text-center group bg-white shadow-sm">
                            <span className="text-[10px] font-bold text-foreground group-hover:text-black mb-0.5">HQ</span>
                            <span className="text-[10px] text-muted-foreground">Admin</span>
                        </button>
                        <button type="button" onClick={() => demoLogin('sarahjenkins@edu.com', '123')} className="flex flex-col items-center justify-center py-2 px-1 border rounded-lg hover:bg-gray-50 transition-all text-center group bg-white shadow-sm">
                            <span className="text-[10px] font-bold text-foreground group-hover:text-black mb-0.5">Teacher</span>
                            <span className="text-[10px] text-muted-foreground">Sarah</span>
                        </button>
                        <button type="button" onClick={() => demoLogin('ahmad@edu.com', '123')} className="flex flex-col items-center justify-center py-2 px-1 border rounded-lg hover:bg-gray-50 transition-all text-center group bg-white shadow-sm">
                            <span className="text-[10px] font-bold text-foreground group-hover:text-black mb-0.5">Parent</span>
                            <span className="text-[10px] text-muted-foreground">Ali's Dad</span>
                        </button>
                    </div>
                </div>
              </form>
          ) : (
              // Forgot Password View
              <div className="space-y-6">
                  {!resetSuccess ? (
                      <form className="space-y-4" onSubmit={handleForgotPassword}>
                        <p className="text-sm text-muted-foreground text-center">{t.enterEmailForReset}</p>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold">Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <Input 
                                type="email" 
                                placeholder={t.emailPlaceholder} 
                                className="pl-10 h-10" 
                                value={resetEmail}
                                onChange={(e) => setResetEmail(e.target.value)}
                                required
                                />
                            </div>
                        </div>
                        <Button type="submit" className="w-full h-10 bg-black text-white hover:bg-black/90 rounded-lg">
                            {t.sendResetLink}
                        </Button>
                      </form>
                  ) : (
                      <div className="text-center space-y-4 py-4">
                          <div className="mx-auto h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center animate-in zoom-in">
                              <CheckCircle className="h-6 w-6" />
                          </div>
                          <p className="text-sm text-muted-foreground">{t.resetSuccess}</p>
                      </div>
                  )}
                  
                  <Button variant="ghost" className="w-full h-10" onClick={() => { setView('LOGIN'); setResetSuccess(false); setResetEmail(''); }}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      {t.backToLogin}
                  </Button>
              </div>
          )}
        </div>

        {/* Footer Language Switcher */}
        <div className="text-center pb-4">
          <button 
            onClick={toggleLang} 
            className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
             <Globe className="w-3.5 h-3.5 mr-1.5" />
             {lang === 'en' ? 'Switch to Chinese' : 'Switch to English'}
          </button>
        </div>
      </div>
    </div>
  );
};
