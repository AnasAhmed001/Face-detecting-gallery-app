import { createContext, useContext, useEffect, useState } from "react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [role, setRole] = useState(() => localStorage.getItem("role"));
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
      return null;
    }
  });
  const [userId, setUserId] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.id || parsed?._id || parsed?.uid || null;
    } catch {
      return null;
    }
  });

  const setAuth = ({ role: newRole, user: newUser, token }) => {
    try {
      if (newRole) {
        localStorage.setItem("role", newRole);
        setRole(newRole);
      }
      if (newUser) {
        localStorage.setItem("user", JSON.stringify(newUser));
        setUser(newUser);
        const id = newUser?.id || newUser?._id || newUser?.uid || null;
        setUserId(id);
      }
      if (token) {
        localStorage.setItem("token", token);
      }
    } catch (e) {
      console.error("Failed to set auth in localStorage", e);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem("role");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch {}
    setRole(null);
    setUser(null);
    setUserId(null);
  };

  return (
    <UserContext.Provider value={{ user, role, userId, setAuth, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);
