import "./App.css";
import { enableMapSet } from "immer";
import { ThemeProvider } from "./components/theme-provider";
import Layout from "./layout/layout";
import { Toaster } from "./components/ui/sonner";
import { useEffect } from "react";
import useSessionStore from "./stores/session.store";
import useTabStore from "./stores/tab.store";



function App() {
  enableMapSet();

  const disconnectAllSessions = useSessionStore((state) => state.disconnectAllSessions);
  const tabs = useTabStore((state) => state.tabs);
  const activeTabId = useTabStore((state) => state.activeTabId);
  const setActiveTab = useTabStore((state) => state.setActiveTab);

  useEffect(() => {
    // If there is no active tab, set the first tab as active
    if (tabs.length > 0 && !activeTabId) {
      setActiveTab(tabs[0].id);
    }

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
