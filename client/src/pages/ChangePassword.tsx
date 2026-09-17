import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthApiError } from "../api/auth.api";
import { useAuth } from "../context/AuthContext";

export default function ChangePassword() {
  const navigate = useNavigate();
  const { changePassword, role, mustChangePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time password policy validation criteria
  const hasMinLength = newPassword.length >= 8;
  const hasUpperAndLower = /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword);
  const hasNumberAndSymbol = /\d/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword);
  const isDifferentFromCurrent = currentPassword.length > 0 && newPassword !== currentPassword;
  const isAllComplexityMet = hasMinLength && hasUpperAndLower && hasNumberAndSymbol;

  const isConfirmed = confirmPassword.length > 0 && confirmPassword === newPassword;
  const isMismatch = confirmPassword.length > 0 && confirmPassword !== newPassword;

  const isSubmitDisabled =
    !currentPassword ||
    !isAllComplexityMet ||
    !isConfirmed ||
    (currentPassword.length > 0 && newPassword === currentPassword) ||
    isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (isSubmitDisabled) return;

    setIsSubmitting(true);

    try {
      await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      // Navigate to role landing page
      if (role === "REQUESTER") {
        navigate("/tickets", { replace: true });
      } else {
        navigate("/queue", { replace: true });
      }
    } catch (err) {
      if (err instanceof AuthApiError) {
        setErrorMessage(err.message || "Failed to change password. Please check your inputs.");
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="d-flex justify-content-center px-3 py-4 py-sm-5"
      style={{
        backgroundColor: "#F5F7F6",
        minHeight: "100vh",
      }}
    >
      <div
        className="card shadow-sm border-0 p-4 w-100 my-auto"
        style={{ maxWidth: 480, borderRadius: 12, backgroundColor: "#FFFFFF" }}
      >
        {/* Header */}
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center mb-2">
            <div
              className="rounded-circle p-2 d-flex align-items-center justify-content-center text-white"
              style={{ backgroundColor: "#006B3C", width: 44, height: 44 }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                style={{ width: 24, height: 24 }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                />
              </svg>
            </div>
          </div>
          <h1 className="h4 fw-bold text-dark mb-1">Change Your Password</h1>
          <p className="text-secondary small mb-0">
            {mustChangePassword
              ? "You must change your password to continue."
              : "Update your account password securely."}
          </p>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div
            className="alert alert-danger py-2 px-3 mb-3 small d-flex align-items-center gap-2"
            role="alert"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              style={{ width: 18, height: 18, flexShrink: 0 }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 8.25h.008v.008H12v-.008Z"
              />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Current Password Input */}
          <div className="mb-3">
            <label
              htmlFor="current-password"
              className="form-label small fw-semibold text-dark mb-1"
            >
              Current Password
            </label>
            <div className="input-group">
              <input
                id="current-password"
                type={showCurrentPassword ? "text" : "password"}
                className="form-control"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoFocus
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                tabIndex={-1}
                aria-label={showCurrentPassword ? "Hide password" : "Show password"}
              >
                {showCurrentPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* New Password Input */}
          <div className="mb-3">
            <label
              htmlFor="new-password"
              className="form-label small fw-semibold text-dark mb-1"
            >
              New Password
            </label>
            <div className="input-group">
              <input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                className="form-control"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowNewPassword(!showNewPassword)}
                tabIndex={-1}
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Real-time Checklist */}
          <div
            className="p-3 mb-3 rounded"
            style={{ backgroundColor: "#F0F4F2", border: "1px solid #D5DDD8" }}
          >
            <div className="small fw-semibold text-dark mb-2">Password Requirements:</div>
            <ul className="list-unstyled mb-0 small">
              <li
                className={`d-flex align-items-center gap-2 mb-1 ${
                  hasMinLength ? "text-success fw-medium" : "text-secondary"
                }`}
              >
                <span>{hasMinLength ? "✓" : "○"}</span>
                <span>At least 8 characters</span>
              </li>
              <li
                className={`d-flex align-items-center gap-2 mb-1 ${
                  hasUpperAndLower ? "text-success fw-medium" : "text-secondary"
                }`}
              >
                <span>{hasUpperAndLower ? "✓" : "○"}</span>
                <span>Include uppercase and lowercase letters</span>
              </li>
              <li
                className={`d-flex align-items-center gap-2 mb-1 ${
                  hasNumberAndSymbol ? "text-success fw-medium" : "text-secondary"
                }`}
              >
                <span>{hasNumberAndSymbol ? "✓" : "○"}</span>
                <span>Include a number and a special character</span>
              </li>
              {currentPassword.length > 0 && newPassword.length > 0 && !isDifferentFromCurrent && (
                <li className="d-flex align-items-center gap-2 text-danger">
                  <span>✗</span>
                  <span>New password must differ from current password</span>
                </li>
              )}
            </ul>
          </div>

          {/* Confirm New Password Input */}
          <div className="mb-4">
            <label
              htmlFor="confirm-password"
              className="form-label small fw-semibold text-dark mb-1"
            >
              Confirm New Password
            </label>
            <div className="input-group">
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                className={`form-control ${isMismatch ? "is-invalid" : ""}`}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
            {isMismatch && (
              <div className="text-danger small mt-1">Passwords do not match</div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn text-white w-100 fw-semibold py-2 d-flex align-items-center justify-content-center gap-2"
            style={{
              backgroundColor: isSubmitDisabled ? "#A3C9B8" : "#006B3C",
              borderColor: isSubmitDisabled ? "#A3C9B8" : "#006B3C",
              cursor: isSubmitDisabled ? "not-allowed" : "pointer",
            }}
            disabled={isSubmitDisabled}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                <span>Updating password...</span>
              </>
            ) : (
              "Continue"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
