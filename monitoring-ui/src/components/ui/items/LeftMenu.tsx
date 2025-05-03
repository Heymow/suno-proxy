import { Button } from "../button";
import { Activity, LayoutDashboard, Settings, Moon } from "lucide-react";

export default function LeftMenu({ handleWithBlur, toggleDarkMode, setView }: { handleWithBlur: (callback: () => void) => () => void; toggleDarkMode: () => void; setView: (view: string) => void; }) {
    return (
        <>
            <div className="flex-col w-full">

                <h2 className="text-lg font-bold">Dashboard</h2>
                <nav className="flexflex-row pace-y-2 text-sm mt-4">
                    <Button
                        variant="outline"
                        onClick={handleWithBlur(() => setView("Overview"))}
                        className="mb-3 cursor-pointer w-full flex items-center gap-2 text-foreground hover:text-primary transition-colors outline-1"
                    >
                        <LayoutDashboard className="w-4 h-4 mr-2" /> Overview
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleWithBlur(() => setView("Live Stats"))}
                        className="mb-3 cursor-pointer w-full flex items-center gap-2 text-foreground hover:text-primary transition-colors outline-1"
                    >
                        <Activity className="w-4 h-4 mr-2" /> Live Stats
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleWithBlur(() => setView("Settings"))}
                        className="mb-3 cursor-pointer w-full flex items-center gap-2 text-foreground hover:text-primary transition-colors outline-1"
                    >
                        <Settings className="w-4 h-4 mr-2" /> Settings
                    </Button>
                </nav>
            </div>

            <div className="flex-col w-full">
                <Button variant="outline"
                    onClick={handleWithBlur(toggleDarkMode)}
                    className="mb-3 cursor-pointer w-full flex items-center gap-2 text-foreground hover:text-primary transition-colors outline-1">
                    <Moon className="w-4 h-4 mr-2" /> Toggle Theme
                </Button>
            </div>
        </>
    )
}