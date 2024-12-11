import React from 'react';
import { useRoutes } from 'react-router-dom';
import Home from './pages/Home';
import NotFound from './pages/NotFound';

const Routes = () => {
  return useRoutes([
    {
      path: '/',
      element: <Home />,
    },
    {
      path: '*',
      element: <NotFound />,
    },
  ]);
};

export default Routes;
