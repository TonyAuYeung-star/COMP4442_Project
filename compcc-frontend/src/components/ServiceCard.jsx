import React from 'react';

const ServiceCard = ({ service, isSelected, onSelect, onEdit, onDelete }) => {
  const statusColors = {
    ACTIVE: 'bg-green-100 text-green-800',
    INACTIVE: 'bg-red-100 text-red-800',
    MAINTENANCE: 'bg-yellow-100 text-yellow-800'
  };

  return (
    <div className={`rounded-lg border p-4 cursor-pointer transition-all ${
      isSelected ? 'border-cyan-500 bg-cyan-50' : 'border-slate-200 bg-white hover:border-slate-300'
    }`} onClick={() => onSelect(service.id)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900">{service.serviceName}</h3>
          <p className="text-sm text-slate-600 mt-1">{service.description}</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
            <span>{service.host}:{service.port}</span>
            {service.version && <span>v{service.version}</span>}
          </div>
          {service.healthCheckUrl && (
            <p className="text-xs text-slate-500 mt-1 truncate">{service.healthCheckUrl}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[service.status] || 'bg-gray-100 text-gray-800'}`}>
            {service.status}
          </span>
          <div className="flex gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(service); }}
              className="px-2 py-1 text-xs bg-cyan-600 text-white rounded hover:bg-cyan-700"
            >
              Edit
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(service.id); }}
              className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
      <div className="mt-3 text-xs text-slate-500">
        Created: {new Date(service.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
};

export default ServiceCard;