import { lazy } from 'react';

const MCPDashboard = lazy(() => import('../pages/mcp-dashboard/page'));
const NotFound = lazy(() => import('../pages/NotFound'));

const routes = [
  {
    path: '/',
    element: <MCPDashboard />
  },
  {
    path: '*',
    element: <NotFound />
  }
];

export default routes;
