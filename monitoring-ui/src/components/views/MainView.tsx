import OverviewView from "./OverviewView";
import LiveStats from "./LiveStatsView";
import Settings from "@/components/views/SettingsView";

// import EndpointView from "./EndpointView";
// import StatusCodeView from "./StatusCodeView";
// import ErrorView from "./ErrorView";

export default function MainView({
    view = "overview",
    ...props
}
) {
    switch (view) {
        case "Overview":
            return (
                <OverviewView
                    stats={props.stats}
                    error={props.error}
                />
            );
        case "Live Stats":
            return <LiveStats
                stats={props.stats}
                error={props.error}
            />;
        case "Settings":
            return <Settings
                error={props.error}
                className="ml-10 "
            />;
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
