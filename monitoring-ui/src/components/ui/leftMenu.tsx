import { Button } from "./button";
import { Activity, LayoutDashboard, Settings, Moon } from "lucide-react";

export default function LeftMenu({ handleWithBlur, toggleDarkMode }: { handleWithBlur: (callback: () => void) => () => void; toggleDarkMode: () => void; }) {
    return (
        <>
            <div className="flex-col w-full">

                <h2 className="text-lg font-bold">Dashboard</h2>
                <nav className="flexflex-row pace-y-2 text-sm mt-4">
                    <Button variant="default" onClick={e => e.currentTarget.blur()} className="mb-3 cursor-pointer w-full flex items-center gap-2 text-foreground bg-accent-background hover:text-white-500 transition-colors outline-1" asChild>
                        <a href="#">
                            <LayoutDashboard className="w-4 h-4 mr-2" /> Overview
                        </a>
                    </Button>
                    <Button variant="default" onClick={e => e.currentTarget.blur()} className="mb-3 cursor-pointer w-full flex items-center gap-2 text-foreground bg-accent-background hover:text-secondary transition-colors outline-1" asChild>
                        <a href="#">
                            <Activity className="w-4 h-4 mr-2" /> Live Stats
                        </a>
                    </Button>
                    <Button variant="default" onClick={e => e.currentTarget.blur()} className="mb-3 cursor-pointer w-full flex items-center gap-2 text-foreground bg-accent-background hover:text-secondary transition-colors outline-1" asChild>
                        <a href="#">
                            <Settings className="w-4 h-4 mr-2" /> Settings
                        </a>
                    </Button>
                </nav>
            </div>

            <div className="flex-col w-full">
                <Button variant="default" onClick={handleWithBlur(toggleDarkMode)} className="mb-3 cursor-pointer w-full flex items-center gap-2 text-foreground bg-accent-background hover:text-secondary transition-colors outline-1">
                    <Moon className="w-4 h-4 mr-2" /> Toggle Theme
                </Button>
            </div>
        </>
    )
}