interface HeaderProps {
    subheader: boolean;
    title: string;
}

export default function Header({ subheader, title }: HeaderProps) {
    return (
        <header className={`bg-card px-6 py-4 ${subheader && 'ml-7'} shadow border-b border-border rounded-xl text-xl font-semibold mb-4`}>
            {title ? `${title}` : 'Default'}
        </header>
    )
}