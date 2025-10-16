
import { RouteObject } from 'react-router-dom';
import { lazy } from 'react';

const MCPDashboard = lazy(() => import('../pages/mcp-dashboard/page'));
const NotFound = lazy(() => import('../pages/NotFound'));

const routes: RouteObject[] = [
  {
    path: '/',
    element: <MCPDashboard />
  },
  {
    path: '/mcp-dashboard',
    element: <MCPDashboard />
  },
  {
    path: '*',
    element: <NotFound />
  }
];

export default routes;
