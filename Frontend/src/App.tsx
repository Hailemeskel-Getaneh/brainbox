import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import TopicView from './components/TopicView';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import UserProfile from './components/UserProfile';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Footer from './components/Footer';

/**
 * The main application component.
 * It sets up the authentication and theme providers, and defines the application's routes.
 */
function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <div className="flex flex-col min-h-screen">
          <BrowserRouter>
            <div className="flex-grow">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/topic/:topicId" element={<TopicView />} />
                  <Route path="/profile" element={<UserProfile />} />
                </Route>
              </Routes>
            </div>
            <Footer />
          </BrowserRouter>
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
