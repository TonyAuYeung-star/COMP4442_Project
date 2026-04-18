import React, { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';

const ServiceForm = ({ service, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    serviceName: '',
    host: '',
    port: '',
    description: '',
    healthCheckUrl: '',
    version: '',
    status: 'ACTIVE'
  });

  useEffect(() => {
    if (service) {
      setFormData({
        serviceName: service.serviceName || '',
        host: service.host || '',
        port: service.port || '',
        description: service.description || '',
        healthCheckUrl: service.healthCheckUrl || '',
        version: service.version || '',
        status: service.status || 'ACTIVE'
      });
    } else {
      setFormData({
        serviceName: '',
        host: '',
        port: '',
        description: '',
        healthCheckUrl: '',
        version: '',
        status: 'ACTIVE'
      });
    }
  }, [service]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      port: Number(formData.port)
    });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Service Name *
          </label>
          <input
            type="text"
            value={formData.serviceName}
            onChange={(e) => handleChange('serviceName', e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
            placeholder="e.g., user-service"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Host *
          </label>
          <input
            type="text"
            value={formData.host}
            onChange={(e) => handleChange('host', e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
            placeholder="e.g., localhost"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Port *
          </label>
          <input
            type="number"
            value={formData.port}
            onChange={(e) => handleChange('port', e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
            placeholder="e.g., 8080"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Version
          </label>
          <input
            type="text"
            value={formData.version}
            onChange={(e) => handleChange('version', e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
            placeholder="e.g., 1.0.0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Health Check URL
          </label>
          <input
            type="url"
            value={formData.healthCheckUrl}
            onChange={(e) => handleChange('healthCheckUrl', e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
            placeholder="e.g., http://localhost:8080/health"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
          placeholder="Service description..."
        />
      </div>
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading && <LoadingSpinner size="sm" />}
          {service ? 'Update Service' : 'Create Service'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default ServiceForm;