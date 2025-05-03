export enum MenuChipVariant {
    BUTTON = 'button',
    TOGGLE = 'toggle',
    RANGE = 'range',
    CHECKBOX = 'checkbox',
    STATUS = 'status',
    REDBUTTON = 'redbutton',
}

export interface MenuChipProps {
    variant: MenuChipVariant;
    active?: boolean;
    text?: string;
    value?: string | boolean | number;
    range?: {
        start: string;
        end: string;
    };
}

import { handleWithBlur } from "@/utils/theme";

export default function MenuChip(props: MenuChipProps) {
    const { variant, text, value } = props;
    return (
        <>
            {
                (
                    () => {
                        switch (variant) {
                            case MenuChipVariant.BUTTON:
                                return (
                                    <button
                                        className={`cursor-pointer text-foreground px-4 py-2 rounded-lg shadow border border-border hover:bg-accent hover:text-accent-foreground transition-all duration-200`}
                                        onClick={handleWithBlur(() => { })}
                                    >
                                        {text ? `${text}` : 'Default'}
                                    </button>
                                );
                            case MenuChipVariant.TOGGLE:
                                return (
                                    <button
                                        className={`cursor-pointer text-foreground px-4 py-2 rounded-lg shadow border border-border hover:bg-accent hover:text-accent-foreground transition-all duration-200`}
                                        onClick={handleWithBlur(() => { })}
                                    >
                                        {text ? `${text}` : 'Default'}
                                    </button>
                                );
                            case MenuChipVariant.RANGE:
                                return (
                                    <input
                                        type="range"
                                        className={`cursor-pointer text-foreground px-4 py-2 rounded-lg shadow border border-border hover:bg-accent hover:text-accent-foreground transition-all duration-200`}
                                        onChange={handleWithBlur(() => { })}
                                    />
                                );
                            case MenuChipVariant.CHECKBOX:
                                return (
                                    <input
                                        type="checkbox"
                                        className={`cursor-pointer w-6 text-foreground px-4 py-2 rounded-lg shadow border border-border hover:bg-accent hover:text-accent-foreground transition-all duration-200`}
                                        onChange={handleWithBlur(() => { })}
                                    />
                                );
                            case MenuChipVariant.STATUS:
                                return (
                                    <span
                                        className={`flex align-middle text-foreground margin px-4 py-2 rounded-lg shadow border border-border transition-all duration-200`}
                                    >
                                        <div
                                            className={`cursor-pointer inline-block w-4 h-4 rounded-full border ${value ? 'bg-green-500' : 'bg-red-500'} mr-2 mt-3`}
                                        ></div>
                                        {value ? `ONLINE` : 'OFFLINE'}
                                    </span>
                                );
                            case MenuChipVariant.REDBUTTON:
                                return (
                                    <button
                                        className={`cursor-pointer text-foreground px-4 py-2 rounded-lg shadow border border-border hover:bg-red-500 hover:text-red-foreground transition-all duration-200`}
                                        onClick={handleWithBlur(() => { })}
                                    >
                                        {text ? `${text}` : 'Default'}
                                    </button>
                                );
                            default:
                                return null;
                        }
                    })()}
        </>
    )
}