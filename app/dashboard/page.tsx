/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../utils/supabaseClient';
import { useSession } from '../../utils/SessionContext';
import MoodChart from '@/components/MoodChart';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Mood } from '@/types/mood';
import type { PostgrestError } from '@supabase/supabase-js';

interface MoodStats {
    totalEntries: number;
    moodCounts: Record<string, number>;
    percentages: Array<{
      mood: string;
      percentage: string;
    }>;
  }

const Dashboard = () => {
  const router = useRouter();
  const session = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [moods, setMoods] = useState<Mood[]>([]);
  const [mood, setMood] = useState<Mood['mood'] | ''>('');
  const [event, setEvent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [moodStats, setMoodStats] = useState<MoodStats | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw new Error(`Session error: ${sessionError.message}`);
        }
        
        if (!currentSession) {
          router.push('/');
          return;
        }

        setSessionChecked(true);
      } catch (error) {
        console.error('Session check failed:', error);
        router.push('/');
      }
    };

    checkSession();
  }, [router]);

  useEffect(() => {
    if (sessionChecked && session?.user?.id) {
      fetchMoods();
      setIsLoading(false);
    }
  }, [sessionChecked, session?.user?.id]);

  const fetchMoods = async () => {
    if (!session?.user?.id) {
      console.error('Attempting to fetch moods without user session', {
        sessionExists: !!session,
        userExists: !!session?.user,
        sessionChecked
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('moods')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        const supabaseError = error as PostgrestError;
        throw new Error(`Database error: ${supabaseError.message} (Code: ${supabaseError.code})`);
      }

      if (!data) {
        throw new Error('No data returned from database');
      }

      setMoods(data as Mood[]);
      setError(null);
    } catch (error) {
      let errorMessage = 'An unknown error occurred while fetching moods';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      console.error('Error fetching moods:', {
        error,
        userId: session?.user?.id,
        timestamp: new Date().toISOString(),
        sessionChecked
      });
      
      setError(errorMessage);
    }
  };

  const analyzeMoods = async () => {
    if (!session?.user?.id) return;
    
    setIsAnalyzing(true);
    setError(null);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: session.user.id }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze moods');
      }

      const { analysis, stats } = await response.json();
      setAnalysis(analysis);
      setMoodStats(stats);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to analyze moods');
      setAnalysis(null);
      setMoodStats(null);
    } finally {
      setIsAnalyzing(false);
    }
  };
  const addMood = async () => {
    if (!mood || !event || !session?.user?.id) return;
    
    setLoading(true);
    try {
      const newMood: Omit<Mood, 'id' | 'created_at'> = {
        mood,
        event,
        user_id: session.user.id
      };

      const { error } = await supabase
        .from('moods')
        .insert(newMood);

      if (error) throw error;
      
      await fetchMoods();
      setMood('');
      setEvent('');
      setError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while adding mood';
      console.error('Error adding mood:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const moodEmoji = {
    Happy: '😊',
    Sad: '😢',
    Stressed: '😓',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Moody</h1>
            <p className="text-gray-600 mt-2">Track and analyze your emotional well-being</p>
          </div>
          <button
            onClick={handleSignOut}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Sign Out
          </button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Add New Mood Entry</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(moodEmoji).map(([moodType, emoji]) => (
                    <button
                      key={moodType}
                      onClick={() => setMood(moodType as Mood['mood'])}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        mood === moodType 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-blue-200'
                      }`}
                    >
                      <div className="text-3xl mb-2">{emoji}</div>
                      <div className="font-medium">{moodType}</div>
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  className="w-full border-2 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="What's making you feel this way?"
                  value={event}
                  onChange={(e) => setEvent(e.target.value)}
                />
                <button
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={addMood}
                  disabled={loading || !mood || !event}
                >
                  {loading ? 'Adding...' : 'Add Mood Entry'}
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
    <CardHeader>
      <CardTitle>Mood Analysis</CardTitle>
    </CardHeader>
    <CardContent>
      <button
        onClick={analyzeMoods}
        disabled={isAnalyzing || moods.length === 0}
        className="w-full mb-4 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
      >
        {isAnalyzing ? 'Analyzing...' : 'Analyze My Moods'}
      </button>
      
      {moodStats && (
        <div className="mb-4 grid grid-cols-3 gap-4">
          {moodStats.percentages.map(({ mood, percentage }) => (
            <div key={mood} className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl mb-1">{moodEmoji[mood as keyof typeof moodEmoji]}</div>
              <div className="text-sm text-gray-600">{mood}</div>
              <div className="text-lg font-semibold">{percentage}%</div>
            </div>
          ))}
        </div>
      )}

      {analysis && (
        <div className="bg-gray-50 rounded-lg p-4 text-gray-700">
          {analysis.split('\n').map((paragraph, index) => (
            <p key={index} className="mb-2">
              {paragraph}
            </p>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Mood Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <MoodChart moodData={moods} />
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {moods.slice(0, 5).map((entry) => (
                <div key={entry.id} className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <span className="text-2xl mr-4">{moodEmoji[entry.mood]}</span>
                  <div>
                    <div className="font-medium">{entry.event}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(entry.created_at).toLocaleDateString()} at{' '}
                      {new Date(entry.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;