import React from "react";
import { Link } from "react-router-dom";
import { useRequester } from "../context/RequesterContext";

interface Props {
  onChangeRequester: () => void;
}

export const Header: React.FC<Props> = ({ onChangeRequester }) => {
  const { selectedRequester } = useRequester();

  return (
    <header style={{ backgroundColor: "#006B3C" }} className="text-white py-2 px-4 shadow-sm">
      <div className="container-fluid d-flex align-items-center justify-content-between">
        {/* Left Side: Brand Logo & Navigation */}
        <div className="d-flex align-items-center gap-4">
          <Link to="/tickets" className="d-flex align-items-center gap-2 fw-bold fs-5 text-white text-decoration-none">
            {/* Clock Icon (Heroicons) */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 22, height: 22 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span>TokTickIT</span>
          </Link>
          
          <nav className="d-flex align-items-center gap-3">
            <Link to="/tickets" className="text-white text-decoration-none small fw-medium opacity-90 d-flex align-items-center gap-1">
              {/* Ticket Icon (Heroicons) */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: 16, height: 16 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-12v.75m0 3v.75m0 3v.75m0 3V18M3 7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v9a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 16.5v-9Z" />
              </svg>
              My Tickets
            </Link>
            <Link to="/create-ticket" className="text-white text-decoration-none small fw-medium opacity-90 d-flex align-items-center gap-1">
              {/* Plus Icon (Heroicons) */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 16, height: 16 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Create Ticket
            </Link>
          </nav>
        </div>

        {/* Right Side: Requester Profile Badge */}
        {selectedRequester && (
          <div className="d-flex align-items-center">
            <div
              className="d-flex align-items-center gap-2 px-3 py-1 rounded-pill"
              style={{ backgroundColor: "#00522E", border: "1px solid rgba(255, 255, 255, 0.2)" }}
            >
              {/* User Icon (Heroicons) */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: 16, height: 16 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              <span className="small fw-medium text-white">{selectedRequester.name}</span>
              <button
                onClick={onChangeRequester}
                className="btn btn-sm btn-link p-0 small ms-2 text-white text-decoration-underline opacity-90"
                style={{ fontSize: "0.8rem" }}
              >
                Change Requester
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};