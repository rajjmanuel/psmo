"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type AuthUser = {
  id: number;
  username: string;
  name: string;
  role: string;
};

const GUEST_USER: AuthUser = { id: 0, username: "guest", name: "PSMO Staff", role: "staff" };

type AuthContextValue = {
  user: AuthUser;
  setUser: (user: AuthUser) => void;
};

const AuthContext = createContext<AuthContextValue>({
  user: GUEST_USER,
  setUser: () => {},
});

export function AuthProvider({
  user,
  children,
}: {
  user: AuthUser;
  children: ReactNode;
}) {
  // Held in state (not just a static prop) so the profile can be updated
  // live — e.g. right after an admin edits their own full name — without
  // needing to log out and log back in.
  const [currentUser, setCurrentUser] = useState<AuthUser>(user);

  return (
    <AuthContext.Provider value={{ user: currentUser, setUser: setCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthUser {
  return useContext(AuthContext).user;
}

/** Returns a setter to update the signed-in user's profile in real time. */
export function useAuthUpdater(): (user: AuthUser) => void {
  return useContext(AuthContext).setUser;
}

export function roleLabel(role: string) {
  const labels: Record<string, string> = {
    admin: "PSMO Admin",
    staff: "PSMO Staff",
    amt: "AMT Officer",
    ssmt: "SSMT Officer",
    accounting: "Accounting",
  };
  return labels[role] ?? role;
}
