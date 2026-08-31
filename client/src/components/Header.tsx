import React from "react";
import { useRequester } from "../context/RequesterContext";

interface Props {
  onChangeRequester: () => void;
}

export const Header: React.FC<Props> = ({ onChangeRequester }) => {
  const { selectedRequester } = useRequester();

  return (
    <header style={{ backgroundColor: "#006B3C" }} className="text-white py-2 px-3 shadow-sm">
      <div className="container-fluid d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-4">
          <div className="d-flex align-items-center gap-2 fw-bold fs-5">
            <span>⏱️</span> Service Desk
          </div>
          <nav className="d-none d-md-flex gap-3">
            <span className="text-white-50 small cursor-pointer">📄 My Tickets</span>
            <span className="text-white-50 small cursor-pointer">➕ Create Ticket</span>
          </nav>
        </div>

        {selectedRequester && (
          <div className="d-flex align-items-center gap-2">
            <div className="d-flex align-items-center gap-2 bg-white bg-opacity-10 px-3 py-1 rounded-pill">
              <span className="small">👤 {selectedRequester.name}</span>
              <button
                onClick={onChangeRequester}
                className="btn btn-sm btn-link text-white text-decoration-underline p-0 small ms-2"
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