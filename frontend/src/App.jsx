import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
const Login = lazy(() => import("./pages/Login"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Events = lazy(() => import("./pages/Events"));
const SelfiePage = lazy(() => import("./pages/SelfiePage"));
const Photographers = lazy(() => import("./pages/Photographers"));
const EventsDetails = lazy(() => import("./pages/EventsDetails"));
const DigitalAlbum = lazy(() => import("./pages/DigitalAlbum"));
const ProtectedRoutes = lazy(() => import("./components/ProtectedRoutes"));
const ImageGallery = lazy(() => import("./pages/ImageGallery"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const RoleRedirect = lazy(() => import("./components/RoleRedirect"));
const RequireAdmin = lazy(() => import("./components/RequireAdmin"));
const NotFound = lazy(() => import("./pages/NotFound"));
import LoadingSpinner from "./components/LoadingSpinner";
import { Toaster } from "./components/ui/sonner";
import { ThemeProvider } from "./context/ThemeContext";
import LandingPage from "./pages/Landingpage";
import Box from "@mui/material/Box";
import Topbar from "./components/Topbar";
import FaceDetail from "./pages/Profile";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="site_theme">
      <Suspense fallback={<LoadingSpinner />}>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/*"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Toaster position="bottom-right" richColors closeButton />
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route
                      path="/guest/event/:eventId"
                      element={<SelfiePage />}
                    />
                    <Route
                      path="/gallery/:eventId"
                      element={<ImageGallery />}
                    />
                    <Route
                      path="/event/:eventId/people/:faceId"
                      element={<FaceDetail />}
                    />
                    {/* <Route
                      path="/guests"
                      element={<Guests />}
                    /> */}
                    <Route
                      path="/album/event/:eventId/:userId"
                      element={<DigitalAlbum />}
                    />
                    <Route
                      element={
                        <>
                          <Topbar />
                          <Box
                            component="main"
                            sx={{
                              flexGrow: 1,
                              p: 2,
                              marginTop: "48px", // Reduced from 56px
                              marginLeft: "var(--sidebar-width)",
                              minHeight: "calc(100vh - 48px)", // Reduced from 56px
                              transition: "margin-left 0.3s ease",
                            }}
                          >
                            <ProtectedRoutes />
                          </Box>
                        </>
                      }
                    >
                      <Route index element={<RoleRedirect />} />
                      <Route
                        path="/AdminDashboard"
                        element={
                          <RequireAdmin>
                            <AdminDashboard />
                          </RequireAdmin>
                        }
                      />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/events/:id" element={<EventsDetails />} />
                      <Route path="/events" element={<Events />} />
                      <Route
                        path="/photographers"
                        element={
                          <RequireAdmin>
                            <Photographers />
                          </RequireAdmin>
                        }
                      />
                    </Route>
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              }
            />
          </Routes>
        </Router>
      </Suspense>
    </ThemeProvider>
  );
}

export default App;
