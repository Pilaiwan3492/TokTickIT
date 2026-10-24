import { apiFetch } from "./apiClient";
import { RequesterDashboardData, StaffDashboardData } from "../types/dashboard";

export async function getRequesterDashboard(): Promise<RequesterDashboardData> {
  const res = await apiFetch("/api/v1/dashboard/requester");
  const result = await res.json();
  if (!res.ok || !result.success) {
    throw new Error(result.error?.message || "Failed to load Requester Dashboard.");
  }
  return result.data;
}

export async function getStaffDashboard(): Promise<StaffDashboardData> {
  const res = await apiFetch("/api/v1/dashboard/staff");
  const result = await res.json();
  if (!res.ok || !result.success) {
    throw new Error(result.error?.message || "Failed to load Staff Dashboard.");
  }
  return result.data;
}
