export default function LastUpdated({ loading, error }: { loading: boolean; error: string | null }) {

    return (<div className="flex items-center gap-2 mb-6">
        <span className="text-muted-foreground text-sm">
            Last updated: {loading ? (
                <span className="animate-pulse">{new Date().toLocaleTimeString()}</span>
            ) : (
                new Date().toLocaleTimeString()
            )}
        </span>
        {error && (
            <span className="text-destructive font-medium text-sm text-center ">
                Error: {error}
            </span>
        )}
    </div>)
}