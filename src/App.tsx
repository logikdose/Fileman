import "./App.css";
import { enableMapSet } from "immer";
import { ThemeProvider } from "./components/theme-provider";
import Layout from "./layout/layout";
import { Toaster } from "./components/ui/sonner";
import { useEffect } from "react";
import useSessionStore from "./stores/session.store";

function App() {
  enableMapSet();

  const disconnectAllSessions = useSessionStore((state) => state.disconnectAllSessions);
  useEffect(() => {
    // Disconnect all sessions on unmount
    return () => {
      disconnectAllSessions();
    };
  }, []);



  // Render
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Layout />
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
