import MonitoringDashboard from './MonitoringDashboard.tsx';
import { ErrorProvider } from './context/ErrorContext.tsx';

function App() {
  return (
    <ErrorProvider>
      <MonitoringDashboard />
    </ErrorProvider>
  )
}

export default App;