
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';


function App() {
  const session = localStorage.getItem('token');

  return (
    <Router>
      {session ? (
        <Routes>
          <Route path='/dashboard' element={<Dashboard />} />
          <Route path='*' element={<Navigate to={'/dashboard'} />} />
        </Routes>
      ) : (
        <Routes>
          <Route path='/' element={<SignIn />} />
          <Route path='/signup' element={<SignUp />} />
          <Route path='*' element={<Navigate to={'/'} />} />
        </Routes>
      )}
    </Router>
  );
}

export default App;