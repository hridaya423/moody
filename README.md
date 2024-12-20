# Moody - Emotional Well-being Tracker

Moody is a full-stack web application that helps users track and analyze their emotional well-being. Built with Next.js, Tailwind CSS, Supabase, and OpenAI, it provides an intuitive interface for mood tracking and AI-powered insights.

![Moody Landing Page](https://cloud-qezh34qvk-hack-club-bot.vercel.app/0image.png)

## Features

- 🔐 Secure authentication with Supabase
- 📝 Easy mood logging with emoji selection
- 📊 Visual mood trends and statistics
- 🤖 AI-powered mood analysis using OpenAI
- 📱 Responsive design for all devices
- ⚡ Real-time updates with Supabase

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account
- OpenAI API key

### Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL='your_supabase_url'
NEXT_PUBLIC_SUPABASE_ANON_KEY='your_supabase_anon_key'
OPENAI_API_KEY='your_openai_api_key'
```

### Database Setup

1. Create a new Supabase project
2. Create a `moods` table with the following schema:

```sql
create table moods (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users not null,
  mood text not null,
  event text not null
);

-- Add RLS policies
alter table moods enable row level security;

create policy "Users can view their own moods"
  on moods for select
  using (auth.uid() = user_id);

create policy "Users can insert their own moods"
  on moods for insert
  with check (auth.uid() = user_id);
```

### Installation

1. Clone the repository:
```bash
git clone https://github.com/hridaya423/moody.git
cd moody
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser
