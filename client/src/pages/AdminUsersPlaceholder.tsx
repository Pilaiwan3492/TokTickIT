import React from "react";

export default function AdminUsersPlaceholder() {
  return (
    <main className="container py-5" style={{ maxWidth: 760 }}>
      <div className="card shadow-sm border-0 p-4" style={{ borderRadius: 12 }}>
        <h1 className="h4 fw-bold mb-2">
          User Management <span className="badge bg-secondary ms-2 small fw-normal">Upcoming Feature</span>
        </h1>
        <p className="text-secondary mb-3">
          The Administrator User Management screen with account creation, role assignment, and safety guardrails is scheduled for implementation in Issue 28.
        </p>
        <div className="alert alert-success py-2 small mb-0" style={{ backgroundColor: "#EAF6EF", borderColor: "#B2DFDB", color: "#006B3C" }}>
          Authenticated Administrator access verified.
        </div>
      </div>
    </main>
  );
}
