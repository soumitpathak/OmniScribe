import React, { useState } from 'react';
import { OmniScribeLogo } from './OmniScribeLogo';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  ShieldCheck,
  ArrowRight,
  Lock,
  Mail,
  User,
  Building,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  FileText,
  Globe,
  Sparkles,
  AlertTriangle,
  Scale,
  Hash,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface HomePageProps {
  onOpenRulesPreview?: () => void;
  onOpenHSLookupPreview?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onOpenRulesPreview,
  onOpenHSLookupPreview,
}) => {
  const { login, signup, forgotPassword, quickDemoLogin, loginWithGoogle, isLoading } = useAuth();
  const toast = useToast();

  // Auth Card Modes: 'login' | 'signup' | 'forgot'
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState<string>('elena.rostova@meridiantrade.com');
  const [loginPassword, setLoginPassword] = useState<string>('••••••••••••');
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Signup Form State
  const [signupName, setSignupName] = useState<string>('');
  const [signupEmail, setSignupEmail] = useState<string>('');
  const [signupPassword, setSignupPassword] = useState<string>('');
  const [signupCompany, setSignupCompany] = useState<string>('');
  const [signupRole, setSignupRole] = useState<'Logistics Compliance Officer' | 'Customs Broker' | 'Supply Chain Director' | 'Auditor'>('Logistics Compliance Officer');
  const [signupError, setSignupError] = useState<string | null>(null);

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [forgotStatus, setForgotStatus] = useState<{ sent: boolean; message: string } | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const result = await login(loginEmail, loginPassword, rememberMe);
    if (result.success) {
      toast.success('Signed in successfully', 'Welcome to the OmniScribe Compliance Workspace.');
    } else {
      setLoginError(result.error || 'Authentication failed. Please verify credentials.');
      toast.error('Sign In Failed', result.error);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);
    if (!signupName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      setSignupError('Please complete all required fields.');
      return;
    }
    const result = await signup(signupName, signupEmail, signupPassword, signupCompany, signupRole);
    if (result.success) {
      toast.success('Account created', `Welcome aboard, ${signupName.trim()}! Workspace activated.`);
    } else {
      setSignupError(result.error || 'Registration failed.');
      toast.error('Signup Failed', result.error);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotStatus(null);
    if (!forgotEmail.trim()) {
      toast.warning('Email Required', 'Please enter your account email.');
      return;
    }
    const result = await forgotPassword(forgotEmail);
    setForgotStatus({ sent: result.success, message: result.message });
    if (result.success) {
      toast.info('Password Reset Link Sent', `Verification link sent to ${forgotEmail}.`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Bar Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single Brand Wordmark */}
          <OmniScribeLogo size="md" showSubtitle={false} />

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
            <a href="#overview" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Overview
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              How It Works
            </a>
            <a href="#jurisdictions" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Customs Standards
            </a>
          </nav>
        </div>
      </header>

      {/* Main Home Content */}
      <main className="flex-1">
        {/* Hero Section Split: Value Proposition on Left, Live Auth Portal on Right */}
        <section className="relative overflow-hidden pt-8 pb-16 lg:py-20 border-b border-slate-800/80">
          {/* Background Radial Glow */}
          <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Left Column: Brand Statement & Brief Capabilities */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Autonomous Cross-Border Logistics Compliance</span>
                  <span className="text-slate-600">/</span>
                  <span className="text-slate-400">Continuous Audit</span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.15] text-balance">
                  Stop Customs Fines & Border Holds Before Cargo Ships.
                </h1>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                  <strong>OmniScribe</strong> is an autonomous regulatory compliance agent that inspects commercial invoices, bills of lading, and dangerous goods declarations against real-time global customs statutes—instantly validating HS codes, duty surcharges, and hazardous cargo permits.
                </p>

                {/* 3 Core Value Props in very brief */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2">
                      <FileText className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-white mb-1">Autonomous Ingestion</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Instant multimodal extraction from PDF invoices, manifests, and shipping dockets.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-2">
                      <Hash className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-white mb-1">HS Code & Tariff Check</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Cross-checks 6–10 digit codes with CBP 19 CFR, EU TARIC, and TradeNet schedules.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-2">
                      <Scale className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-white mb-1">Discrepancy Defense</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Flags Section 301 duties, missing UN3480 DG test certificates, and CBAM holds.
                    </p>
                  </div>
                </div>

                {/* Active Global Customs Frameworks Pills */}
                <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
                  <span className="text-slate-500">Supported Authorities:</span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">USA (CBP 19 CFR)</span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">EU (TARIC & CBAM)</span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">Singapore (TradeNet)</span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">UAE (Mirsal II)</span>
                </div>
              </div>

              {/* Right Column: High-End Auth Portal Card */}
              <div className="lg:col-span-5">
                <div className="relative rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-7 shadow-2xl backdrop-blur-xl">
                  {/* Subtle Top Indicator */}
                  <div className="flex items-center justify-between pb-5 border-b border-slate-800/80 mb-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-white tracking-tight">Compliance Gateway</h2>
                        <p className="text-[11px] text-slate-400">Secure auditor authentication</p>
                      </div>
                    </div>

                    {/* Mode Selector Tabs */}
                    <div className="flex p-0.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('login');
                          setLoginError(null);
                        }}
                        className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                          authMode === 'login'
                            ? 'bg-slate-800 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Sign In
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('signup');
                          setSignupError(null);
                        }}
                        className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                          authMode === 'signup'
                            ? 'bg-slate-800 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Sign Up
                      </button>
                    </div>
                  </div>

                  {/* 1. LOGIN FORM */}
                  {authMode === 'login' && (
                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                      {loginError && (
                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                          <span>{loginError}</span>
                        </div>
                      )}

                      {/* Google Sign In (Firebase Authentication) */}
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await loginWithGoogle();
                          if (res.success) {
                            toast.success('Signed in with Google', 'Connected via Firebase Authentication.');
                          } else if (res.error) {
                            setLoginError(res.error);
                            toast.error('Google Sign In Error', res.error);
                          }
                        }}
                        disabled={isLoading}
                        className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-sm hover:shadow-md"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                        <span>Sign in with Google</span>
                      </button>

                      <div className="relative flex py-0.5 items-center">
                        <div className="flex-grow border-t border-slate-800"></div>
                        <span className="flex-shrink mx-3 text-[10px] uppercase font-mono text-slate-500">or email</span>
                        <div className="flex-grow border-t border-slate-800"></div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Work Email Address
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            required
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            placeholder="auditor@freight.com"
                            className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-medium text-slate-300">
                            Password
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setAuthMode('forgot');
                              setForgotEmail(loginEmail);
                            }}
                            className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                          >
                            Forgot password?
                          </button>
                        </div>
                        <div className="relative">
                          <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="Enter password"
                            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500/20"
                          />
                          <span>Keep me signed in</span>
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isLoading ? (
                          <span>Verifying credentials...</span>
                        ) : (
                          <>
                            <span>Access Compliance Agent</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      {/* Quick Demo Accounts for instant 1-click test drive */}
                      <div className="pt-4 border-t border-slate-800">
                        <span className="block text-[11px] font-mono text-slate-500 uppercase tracking-wider mb-2.5">
                          Instant Demo Sign In:
                        </span>
                        <div className="grid grid-cols-1 gap-2">
                          <button
                            type="button"
                            onClick={() => quickDemoLogin('compliance_officer')}
                            className="flex items-center justify-between p-2 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 text-left transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                                ER
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs font-semibold text-white block truncate">Elena Rostova</span>
                                <span className="text-[10px] text-slate-400 block truncate">Compliance Officer • Meridian Trade</span>
                              </div>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors shrink-0" />
                          </button>

                          <button
                            type="button"
                            onClick={() => quickDemoLogin('customs_broker')}
                            className="flex items-center justify-between p-2 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 text-left transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                                MC
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs font-semibold text-white block truncate">Marcus Chen</span>
                                <span className="text-[10px] text-slate-400 block truncate">Customs Broker • Pacific TradeNet</span>
                              </div>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors shrink-0" />
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  {/* 2. SIGN UP FORM */}
                  {authMode === 'signup' && (
                    <form onSubmit={handleSignupSubmit} className="space-y-3.5">
                      {signupError && (
                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                          <span>{signupError}</span>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Full Name
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            value={signupName}
                            onChange={(e) => setSignupName(e.target.value)}
                            placeholder="Captain James Vance"
                            className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Work Email
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            required
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            placeholder="james.vance@oceanfreight.com"
                            className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            Organization
                          </label>
                          <div className="relative">
                            <Building className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={signupCompany}
                              onChange={(e) => setSignupCompany(e.target.value)}
                              placeholder="Apex Freight Ltd"
                              className="w-full pl-8 pr-2 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            Role
                          </label>
                          <select
                            value={signupRole}
                            onChange={(e) => setSignupRole(e.target.value as any)}
                            className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
                          >
                            <option value="Logistics Compliance Officer">Compliance Officer</option>
                            <option value="Customs Broker">Customs Broker</option>
                            <option value="Supply Chain Director">Supply Chain Lead</option>
                            <option value="Auditor">Regulatory Auditor</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Password
                        </label>
                        <div className="relative">
                          <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            placeholder="Create secure password"
                            className="w-full pl-10 pr-10 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isLoading ? (
                          <span>Activating Account...</span>
                        ) : (
                          <>
                            <span>Create Account & Enter Agent</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => setAuthMode('login')}
                          className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                          Already have an account? <strong className="text-emerald-400">Sign in</strong>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* 3. FORGOT PASSWORD FORM */}
                  {authMode === 'forgot' && (
                    <form onSubmit={handleForgotSubmit} className="space-y-4">
                      <div>
                        <h3 className="text-xs font-bold text-white mb-1">Reset Account Password</h3>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Enter your verified business email address. A one-time security recovery token will be dispatched.
                        </p>
                      </div>

                      {forgotStatus && (
                        <div
                          className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                            forgotStatus.sent
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                          <span>{forgotStatus.message}</span>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Registered Email Address
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            required
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            placeholder="auditor@organization.com"
                            className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isLoading ? <span>Sending reset link...</span> : <span>Send Reset Instructions</span>}
                      </button>

                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => setAuthMode('login')}
                          className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                        >
                          ← Return to Sign In
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* High-Impact Visual Showcase: Operations Control Center */}
        <section id="overview" className="py-16 border-b border-slate-800/80 bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-8">
              <div>
                <span className="text-xs font-mono text-emerald-400 font-semibold block mb-1">
                  ENTERPRISE LOGISTICS INTELLIGENCE
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Continuous Compliance Across Ocean, Air & Border Crossings
                </h2>
              </div>
              <p className="text-xs text-slate-400 max-w-md">
                OmniScribe orchestrates continuous checks across tariffs, export control lists, dangerous goods regulations, and environmental directives before paperwork reaches customs officers.
              </p>
            </div>

            {/* Asymmetric Showcase Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Primary 16:9 Terminal View */}
              <div className="lg:col-span-8 relative rounded-3xl overflow-hidden border border-slate-800 group shadow-2xl bg-slate-900">
                <img
                  src="/src/assets/images/hero_logistics_terminal_1792247370534.jpg"
                  alt="OmniScribe Global Logistics Port Terminal Operations"
                  referrerPolicy="no-referrer"
                  className="w-full h-80 sm:h-96 object-cover object-center group-hover:scale-102 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-6 sm:p-8 flex flex-col justify-end">
                  <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest mb-1">
                    Port Terminal Telemetry & Clearance
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    Automated Green-Channel Customs Pre-Clearance
                  </h3>
                  <p className="text-xs text-slate-300 max-w-xl mt-1 leading-relaxed">
                    Connecting shippers, freight forwarders, and border agencies to eliminate demurrage fines, container holds, and regulatory misdeclarations.
                  </p>
                </div>
              </div>

              {/* Secondary Operations Center View */}
              <div className="lg:col-span-4 relative rounded-3xl overflow-hidden border border-slate-800 group shadow-2xl bg-slate-900 flex flex-col">
                <img
                  src="/src/assets/images/trade_customs_operations_1792247389517.jpg"
                  alt="Customs Compliance Operations Desk"
                  referrerPolicy="no-referrer"
                  className="w-full h-48 sm:h-52 object-cover object-center group-hover:scale-102 transition-transform duration-700"
                />
                <div className="p-5 flex-1 flex flex-col justify-between bg-slate-900/90">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 font-semibold block mb-1">
                      Auditor Console
                    </span>
                    <h4 className="text-sm font-bold text-white">
                      Document Focus Region Highlighting
                    </h4>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      Click directly on invoice dockets or bills of lading to tag specific items, HS codes, or Incoterms for targeted Gemini 3.8 Flash inspection.
                    </p>
                  </div>
                  <div className="pt-4 mt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono">Precision Inspection</span>
                    <span className="text-emerald-400 font-semibold">Sub-second Latency</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What It Does In Brief: 4-Step Pipeline */}
        <section id="how-it-works" className="py-16 border-b border-slate-800/80 bg-slate-900/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider block mb-1">
                SYSTEM WORKFLOW
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                How OmniScribe Audits Every Consignment
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2">
                Four automated stages guarantee every line item, tariff number, and hazardous cargo declaration is compliant before filing.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="font-mono text-xs text-slate-500 font-bold block mb-2">01. INGESTION</span>
                  <h3 className="text-sm font-bold text-white mb-1.5">Document OCR & Parsing</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Upload PDF invoices, scans, or text manifests. Multimodal models extract shipper, consignee, items, Incoterms, and values.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-900 text-[11px] font-mono text-emerald-400">
                  Multimodal Extraction
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="font-mono text-xs text-slate-500 font-bold block mb-2">02. HS CLASSIFICATION</span>
                  <h3 className="text-sm font-bold text-white mb-1.5">Tariff Verification</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Codes are cross-referenced with national tariff schedules (CBP HTSUS, EU TARIC, Singapore TradeNet) to detect misclassification.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-900 text-[11px] font-mono text-cyan-400">
                  6-10 Digit Matching
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="font-mono text-xs text-slate-500 font-bold block mb-2">03. REGULATORY CROSS-AUDIT</span>
                  <h3 className="text-sm font-bold text-white mb-1.5">Statute & Hazard Check</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Inspects hazardous materials (UN3480 Lithium cells, chemicals), Section 301 tariffs, dual-use export controls, and EU CBAM / EUDR.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-900 text-[11px] font-mono text-amber-400">
                  IMDG & EPA TSCA
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="font-mono text-xs text-slate-500 font-bold block mb-2">04. REMEDIATION & CERTIFICATE</span>
                  <h3 className="text-sm font-bold text-white mb-1.5">Exportable PDF Report</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Computes risk score 0–100, lists exact discrepancies with statutory references, and generates a formatted PDF audit certificate.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-900 text-[11px] font-mono text-emerald-400">
                  jsPDF Compliance Docket
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Global Customs Jurisdiction Frameworks */}
        <section id="jurisdictions" className="py-16 border-b border-slate-800/80 bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-10">
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider block mb-1">
                REGULATORY REPERTOIRE
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Grounded in Real International Customs Codes
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">United States</span>
                  <span className="text-[10px] font-mono text-emerald-400">CBP / ACE</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  19 CFR § 141.86 commercial invoice rules, Section 301 China tariff surcharges, EPA TSCA Section 13, and DOT HazMat UN3480.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">European Union</span>
                  <span className="text-[10px] font-mono text-cyan-400">TARIC / ICS2</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  UCC Regulation (EU) 952/2013, Carbon Border Adjustment (CBAM), EUDR Deforestation geolocations, and ICS2 safety declarations.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Singapore</span>
                  <span className="text-[10px] font-mono text-amber-400">TradeNet / HSA</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Customs Act 1960, Health Products Act 2007, SFA food clearance, and Strategic Goods Control Act (SGCA) dual-use transit.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">UAE & Gulf GCC</span>
                  <span className="text-[10px] font-mono text-indigo-400">Mirsal II</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  GCC Common Customs Law Decree 11/2002, MOIAT ECAS equipment conformity, and EOCN Non-Proliferation controls.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Clean Single-Zone Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <OmniScribeLogo size="sm" showSubtitle={false} />
            <span className="text-slate-600">|</span>
            <span>Autonomous Regulatory Compliance & Continuous Audit Agent</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
