import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
  useTheme,
  Tabs,
  Tab,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAppSelector } from '../../app/hooks';
import { selectUser } from '../auth/authSlice';
import SystemMetrics from './SystemMetrics';
import PerformanceReport from './PerformanceReport';

interface MetricData {
  timestamp: string;
  value: number;
}

interface CallQualityData {
  timestamp: string;
  packetsLost: number;
  jitter: number;
  roundTripTime: number;
}

interface TransferData {
  timestamp: string;
  bytesTransferred: number;
  speed: number;
}

interface ErrorData {
  type: string;
  count: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`monitoring-tabpanel-${index}`}
      aria-labelledby={`monitoring-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `monitoring-tab-${index}`,
    'aria-controls': `monitoring-tabpanel-${index}`,
  };
}

const MonitoringDashboard: React.FC = () => {
  const theme = useTheme();
  const user = useAppSelector(selectUser);
  const [activeTab, setActiveTab] = useState(0);
  const [callMetrics, setCallMetrics] = useState<CallQualityData[]>([]);
  const [transferMetrics, setTransferMetrics] = useState<TransferData[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<MetricData[]>([]);
  const [errorMetrics, setErrorMetrics] = useState<ErrorData[]>([]);
  const [value, setValue] = useState(0);

  const fetchMetrics = async () => {
    try {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours

      // Fetch call metrics
      const callResponse = await fetch(
        `/api/monitoring/metrics?type=call&startTime=${startTime.toISOString()}&endTime=${endTime.toISOString()}`
      );
      const callData = await callResponse.json();
      setCallMetrics(callData);

      // Fetch transfer metrics
      const transferResponse = await fetch(
        `/api/monitoring/metrics?type=transfer&startTime=${startTime.toISOString()}&endTime=${endTime.toISOString()}`
      );
      const transferData = await transferResponse.json();
      setTransferMetrics(transferData);

      // Fetch performance metrics
      const performanceResponse = await fetch(
        `/api/monitoring/metrics?type=performance&startTime=${startTime.toISOString()}&endTime=${endTime.toISOString()}`
      );
      const performanceData = await performanceResponse.json();
      setPerformanceMetrics(performanceData);

      // Fetch error metrics
      const errorResponse = await fetch(
        `/api/monitoring/metrics?type=error&startTime=${startTime.toISOString()}&endTime=${endTime.toISOString()}`
      );
      const errorData = await errorResponse.json();
      setErrorMetrics(errorData);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.error.main,
    theme.palette.warning.main,
  ];

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Monitoring Dashboard
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleChange} aria-label="monitoring tabs">
            <Tab label="Real-time Metrics" {...a11yProps(0)} />
            <Tab label="Performance Reports" {...a11yProps(1)} />
          </Tabs>
        </Box>
        <TabPanel value={value} index={0}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{ mb: 3 }}
          >
            <Tab label="Application Metrics" />
            <Tab label="System Metrics" />
          </Tabs>

          {activeTab === 0 ? (
            <Grid container spacing={3}>
              {/* Call Quality Metrics */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Call Quality
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={callMetrics}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="timestamp"
                            tickFormatter={(time) =>
                              new Date(time).toLocaleTimeString()
                            }
                          />
                          <YAxis />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="packetsLost"
                            stroke={theme.palette.error.main}
                            name="Packets Lost"
                          />
                          <Line
                            type="monotone"
                            dataKey="jitter"
                            stroke={theme.palette.warning.main}
                            name="Jitter"
                          />
                          <Line
                            type="monotone"
                            dataKey="roundTripTime"
                            stroke={theme.palette.info.main}
                            name="Round Trip Time"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* File Transfer Metrics */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      File Transfers
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={transferMetrics}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="timestamp"
                            tickFormatter={(time) =>
                              new Date(time).toLocaleTimeString()
                            }
                          />
                          <YAxis />
                          <Tooltip />
                          <Bar
                            dataKey="bytesTransferred"
                            fill={theme.palette.primary.main}
                            name="Bytes Transferred"
                          />
                          <Bar
                            dataKey="speed"
                            fill={theme.palette.secondary.main}
                            name="Speed"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Performance Metrics */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Performance
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={performanceMetrics}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="timestamp"
                            tickFormatter={(time) =>
                              new Date(time).toLocaleTimeString()
                            }
                          />
                          <YAxis />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke={theme.palette.success.main}
                            name="Performance"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Error Distribution */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Error Distribution
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={errorMetrics}
                            dataKey="count"
                            nameKey="type"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label
                          >
                            {errorMetrics.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <SystemMetrics />
          )}
        </TabPanel>
        <TabPanel value={value} index={1}>
          <PerformanceReport />
        </TabPanel>
      </Box>
    </Container>
  );
};

export default MonitoringDashboard;
