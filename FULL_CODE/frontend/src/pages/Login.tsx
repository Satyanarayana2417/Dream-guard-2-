import { ArrowRight, KeyRound, Lock, Mail, Shield, User, UserPlus } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Alert } from "../components/ui";
import { DEMO_ACCOUNTS, getRoleHome, useAuth } from "../lib/auth";

const ROLE_OUTLINE: Record<string, string> = {
  admin: "border-[#1D5FA7] text-[#1D5FA7]",
  support: "border-amber-400 text-amber-700",
  analyst: "border-sky-400 text-sky-700",
  compliance: "border-purple-400 text-purple-700",
};

export default function LoginPage() {
  const { user, login, signup } = useAuth();
  const navigate = useNavigate();

  // Mode: "login" or "signup"
  const [mode, setMode] = useState<"login" | "signup">("login");

  // Login form state
  const [loginInput, setLoginInput] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form state
  const [signupUsername, setSignupUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupRole, setSignupRole] = useState("admin");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [activeRoleTab, setActiveRoleTab] = useState<string>("all");

  useEffect(() => {
    if (user) {
      navigate(getRoleHome(user.role), { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async (e?: FormEvent, u = loginInput, p = loginPassword) => {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await login(u, p);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed. Please verify credentials.");
    } finally {
      setBusy(false);
    }
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    if (!signupUsername.trim() || !signupEmail.trim() || !signupPassword) {
      setError("Please fill in all signup fields.");
      return;
    }
    if (signupPassword.length < 6) {
      setError("Firebase requires a password of at least 6 characters.");
      return;
    }
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await signup(signupUsername, signupEmail, signupPassword, signupRole);
      setSuccess("Account successfully created in Firebase! Redirecting...");
    } catch (err: any) {
      const msg = err?.message || "Registration failed";
      if (msg.includes("email-already-in-use")) {
        setError("This email is already registered. Please sign in or use a different email.");
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  const filteredDemoAccounts = DEMO_ACCOUNTS.filter(
    (a) => activeRoleTab === "all" || a.role === activeRoleTab
  );

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#F5F8FC] p-2.5 sm:p-6 md:p-8 overflow-x-hidden">
      {/* Background Decorative Radial Gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(29,95,167,0.12),transparent_70%)]" />

      {/* Main Split-Screen Container Card */}
      <div className="relative w-full max-w-[1080px] overflow-hidden rounded-2xl sm:rounded-3xl bg-white border border-[#DCE5F0] shadow-[0_20px_50px_-15px_rgba(18,59,103,0.18)] transition-all animate-fadein">
        <div className="flex flex-col lg:flex-row">
          {/* ================= LEFT PANEL: BLUE BRANDING ================= */}
          <div className="relative w-full lg:w-[48%] xl:w-[47%] bg-gradient-to-br from-[#123B67] via-[#1D5FA7] to-[#14477c] p-5 sm:p-8 lg:p-12 text-white flex flex-col justify-center items-center text-center overflow-hidden min-h-[220px] sm:min-h-[280px] lg:min-h-[620px]">
            <div className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-white/5 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-[#3478C8]/25 blur-2xl" />

            <div className="relative z-10 flex flex-col items-center justify-center space-y-3 sm:space-y-6 w-full max-w-[360px] my-auto">
              <div className="text-center">
                <span className="inline-block text-[11px] sm:text-xs font-semibold tracking-widest text-[#EAF2FB]/80 uppercase mb-0.5 sm:mb-1">
                  Welcome to
                </span>
                <h1 className="text-2xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-white leading-tight">
                  Dream Guard
                </h1>
                <p className="mt-1 text-xs text-[#EAF2FB]/80">
                  Smart Data Masking & Cloud Security
                </p>
              </div>

              {/* Logo */}
              <div className="flex items-center justify-center py-1 sm:py-2">
                <img
                  src="/dreamguard-brand.png"
                  alt="Dream Guard"
                  className="h-28 sm:h-44 lg:h-60 w-auto max-w-[180px] sm:max-w-[320px] object-contain drop-shadow-[0_20px_40px_rgba(18,59,103,0.5)] transition-transform hover:scale-105 duration-300"
                />
              </div>

              <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] text-[#EAF2FB]">
                <Shield className="h-3.5 w-3.5 text-sky-300" />
                <span>Powered by Firebase Auth & Cloudinary</span>
              </div>
            </div>

            {/* Desktop Scalloped Wave Boundary */}
            <div className="hidden lg:block absolute top-0 bottom-0 -right-[1px] h-full w-24 xl:w-28 pointer-events-none overflow-hidden z-20">
              <svg className="h-full w-full" viewBox="0 0 120 900" preserveAspectRatio="none" fill="none">
                <path
                  d="M 120 0 L 61 0 C 11 30.0, 11 120.0, 61 150 C -4 184.0, -4 286.0, 66 320 C 6 354.0, 6 456.0, 61 490 C -6 524.0, -6 626.0, 64 660 C 8 688.0, 8 772.0, 68 800 C -2 820.0, -2 880.0, 61 900 L 120 900 Z"
                  fill="#3478C8"
                  fillOpacity="0.35"
                />
                <path
                  d="M 120 0 L 73 0 C 23 30.0, 23 120.0, 73 150 C 8 184.0, 8 286.0, 78 320 C 18 354.0, 18 456.0, 73 490 C 6 524.0, 6 626.0, 76 660 C 20 688.0, 20 772.0, 80 800 C 10 820.0, 10 880.0, 73 900 L 120 900 Z"
                  fill="#EAF2FB"
                  fillOpacity="0.5"
                />
                <path
                  d="M 120 0 L 85 0 C 35 30.0, 35 120.0, 85 150 C 20 184.0, 20 286.0, 90 320 C 30 354.0, 30 456.0, 85 490 C 18 524.0, 18 626.0, 88 660 C 32 688.0, 32 772.0, 92 800 C 22 820.0, 22 880.0, 85 900 L 120 900 Z"
                  fill="#FFFFFF"
                />
              </svg>
            </div>
          </div>

          {/* ================= RIGHT PANEL: AUTH FORMS & IDENTITIES ================= */}
          <div className="w-full lg:w-[52%] xl:w-[53%] bg-white p-5 sm:p-8 lg:p-11 flex flex-col justify-center">
            <div className="max-w-[440px] w-full mx-auto space-y-4 sm:space-y-5">
              {/* Top Navigation Tabs: Sign In vs Create Account */}
              <div className="flex rounded-full border border-[#DCE5F0] bg-[#EEF3F9] p-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                    setSuccess(null);
                  }}
                  className={`flex-1 rounded-full py-1.5 text-xs font-semibold transition-all ${
                    mode === "login"
                      ? "bg-white text-[#123B67] shadow-sm"
                      : "text-[#64748B] hover:text-[#172B45]"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                    setSuccess(null);
                  }}
                  className={`flex-1 rounded-full py-1.5 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    mode === "signup"
                      ? "bg-white text-[#123B67] shadow-sm"
                      : "text-[#64748B] hover:text-[#172B45]"
                  }`}
                >
                  <UserPlus className="h-3.5 w-3.5 text-[#1D5FA7]" />
                  Create Account
                </button>
              </div>

              {/* Title & Subtitle */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172B45]">
                  {mode === "login" ? "Sign In to Workspace" : "Register with Firebase"}
                </h2>
                <p className="mt-1 text-xs text-[#64748B]">
                  {mode === "login"
                    ? "Enter your Firebase Email or Demo Username"
                    : "Creates account in Firebase Authentication & Firestore users collection"}
                </p>
              </div>

              {error && <Alert tone="error">{error}</Alert>}
              {success && <Alert tone="info">{success}</Alert>}

              {/* ================= LOGIN FORM ================= */}
              {mode === "login" && (
                <form onSubmit={handleLogin} className="space-y-3.5 sm:space-y-4">
                  <div>
                    <label
                      className="block text-[11px] font-bold tracking-wider text-[#172B45] uppercase mb-1.5 ml-2"
                      htmlFor="login-ident"
                    >
                      Email or Username
                    </label>
                    <div className="relative">
                      <input
                        id="login-ident"
                        className="w-full rounded-full border border-[#1D5FA7]/70 hover:border-[#1D5FA7] focus:border-[#1D5FA7] bg-white px-4 sm:px-5 py-2.5 pr-11 text-xs text-[#172B45] font-medium placeholder-[#64748B]/60 shadow-[0_0_10px_rgba(29,95,167,0.18)] focus:shadow-[0_0_16px_rgba(29,95,167,0.32)] focus:ring-2 focus:ring-[#1D5FA7]/20 outline-none transition-all"
                        value={loginInput}
                        onChange={(e) => setLoginInput(e.target.value)}
                        placeholder="e.g. your-email@example.com or admin_anita"
                        required
                      />
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-[#1D5FA7]">
                        <User className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      className="block text-[11px] font-bold tracking-wider text-[#172B45] uppercase mb-1.5 ml-2"
                      htmlFor="login-pass"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="login-pass"
                        type="password"
                        className="w-full rounded-full border border-[#1D5FA7]/70 hover:border-[#1D5FA7] focus:border-[#1D5FA7] bg-white px-4 sm:px-5 py-2.5 pr-11 text-xs text-[#172B45] font-medium placeholder-[#64748B]/60 shadow-[0_0_10px_rgba(29,95,167,0.18)] focus:shadow-[0_0_16px_rgba(29,95,167,0.32)] focus:ring-2 focus:ring-[#1D5FA7]/20 outline-none transition-all"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                      />
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-[#1D5FA7]">
                        <Lock className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full rounded-full bg-gradient-to-r from-[#123B67] via-[#1D5FA7] to-[#3478C8] hover:from-[#0f3054] hover:to-[#1D5FA7] py-2.5 px-6 text-xs font-semibold text-white shadow-md shadow-[#1D5FA7]/25 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {busy ? (
                      <span className="flex items-center gap-2">
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Authenticating...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        Sign In <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </button>
                </form>
              )}

              {/* ================= SIGNUP FORM ================= */}
              {mode === "signup" && (
                <form onSubmit={handleSignup} className="space-y-3.5 sm:space-y-4">
                  <div>
                    <label
                      className="block text-[11px] font-bold tracking-wider text-[#172B45] uppercase mb-1.5 ml-2"
                      htmlFor="su-username"
                    >
                      Username
                    </label>
                    <div className="relative">
                      <input
                        id="su-username"
                        className="w-full rounded-full border border-[#1D5FA7]/70 hover:border-[#1D5FA7] focus:border-[#1D5FA7] bg-white px-4 sm:px-5 py-2 text-xs text-[#172B45] font-medium placeholder-[#64748B]/60 shadow-[0_0_10px_rgba(29,95,167,0.18)] focus:ring-2 focus:ring-[#1D5FA7]/20 outline-none transition-all"
                        value={signupUsername}
                        onChange={(e) => setSignupUsername(e.target.value)}
                        placeholder="e.g. satya_admin"
                        required
                      />
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-[#1D5FA7]">
                        <User className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      className="block text-[11px] font-bold tracking-wider text-[#172B45] uppercase mb-1.5 ml-2"
                      htmlFor="su-email"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        id="su-email"
                        type="email"
                        className="w-full rounded-full border border-[#1D5FA7]/70 hover:border-[#1D5FA7] focus:border-[#1D5FA7] bg-white px-4 sm:px-5 py-2 text-xs text-[#172B45] font-medium placeholder-[#64748B]/60 shadow-[0_0_10px_rgba(29,95,167,0.18)] focus:ring-2 focus:ring-[#1D5FA7]/20 outline-none transition-all"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="e.g. user@example.com"
                        required
                      />
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-[#1D5FA7]">
                        <Mail className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      className="block text-[11px] font-bold tracking-wider text-[#172B45] uppercase mb-1.5 ml-2"
                      htmlFor="su-pass"
                    >
                      Password (min 6 characters)
                    </label>
                    <div className="relative">
                      <input
                        id="su-pass"
                        type="password"
                        className="w-full rounded-full border border-[#1D5FA7]/70 hover:border-[#1D5FA7] focus:border-[#1D5FA7] bg-white px-4 sm:px-5 py-2 text-xs text-[#172B45] font-medium placeholder-[#64748B]/60 shadow-[0_0_10px_rgba(29,95,167,0.18)] focus:ring-2 focus:ring-[#1D5FA7]/20 outline-none transition-all"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                      />
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-[#1D5FA7]">
                        <Lock className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      className="block text-[11px] font-bold tracking-wider text-[#172B45] uppercase mb-1.5 ml-2"
                      htmlFor="su-role"
                    >
                      Assigned Workspace Role
                    </label>
                    <select
                      id="su-role"
                      value={signupRole}
                      onChange={(e) => setSignupRole(e.target.value)}
                      className="w-full rounded-full border border-[#1D5FA7]/70 bg-white px-4 py-2 text-xs text-[#172B45] font-medium shadow-[0_0_10px_rgba(29,95,167,0.18)] outline-none"
                    >
                      <option value="admin">Administrator (Full Access & Masking)</option>
                      <option value="support">Customer Support (Masked PII)</option>
                      <option value="analyst">Data Analyst (Pseudonyms & Aggregates)</option>
                      <option value="compliance">Compliance Officer (Audit & Integrity)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-[#1D5FA7] hover:from-emerald-700 hover:to-[#123B67] py-2.5 px-6 text-xs font-semibold text-white shadow-md shadow-emerald-600/25 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {busy ? (
                      <span className="flex items-center gap-2">
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Creating Firebase User...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        Create Account in Firebase <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </button>
                </form>
              )}

              {/* Instant Demo Access Section */}
              <div className="border-t border-[#DCE5F0] pt-3.5 sm:pt-4 space-y-2.5 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-[#172B45]">
                    <KeyRound className="h-3.5 w-3.5 text-[#1D5FA7]" /> Instant Demo Access
                  </span>
                </div>

                <div className="flex gap-1 rounded-full border border-[#DCE5F0] bg-[#EEF3F9] p-1">
                  {[
                    { id: "admin", label: "Admin" },
                    { id: "support", label: "Support" },
                    { id: "analyst", label: "Analyst" },
                  ].map((t) => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setActiveRoleTab(activeRoleTab === t.id ? "all" : t.id)}
                      className={`flex-1 rounded-full py-1 text-[11px] font-medium transition-all ${
                        activeRoleTab === t.id
                          ? "bg-white text-[#123B67] shadow-sm font-bold"
                          : "text-[#64748B] hover:text-[#172B45]"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-2 pr-0.5">
                  {filteredDemoAccounts.map((a) => (
                    <button
                      type="button"
                      key={a.username}
                      disabled={busy}
                      onClick={() => {
                        setMode("login");
                        setLoginInput(a.username);
                        setLoginPassword(a.password);
                        handleLogin(undefined, a.username, a.password);
                      }}
                      className="flex min-h-[48px] w-full items-center justify-between gap-2 sm:gap-3 rounded-full border border-[#DCE5F0] bg-white px-3.5 sm:px-4 py-2 text-left transition-all hover:border-[#1D5FA7] hover:bg-[#F4F8FD] hover:shadow-[0_0_10px_rgba(29,95,167,0.18)] group cursor-pointer"
                    >
                      <div className="min-w-0 flex-1 pl-0.5">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-[12px] font-bold text-[#172B45] group-hover:text-[#1D5FA7] transition-colors leading-tight truncate">
                            {a.label}
                          </span>
                          <span className="font-mono text-[9.5px] text-[#64748B] shrink-0">
                            @{a.username}
                          </span>
                        </div>
                        <div className="truncate text-[10px] text-[#64748B]">{a.email}</div>
                      </div>
                      <div className="shrink-0 pr-0.5">
                        <span
                          className={`rounded-full border px-2 sm:px-2.5 py-0.5 text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider bg-transparent ${
                            ROLE_OUTLINE[a.role] ?? "border-[#1D5FA7] text-[#1D5FA7]"
                          }`}
                        >
                          {a.role}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
