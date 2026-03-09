import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../src/lib/supabase";

type Props = {
  children: React.ReactNode;
};

const ProtectedAdminRoute: React.FC<Props> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          setAllowed(false);
          setLoading(false);
          return;
        }

        const { data: adminRow, error } = await supabase
          .from("admins")
          .select("id, username, auth_id")
          .eq("auth_id", session.user.id)
          .single();

        if (error || !adminRow) {
          setAllowed(false);
          setLoading(false);
          return;
        }

        setAllowed(true);
      } catch {
        setAllowed(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white px-6 py-4 rounded-lg shadow border-t-4 border-apra-dark">
          <p className="text-gray-700 font-medium">Checking admin access...</p>
        </div>
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedAdminRoute;