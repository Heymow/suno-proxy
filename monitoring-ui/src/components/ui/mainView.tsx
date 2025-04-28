import OverviewView from "./OverviewView";
import LiveStats from "./LiveStats";

// import EndpointView from "./EndpointView";
// import StatusCodeView from "./StatusCodeView";
// import ErrorView from "./ErrorView";

export default function MainView({ view = "overview", ...props }) {
    switch (view) {
        case "Overview":
            return (
                <OverviewView
                    stats={props.stats}
                    loading={props.loading}
                    error={props.error}
                    resetStats={props.resetStats}
                    toggleDarkMode={props.toggleDarkMode}
                />
            );
        case "Live Stats":
            return <LiveStats
                stats={props.stats}
                loading={props.loading}
                error={props.error}
                resetStats={props.resetStats}
                toggleDarkMode={props.toggleDarkMode}
            />;
        // case "Settings":
        //     return <ErrorView {...props} />;
        // case "Status Code":
        //     return <StatusCodeView {...props} />;
        // case "Endpoint":
        //     return <EndpointView {...props} />;
        // case "Errors":
        //     return <ErrorView {...props} />;
        // case "Error":
        //     return <ErrorView {...props} />;
        default:
            return <div>Unknown view</div>;
    }
}
