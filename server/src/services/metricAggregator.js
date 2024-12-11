const { Op } = require('sequelize');
const { Metric, CallMetric, TransferMetric } = require('../models/metrics');

class MetricAggregator {
    constructor() {
        this.aggregationIntervals = {
            MINUTE: 60 * 1000,
            HOUR: 60 * 60 * 1000,
            DAY: 24 * 60 * 60 * 1000
        };
    }

    async aggregateCallMetrics(timeframe = 'HOUR') {
        const interval = this.aggregationIntervals[timeframe];
        const now = new Date();
        const startTime = new Date(now - interval);

        const metrics = await CallMetric.findAll({
            where: {
                timestamp: {
                    [Op.gte]: startTime,
                    [Op.lt]: now
                }
            }
        });

        return {
            avgPacketLoss: this._calculateAverage(metrics, 'packetLoss'),
            avgJitter: this._calculateAverage(metrics, 'jitter'),
            avgRoundTripTime: this._calculateAverage(metrics, 'roundTripTime'),
            avgFrameRate: this._calculateAverage(metrics, 'frameRate'),
            totalCalls: metrics.length,
            timeframe,
            startTime,
            endTime: now
        };
    }

    async aggregateTransferMetrics(timeframe = 'HOUR') {
        const interval = this.aggregationIntervals[timeframe];
        const now = new Date();
        const startTime = new Date(now - interval);

        const metrics = await TransferMetric.findAll({
            where: {
                timestamp: {
                    [Op.gte]: startTime,
                    [Op.lt]: now
                }
            }
        });

        return {
            avgTransferSpeed: this._calculateAverage(metrics, 'transferSpeed'),
            totalBytesTransferred: this._calculateSum(metrics, 'bytesTransferred'),
            successRate: this._calculateSuccessRate(metrics),
            totalTransfers: metrics.length,
            timeframe,
            startTime,
            endTime: now
        };
    }

    async aggregatePerformanceMetrics(timeframe = 'HOUR') {
        const interval = this.aggregationIntervals[timeframe];
        const now = new Date();
        const startTime = new Date(now - interval);

        const metrics = await Metric.findAll({
            where: {
                type: 'performance',
                timestamp: {
                    [Op.gte]: startTime,
                    [Op.lt]: now
                }
            }
        });

        return {
            avgResponseTime: this._calculateAverage(metrics, 'responseTime'),
            avgCpuUsage: this._calculateAverage(metrics, 'cpuUsage'),
            avgMemoryUsage: this._calculateAverage(metrics, 'memoryUsage'),
            errorRate: this._calculateErrorRate(metrics),
            timeframe,
            startTime,
            endTime: now
        };
    }

    _calculateAverage(metrics, field) {
        if (!metrics.length) return 0;
        const sum = metrics.reduce((acc, metric) => acc + (metric[field] || 0), 0);
        return sum / metrics.length;
    }

    _calculateSum(metrics, field) {
        return metrics.reduce((acc, metric) => acc + (metric[field] || 0), 0);
    }

    _calculateSuccessRate(metrics) {
        if (!metrics.length) return 0;
        const successful = metrics.filter(m => m.status === 'success').length;
        return (successful / metrics.length) * 100;
    }

    _calculateErrorRate(metrics) {
        if (!metrics.length) return 0;
        const errors = metrics.filter(m => m.status === 'error').length;
        return (errors / metrics.length) * 100;
    }
}

module.exports = new MetricAggregator();
