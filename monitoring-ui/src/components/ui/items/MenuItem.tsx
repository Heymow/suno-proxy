import MenuChip from "./MenuChip";
import { MenuChipVariant } from "./MenuChip";

interface MenuItem {
    submenu: boolean;
    title: string;
}

export default function MenuItem({ submenu, title }: MenuItem) {
    const buttonType = () => {
        switch (title) {
            case 'API Status':
                return MenuChipVariant.STATUS;
            case 'API Throttle (auto speed)':
                return MenuChipVariant.TOGGLE;
            case 'Caching':
                return MenuChipVariant.CHECKBOX;
            case 'Console':
                return MenuChipVariant.BUTTON;
            case 'Reset Stats':
                return MenuChipVariant.REDBUTTON;
            case 'Logout':
                return MenuChipVariant.REDBUTTON;
            default:
                return MenuChipVariant.BUTTON;
        }
    };
    return (
        <header className={`flex justify-between bg-card px-6 py-4 ${submenu && 'ml-7'} shadow border-b border-border rounded-xl text-xl font-semibold mb-4`}>
            <div className={`flex items-center justify-between ${submenu ? 'text-muted-foreground' : 'text-foreground'}`}>
                {title ? `${title}` : 'Default'}
            </div>
            <MenuChip
                variant={buttonType()}
                text={title}
                active={true}
                value={false}
            />
        </header >
    )
}