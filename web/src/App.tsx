import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import PageLoading from "./components/ui/PageLoading";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { Toast } from "./components/ui/Toast";

const HomePage = lazy(() => import("./pages/HomePage"));
const GeneratePage = lazy(() => import("./pages/GeneratePage"));
const LibraryPage = lazy(() => import("./pages/LibraryPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RemoveBgPage = lazy(() => import("./pages/RemoveBgPage"));
const BatchPage = lazy(() => import("./pages/BatchPage"));
const TemplatePage = lazy(() => import("./pages/TemplatePage"));

function App() {
  return (
    <>
      <Router>
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="login" element={<LoginPage />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route element={<ProtectedRoute />}>
                <Route path="generate" element={<GeneratePage />} />
                <Route path="templates" element={<TemplatePage />} />
                <Route path="library" element={<LibraryPage />} />
                <Route path="remove-bg" element={<RemoveBgPage />} />
                <Route path="batch" element={<BatchPage />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </Router>
      <Toast />
    </>
  );
}

export default App;
