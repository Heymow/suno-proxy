import { useState } from "react";
import { ApiStats } from "@/types";
import { handleWithBlur, toggleDarkMode } from "@/utils/theme";
import { fetchStats as fetchStatsApi, resetStats as resetStatsApi } from "@/services/apiService";
import SidebarDrawer from "@/components/ui/SidebarDrawer";
import MainView from "@/components/ui/MainView";
import Header from "@/components/ui/Header";
import LastUpdated from "@/components/ui/LastUpdated";
import LeftMenu from "@/components/ui/LeftMenu";
import RightMenu from "@/components/ui/RightMenu";
import ActionButtons from "@/components/ui/ActionButtons";
import { Dialog, DialogContent, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
  const [view, setView] = useState("Overview");
  const [showResetModal, setShowResetModal] = useState(false);

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

  const handleResetClick = () => setShowResetModal(true);

  const handleConfirmReset = async () => {
    setShowResetModal(false);
    await resetStats();
  };

  const handleCancelReset = () => setShowResetModal(false);

  return (
    <div className="grid min-h-screen w-full grid-cols-1 md:grid-cols-[16rem_minmax(0,1fr)_24rem]">
      <SidebarDrawer handleWithBlur={handleWithBlur} toggleDarkMode={toggleDarkMode} setView={setView} />

      <aside className="w-64 p-6 border-r bg-card text-card-foreground shadow hidden md:flex flex-col justify-between">
        <LeftMenu handleWithBlur={handleWithBlur} toggleDarkMode={toggleDarkMode} setView={setView} />
      </aside>

      <main className="flex flex-col px-2 md:px-10 py-8 w-full min-w-0">
        <Header subheader={false} title="Suno API calls" />
        <Header subheader={true} title={view} />
        <ActionButtons
          autoRefresh={autoRefresh}
          setAutoRefresh={setAutoRefresh}
          fetchStats={fetchStats}
          resetStats={async () => handleResetClick()}
        />
        <LastUpdated loading={loading} error={error} />
        <MainView
          stats={stats}
          loading={loading}
          error={error}
          resetStats={resetStats}
          toggleDarkMode={toggleDarkMode}
          view={view}
          setView={setView}
        />
      </main>

      <aside className=" md:flex flex-col w-full p-4 border-l bg-card text-card-foreground shadow">
        <RightMenu
          stats={stats}
          perStatus={stats.perStatus}
          perEndpoint={stats.perEndpoint}
          lastErrors={stats.lastErrors}
        />
      </aside>

      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent>
          <DialogHeader>
            <span className="font-bold text-lg">Confirm Reset</span>
          </DialogHeader>
          <div>Are you sure you want to reset the statistics?</div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelReset} className="cursor-pointer">Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmReset} className="cursor-pointer text-background">Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
