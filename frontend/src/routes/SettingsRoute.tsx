import { SettingsPage } from "../pages/SettingsPage";
import { useAuth } from "../auth/AuthContext";
import { useMacroData } from "../data/MacroDataContext";

export function SettingsRoute() {
  const { user, setUser } = useAuth();
  const { targets, refresh } = useMacroData();
  return (
    <SettingsPage
      user={user}
      targets={targets}
      onSaved={(u) => { setUser(u); refresh(); }}
    />
  );
}
