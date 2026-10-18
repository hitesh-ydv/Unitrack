import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShieldAlert } from "lucide-react";

/**
 * ProtectedRoute component
 * Checks client-side authentication and role permission.
 *
 * ARCHITECTURAL NOTICE:
 * Client-side route protection enhances UI/UX by hiding inaccessible screens,
 * but real zero-trust security and data isolation MUST be strictly validated
 * and enforced by the backend API on every request using JWT/OAuth2 and database scopes.
 */
export const ProtectedRoute = ({ requiredPermission }) => {
  const { isAuthenticated, hasPermission, currentUser } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-slate-900/60 border border-slate-800 rounded-3xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
        <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
          Your current assigned role (
          <span className="text-indigo-400 font-semibold">{currentUser.role}</span>) does not
          have the <span className="text-rose-400 font-mono text-[11px] font-semibold">{requiredPermission}</span> permission.
          You can change your demo role using the top-right profile dropdown.
        </p>
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-500 max-w-md text-left">
          <strong>Security Note:</strong> Backend API routes must independently verify user tokens
          and deny unauthorized RPC/REST endpoints regardless of UI routing state.
        </div>
      </div>
    );
  }

  return <Outlet />;
};
