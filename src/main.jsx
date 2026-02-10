import ReactDOM  from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";
import './i18n'; // Initialize i18n
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext'

ReactDOM.createRoot(document.getElementById("root")).render(
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
);
