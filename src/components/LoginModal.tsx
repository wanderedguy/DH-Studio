import React, { useState } from 'react';
import { X, Lock, Mail, UserCheck, ShieldAlert, KeyRound, Sparkles } from 'lucide-react';
import { User } from '../types';

interface LoginModalProps {
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  darkMode: boolean;
}

export default function LoginModal({
  onClose,
  onLoginSuccess,
  darkMode
}: LoginModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    const pathUrl = isSignUp ? "/api/auth/signup" : "/api/auth/login";
    const payload = isSignUp ? { name, email, password, phone } : { email, password };

    try {
      const res = await fetch(pathUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication procedure failed.");
      }

      onLoginSuccess(data.user);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Invalid credentials or email. Try customer@dh2studio.com (pass: customer) or admin@dh2studio.com (pass: admin) of current session.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 font-sans">
      <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs transition-opacity" onClick={onClose}></div>

      {/* Login Box */}
      <div className={`relative max-w-sm w-full rounded-2xl overflow-hidden shadow-2xl transition-all border p-6 ${
        darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-150 text-slate-800"
      }`}>
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-800/15 dark:hover:bg-slate-800 text-slate-400">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 mb-5">
          <div className="w-12 h-12 rounded-xl overflow-hidden shadow-md mx-auto border border-amber-500">
            <img 
              src="https://i.ibb.co/6Jc30YhF/Whats-App-Image-2026-05-28-at-4-41-10-PM.jpg" 
              alt="DH² Logo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <h3 className="text-lg font-black tracking-tight uppercase bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-500">
            {isSignUp ? "Join DH² Studio" : "Define Your Identity"}
          </h3>
          <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
            WEAR YOUR IDENTITY &bull; SECURE WORKSPACE
          </p>
        </div>

        {errorMessage && (
          <div className="p-2.5 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-lg text-[10px] font-sans flex items-start gap-2 mb-4 leading-relaxed">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isSignUp && (
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-405 block mb-1">Your Full Name</label>
              <input
                type="text"
                required
                className={`w-full p-2.5 rounded-xl text-xs focus:outline-hidden border ${
                  darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                }`}
                placeholder="E.g. Harish Dynamo"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-405 block mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                className={`w-full p-2.5 pl-9 rounded-xl text-xs focus:outline-hidden border ${
                  darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                }`}
                placeholder="E.g. customer@dh2studio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Mail className="absolute left-3 top-3.5 w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-450 block mb-1">Secret Password</label>
            <div className="relative">
              <input
                type="password"
                required
                className={`w-full p-2.5 pl-9 rounded-xl text-xs focus:outline-hidden border ${
                  darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                }`}
                placeholder={isSignUp ? "Create a secret password" : "Enter account password (e.g. customer)"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <KeyRound className="absolute left-3 top-3.5 w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          {isSignUp && (
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-405 block mb-1">Mobile Telephone (Optional)</label>
              <input
                type="tel"
                pattern="[0-9]{10}"
                className={`w-full p-2.5 rounded-xl text-xs focus:outline-hidden border ${
                  darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                }`}
                placeholder="10-Digit Mobile Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          )}

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-blue-500 text-slate-900 text-xs font-black rounded-xl text-center shadow-lg transform active:scale-97 transition-all disabled:opacity-50 uppercase tracking-wider"
          >
            {isSubmitting ? "Authenticating..." : isSignUp ? "Build Account Identity" : "Verify & Sign In"}
          </button>
        </form>

        {/* Guest sign in accounts tips */}
        {!isSignUp && (
          <div className="mt-4 p-2 bg-slate-950/40 rounded-xl border border-slate-850 text-[10px] text-slate-400 space-y-1 font-mono hover:border-amber-500/25 transition-colors">
            <span className="font-bold text-slate-300 block">✨ SESSION DEMO ACCOUNTS:</span>
            <div className="flex justify-between">
              <span>Customer: customer@dh2studio.com</span>
              <span className="font-bold text-amber-500">pass: customer</span>
            </div>
            <div className="flex justify-between border-t border-slate-900 pt-1">
              <span>Store Admin: admin@dh2studio.com</span>
              <span className="font-bold text-amber-500">pass: admin</span>
            </div>
          </div>
        )}

        <hr className="my-4 border-slate-700/20" />

        <div className="text-center">
          <button
            id="auth-toggle-btn"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMessage("");
            }}
            className="text-xs hover:underline text-amber-500 font-sans font-semibold"
          >
            {isSignUp ? "Already registered? Sign In instead" : "Create new DH² Studio customer account"}
          </button>
        </div>

      </div>
    </div>
  );
}
