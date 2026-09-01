import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Category {
  id: number;
  name: string;
  isActive?: boolean;
}

interface RelatedSystem {
  id: number;
  name: string;
  isActive?: boolean;
}

export default function CreateTicket() {
  const navigate = useNavigate();

  // Reference Data State
  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedSystems, setRelatedSystems] = useState<RelatedSystem[]>([]);

  // Form Fields State
  const [categoryId, setCategoryId] = useState<string>("");
  const [relatedSystemId, setRelatedSystemId] = useState<string>("");
  const [requestedPriority, setRequestedPriority] = useState<string>("MEDIUM");
  const [summary, setSummary] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  // Validation & Loading State
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdTicketNo, setCreatedTicketNo] = useState<string | null>(null);

  // Fetch Reference Data
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/v1/categories");
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.data || []);
          setCategories(list.filter((item: Category) => item.isActive !== false));
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };

    const fetchRelatedSystems = async () => {
      try {
        const res = await fetch("/api/v1/related-systems");
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.data || []);
          setRelatedSystems(list.filter((item: RelatedSystem) => item.isActive !== false));
        }
      } catch (err) {
        console.error("Error fetching related systems:", err);
      }
    };

    fetchCategories();
    fetchRelatedSystems();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError("");

    // ---------------------------------------------------------
    // Client-side Validation Checks
    // ---------------------------------------------------------
    const errors: Record<string, string> = {};

    if (!categoryId) {
      errors.categoryId = "Please select a category";
    }

    if (!relatedSystemId) {
      errors.relatedSystemId = "Please select a related system";
    }

    const trimmedSummary = summary.trim();
    if (trimmedSummary.length < 5 || trimmedSummary.length > 150) {
      errors.summary = "Summary must be between 5 and 150 characters.";
    }

    const trimmedDescription = description.trim();
    if (trimmedDescription.length < 10 || trimmedDescription.length > 2000) {
      errors.description = "Description must be between 10 and 2,000 characters.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);

    const selectedRequesterId = localStorage.getItem("dev_selected_requester_id") || "1";

    try {
      const response = await fetch("/api/v1/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requesterId: Number(selectedRequesterId),
          categoryId: Number(categoryId),
          relatedSystemId: Number(relatedSystemId),
          requestedPriority,
          summary: trimmedSummary,
          description: trimmedDescription,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        if (resData.error?.fields) {
          setFieldErrors(resData.error.fields);
        } else {
          setGeneralError(resData.error?.message || "Failed to create ticket");
        }
      } else {
        setCreatedTicketNo(resData.data?.ticketNo);
      }
    } catch (error) {
      setGeneralError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------
  // Success View Screen 
  // ---------------------------------------------------------
  if (createdTicketNo) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md mt-10 text-center space-y-4">
        <div className="text-emerald-600 text-5xl">✓</div>
        <h2 className="text-2xl font-bold text-gray-800">Ticket Created Successfully!</h2>
        <p className="text-sm text-gray-600">Your ticket has been submitted with reference number:</p>
        <div className="text-2xl font-mono font-bold text-emerald-800 bg-emerald-50 py-3 rounded border border-emerald-200">
          {createdTicketNo}
        </div>
        <div className="flex justify-center space-x-3 pt-4">
          <button
            type="button"
            onClick={() => navigate("/tickets")}
            className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
          >
            View My Tickets
          </button>
          <button
            type="button"
            onClick={() => {
              setCreatedTicketNo(null);
              setSummary("");
              setDescription("");
              setCategoryId("");
              setRelatedSystemId("");
            }}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
          >
            Create Another Ticket
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-6">
      <h1 className="text-2xl font-bold text-emerald-800 mb-6">Create New Ticket</h1>

      {generalError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {generalError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">-- Select Category --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {fieldErrors.categoryId && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.categoryId}</p>
          )}
        </div>

        {/* Related System Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Related System <span className="text-red-500">*</span>
          </label>
          <select
            value={relatedSystemId}
            onChange={(e) => setRelatedSystemId(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">-- Select Related System --</option>
            {relatedSystems.map((sys) => (
              <option key={sys.id} value={sys.id}>
                {sys.name}
              </option>
            ))}
          </select>
          {fieldErrors.relatedSystemId && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.relatedSystemId}</p>
          )}
        </div>

        {/* Requested Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Requested Priority <span className="text-red-500">*</span>
          </label>
          <select
            value={requestedPriority}
            onChange={(e) => setRequestedPriority(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
          </select>
          {fieldErrors.requestedPriority && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.requestedPriority}</p>
          )}
        </div>

        {/* Summary Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Summary <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Brief summary (5-150 characters)"
            className="w-full border border-gray-300 p-2 rounded focus:ring-emerald-500 focus:border-emerald-500"
          />
          {fieldErrors.summary && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.summary}</p>
          )}
        </div>

        {/* Description Textarea */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed description (10-2000 characters)"
            className="w-full border border-gray-300 p-2 rounded focus:ring-emerald-500 focus:border-emerald-500"
          />
          {fieldErrors.description && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.description}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={() => navigate("/tickets")}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Create Ticket"}
          </button>
        </div>
      </form>
    </div>
  );
}