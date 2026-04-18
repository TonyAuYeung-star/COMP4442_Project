import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

const ServiceQuery = ({ onQueryByName, onQueryByStatus, loading, result }) => {
  const [queryName, setQueryName] = useState('');
  const [queryStatus, setQueryStatus] = useState('ACTIVE');

  const handleNameQuery = (e) => {
    e.preventDefault();
    onQueryByName(queryName);
  };

  const handleStatusQuery = (e) => {
    e.preventDefault();
    onQueryByStatus(queryStatus);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <form onSubmit={handleNameQuery} className="space-y-3 rounded-xl border border-slate-200 p-4">
          <h4 className="text-sm font-semibold text-slate-900">Query by Name</h4>
          <input
            type="text"
            value={queryName}
            onChange={(e) => setQueryName(e.target.value)}
            placeholder="Enter service name"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading && <LoadingSpinner size="sm" />}
            Query by Name
          </button>
        </form>

        <form onSubmit={handleStatusQuery} className="space-y-3 rounded-xl border border-slate-200 p-4">
          <h4 className="text-sm font-semibold text-slate-900">Query by Status</h4>
          <select
            value={queryStatus}
            onChange={(e) => setQueryStatus(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading && <LoadingSpinner size="sm" />}
            Query by Status
          </button>
        </form>
      </div>

      {result && (
        <div className="rounded-xl border border-slate-200 p-4">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">Query Result</h4>
          <div className="space-y-3">
            {Array.isArray(result) ? (
              result.length > 0 ? (
                result.map((service) => (
                  <div key={service.id} className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-semibold text-slate-900">{service.serviceName}</h5>
                        <p className="text-sm text-slate-600 mt-1">{service.description}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                          <span>{service.host}:{service.port}</span>
                          {service.version && <span>v{service.version}</span>}
                        </div>
                        {service.healthCheckUrl && (
                          <p className="text-xs text-slate-500 mt-1 truncate">{service.healthCheckUrl}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          service.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                          service.status === 'INACTIVE' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {service.status}
                        </span>
                        <p className="text-xs text-slate-500 mt-2">
                          ID: {service.id}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-slate-500">
                      Created: {new Date(service.createdAt).toLocaleDateString()}
                      {service.updatedAt && service.updatedAt !== service.createdAt && (
                        <span className="ml-2">
                          Updated: {new Date(service.updatedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No services found</p>
              )
            ) : (
              // Single service result
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="font-semibold text-slate-900">{result.serviceName}</h5>
                    <p className="text-sm text-slate-600 mt-1">{result.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                      <span>{result.host}:{result.port}</span>
                      {result.version && <span>v{result.version}</span>}
                    </div>
                    {result.healthCheckUrl && (
                      <p className="text-xs text-slate-500 mt-1 truncate">{result.healthCheckUrl}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      result.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      result.status === 'INACTIVE' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {result.status}
                    </span>
                    <p className="text-xs text-slate-500 mt-2">
                      ID: {result.id}
                    </p>
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-500">
                  Created: {new Date(result.createdAt).toLocaleDateString()}
                  {result.updatedAt && result.updatedAt !== result.createdAt && (
                    <span className="ml-2">
                      Updated: {new Date(result.updatedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceQuery;