import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useRequester } from "../context/RequesterContext";

interface Ticket {
  id: string;
  ticketNo: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  category?: { name: string };
  relatedSystem?: { name: string };
}

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const { selectedRequester } = useRequester();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTicket() {
      if (!id || !selectedRequester) return;

      try {
        setLoading(true);
        // เพิ่ม ?requesterId= ใน Query Parameter ตามที่ Middleware ฝั่ง Backend เรียกหา
        const res = await fetch(`/api/v1/tickets/${id}?requesterId=${selectedRequester.id}`, {
          headers: {
            "x-requester-id": String(selectedRequester.id), 
          },
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || "Failed to fetch ticket");
        }

        const data = await res.json();
        setTicket(data.data || data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTicket();
  }, [id, selectedRequester]);

  if (loading) return <div className="container py-4">Loading ticket details...</div>;
  if (error) return <div className="container py-4 text-danger">Error: {error}</div>;
  if (!ticket) return <div className="container py-4">Ticket not found.</div>;

  return (
    <div className="container py-4" style={{ maxWidth: 800 }}>
      <div className="mb-3">
        <Link to="/tickets" className="btn btn-outline-secondary btn-sm">
          &larr; Back to My Tickets
        </Link>
      </div>
      <div className="card shadow-sm p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h4 mb-0">{ticket.ticketNo}</h2>
          <span className="badge bg-secondary">{ticket.status}</span>
        </div>
        <h5 className="fw-bold">{ticket.title}</h5>
        <p className="text-muted small mb-3">
          Category: {ticket.category?.name || "N/A"} | Priority: {ticket.priority}
        </p>
        <hr />
        <p className="mb-0">{ticket.description}</p>
      </div>
    </div>
  );
}