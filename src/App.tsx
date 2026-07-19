import { Navigate, Route, Routes } from "react-router-dom";
import { useApp } from "./state/AppProvider";
import { AppShell, FullScreenLayout } from "./components/AppShell";
import { Onboarding } from "./screens/Onboarding";
import { Home } from "./screens/Home";
import { Tasks } from "./screens/Tasks";
import { Subject } from "./screens/Subject";
import { TestRunner } from "./screens/TestRunner";
import { TestResult } from "./screens/TestResult";
import { Progress } from "./screens/Progress";
import { Materials } from "./screens/Materials";
import { MaterialDetail } from "./screens/MaterialDetail";
import { Profile } from "./screens/Profile";
import { Calendar } from "./screens/Calendar";
import { Mistakes } from "./screens/Mistakes";

export function App() {
  const { state } = useApp();

  if (!state.authed) {
    return <Onboarding />;
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/materials" element={<Materials />} />
        <Route path="/material/:id" element={<MaterialDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/subject/:id" element={<Subject />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/mistakes" element={<Mistakes />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
      <Route element={<FullScreenLayout />}>
        <Route path="/test/:id" element={<TestRunner />} />
        <Route path="/result/:testId" element={<TestResult />} />
      </Route>
    </Routes>
  );
}
