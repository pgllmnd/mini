import { createBrowserRouter } from 'react-router-dom';
import Layout from './components/Layout';
import { LanguageProvider } from './hooks/LanguageContext';
import { AuthProvider } from './hooks/useAuth';
import PrivateRoute from './components/PrivateRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import InitiateReset from './pages/InitiateReset';
import ResetPassword from './pages/ResetPassword';
import AskQuestion from './pages/AskQuestion';
import QuestionDetail from './pages/QuestionDetail';
import UserProfile from './pages/UserProfile';
import Tags from './pages/Tags';
import Users from './pages/Users';
import Chat from './pages/Chat';
import ComingSoon from './pages/ComingSoon';

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <AuthProvider>
        <LanguageProvider>
          <Layout />
        </LanguageProvider>
      </AuthProvider>
    ),
    children: [
      { index: true, element: <Home /> },
      { path: 'questions/ask', element: <PrivateRoute element={<AskQuestion />} /> },
      { path: 'questions/:id', element: <QuestionDetail /> },
      { path: 'question/:id', element: <QuestionDetail /> },
      { path: 'questions', element: <Home /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'forgot-password', element: <InitiateReset /> },
      { path: 'reset-password', element: <ResetPassword /> },
      { path: 'tags', element: <Tags /> },
      { path: 'users', element: <Users /> },
      { path: 'users/:username', element: <UserProfile /> },
      { path: 'user/:username', element: <UserProfile /> },
      { path: 'assistant', element: <Chat /> },
      { path: 'companies', element: <ComingSoon /> },
      { path: 'collectives/explore', element: <ComingSoon /> },
      { path: 'teams', element: <ComingSoon /> },
      { path: 'blog', element: <ComingSoon /> },
      { path: 'annonces', element: <ComingSoon /> }
    ]
  }
]);
