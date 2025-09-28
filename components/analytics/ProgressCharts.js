'use client';

import {
  Paper,
  Typography,
  Box,
  Grid
} from '@mui/material';
import dynamic from 'next/dynamic';

// Dynamically import the Chart component to prevent SSR issues
const Chart = dynamic(() => import('@/components/Chart'), {
  ssr: false,
  loading: () => (
    <Box sx={{
      height: 280,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Typography>Loading chart...</Typography>
    </Box>
  )
});

/**
 * ProgressCharts component displays strength progression charts
 * @param {Object} props - Component props
 * @param {Array} props.chartData - Array of chart data objects
 */
export default function ProgressCharts({ chartData }) {
  if (!chartData || chartData.length === 0) {
    return null;
  }

  return (
    <Paper
      sx={{
        background: '#1a1a1a',
        border: '1px solid #333',
        p: 3,
        mb: 3
      }}
    >
      <Typography
        variant="h6"
        sx={{
          mb: 3,
          fontWeight: 700,
          textAlign: 'center',
          fontSize: { xs: '1.1rem', sm: '1.25rem' },
          lineHeight: 1.2
        }}
      >
        STRENGTH PROGRESSION
      </Typography>
      <Grid container spacing={3}>
        {chartData.map((exercise) => (
          <Grid item xs={12} md={6} key={exercise.name}>
            <Box
              sx={{
                p: 3,
                background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.9), rgba(255, 68, 68, 0.05))',
                border: '1px solid #333',
                borderRadius: 2,
                height: 350
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, textAlign: 'center' }}>
                {exercise.name}
              </Typography>
              <Chart
                data={{
                  labels: exercise.data.map(d => d.date),
                  datasets: [
                    {
                      label: 'Max Weight (kg)',
                      data: exercise.data.map(d => d.weight),
                      borderColor: '#ff4444',
                      backgroundColor: 'rgba(255, 68, 68, 0.1)',
                      borderWidth: 3,
                      pointBackgroundColor: '#ff4444',
                      pointBorderColor: '#ffffff',
                      pointBorderWidth: 2,
                      pointRadius: 6,
                      tension: 0.4,
                      fill: true
                    }
                  ]
                }}
                options={{
                  plugins: {
                    legend: {
                      display: false
                    },
                    tooltip: {
                      backgroundColor: '#1a1a1a',
                      titleColor: '#fff',
                      bodyColor: '#fff',
                      borderColor: '#ff4444',
                      borderWidth: 1
                    }
                  },
                  scales: {
                    x: {
                      grid: {
                        color: '#333'
                      },
                      ticks: {
                        color: '#ccc',
                        maxTicksLimit: 5
                      }
                    },
                    y: {
                      grid: {
                        color: '#333'
                      },
                      ticks: {
                        color: '#ccc',
                        callback: function(value) {
                          return value + ' kg';
                        }
                      }
                    }
                  }
                }}
                title={exercise.name}
                height={280}
              />
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}
