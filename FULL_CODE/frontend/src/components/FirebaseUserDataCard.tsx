import { Copy, Check, Flame, Shield, User, Clock, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db, fetchUserData, type FirebaseUserData } from "../lib/firebase";
import { useAuth } from "../lib/auth";
import { RoleChip } from "./Layout";

export default function FirebaseUserDataCard() {
  const { user } = useAuth();
  const [firebaseData, setFirebaseData] = useState<FirebaseUserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [ruleNotice, setRuleNotice] = useState(false);

  const uid = user?.firebaseUid || user?.id;

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    // Real-time listener for this specific user's document in Firestore "users" collection
    try {
      const unsub = onSnapshot(
        doc(db, "users", uid),
        (snap) => {
          if (snap.exists()) {
            setFirebaseData(snap.data() as FirebaseUserData);
            setRuleNotice(false);
          } else {
            // Document might still be syncing, fallback to fetchUserData
            fetchUserData(uid)
              .then((data) => {
                if (data) setFirebaseData(data);
              })
              .catch(() => {});
          }
          setLoading(false);
        },
        (err) => {
          console.warn("Firestore snapshot notice:", err);
          setRuleNotice(true);
          setLoading(false);
        }
      );
      return () => unsub();
    } catch (err) {
      console.warn("Firestore listener initialization:", err);
      setRuleNotice(true);
      setLoading(false);
    }
  }, [uid]);

  if (!user) return null;

  const displayUid = firebaseData?.uid || uid || "N/A";
  const displayEmail = firebaseData?.email || user.email || `${user.username}@dreamguard.com`;
  const displayUsername = firebaseData?.username || user.username;
  const displayRole = firebaseData?.role || user.role;
  const displayCreatedAt = firebaseData?.createdAt
    ? new Date(firebaseData.createdAt).toLocaleString()
    : "Just now";
  const displayLastLogin = firebaseData?.lastLogin
    ? new Date(firebaseData.lastLogin).toLocaleString()
    : "Active session";

  const handleCopy = () => {
    if (displayUid && displayUid !== "N/A") {
      navigator.clipboard.writeText(displayUid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mb-6 rounded-2xl border border-[#DCE5F0] bg-gradient-to-r from-white via-[#F8FAFD] to-[#EEF5FC] p-4 sm:p-5 shadow-sm transition-all">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#DCE5F0]/80 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#123B67] to-[#1D5FA7] text-white shadow-md shadow-[#1D5FA7]/20">
            <Flame className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#172B45]">
                Firebase Authenticated Account
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                <Check className="h-3 w-3" /> Live Firebase Profile
              </span>
            </div>
            <p className="text-xs text-[#64748B]">
              Data fetched strictly for current logged-in identity from Firebase Auth & Firestore{" "}
              <span className="font-mono text-[#1D5FA7]">users</span> collection
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <RoleChip role={displayRole} />
        </div>
      </div>

      {ruleNotice && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/80 px-3.5 py-2 text-xs text-amber-900">
          <span className="font-semibold">Note on Firestore Rules:</span> If your Firebase Firestore rules are in default locked mode, go to{" "}
          <strong className="underline">Firebase Console → Firestore Database → Rules</strong> and set{" "}
          <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono text-[11px]">allow read, write: if true;</code> then click <strong>Publish</strong> to enable full collection synchronization.
        </div>
      )}

      {/* Grid of User Firebase Data */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs">
        {/* Firebase UID */}
        <div className="rounded-xl border border-[#DCE5F0] bg-white p-3 shadow-xs">
          <div className="flex items-center justify-between text-[#64748B] mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1">
              <Shield className="h-3.5 w-3.5 text-[#1D5FA7]" /> Firebase User ID (UID)
            </span>
            <button
              onClick={handleCopy}
              className="text-[#64748B] hover:text-[#1D5FA7] transition-colors"
              title="Copy UID"
              type="button"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
          <div className="font-mono text-[11px] font-bold text-[#172B45] truncate" title={displayUid}>
            {loading ? "Loading..." : displayUid}
          </div>
        </div>

        {/* Username */}
        <div className="rounded-xl border border-[#DCE5F0] bg-white p-3 shadow-xs">
          <span className="font-semibold uppercase tracking-wider text-[10px] text-[#64748B] mb-1 flex items-center gap-1">
            <User className="h-3.5 w-3.5 text-[#1D5FA7]" /> Username
          </span>
          <div className="text-[12px] font-bold text-[#172B45] truncate">
            {displayUsername}
          </div>
          <div className="text-[10px] text-[#64748B]">Firestore doc: @{displayUsername}</div>
        </div>

        {/* Email Address */}
        <div className="rounded-xl border border-[#DCE5F0] bg-white p-3 shadow-xs">
          <span className="font-semibold uppercase tracking-wider text-[10px] text-[#64748B] mb-1 flex items-center gap-1">
            <Mail className="h-3.5 w-3.5 text-[#1D5FA7]" /> Firebase Email
          </span>
          <div className="text-[12px] font-bold text-[#172B45] truncate" title={displayEmail}>
            {displayEmail}
          </div>
          <div className="text-[10px] text-emerald-700 font-medium">Firebase Auth Provider: Password</div>
        </div>

        {/* Timestamps */}
        <div className="rounded-xl border border-[#DCE5F0] bg-white p-3 shadow-xs">
          <span className="font-semibold uppercase tracking-wider text-[10px] text-[#64748B] mb-1 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-[#1D5FA7]" /> Firestore Timestamps
          </span>
          <div className="text-[11px] font-medium text-[#172B45] truncate">
            Last Login: {displayLastLogin}
          </div>
          <div className="text-[10px] text-[#64748B] truncate">
            Created: {displayCreatedAt}
          </div>
        </div>
      </div>
    </div>
  );
}
