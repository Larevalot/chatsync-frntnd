import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("chatsync_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("chatsync_token");
      localStorage.removeItem("chatsync_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
  updateProfile: (formData: FormData) =>
    api.put("/auth/profile", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export const roomAPI = {
  list: (search?: string, code?: string) =>
    api.get("/rooms", { params: { search, code } }),
  get: (id: string) => api.get(`/rooms/${id}`),
  getByCode: (code: string) =>
    api.get("/rooms", { params: { code } }),
  create: (data: { name: string; description?: string; isPrivate?: boolean }) =>
    api.post("/rooms", data),
  join: (id: string, inviteCode?: string) =>
    api.post(`/rooms/${id}/join`, { inviteCode }),
  leave: (id: string) => api.post(`/rooms/${id}/leave`),
  delete: (id: string) => api.delete(`/rooms/${id}`),
  updateBackground: (id: string, formData: FormData) =>
    api.put(`/rooms/${id}/background`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  approveRequest: (roomId: string, requestId: string) =>
    api.post(`/rooms/${roomId}/requests/${requestId}/approve`),
  rejectRequest: (roomId: string, requestId: string) =>
    api.post(`/rooms/${roomId}/requests/${requestId}/reject`),
  updateMemberRole: (roomId: string, memberId: string, role: string) =>
    api.put(`/rooms/${roomId}/members/${memberId}/role`, { role }),
  removeMember: (roomId: string, memberId: string) =>
    api.delete(`/rooms/${roomId}/members/${memberId}`),
};

export const messageAPI = {
  list: (roomId: string, cursor?: string) =>
    api.get(`/messages/${roomId}`, { params: { cursor } }),
  send: (roomId: string, formData: FormData) =>
    api.post(`/messages/${roomId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (roomId: string, messageId: string) =>
    api.delete(`/messages/${roomId}/${messageId}`),
};

export default api;
