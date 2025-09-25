'use client';

import { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';

// Dynamic chart component that only loads on client side
export default function Chart({ data, options, title, height = 280 }) {
  const [ChartComponent, setChartComponent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only import Chart.js components on client side
    const loadChart = async () => {
      try {
        // Dynamic import to prevent SSR issues
        const { Line } = await import('react-chartjs-2');
        const ChartModule = await import('chart.js');
        const {
          Chart: ChartJS,
          CategoryScale,
          LinearScale,
          PointElement,
          LineElement,
          Title,
          Tooltip,
          Legend,
          Filler
        } = ChartModule;

        // Register Chart.js components
        ChartJS.register(
          CategoryScale,
          LinearScale,
          PointElement,
          LineElement,
          Title,
          Tooltip,
          Legend,
          Filler
        );

        setChartComponent(() => Line);
      } catch (err) {
        console.error('Failed to load chart component:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadChart();
  }, []);

  if (isLoading) {
    return (
      <Box
        sx={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <CircularProgress size={40} sx={{ color: 'primary.main' }} />
        <Typography variant="body2" color="text.secondary">
          Loading chart...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2,
          p: 3
        }}
      >
        <Typography variant="h6" color="error">
          📊
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Chart failed to load
          <br />
          {title && `(${title})`}
        </Typography>
      </Box>
    );
  }

  if (!ChartComponent) {
    return (
      <Box
        sx={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Chart component not available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height }}>
      <ChartComponent
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          ...options
        }}
      />
    </Box>
  );
}