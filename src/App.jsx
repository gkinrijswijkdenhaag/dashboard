import { Outlet } from "react-router-dom";
import { NotificationProvider } from "./context/NotificationContext";

function App() {
  return (
    <NotificationProvider>
      <Outlet />
    </NotificationProvider>
  );
}

export default App;
