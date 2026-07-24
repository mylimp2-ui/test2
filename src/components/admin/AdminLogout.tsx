import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminLogout() {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem('adminToken');
    navigate('/admin');
  }, [navigate]);

  return <div className="p-8 text-center">로그아웃 중...</div>;
}
