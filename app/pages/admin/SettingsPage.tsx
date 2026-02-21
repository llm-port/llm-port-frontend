import { useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";

import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";

import UsersPage from "~/pages/admin/UsersPage";

type SettingsTab = "users";

function getCurrentTab(pathname: string, tabQuery: string | null): SettingsTab {
  if (pathname === "/admin/users") return "users";
  if (tabQuery === "users") return "users";
  return "users";
}

export default function SettingsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const tab = useMemo(
    () => getCurrentTab(location.pathname, searchParams.get("tab")),
    [location.pathname, searchParams],
  );

  function handleTabChange(_event: React.SyntheticEvent, nextTab: SettingsTab) {
    navigate(`/admin/settings?tab=${nextTab}`, { replace: true });
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: 0, height: "100%" }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ mb: 1 }}>
          Settings
        </Typography>
        <Tabs value={tab} onChange={handleTabChange}>
          <Tab label="User Management" value="users" />
        </Tabs>
      </Box>

      <Box sx={{ minHeight: 0, flexGrow: 1, display: "flex", flexDirection: "column" }}>
        {tab === "users" && <UsersPage />}
      </Box>
    </Box>
  );
}
