export default function LastUpdated({ loading, error }: { loading: boolean; error: string | null }) {

    return (<div className="mb-3">
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