import { useState } from "react";
import { handleWithBlur, toggleDarkMode } from "@/utils/theme";
import SidebarDrawer from "@/components/ui/SidebarDrawer";
import MainView from "@/components/ui/MainView";
import Header from "@/components/ui/Header";
import LastUpdated from "@/components/ui/LastUpdated";
import LeftMenu from "@/components/ui/LeftMenu";
import RightMenu from "@/components/ui/RightMenu";
import { fetchStats as fetchStatsApi, resetStats as resetStatsApi } from "@/services/apiService";
import { ApiStats } from "@/types";
import ActionButtons from "@/components/ui/ActionButtons";
import useAutoRefresh from "@/hooks/useAutoRefresh";
import { useError } from "@/context/ErrorContext";

const refreshInterval = 1_000;

export default function MonitoringDashboard() {
  const [stats, setStats] = useState<ApiStats>({
    success: 0,
    errors: 0,
    timeouts: 0,
    rateLimits: 0,
    total: 0,
    perStatus: {},
    perEndpoint: {},
    lastErrors: [],
  });
  const [loading, setLoading] = useState(true);
  const { error, setError } = useError();
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await fetchStatsApi();
      setStats(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch stats");
    } finally {
      setLoading(false);
    }
  };

  const resetStats = async () => {
    try {
      setAutoRefresh(false);
      await resetStatsApi();
      await fetchStats();
    } catch (err: any) {
      setError("Failed to reset stats");
    }
  };

  useAutoRefresh(fetchStats, refreshInterval, autoRefresh);

  return (
    <div className="grid min-h-screen w-full grid-cols-1 md:grid-cols-[16rem_1fr_24rem]">
      <SidebarDrawer handleWithBlur={handleWithBlur} toggleDarkMode={toggleDarkMode} />

      <aside className="w-64 p-6 border-r bg-card text-card-foreground shadow hidden md:flex flex-col justify-between">
        <LeftMenu handleWithBlur={handleWithBlur} toggleDarkMode={toggleDarkMode} />
      </aside>

      <main className="flex flex-col px-6 pt-17 md:pt-7 md:px-10 py-8 h-screen">
        <Header subheader={false} title="Suno API calls" />
        <Header subheader={true} title="Overview" />
        <ActionButtons
          autoRefresh={autoRefresh}
          setAutoRefresh={setAutoRefresh}
          fetchStats={fetchStats}
          resetStats={resetStats}
        />
        <LastUpdated loading={loading} error={error} />
        <MainView
          stats={stats}
          loading={loading}
          error={error}
          resetStats={resetStats}
          toggleDarkMode={toggleDarkMode}
        />
      </main>

      <aside className="1fr shrink-0 p-4 border-l bg-card text-card-foreground shadow hidden md:flex flex-col">
        <RightMenu
          stats={stats}
          perStatus={stats.perStatus}
          perEndpoint={stats.perEndpoint}
          lastErrors={stats.lastErrors}
        />
      </aside>
    </div>
  );
}
