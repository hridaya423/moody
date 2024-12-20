'use client';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import type { Mood } from '@/types/mood';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface MoodChartProps {
  moodData: Mood[];
}

const MoodChart = ({ moodData }: MoodChartProps) => {
  const options: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Your Mood Trends'
      }
    },
    scales: {
      y: {
        min: -1,
        max: 1,
        ticks: {
          callback: function(value) {
            if (value === 1) return 'Happy';
            if (value === 0) return 'Neutral';
            if (value === -1) return 'Sad';
            return '';
          }
        }
      }
    }
  };

  const data = {
    labels: moodData.map((m) => new Date(m.created_at).toLocaleDateString()),
    datasets: [
      {
        label: 'Mood Trend',
        data: moodData.map((m) =>
          m.mood === 'Happy' ? 1 : m.mood === 'Sad' ? -1 : 0
        ),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.3
      },
    ],
  };

  return <Line options={options} data={data} />;
};

export default MoodChart;