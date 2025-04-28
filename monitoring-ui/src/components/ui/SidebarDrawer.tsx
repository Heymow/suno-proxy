import {
    Drawer,
    DrawerContent,
    DrawerTrigger,
} from "@/components/ui/drawer";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Activity, LayoutDashboard, Settings, Moon } from "lucide-react";

export default function SidebarDrawer({ handleWithBlur, toggleDarkMode, setView }: { handleWithBlur: (callback: () => void) => () => void; toggleDarkMode: () => void; setView: (view: string) => void; }) {
    const [open, setOpen] = useState(false);

    // Ferme le drawer puis exécute l'action
    const closeAnd = (fn: () => void) => () => {
        setOpen(false);
        fn();
    };
    return (
        <div className="lg:hidden">
            <Drawer direction="left" open={open} onOpenChange={setOpen}>
                <DrawerTrigger asChild className="fixed top-4 left-4 z-50 ">
                    <Button variant="outline" className="mb-4 cursor-pointer w-20 h-10 bg-accent-foreground"
                        onClick={e => e.currentTarget.blur()}>
                        <Menu className="w-4 h-4" />
                    </Button>
                </DrawerTrigger>
                <DrawerContent className="p-6 bg-card text-card-foreground justify-between" >
                    <div className="flex-col w-full">

                        <h2 className="text-lg font-bold">Dashboard</h2>
                        <nav className="flexflex-row pace-y-2 text-sm mt-4">
                            <Button variant="default" onClick={handleWithBlur(closeAnd(() => setView("Overview")))} className="mb-3 cursor-pointer w-full flex items-center gap-2 text-foreground bg-accent-background hover:text-secondary transition-colors outline-1" asChild>
                                <a href="#" className="flex items-center gap-2 text-muted-foreground hover:text-secondary transition-colors">
                                    <LayoutDashboard className="w-4 h-4 mr-2" /> Overview
                                </a>
                            </Button>
                            <Button variant="default" onClick={handleWithBlur(closeAnd(() => setView("Live Stats")))} className="mb-3 cursor-pointer w-full flex items-center gap-2 text-foreground bg-accent-background hover:text-secondary transition-colors outline-1" asChild>
                                <a href="#" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                                    <Activity className="w-4 h-4 mr-2" /> Live Stats
                                </a>
                            </Button>
                            <Button variant="default" onClick={handleWithBlur(closeAnd(() => setView("Settings")))} className="mb-3 cursor-pointer w-full flex items-center gap-2 text-foreground bg-accent-background hover:text-secondary transition-colors outline-1" asChild>
                                <a href="#" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                                    <Settings className="w-4 h-4 mr-2" /> Settings
                                </a>
                            </Button>
                        </nav>
                    </div>
                    <div className="flex-col w-full mb-10">
                        <Button variant="default" onClick={handleWithBlur(toggleDarkMode)} className="mb-3 cursor-pointer w-full flex items-center gap-2 text-foreground bg-accent-background hover:text-secondary transition-colors outline-1">
                            <Moon className="w-4 h-4 mr-2" /> Toggle Theme
                        </Button>
                    </div>
                </DrawerContent>
            </Drawer>
        </div>
    );
}