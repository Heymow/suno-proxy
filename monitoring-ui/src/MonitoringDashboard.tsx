import { useEffect, useState } from 'react';
import axios from 'axios';
import { RefreshCcw, TimerReset } from 'lucide-react';
import { cn } from '@/lib/utils';
import { handleWithBlur, toggleDarkMode } from '@/utils/theme';
import SidebarDrawer from "@/components/ui/SidebarDrawer";
import MainView from "@/components/ui/mainView";
import Header from './components/ui/header';
import LastUpdated from './components/ui/lastUpdated';
import LeftMenu from '@/components/ui/leftMenu';
import RightMenu from './components/ui/rightMenu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface ApiStats {
  success: number;
  errors: number;
  timeouts: number;
  rateLimits: number;
  total: number;
  perStatus: Record<number, number>;
  perEndpoint: Record<string, number>;
  lastErrors: { url: string; status: number; message?: string; timestamp: number }[];
}

const baseUrl = typeof import.meta.env !== 'undefined' && import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : 'http://localhost:3000';
const API_URL = '/api/internal/monitoring';
const RESET_URL = '/api/internal/monitoring/reset';
const TOKEN = typeof import.meta.env !== 'undefined' && import.meta.env.VITE_MONITOR_TOKEN ? import.meta.env.VITE_MONITOR_TOKEN : '';

export default function MonitoringDashboard() {
  const [stats, setStats] = useState<ApiStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const refreshInterval = 1_000;

  const {
    success = 0,
    errors = 0,
    timeouts = 0,
    rateLimits = 0,
    total = 0,
    perStatus = {},
    perEndpoint = {},
    lastErrors = [],
  } = stats || {};

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await axios.get(baseUrl + API_URL, {
        headers: { 'x-monitor-token': TOKEN },
      });
      if (JSON.stringify(res.data) !== JSON.stringify(stats)) {
        setStats(res.data);
      }
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  const resetStats = async () => {
    try {
      setAutoRefresh(false);
      await axios.post(
        baseUrl + RESET_URL,
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

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchStats();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh]);


  return (
    <div className="grid min-h-screen w-full grid-cols-1 md:grid-cols-[16rem_1fr_24rem]">
      <SidebarDrawer
        handleWithBlur={handleWithBlur}
        toggleDarkMode={toggleDarkMode}
      />

      <aside className="w-64 p-6 border-r bg-card text-card-foreground shadow hidden md:flex flex-col justify-between">
        <LeftMenu
          handleWithBlur={handleWithBlur}
          toggleDarkMode={toggleDarkMode}
        />
      </aside>

      <main className="flex flex-col px-6 pt-17 md:pt-7 md:px-10 py-8 h-screen">
        <Header subheader={false} title="Suno API calls" />
        <Header subheader={true} title="Overview" />

        <div className="flex justify-end gap-2 mb-6">
          <Button variant="outline" onClick={handleWithBlur(() => setAutoRefresh(v => !v))} className={cn("cursor-pointer", autoRefresh && "animate-pulse")}>
            {/* <RefreshCcw /> */}
            <Badge variant={autoRefresh ? "default" : "destructive"}></Badge>
            {autoRefresh ? "Auto Refresh ON" : "Auto Refresh OFF"}
          </Button>
          <Button variant="outline" onClick={handleWithBlur(fetchStats)} className="cursor-pointer">
            <RefreshCcw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button variant="outline" onClick={handleWithBlur(resetStats)} className="cursor-pointer">
            <TimerReset className="w-4 h-4 mr-2" /> Reset
          </Button>
        </div>

        <LastUpdated
          loading={loading}
          error={error}
        />

        <MainView
          stats={
            {
              success,
              errors,
              timeouts,
              rateLimits,
              total,
            }
          }
          loading={loading}
          error={error}
          resetStats={resetStats}
          toggleDarkMode={toggleDarkMode}
        />
      </main>

      <aside className="1fr shrink-0 p-4 border-l bg-card text-card-foreground shadow hidden md:flex flex-col">
        <RightMenu
          stats={stats}
          perStatus={perStatus || {}}
          perEndpoint={perEndpoint || {}}
          lastErrors={lastErrors || []}
        />
      </aside>
    </div>
  );
}
