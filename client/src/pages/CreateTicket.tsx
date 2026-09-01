import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface CreateTicketProps {
  selectedRequesterId: number;
}

export const CreateTicket: React.FC<CreateTicketProps> = ({ selectedRequesterId }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    categoryId: '1',
    relatedSystemId: '1',
    summary: '',
    description: '',
    requestedPriority: 'MEDIUM'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (formData.summary.trim().length < 5 || formData.summary.trim().length > 150) {
      newErrors.summary = 'Summary must be between 5 and 150 characters.';
    }
    if (formData.description.trim().length < 10 || formData.description.trim().length > 2000) {
      newErrors.description = 'Description must be between 10 and 2,000 characters.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          requesterId: selectedRequesterId,
          categoryId: Number(formData.categoryId),
          relatedSystemId: Number(formData.relatedSystemId)
        })
      });
      const data = await res.json();
      if (res.status === 201) {
        navigate(`/tickets/${data.data.id}`, {
          state: { notification: `Ticket ${data.data.ticketNo} created successfully!` }
        });
      } else if (data.error?.fields) {
        setErrors(data.error.fields);
      }
    } catch {
      alert('Network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#F5F7F6', minHeight: '100vh', padding: '24px' }}>
      <form onSubmit={handleSubmit} style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '8px', maxWidth: '700px', margin: '0 auto', border: '1px solid #E0E0E0' }}>
        <h2 style={{ color: '#006B3C', marginTop: 0 }}>Create Ticket</h2>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>
            Summary <span style={{ color: '#D32F2F' }}>*</span>
          </label>
          <input
            type="text"
            value={formData.summary}
            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
            style={{ width: '100%', height: '40px', borderColor: errors.summary ? '#D32F2F' : '#CCC', borderRadius: '4px', padding: '0 8px' }}
          />
          {errors.summary && <span style={{ color: '#D32F2F', fontSize: '13px' }}>{errors.summary}</span>}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>
            Description <span style={{ color: '#D32F2F' }}>*</span>
          </label>
          <textarea
            rows={5}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            style={{ width: '100%', borderColor: errors.description ? '#D32F2F' : '#CCC', borderRadius: '4px', padding: '8px' }}
          />
          {errors.description && <span style={{ color: '#D32F2F', fontSize: '13px' }}>{errors.description}</span>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{ backgroundColor: isSubmitting ? '#A0A0A0' : '#006B3C', color: '#FFF', border: 'none', padding: '12px 24px', borderRadius: '4px', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
        </button>
      </form>
    </div>
  );
};