import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Heart, Sparkles, Smile } from 'lucide-react';

export default async function Home() {
  const supabase = createServerComponentClient({ cookies });

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      redirect('/dashboard');
    }
  } catch (error) {
    console.error('Error checking session:', error);
  }

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-8 right-20 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-2xl bg-white shadow-lg p-4 rotate-3 hover:rotate-6 transition-transform duration-300">
            <Smile className="w-12 h-12 text-purple-600" />
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Welcome to Moody
          </h1>
          <p className="text-xl text-gray-600 max-w-md mx-auto">
            Analyze your emotional health!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mb-12">
          {[
            {
              icon: <Heart className="w-6 h-6" />,
              title: "Mood Tracking",
              description: "Track your emotional journey"
            },
            {
              icon: <Sparkles className="w-6 h-6" />,
              title: "Personalized Insights",
              description: "See how your emotional health can affect you"
            },
            {
              icon: <Sparkles className="w-6 h-6" />,
              title: "Personalized Analysis",
              description: "See how your emotional health can be improved"
            }
          ].map((feature, index) => (
            <div key={index} className="bg-white/60 backdrop-blur-lg rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-purple-100 text-purple-600 mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link 
            href="/auth"
            className="inline-flex items-center px-8 py-4 rounded-full font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            <span>Get Started</span>
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>

          <p className="mt-4 text-sm text-gray-600">
            Already have an account? Click the button above to sign in
          </p>
        </div>

        <div className="absolute bottom-6 left-0 right-0 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Moody. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}