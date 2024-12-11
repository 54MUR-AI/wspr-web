const { CallMetric } = require('../models/metrics');
const metricAggregator = require('./metricAggregator');

class WebRTCAnalytics {
    constructor() {
        this.statsMapping = {
            'inbound-rtp': this._processInboundRTP.bind(this),
            'outbound-rtp': this._processOutboundRTP.bind(this),
            'remote-inbound-rtp': this._processRemoteInboundRTP.bind(this),
            'remote-outbound-rtp': this._processRemoteOutboundRTP.bind(this),
            'media-source': this._processMediaSource.bind(this),
            'track': this._processTrack.bind(this),
            'candidate-pair': this._processCandidatePair.bind(this),
            'local-candidate': this._processLocalCandidate.bind(this),
            'remote-candidate': this._processRemoteCandidate.bind(this)
        };
    }

    async processRTCStats(callId, stats, timestamp = new Date()) {
        const processedStats = {
            callId,
            timestamp,
            audio: { inbound: {}, outbound: {} },
            video: { inbound: {}, outbound: {} },
            network: {},
            connection: {}
        };

        for (const [id, stat] of Object.entries(stats)) {
            const processor = this.statsMapping[stat.type];
            if (processor) {
                await processor(stat, processedStats);
            }
        }

        await this._saveMetrics(processedStats);
        return processedStats;
    }

    async _processInboundRTP(stat, stats) {
        const mediaType = stat.mediaType;
        const direction = 'inbound';
        
        if (!mediaType) return;

        stats[mediaType][direction] = {
            ...stats[mediaType][direction],
            packetsReceived: stat.packetsReceived,
            packetsLost: stat.packetsLost,
            jitter: stat.jitter,
            framesDecoded: stat.framesDecoded,
            frameWidth: stat.frameWidth,
            frameHeight: stat.frameHeight,
            framesPerSecond: stat.framesPerSecond,
            qpSum: stat.qpSum,
            totalDecodeTime: stat.totalDecodeTime,
            totalInterFrameDelay: stat.totalInterFrameDelay,
            totalSquaredInterFrameDelay: stat.totalSquaredInterFrameDelay
        };
    }

    async _processOutboundRTP(stat, stats) {
        const mediaType = stat.mediaType;
        const direction = 'outbound';
        
        if (!mediaType) return;

        stats[mediaType][direction] = {
            ...stats[mediaType][direction],
            packetsSent: stat.packetsSent,
            bytesSent: stat.bytesSent,
            retransmittedPacketsSent: stat.retransmittedPacketsSent,
            framesEncoded: stat.framesEncoded,
            frameWidth: stat.frameWidth,
            frameHeight: stat.frameHeight,
            framesPerSecond: stat.framesPerSecond,
            qualityLimitationReason: stat.qualityLimitationReason,
            qualityLimitationResolutionChanges: stat.qualityLimitationResolutionChanges
        };
    }

    async _processRemoteInboundRTP(stat, stats) {
        const mediaType = stat.mediaType;
        if (!mediaType) return;

        stats.network = {
            ...stats.network,
            roundTripTime: stat.roundTripTime,
            totalRoundTripTime: stat.totalRoundTripTime,
            fractionLost: stat.fractionLost
        };
    }

    async _processRemoteOutboundRTP(stat, stats) {
        const mediaType = stat.mediaType;
        if (!mediaType) return;

        stats.network = {
            ...stats.network,
            remoteTimestamp: stat.remoteTimestamp,
            reportsSent: stat.reportsSent
        };
    }

    async _processMediaSource(stat, stats) {
        const mediaType = stat.kind;
        if (!mediaType) return;

        stats[mediaType].source = {
            ...stats[mediaType].source,
            trackIdentifier: stat.trackIdentifier,
            kind: stat.kind,
            audioLevel: stat.audioLevel,
            totalAudioEnergy: stat.totalAudioEnergy,
            totalSamplesDuration: stat.totalSamplesDuration
        };
    }

    async _processTrack(stat, stats) {
        const mediaType = stat.kind;
        if (!mediaType) return;

        stats[mediaType].track = {
            ...stats[mediaType].track,
            jitterBufferDelay: stat.jitterBufferDelay,
            jitterBufferEmittedCount: stat.jitterBufferEmittedCount,
            framesSent: stat.framesSent,
            hugeFramesSent: stat.hugeFramesSent
        };
    }

    async _processCandidatePair(stat, stats) {
        stats.connection = {
            ...stats.connection,
            availableOutgoingBitrate: stat.availableOutgoingBitrate,
            availableIncomingBitrate: stat.availableIncomingBitrate,
            currentRoundTripTime: stat.currentRoundTripTime,
            totalRoundTripTime: stat.totalRoundTripTime,
            nominated: stat.nominated,
            state: stat.state
        };
    }

    async _processLocalCandidate(stat, stats) {
        stats.connection.local = {
            ...stats.connection.local,
            candidateType: stat.candidateType,
            protocol: stat.protocol,
            address: stat.address,
            port: stat.port
        };
    }

    async _processRemoteCandidate(stat, stats) {
        stats.connection.remote = {
            ...stats.connection.remote,
            candidateType: stat.candidateType,
            protocol: stat.protocol,
            address: stat.address,
            port: stat.port
        };
    }

    async _saveMetrics(stats) {
        const { audio, video, network, connection } = stats;

        // Calculate aggregate metrics
        const packetLossRate = this._calculatePacketLossRate(audio, video);
        const averageRoundTripTime = network.roundTripTime || connection.currentRoundTripTime || 0;
        const averageJitter = this._calculateAverageJitter(audio, video);
        const averageBitrate = this._calculateAverageBitrate(connection);
        const frameRate = this._calculateFrameRate(video);
        const resolution = this._getMaxResolution(video);

        // Save to database
        await CallMetric.create({
            callId: stats.callId,
            timestamp: stats.timestamp,
            packetLoss: packetLossRate,
            roundTripTime: averageRoundTripTime,
            jitter: averageJitter,
            bitrate: averageBitrate,
            frameRate,
            resolution: JSON.stringify(resolution),
            rawStats: JSON.stringify(stats)
        });
    }

    _calculatePacketLossRate(audio, video) {
        let totalReceived = 0;
        let totalLost = 0;

        if (audio.inbound.packetsReceived) {
            totalReceived += audio.inbound.packetsReceived;
            totalLost += audio.inbound.packetsLost || 0;
        }
        if (video.inbound.packetsReceived) {
            totalReceived += video.inbound.packetsReceived;
            totalLost += video.inbound.packetsLost || 0;
        }

        return totalReceived ? (totalLost / totalReceived) * 100 : 0;
    }

    _calculateAverageJitter(audio, video) {
        const jitters = [];
        if (audio.inbound.jitter) jitters.push(audio.inbound.jitter);
        if (video.inbound.jitter) jitters.push(video.inbound.jitter);

        return jitters.length ? jitters.reduce((a, b) => a + b) / jitters.length : 0;
    }

    _calculateAverageBitrate(connection) {
        const { availableOutgoingBitrate, availableIncomingBitrate } = connection;
        const bitrates = [];
        
        if (availableOutgoingBitrate) bitrates.push(availableOutgoingBitrate);
        if (availableIncomingBitrate) bitrates.push(availableIncomingBitrate);

        return bitrates.length ? bitrates.reduce((a, b) => a + b) / bitrates.length : 0;
    }

    _calculateFrameRate(video) {
        return video.inbound.framesPerSecond || video.outbound.framesPerSecond || 0;
    }

    _getMaxResolution(video) {
        const width = video.inbound.frameWidth || video.outbound.frameWidth || 0;
        const height = video.inbound.frameHeight || video.outbound.frameHeight || 0;
        return { width, height };
    }

    async getCallAnalytics(callId, timeframe = 'HOUR') {
        const metrics = await CallMetric.findAll({
            where: { callId },
            order: [['timestamp', 'ASC']]
        });

        return {
            callId,
            metrics: metrics.map(m => ({
                timestamp: m.timestamp,
                packetLoss: m.packetLoss,
                roundTripTime: m.roundTripTime,
                jitter: m.jitter,
                bitrate: m.bitrate,
                frameRate: m.frameRate,
                resolution: JSON.parse(m.resolution)
            })),
            summary: await this._generateCallSummary(metrics)
        };
    }

    async _generateCallSummary(metrics) {
        if (!metrics.length) return null;

        const avgPacketLoss = metrics.reduce((sum, m) => sum + m.packetLoss, 0) / metrics.length;
        const avgRoundTripTime = metrics.reduce((sum, m) => sum + m.roundTripTime, 0) / metrics.length;
        const avgJitter = metrics.reduce((sum, m) => sum + m.jitter, 0) / metrics.length;
        const avgBitrate = metrics.reduce((sum, m) => sum + m.bitrate, 0) / metrics.length;
        const avgFrameRate = metrics.reduce((sum, m) => sum + m.frameRate, 0) / metrics.length;

        return {
            duration: metrics[metrics.length - 1].timestamp - metrics[0].timestamp,
            avgPacketLoss,
            avgRoundTripTime,
            avgJitter,
            avgBitrate,
            avgFrameRate,
            qualityScore: this._calculateQualityScore({
                packetLoss: avgPacketLoss,
                roundTripTime: avgRoundTripTime,
                jitter: avgJitter,
                bitrate: avgBitrate,
                frameRate: avgFrameRate
            })
        };
    }

    _calculateQualityScore(metrics) {
        // Weights for different metrics
        const weights = {
            packetLoss: 0.3,
            roundTripTime: 0.2,
            jitter: 0.2,
            bitrate: 0.15,
            frameRate: 0.15
        };

        // Normalize and score each metric
        const packetLossScore = Math.max(0, 100 - metrics.packetLoss * 10);
        const rttScore = Math.max(0, 100 - (metrics.roundTripTime / 300) * 100);
        const jitterScore = Math.max(0, 100 - (metrics.jitter / 50) * 100);
        const bitrateScore = Math.min(100, (metrics.bitrate / 2000000) * 100);
        const frameRateScore = Math.min(100, (metrics.frameRate / 30) * 100);

        // Calculate weighted average
        return (
            packetLossScore * weights.packetLoss +
            rttScore * weights.roundTripTime +
            jitterScore * weights.jitter +
            bitrateScore * weights.bitrate +
            frameRateScore * weights.frameRate
        );
    }
}

module.exports = new WebRTCAnalytics();
