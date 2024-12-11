import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AssessmentIcon from '@mui/icons-material/Assessment';

interface ReportConfig {
  startTime: Date;
  endTime: Date;
  metrics: string[];
  format: 'pdf' | 'csv' | 'json';
}

interface PerformanceData {
  category: string;
  metric: string;
  min: number;
  max: number;
  avg: number;
  p95: number;
  p99: number;
  unit: string;
}

const PerformanceReport: React.FC = () => {
  const [config, setConfig] = useState<ReportConfig>({
    startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
    endTime: new Date(),
    metrics: ['cpu', 'memory', 'network', 'disk'],
    format: 'pdf',
  });
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<PerformanceData[]>([]);

  const generateReport = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/monitoring/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (config.format === 'pdf' || config.format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `performance-report.${config.format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        const data = await response.json();
        setReportData(data);
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Generate Performance Report
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <DateTimePicker
                    label="Start Time"
                    value={config.startTime}
                    onChange={(date) =>
                      setConfig({ ...config, startTime: date || new Date() })
                    }
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <DateTimePicker
                    label="End Time"
                    value={config.endTime}
                    onChange={(date) =>
                      setConfig({ ...config, endTime: date || new Date() })
                    }
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Metrics</InputLabel>
                    <Select
                      multiple
                      value={config.metrics}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          metrics: e.target.value as string[],
                        })
                      }
                      label="Metrics"
                    >
                      <MenuItem value="cpu">CPU Usage</MenuItem>
                      <MenuItem value="memory">Memory Usage</MenuItem>
                      <MenuItem value="network">Network Performance</MenuItem>
                      <MenuItem value="disk">Disk Usage</MenuItem>
                      <MenuItem value="calls">Call Quality</MenuItem>
                      <MenuItem value="transfers">File Transfers</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Format</InputLabel>
                    <Select
                      value={config.format}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          format: e.target.value as 'pdf' | 'csv' | 'json',
                        })
                      }
                      label="Format"
                    >
                      <MenuItem value="pdf">PDF</MenuItem>
                      <MenuItem value="csv">CSV</MenuItem>
                      <MenuItem value="json">JSON</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={1}>
                  <Button
                    variant="contained"
                    onClick={generateReport}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : config.format === 'json' ? <AssessmentIcon /> : <FileDownloadIcon />}
                    fullWidth
                  >
                    {loading ? 'Generating...' : 'Generate'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {reportData.length > 0 && (
          <Grid item xs={12}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell>Metric</TableCell>
                    <TableCell align="right">Min</TableCell>
                    <TableCell align="right">Max</TableCell>
                    <TableCell align="right">Avg</TableCell>
                    <TableCell align="right">95th %</TableCell>
                    <TableCell align="right">99th %</TableCell>
                    <TableCell>Unit</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.category}</TableCell>
                      <TableCell>{row.metric}</TableCell>
                      <TableCell align="right">{row.min.toFixed(2)}</TableCell>
                      <TableCell align="right">{row.max.toFixed(2)}</TableCell>
                      <TableCell align="right">{row.avg.toFixed(2)}</TableCell>
                      <TableCell align="right">{row.p95.toFixed(2)}</TableCell>
                      <TableCell align="right">{row.p99.toFixed(2)}</TableCell>
                      <TableCell>{row.unit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        )}
      </Grid>
    </LocalizationProvider>
  );
};

export default PerformanceReport;
