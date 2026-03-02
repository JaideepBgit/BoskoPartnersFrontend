// components/UserLandingPage.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const UserLandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/surveys', { replace: true });
  }, [navigate]);

  return null;
};

export default UserLandingPage;
