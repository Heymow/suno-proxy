// import { handleWithBlur } from "@/utils/theme";
import MenuItem from "../ui/items/MenuItem";


export default function Settings({
    error,
    className,
}: {
    error: string | null;
    className?: string;
}) {

    if (error) {
        return (
            <div className="flex items-center justify-center h-full text-red-500">
                {error}
            </div>
        );
    }

    return (
        <div className={className}>
            <div className="flex-1 items-center justify-between mb-6">
                <div className="mb-6">
                    <span className="hidden">Separator</span>
                </div>
                <div className="flex-1 items-center justify-between mb-6">
                    <MenuItem
                        submenu={true}
                        title="API Status" />
                </div>
                <MenuItem submenu={true} title="API Throttle (auto speed)" />
            </div>
            <div className="flex-1 items-center justify-between mb-6">
                <MenuItem submenu={true} title="Caching" />
            </div>
            <div className="flex-1 items-center justify-between mb-6">
                <MenuItem submenu={true} title="Console" />
            </div>
            <div className="flex-1 items-center justify-between mb-6">
                <MenuItem submenu={true} title="Reset Stats" />
            </div>
            <div className="flex-1 items-center justify-between mb-6">
                <MenuItem submenu={true} title="Logout" />
            </div>

            <div className="grid grid-cols-1 3xl:grid-cols-2 gap-3">

            </div>

            <div className="flex items-center justify-between mt-4 -mb-4">

            </div>

        </div>
    );
}
