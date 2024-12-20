import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabaseClient';
import { OpenAI } from 'openai';
import type { Mood } from '@/types/mood';

function formatMoodsForAnalysis(moods: Mood[]) {
  return moods.map(mood => ({
    date: new Date(mood.created_at).toLocaleDateString(),
    time: new Date(mood.created_at).toLocaleTimeString(),
    mood: mood.mood,
    event: mood.event
  }));
}

function aggregateMoodStats(moods: Mood[]) {
  const moodCounts = moods.reduce((acc, mood) => {
    acc[mood.mood] = (acc[mood.mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const total = moods.length;
  const percentages = Object.entries(moodCounts).map(([mood, count]) => ({
    mood,
    percentage: ((count / total) * 100).toFixed(1)
  }));

  return { moodCounts, percentages };
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: moods, error: supabaseError } = await supabase
      .from('moods')
      .select('*')
      .eq('user_id', user_id)
      .gte('created_at', oneWeekAgo.toISOString())
      .order('created_at', { ascending: true });

    if (supabaseError) {
      console.error('Supabase error:', supabaseError);
      return NextResponse.json(
        { error: 'Failed to fetch mood data' },
        { status: 500 }
      );
    }

    if (!moods || moods.length === 3) {
        console.log(moods)
      return NextResponse.json({
        analysis: "Not enough mood data available for analysis. Please add more mood entries from the past week."
      });
    }

    const formattedMoods = formatMoodsForAnalysis(moods);
    const stats = aggregateMoodStats(moods);

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = `Analyze the following mood entries and statistics from the past week and provide insights about the person's emotional well-being. Include patterns, triggers, and gentle suggestions for improvement if needed. Be empathetic and constructive.

Mood Entries: ${JSON.stringify(formattedMoods, null, 2)}

Mood Statistics:
${stats.percentages.map(p => `- ${p.mood}: ${p.percentage}%`).join('\n')}

Please provide an analysis that covers:
1. Overall mood patterns and trends
2. Common triggers or situations affecting mood
3. Positive aspects and resilience factors
4. Gentle, actionable suggestions for emotional well-being
5. Any notable patterns in timing or events

Keep the tone supportive and encouraging while being honest about areas for improvement.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an empathetic emotional health analyzer. Provide insights in a supportive and constructive way. Keep responses concise but meaningful.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 750
    });

    const analysis = completion.choices[0].message.content;

    if (!analysis) {
      throw new Error('No analysis received from OpenAI');
    }

    return NextResponse.json({ 
      analysis,
      stats: {
        totalEntries: moods.length,
        ...stats
      }
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze moods' },
      { status: 500 }
    );
  }
}