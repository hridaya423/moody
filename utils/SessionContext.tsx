'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

type SessionContextType = {
  session: Session | null;
};

const SessionContext = createContext<SessionContextType>({
  session: null,
});

export const SessionProvider = ({ 
  children,
  initialSession
}: { 
  children: React.ReactNode;
  initialSession: Session | null;
}) => {
  const [session, setSession] = useState<Session | null>(initialSession);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Set initial session if provided
    if (initialSession && !isInitialized) {
      setSession(initialSession);
      setIsInitialized(true);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsInitialized(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [initialSession, isInitialized]);

  return (
    <SessionContext.Provider value={{ session }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context.session;
};