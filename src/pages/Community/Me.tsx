import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const Me = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id;
      if (uid) navigate(`/community/user/${uid}`, { replace: true });
      else navigate('/login', { replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#05070d] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
};

export default Me;
