import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError, api } from "./api";
import { authenticateWithFirebase, fetchUserData, signupWithFirebase, auth } from "./firebase";

export type User = {
  id: string;
  username: string;
  display_name: string;
  role: string;
  permissions: string[];
  email?: string;
  firebaseUid?: string;
  createdAt?: string;
};

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (
    usernameOrEmail: string,
    emailOrPassword?: string,
    possiblePassword?: string,
    role?: string
  ) => Promise<void>;
  signup: (username: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  can: (perm: string) => boolean;
  refresh: () => Promise<void>;
};

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    "admin:users",
    "audit:read",
    "classification:review",
    "connection:create",
    "connection:delete",
    "connection:edit",
    "connection:test",
    "integrity:run",
    "policy:create",
    "policy:delete",
    "policy:edit",
    "policy:review",
    "query:break_glass",
    "query:execute",
    "scan:run",
    "upload:import",
  ],
  support: ["query:execute"],
  analyst: ["query:execute"],
  compliance: [
    "query:execute",
    "audit:read",
    "scan:run",
    "classification:review",
    "integrity:run",
  ],
};

const ROLE_DEMO_CREDENTIALS: Record<string, { username: string; password: string }> = {
  admin: { username: "admin_anita", password: "Admin@2026!" },
  support: { username: "support_ravi", password: "Support@2026!" },
  analyst: { username: "analyst_kavya", password: "Analyst@2026!" },
  compliance: { username: "compliance_lata", password: "Compliance@2026!" },
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();

  const refresh = useCallback(async () => {
    try {
      if (typeof localStorage !== "undefined") {
        const storedFb = localStorage.getItem("sm_firebase_user");
        if (storedFb) {
          try {
            const parsed = JSON.parse(storedFb) as User;
            if (parsed.firebaseUid) {
              try {
                const freshDoc = await fetchUserData(parsed.firebaseUid);
                if (freshDoc) {
                  parsed.username = freshDoc.username || parsed.username;
                  parsed.email = freshDoc.email || parsed.email;
                  parsed.role = freshDoc.role || parsed.role;
                  parsed.createdAt = freshDoc.createdAt || parsed.createdAt;
                }
              } catch {
                /* ignore */
              }
            }
            setUser(parsed);
            return;
          } catch {
            localStorage.removeItem("sm_firebase_user");
          }
        }
      }
      const r = await api<{ user: User }>("/api/auth/me");
      setUser(r.user);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        if (typeof localStorage !== "undefined") {
          localStorage.removeItem("sm_token");
          localStorage.removeItem("sm_firebase_user");
        }
        setUser(null);
      } else {
        throw e;
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh().catch(() => setLoading(false));
  }, [refresh]);

  const login = async (
    usernameOrEmail: string,
    emailOrPassword?: string,
    possiblePassword?: string,
    role?: string
  ) => {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("sm_token");
      localStorage.removeItem("sm_firebase_user");
    }

    let username = "";
    let email = "";
    let password = "";
    let userRole = role || "admin";

    if (possiblePassword !== undefined) {
      // Invoked with (username, email, password, role?)
      username = usernameOrEmail.trim();
      email = (emailOrPassword || "").trim();
      password = possiblePassword;
    } else {
      // Invoked with (usernameOrEmail, password)
      const input = usernameOrEmail.trim();
      password = emailOrPassword || "";
      if (input.includes("@")) {
        email = input;
        username = input.split("@")[0];
      } else {
        username = input;
        const demo = DEMO_ACCOUNTS.find((d) => d.username.toLowerCase() === input.toLowerCase());
        email = demo ? demo.email : `${input}@dreamguard.com`;
        if (demo) userRole = demo.role;
      }
    }

    // Authenticate / register user with Firebase Authentication and record in Firestore "users" collection
    const fbUserData = await authenticateWithFirebase(username, email, password, userRole);

    // Synchronize backend session for SQL data masking and DB connectivity
    const backendCred = ROLE_DEMO_CREDENTIALS[fbUserData.role] || ROLE_DEMO_CREDENTIALS.admin;
    try {
      const r = await api<{ user: User; token?: string }>("/api/auth/login", {
        body: { username: backendCred.username, password: backendCred.password, mode: "cookie" },
      });
      if (r.token && typeof localStorage !== "undefined") {
        localStorage.setItem("sm_token", r.token);
      }
    } catch (err) {
      console.warn("Backend session synchronization notice:", err);
    }

    const activeUser: User = {
      id: fbUserData.uid,
      username: fbUserData.username,
      display_name: `${fbUserData.username} (${fbUserData.role})`,
      role: fbUserData.role,
      email: fbUserData.email,
      firebaseUid: fbUserData.uid,
      createdAt: fbUserData.createdAt,
      permissions: ROLE_PERMISSIONS[fbUserData.role] || ROLE_PERMISSIONS.admin,
    };

    if (typeof localStorage !== "undefined") {
      localStorage.setItem("sm_firebase_user", JSON.stringify(activeUser));
    }
    qc.clear();
    setUser(activeUser);
  };

  const signup = async (
    username: string,
    email: string,
    password: string,
    role: string = "admin"
  ) => {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("sm_token");
      localStorage.removeItem("sm_firebase_user");
    }

    const fbUser = await signupWithFirebase(username, email, password, role);

    // Link backend role session so DB queries function with the user's selected role
    const backendCred = ROLE_DEMO_CREDENTIALS[role] || ROLE_DEMO_CREDENTIALS.admin;
    try {
      const r = await api<{ user: User; token?: string }>("/api/auth/login", {
        body: { username: backendCred.username, password: backendCred.password, mode: "cookie" },
      });
      if (r.token && typeof localStorage !== "undefined") {
        localStorage.setItem("sm_token", r.token);
      }
    } catch (err) {
      console.warn("Backend link session notice:", err);
    }

    const activeUser: User = {
      id: fbUser.uid,
      username: fbUser.username,
      display_name: `${fbUser.username} (${fbUser.role})`,
      role: fbUser.role,
      email: fbUser.email,
      firebaseUid: fbUser.uid,
      createdAt: fbUser.createdAt,
      permissions: ROLE_PERMISSIONS[fbUser.role] || ROLE_PERMISSIONS.admin,
    };

    if (typeof localStorage !== "undefined") {
      localStorage.setItem("sm_firebase_user", JSON.stringify(activeUser));
    }
    qc.clear();
    setUser(activeUser);
  };

  const logout = async () => {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    } finally {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem("sm_token");
        localStorage.removeItem("sm_firebase_user");
      }
      try {
        await auth.signOut();
      } catch {
        /* ignore */
      }
      qc.clear();
      setUser(null);
    }
  };

  const can = (perm: string) => !!user?.permissions.includes(perm);

  return (
    <Ctx.Provider value={{ user, loading, login, signup, logout, can, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth outside provider");
  return v;
}

export function getRoleHome(role?: string): string {
  switch (role) {
    case "support":
      return "/support/overview";
    case "analyst":
      return "/analyst/overview";
    case "compliance":
      return "/admin/overview";
    case "admin":
    default:
      return "/admin/overview";
  }
}

// Official sample users from the B1 dataset (data/users.csv) + Compliance Officer.
// Demo-only passwords (one per role) - local demonstration environment only.
export const DEMO_ACCOUNTS = [
  // Admin Identities
  {
    username: "admin_anita",
    password: "Admin@2026!",
    role: "admin",
    label: "Anita Rao (Admin)",
    email: "admin_anita@dreamguard.com",
  },

  // Support Identities
  {
    username: "support_ravi",
    password: "Support@2026!",
    role: "support",
    label: "Ravi Kumar (Support)",
    email: "support_ravi@dreamguard.com",
  },

  // Analyst Identities
  {
    username: "analyst_kavya",
    password: "Analyst@2026!",
    role: "analyst",
    label: "Kavya Hegde (Analyst)",
    email: "analyst_kavya@dreamguard.com",
  },

  // Compliance Identities
  {
    username: "compliance_lata",
    password: "Compliance@2026!",
    role: "compliance",
    label: "Lata S (Compliance)",
    email: "compliance_lata@dreamguard.com",
  },
];
