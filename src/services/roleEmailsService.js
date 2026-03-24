import api from "./api";

/**
 * Get all role emails (admin only)
 */
export const getAllRoleEmails = async () => {
  const response = await api.get("/role-emails");
  return response;
};

/**
 * Get email for a specific role
 */
export const getRoleEmail = async (role) => {
  const response = await api.get(`/role-emails/${role}`);
  return response;
};

/**
 * Get email for current user's role
 */
export const getMyRoleEmail = async () => {
  const response = await api.get("/role-emails/my-role");
  return response;
};

/**
 * Update a single role's email (admin only)
 */
export const updateRoleEmail = async (role, email) => {
  const response = await api.put("/role-emails", { role, email });
  return response;
};

/**
 * Update multiple role emails at once (admin only)
 */
export const updateMultipleRoleEmails = async (roleEmails) => {
  const response = await api.put("/role-emails/batch", { roleEmails });
  return response;
};

export default {
  getAllRoleEmails,
  getRoleEmail,
  getMyRoleEmail,
  updateRoleEmail,
  updateMultipleRoleEmails,
};
