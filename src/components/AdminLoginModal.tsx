import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, X, AlertCircle, KeyRound, Sparkles, LogIn } from 'lucide-react';
import { auth, isOwnerEmail } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updatePassword,
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut 
} from 'firebase/auth';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export function AdminLoginModal({ isOpen, onClose, onLoginSuccess }: AdminLoginModalProps) {
  const [email, setEmail] = useState('satyam000108@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setIsSubmitting(true);
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      const userEmail = userCredential.user.email;
      
      if (!isOwnerEmail(userEmail)) {
        await signOut(auth);
        setErrorMsg('Access Denied: Only Satyam has authorized admin credentials.');
        setIsSubmitting(false);
        return;
      }

      // Automatically attempt to upgrade/set password to SA123456789t@ for upcoming passcode usage
      try {
        if (auth.currentUser) {
          await updatePassword(auth.currentUser, 'SA123456789t@');
          console.log('Successfully aligned under-the-hood password to SA123456789t@!');
        }
      } catch (passErr) {
        console.warn('Silent passcode update failed (usually requires fresh auth), continuing session:', passErr);
      }

      setIsSubmitting(false);
      onLoginSuccess();
    } catch (err: any) {
      console.error('Google login login failed:', err);
      setErrorMsg(err.message || 'Google account verification failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    const sanitizedEmail = email.trim();
    const sanitizedPass = password.trim();

    if (!isOwnerEmail(sanitizedEmail)) {
      setErrorMsg('Access Denied: This email address is not authorized for Admin Panel access.');
      setIsSubmitting(false);
      return;
    }

    if (sanitizedPass.length < 6) {
      setErrorMsg('Passcode must be at least 6 characters long.');
      setIsSubmitting(false);
      return;
    }

    // Try his entered passcode first. If he typed SA123456789t@ and it fails (e.g. invalid credential/wrong-password),
    // fallback to Satyam@2026 to see if we should upgrade under the hood.
    const passwordsToTry = [sanitizedPass];
    if (sanitizedPass === 'SA123456789t@') {
      passwordsToTry.push('Satyam@2026');
    }

    let loginSuccess = false;
    let successfulPassUsed = '';
    let lastError: any = null;

    for (const passAttempt of passwordsToTry) {
      try {
        await signInWithEmailAndPassword(auth, sanitizedEmail, passAttempt);
        loginSuccess = true;
        successfulPassUsed = passAttempt;
        break;
      } catch (err: any) {
        lastError = err;
      }
    }

    if (loginSuccess) {
      // If we authenticated through the fallback legacy password Satyam@2026, upgrade it immediately
      if (successfulPassUsed === 'Satyam@2026' && sanitizedPass === 'SA123456789t@' && auth.currentUser) {
        try {
          await updatePassword(auth.currentUser, 'SA123456789t@');
          console.log('Successfully upgraded user passcode to SA123456789t@ in Firebase Auth!');
        } catch (upgradeErr) {
          console.warn('Silent passcode upgrade failed, but authenticated session is active:', upgradeErr);
        }
      }
      setIsSubmitting(false);
      onLoginSuccess();
      return;
    }

    // If both failed, handle auto-registration if account does not exist or has an invalid registration status
    if (lastError) {
      console.log('SignIn fails. Code:', lastError.code, 'Msg:', lastError.message);
      
      const isNewUser = 
        lastError.code === 'auth/user-not-found' || 
        lastError.code === 'auth/invalid-credential' || 
        lastError.code === 'auth/invalid-email' ||
        String(lastError.message).toLowerCase().includes('user-not-found') ||
        String(lastError.message).toLowerCase().includes('invalid');

      if (isNewUser) {
        try {
          await createUserWithEmailAndPassword(auth, sanitizedEmail, sanitizedPass);
          setIsSubmitting(false);
          onLoginSuccess();
          return;
        } catch (regErr: any) {
          console.error('Auto-registration failed:', regErr);
          if (regErr.code === 'auth/email-already-in-use') {
            setErrorMsg('Incorrect passcode. Please double check and try again.');
          } else {
            setErrorMsg(regErr.message || 'Passcode authentication failed.');
          }
          setIsSubmitting(false);
          return;
        }
      }

      setErrorMsg('Incorrect passcode. Please double check and try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div 
        className="w-full max-w-md p-8 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl relative overflow-hidden"
        id="admin-login-dialog"
      >
        {/* Absolute branding lines */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-rose-500 via-pink-400 to-indigo-500" />
        
        {/* Floating background design ornaments */}
        <div className="absolute -top-12 -right-12 text-rose-500/10 pointer-events-none select-none">
          <KeyRound className="w-32 h-32" />
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-500 hover:text-rose-500 hover:scale-105 transition"
          title="Return to surprise story"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 mb-6">
          <div className="mx-auto w-12 h-12 bg-rose-950/20 rounded-2xl flex items-center justify-center text-rose-500 border border-rose-500/20 animate-pulse">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-rose-150 font-serif">
            Creator Mode Authentication
          </h2>
          <p className="text-xs text-neutral-400 max-w-[280px] mx-auto leading-relaxed">
            Only the surprise creator (<span className="font-semibold text-rose-400">Satyam</span>) is authorized to log in & publish additions.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 mb-5 bg-red-950/30 text-red-400 border border-red-900/40 rounded-xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4.5 h-4.5 shrink-0 text-red-400" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmitPassword} className="space-y-5 relative z-10">
          {/* Email Field - Display Only for Streamlining */}
          <div className="space-y-1.5 pointer-events-none opacity-80">
            <label className="text-[10px] font-mono tracking-widest uppercase text-neutral-500 font-bold block">
              Creator Authorized Email
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                disabled
                value={email}
                className="w-full text-xs py-3 pl-10 pr-4 rounded-xl border border-neutral-800 bg-neutral-950/40 text-neutral-400 select-none"
              />
            </div>
          </div>

          {/* Passcode Field */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-mono tracking-widest uppercase text-neutral-400 font-semibold block">
                Secure Passcode
              </label>
            </div>
            
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter passcode"
                className="w-full text-xs py-3 pl-10 pr-12 rounded-xl border border-neutral-800 bg-neutral-950 focus:outline-none focus:ring-1 focus:ring-rose-500/30 text-white placeholder-neutral-600 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-neutral-500 hover:text-neutral-300"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-gradient-to-r from-rose-500 via-pink-600 to-indigo-650 hover:shadow-lg active:scale-[0.98] text-white rounded-xl text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 transition duration-200 disabled:opacity-75 disabled:cursor-not-allowed select-none shadow-md hover:brightness-110"
          >
            <LogIn className="w-4 h-4" />
            {isSubmitting ? 'Authenticating...' : 'Unlock with Passcode'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-5">
          <div className="flex-1 border-t border-neutral-800/80" />
          <span className="px-3 text-[9px] text-neutral-500 font-mono tracking-widest uppercase">OR</span>
          <div className="flex-1 border-t border-neutral-800/80" />
        </div>

        {/* 1-Click Google Sign-In */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isSubmitting}
          className="w-full py-3.5 bg-neutral-950 border border-neutral-800/80 hover:bg-neutral-900 active:scale-[0.98] text-white rounded-xl text-xs font-semibold tracking-wider flex items-center justify-center gap-2.5 transition duration-200 disabled:opacity-75 select-none hover:border-rose-500/30"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span>Unlock with Google Profile</span>
        </button>

        <div className="text-[10px] text-center text-neutral-500 mt-6 font-mono leading-relaxed select-none flex items-center justify-center gap-1.5">
          <Sparkles className="w-3 h-3 text-rose-500 animate-pulse" />
          <span>Active additions auto-stage to persistent Firestore database.</span>
        </div>
      </div>
    </div>
  );
}
