import { useEffect, useState } from 'react';
import axios from 'axios';
import { CardAction, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, XCircle, Clock, AlertTriangle, RefreshCcw, LayoutDashboard, Settings, Activity } from 'lucide-react';

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
const TOKEN = typeof import.meta.env !== 'undefined' && import.meta.env.VITE_MONITOR_TOKEN ? import.meta.env.VITE_MONITOR_TOKEN : '';

export default function MonitoringDashboard() {
  const [stats, setStats] = useState<ApiStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL, {
        headers: { 'x-monitor-token': TOKEN },
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
      await axios.post(
        RESET_URL,
        {},
        {
          headers: { 'x-monitor-token': TOKEN },
        }
      );
      await fetchStats();
    } catch (err: any) {
      setError('Failed to reset stats');
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="w-64 p-6 border-r border-border shadow-lg hidden md:flex flex-col justify-start gap-4 bg-card text-card-foreground">
        <h2 className="text-lg font-bold">Dashboard</h2>
        <nav className="space-y-2 text-sm">
          <a href="#" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
            <LayoutDashboard className="w-4 h-4" /> Overview
          </a>
          <a href="#" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
            <Activity className="w-4 h-4" /> Live Stats
          </a>
          <a href="#" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
            <Settings className="w-4 h-4" /> Settings
          </a>
        </nav>
      </aside>

      <main className="flex-1 px-10 py-8">
        {TOKEN === '' && (
          <div className="bg-yellow-200 text-yellow-800 text-sm font-medium px-4 py-2 rounded mb-4 text-center">
            ⚠️ The authentication token is missing. Please check your .env file or environment variables.
          </div>
        )}

        <div className="space-y-10">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-semibold mb-2 tracking-tight animate-fade-in">API Monitoring Dashboard</h1>
            <p className="text-muted-foreground mb-1 animate-fade-in">Monitor the performance and status of your API.</p>
            <p className="text-muted-foreground mb-4 animate-fade-in">
              This dashboard provides real-time statistics on API calls, including success rates, error counts, and more.
            </p>
          </div>

          <Button variant="outline" onClick={fetchStats} className="transition hover:scale-102 duration-300 mb-4">
            <RefreshCcw className="w-4 h-4 mr-2" /> Refresh
          </Button>


          {loading ? (
            <p className="animate-pulse text-muted-foreground text-center">Loading...</p>
          ) : error ? (
            <p className="text-destructive font-medium text-center">{error}</p>
          ) : stats ? (
            <div className="space-y-10">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-fade-in">
                <Stat label="Total Calls" value={stats.total} icon={<RefreshCcw />} />
                <Stat label="Success" value={stats.success} icon={<CheckCircle className="text-green-500" />} />
                <Stat label="Errors" value={stats.errors} icon={<XCircle className="text-red-500" />} />
                <Stat label="Rate Limits" value={stats.rateLimits} icon={<AlertTriangle className="text-yellow-500" />} />
                <Stat label="Timeouts" value={stats.timeouts} icon={<Clock className="text-blue-400" />} />
              </div>

              <Separator />

              <div>
                <h2 className="text-xl font-semibold mb-2">Status Codes</h2>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(stats.perStatus).map(([code, count]) => (
                    <Badge key={code} variant="secondary">
                      {code}: {count}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h2 className="text-xl font-semibold mb-2">Endpoints</h2>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  {Object.entries(stats.perEndpoint).map(([endpoint, count]) => (
                    <li key={endpoint}>
                      <code className="text-muted-foreground">{endpoint}</code>: {count}
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              <div>
                <h2 className="text-xl font-semibold mb-2">Last Errors</h2>
                <ScrollArea className="h-40 border rounded-md bg-muted px-4 py-2 animate-in slide-in-from-bottom-4 duration-500">
                  <ul className="text-sm space-y-1">
                    {stats.lastErrors.map((err, index) => (
                      <li key={index} className="text-red-400">
                        [{new Date(err.timestamp).toLocaleTimeString()}] {err.status} - {err.url}{' '}
                        {err.message && `| ${err.message}`}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>

              <div className="text-end">
                <Button variant="destructive" onClick={resetStats} className="transition hover:scale-102 duration-300">
                  <RefreshCcw className="w-4 h-4 mr-2" /> Reset Stats
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon?: React.ReactNode }) {
  return (
    <CardAction className="w-full rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-300 card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          {icon && <span>{icon}</span>}
          <span>{label}</span>
        </div>
        <div className="pt-2 text-2xl font-bold text-foreground">{value}</div>
      </CardContent>
    </CardAction>
  );
}
