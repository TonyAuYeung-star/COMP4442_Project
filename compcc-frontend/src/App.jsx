import { useEffect, useMemo, useState } from "react";
import { serviceApi } from "./api";
import Header from "./components/Header";
import Notification from "./components/Notification";
import ServiceCard from "./components/ServiceCard";
import ServiceForm from "./components/ServiceForm";
import ServiceQuery from "./components/ServiceQuery";
import ConfirmationDialog from "./components/ConfirmationDialog";

const emptyService = { serviceName: "", host: "", port: "", description: "", healthCheckUrl: "", version: "", status: "ACTIVE" };

function App() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "info", text: "" });
  const [services, setServices] = useState([]);
  const [serviceForm, setServiceForm] = useState(emptyService);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [editingService, setEditingService] = useState(null);
  const [queryResult, setQueryResult] = useState(null);
  const [confirmationDialog, setConfirmationDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const selectedService = useMemo(
    () => services.find((s) => String(s.id) === String(selectedServiceId)),
    [services, selectedServiceId]
  );

  const show = (type, text) => setMessage({ type, text });
  const dismissMessage = () => setMessage({ type: "info", text: "" });

  const run = async (task) => {
    setLoading(true);
    try {
      await task();
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    await run(async () => {
      try {
        const s = await serviceApi.getAll();
        setServices(s.data || []);
        show("success", "Services synced.");
      } catch (error) {
        show("error", error.message);
      }
    });
  };

  useEffect(() => {
    refresh();
  }, []);

  const refreshServices = async () => {
    const res = await serviceApi.getAll();
    setServices(res.data || []);
  };

  const createService = async (serviceData) => {
    await run(async () => {
      try {
        await serviceApi.create(serviceData);
        await refreshServices();
        setServiceForm(emptyService);
        setEditingService(null);
        show("success", "Service created.");
      } catch (error) {
        show("error", error.message);
      }
    });
  };

  const updateService = async (serviceData) => {
    if (!selectedServiceId) return show("error", "Select a service to update.");
    await run(async () => {
      try {
        await serviceApi.update(selectedServiceId, serviceData);
        await refreshServices();
        setEditingService(null);
        show("success", `Service #${selectedServiceId} updated.`);
      } catch (error) {
        show("error", error.message);
      }
    });
  };

  const deleteService = (serviceId) => {
    setConfirmationDialog({
      isOpen: true,
      title: 'Delete Service',
      message: `Are you sure you want to delete service #${serviceId}? This action cannot be undone.`,
      onConfirm: async () => {
        await run(async () => {
          try {
            await serviceApi.remove(serviceId);
            setSelectedServiceId("");
            await refreshServices();
            show("success", `Service #${serviceId} deleted.`);
          } catch (error) {
            show("error", error.message);
          }
        });
        setConfirmationDialog({ isOpen: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const handleServiceSubmit = (serviceData) => {
    if (editingService) {
      updateService(serviceData);
    } else {
      createService(serviceData);
    }
  };

  const handleServiceEdit = (service) => {
    setEditingService(service);
    setServiceForm({
      serviceName: service.serviceName || "",
      host: service.host || "",
      port: service.port || "",
      description: service.description || "",
      healthCheckUrl: service.healthCheckUrl || "",
      version: service.version || "",
      status: service.status || "ACTIVE"
    });
  };

  const handleServiceSelect = (serviceId) => {
    setSelectedServiceId(serviceId);
    setEditingService(null);
  };

  const queryByName = async (serviceName) => {
    await run(async () => {
      try {
        const res = await serviceApi.queryByName(serviceName);
        setQueryResult(res.data);
        show("success", "Query by name complete.");
      } catch (error) {
        setQueryResult(null);
        show("error", error.message);
      }
    });
  };

  const queryByStatus = async (status) => {
    await run(async () => {
      try {
        const res = await serviceApi.queryByStatus(status);
        setQueryResult(res.data || []);
        show("success", "Query by status complete.");
      } catch (error) {
        setQueryResult(null);
        show("error", error.message);
      }
    });
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Header
          loading={loading}
          onRefresh={refresh}
          apiBaseUrl={import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api"}
        />

        <Notification message={message} onDismiss={dismissMessage} />

        {/* Service Count */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Total Services</h3>
              <p className="text-2xl font-bold text-slate-700">{services.length}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Active Services</p>
              <p className="text-lg font-semibold text-green-600">
                {services.filter(s => s.status === 'ACTIVE').length}
              </p>
            </div>
          </div>
        </section>

        <div className="max-w-4xl mx-auto">
          {/* Service Management Section */}
          <section className="space-y-6">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Service Management</h2>

              {/* Service List */}
              <div className="space-y-3 mb-6">
                <h3 className="text-sm font-medium text-slate-700">Services</h3>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {services.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      isSelected={String(service.id) === String(selectedServiceId)}
                      onSelect={handleServiceSelect}
                      onEdit={handleServiceEdit}
                      onDelete={deleteService}
                    />
                  ))}
                  {services.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">No services found</p>
                  )}
                </div>
              </div>

              {/* Service Form */}
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-3">
                  {editingService ? 'Edit Service' : 'Create New Service'}
                </h3>
                <ServiceForm
                  service={editingService}
                  onSubmit={handleServiceSubmit}
                  onCancel={editingService ? () => setEditingService(null) : null}
                  loading={loading}
                />
              </div>
            </article>

            {/* Service Queries */}
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Service Queries</h2>
              <ServiceQuery
                onQueryByName={queryByName}
                onQueryByStatus={queryByStatus}
                loading={loading}
                result={queryResult}
              />
            </article>
          </section>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        title={confirmationDialog.title}
        message={confirmationDialog.message}
        onConfirm={confirmationDialog.onConfirm}
        onCancel={() => setConfirmationDialog({ isOpen: false, title: '', message: '', onConfirm: null })}
      />
    </main>
  );
}

export default App;
