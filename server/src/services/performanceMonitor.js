const os = require('os');
const { performance } = require('perf_hooks');
const { EventEmitter } = require('events');
const { createLogger } = require('../utils/logger');
const disk = require('diskusage');
const netstat = require('node-netstat');

class PerformanceMonitor extends EventEmitter {
    constructor() {
        super();
        this.logger = createLogger('PerformanceMonitor');
        this.metrics = {
            cpu: [],
            memory: [],
            network: [],
            disk: [],
            callLatency: [],
            apiLatency: []
        };
        this.thresholds = {
            cpu: 80, // CPU usage percentage
            memory: 85, // Memory usage percentage
            disk: 90, // Disk usage percentage
            callLatency: 300, // milliseconds
            apiLatency: 1000, // milliseconds
            networkThroughput: 100 * 1024 * 1024 // 100 MB/s
        };
        this.networkStats = {
            bytesIn: 0,
            bytesOut: 0,
            lastUpdate: Date.now()
        };
    }

    start() {
        this.startCPUMonitoring();
        this.startMemoryMonitoring();
        this.startNetworkMonitoring();
        this.startDiskMonitoring();
    }

    startCPUMonitoring() {
        setInterval(() => {
            const cpus = os.cpus();
            const cpuUsage = this.calculateCPUUsage(cpus);
            this.metrics.cpu.push({
                timestamp: Date.now(),
                usage: cpuUsage,
                temperature: this.getCPUTemperature(),
                cores: cpus.length
            });

            if (cpuUsage > this.thresholds.cpu) {
                this.emit('highCPUUsage', { usage: cpuUsage });
            }
        }, 5000);
    }

    startMemoryMonitoring() {
        setInterval(() => {
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const usedMem = ((totalMem - freeMem) / totalMem) * 100;
            const heapUsed = process.memoryUsage().heapUsed;
            const heapTotal = process.memoryUsage().heapTotal;

            this.metrics.memory.push({
                timestamp: Date.now(),
                total: totalMem,
                free: freeMem,
                used: usedMem,
                heapUsed,
                heapTotal
            });

            if (usedMem > this.thresholds.memory) {
                this.emit('highMemoryUsage', { usage: usedMem });
            }
        }, 5000);
    }

    startNetworkMonitoring() {
        setInterval(() => {
            netstat({
                filter: {
                    state: 'ESTABLISHED'
                },
                limit: 1000
            }, (data) => {
                const now = Date.now();
                const timeDiff = (now - this.networkStats.lastUpdate) / 1000; // seconds
                const bytesInPerSec = (data.bytesIn - this.networkStats.bytesIn) / timeDiff;
                const bytesOutPerSec = (data.bytesOut - this.networkStats.bytesOut) / timeDiff;

                this.metrics.network.push({
                    timestamp: now,
                    connections: data.length,
                    throughputIn: bytesInPerSec,
                    throughputOut: bytesOutPerSec,
                    interfaces: os.networkInterfaces()
                });

                if (bytesInPerSec > this.thresholds.networkThroughput || 
                    bytesOutPerSec > this.thresholds.networkThroughput) {
                    this.emit('highNetworkUsage', { 
                        throughputIn: bytesInPerSec,
                        throughputOut: bytesOutPerSec
                    });
                }

                this.networkStats = {
                    bytesIn: data.bytesIn,
                    bytesOut: data.bytesOut,
                    lastUpdate: now
                };
            });
        }, 10000);
    }

    startDiskMonitoring() {
        setInterval(async () => {
            try {
                const rootPath = os.platform() === 'win32' ? 'C:' : '/';
                const diskInfo = await disk.check(rootPath);
                const usedPercentage = ((diskInfo.total - diskInfo.free) / diskInfo.total) * 100;

                this.metrics.disk.push({
                    timestamp: Date.now(),
                    total: diskInfo.total,
                    free: diskInfo.free,
                    used: diskInfo.total - diskInfo.free,
                    usedPercentage
                });

                if (usedPercentage > this.thresholds.disk) {
                    this.emit('highDiskUsage', { usage: usedPercentage });
                }
            } catch (error) {
                this.logger.error('Failed to get disk usage:', error);
            }
        }, 30000);
    }

    getCPUTemperature() {
        // This is a placeholder. Actual implementation would depend on the OS
        // and available hardware monitoring tools
        return null;
    }

    calculateCPUUsage(cpus) {
        let totalIdle = 0;
        let totalTick = 0;

        cpus.forEach(cpu => {
            for (const type in cpu.times) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        });

        return ((1 - totalIdle / totalTick) * 100).toFixed(2);
    }

    getMetrics(type, timeRange) {
        const now = Date.now();
        if (type === 'all') {
            return {
                cpu: this.metrics.cpu.filter(m => now - m.timestamp <= timeRange),
                memory: this.metrics.memory.filter(m => now - m.timestamp <= timeRange),
                network: this.metrics.network.filter(m => now - m.timestamp <= timeRange),
                disk: this.metrics.disk.filter(m => now - m.timestamp <= timeRange)
            };
        }
        return this.metrics[type].filter(metric => 
            (now - metric.timestamp) <= timeRange
        );
    }

    setThreshold(metric, value) {
        if (metric in this.thresholds) {
            this.thresholds[metric] = value;
            return true;
        }
        return false;
    }

    clearOldMetrics(timeRange) {
        const now = Date.now();
        for (const metricType in this.metrics) {
            this.metrics[metricType] = this.metrics[metricType].filter(
                metric => (now - metric.timestamp) <= timeRange
            );
        }
    }
}

module.exports = new PerformanceMonitor();
