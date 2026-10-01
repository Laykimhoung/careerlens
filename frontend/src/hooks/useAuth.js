import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

/**
 * useAuth — consumes the AuthContext.
 *
 * Returns:
 *  - user           : current user object (or null)
 *  - token          : current JWT access token (or null)
 *  - loading        : true while an auth request is in-flight
 *  - error          : last auth error message (or null)
 *  - isAuthenticated: true if user is logged in with a token
 *  - isCandidate    : true if logged-in user has role "candidate"
 *  - isCompany      : true if logged-in user has role "company"
 *  - isAdmin        : true if logged-in user has role "admin"
 *  - login()        : async fn — accepts { email, password }
 *  - register()     : async fn — accepts registration form data
 *  - logout()       : async fn — clears session
 *  - clearError()   : clears the current error message
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an <AuthProvider>.");
  }

  return context;
};