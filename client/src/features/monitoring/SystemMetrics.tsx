import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  useTheme,
  LinearProgress,
  Tooltip as MuiTooltip,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface SystemMetric {
  timestamp: string;
  cpu: {
    usage: number;
    temperature: number | null;
    cores: number;
  };
  memory: {
    used: number;
    total: number;
    free: number;
    heapUsed: number;
    heapTotal: number;
  };
  network: {
    connections: number;
    throughputIn: number;
    throughputOut: number;
  };
  disk: {
    used: number;
    total: number;
    free: number;
    usedPercentage: number;
  };
}

const formatBytes = (bytes: number) => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
};

const SystemMetrics: React.FC = () => {
  const theme = useTheme();
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSystemMetrics = async () => {
    try {
      const response = await fetch('/api/monitoring/system-metrics');
      const data = await response.json();
      setMetrics(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch system metrics:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemMetrics();
    const interval = setInterval(fetchSystemMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <LinearProgress />;
  }

  const currentMetrics = metrics[metrics.length - 1] || {
    cpu: { usage: 0, temperature: null, cores: 0 },
    memory: { used: 0, total: 0, free: 0, heapUsed: 0, heapTotal: 0 },
    network: { connections: 0, throughputIn: 0, throughputOut: 0 },
    disk: { used: 0, total: 0, free: 0, usedPercentage: 0 },
  };

  return (
    <Grid container spacing={3}>
      {/* CPU Metrics */}
      <Grid item xs={12} md={6} lg={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              CPU Usage
            </Typography>
            <Typography variant="h4" color="primary">
              {currentMetrics.cpu.usage.toFixed(1)}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={currentMetrics.cpu.usage}
              color={currentMetrics.cpu.usage > 80 ? 'error' : 'primary'}
              sx={{ mt: 2 }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Cores: {currentMetrics.cpu.cores}
              {currentMetrics.cpu.temperature && 
                ` | Temp: ${currentMetrics.cpu.temperature}°C`}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Memory Usage */}
      <Grid item xs={12} md={6} lg={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Memory Usage
            </Typography>
            <Typography variant="h4" color="secondary">
              {(currentMetrics.memory.used / currentMetrics.memory.total * 100).toFixed(1)}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={currentMetrics.memory.used / currentMetrics.memory.total * 100}
              color={currentMetrics.memory.used / currentMetrics.memory.total > 0.85 ? 'error' : 'secondary'}
              sx={{ mt: 2 }}
            />
            <MuiTooltip title={`Heap: ${formatBytes(currentMetrics.memory.heapUsed)} / ${formatBytes(currentMetrics.memory.heapTotal)}`}>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {formatBytes(currentMetrics.memory.used)} / {formatBytes(currentMetrics.memory.total)}
              </Typography>
            </MuiTooltip>
          </CardContent>
        </Card>
      </Grid>

      {/* Network Usage */}
      <Grid item xs={12} md={6} lg={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Network
            </Typography>
            <Typography variant="h4" color="info">
              {currentMetrics.network.connections}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              In: {formatBytes(currentMetrics.network.throughputIn)}/s
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Out: {formatBytes(currentMetrics.network.throughputOut)}/s
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Disk Usage */}
      <Grid item xs={12} md={6} lg={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Disk Usage
            </Typography>
            <Typography variant="h4" color="warning">
              {currentMetrics.disk.usedPercentage.toFixed(1)}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={currentMetrics.disk.usedPercentage}
              color={currentMetrics.disk.usedPercentage > 90 ? 'error' : 'warning'}
              sx={{ mt: 2 }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {formatBytes(currentMetrics.disk.free)} free of {formatBytes(currentMetrics.disk.total)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Historical Charts */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              System Metrics History
            </Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(time) => new Date(time).toLocaleTimeString()}
                  />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="cpu.usage"
                    stroke={theme.palette.primary.main}
                    name="CPU Usage (%)"
                  />
                  <Line
                    type="monotone"
                    dataKey="memory.used"
                    stroke={theme.palette.secondary.main}
                    name="Memory Usage (%)"
                  />
                  <Line
                    type="monotone"
                    dataKey="disk.usedPercentage"
                    stroke={theme.palette.warning.main}
                    name="Disk Usage (%)"
                  />
                  <Line
                    type="monotone"
                    dataKey="network.connections"
                    stroke={theme.palette.info.main}
                    name="Network Connections"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default SystemMetrics;
