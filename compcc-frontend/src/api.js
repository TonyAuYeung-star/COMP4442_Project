const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    const message = payload?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  if (payload?.code && payload.code >= 400) {
    throw new Error(payload.message || "API returned an error");
  }

  return payload;
}

export const serviceApi = {
  getAll: () => request("/v1/services"),
  getById: (id) => request(`/v1/services/${id}`),
  create: (service) =>
    request("/v1/services", { method: "POST", body: JSON.stringify(service) }),
  update: (id, service) =>
    request(`/v1/services/${id}`, { method: "PUT", body: JSON.stringify(service) }),
  remove: (id) => request(`/v1/services/${id}`, { method: "DELETE" }),
  queryByName: (serviceName) =>
    request("/v1/services/query/by-name", {
      method: "POST",
      body: JSON.stringify({ serviceName })
    }),
  queryByStatus: (status) =>
    request("/v1/services/query/by-status", {
      method: "POST",
      body: JSON.stringify({ status })
    })
};
