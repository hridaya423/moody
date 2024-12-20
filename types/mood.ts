export interface Mood {
    id: number;
    created_at: string;
    mood: 'Happy' | 'Sad' | 'Stressed';
    event: string;
    user_id: string;
  }