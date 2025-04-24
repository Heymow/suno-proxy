export const toggleDarkMode = () => {
    const html = document.documentElement;
    html.classList.toggle('dark');
};

export const handleWithBlur = (fn: () => void) => () => {
    fn();
    document.activeElement instanceof HTMLElement && document.activeElement.blur();
};