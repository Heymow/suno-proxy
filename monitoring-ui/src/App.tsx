import { useEffect, useState } from 'react';
import axios from 'axios';

interface ApiStats {
  success: number;
  errors: number;
  timeouts: number;
  rateLimits: number;
  total: number;
  perStatus: Record<number, number>;
  perEndpoint: Record<string, number>;
  lastErrors: { url: string; status: number; message?: string; timestamp: number }[];
}

const API_URL = '/api/internal/monitoring';
const RESET_URL = '/api/internal/monitoring/reset';
const TOKEN = import.meta.env.VITE_MONITOR_TOKEN || '';

export default function MonitoringDashboard() {
  const [stats, setStats] = useState<ApiStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL, {
        headers: { 'x-monitor-token': TOKEN }
      });
      setStats(res.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  const resetStats = async () => {
    try {
      await axios.post(RESET_URL, {}, {
        headers: { 'x-monitor-token': TOKEN }
      });
      await fetchStats();
    } catch (err: any) {
      setError('Failed to reset stats');
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">API Monitoring</h1>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : stats ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Stat label="Total Calls" value={stats.total} />
            <Stat label="Success" value={stats.success} />
            <Stat label="Errors" value={stats.errors} />
            <Stat label="Rate Limits" value={stats.rateLimits} />
            <Stat label="Timeouts" value={stats.timeouts} />
          </div>

          <h2 className="text-lg font-semibold mt-6">Status Codes</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(stats.perStatus).map(([code, count]) => (
              <Stat key={code} label={`Status ${code}`} value={count} />
            ))}
          </div>

          <h2 className="text-lg font-semibold mt-6">Endpoints</h2>
          <ul className="list-disc pl-6">
            {Object.entries(stats.perEndpoint).map(([endpoint, count]) => (
              <li key={endpoint} className="text-sm">{endpoint}: {count}</li>
            ))}
          </ul>

          <h2 className="text-lg font-semibold mt-6">Last Errors</h2>
          <ul className="text-sm space-y-1">
            {stats.lastErrors.map((err, index) => (
              <li key={index} className="text-red-600">
                [{new Date(err.timestamp).toLocaleTimeString()}] {err.status} - {err.url} {err.message && `| ${err.message}`}
              </li>
            ))}
          </ul>

          <button
            className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={resetStats}
          >
            Reset Stats
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white shadow rounded p-4">
      <div className="text-gray-600 text-sm">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}
