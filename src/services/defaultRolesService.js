import api from "./api";

const defaultRolesService = {
  getDefaultRoles: () => api.get("/default-roles"),

  addDefaultRole: (name) => api.post("/default-roles", { name }),

  deleteDefaultRole: (id) => api.delete(`/default-roles/${id}`),
};

export default defaultRolesService;
