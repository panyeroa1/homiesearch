import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminPortal from './portals/AdminPortal';
import ClientPortal from './portals/ClientPortal';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/*" element={<AdminPortal />} />
        <Route path="/*" element={<ClientPortal />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;