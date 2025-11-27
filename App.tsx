```javascript
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AdminPortal from './portals/AdminPortal';
import ClientPortal from './portals/ClientPortal';
// DevLanding is no longer used, so it can be removed from imports if not used elsewhere.
// import DevLanding from './components/DevLanding';

const App: React.FC = () => {
  }, []);

  if (portal === 'dev') {
    return <DevLanding />;
  }

  return (
    <BrowserRouter>
      {portal === 'admin' ? <AdminPortal /> : <ClientPortal />}
    </BrowserRouter>
  );
};

export default App;