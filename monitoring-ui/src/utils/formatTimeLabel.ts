export function formatTimeLabel(timestamp: number): string {
    const date = new Date(timestamp);

    return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        // @ts-expect-error: fractionalSecondDigits is not yet supported in TS types
        fractionalSecondDigits: 1,
    });
}