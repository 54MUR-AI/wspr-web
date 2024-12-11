const axios = require('axios');
const WebSocket = require('ws');
const { performance } = require('perf_hooks');
const { createLogger } = require('../utils/logger');

class LoadTester {
    constructor() {
        this.logger = createLogger('LoadTester');
        this.results = {
            api: {},
            websocket: {},
            webrtc: {}
        };
    }

    async testAPIEndpoint(endpoint, method = 'GET', concurrency = 10, duration = 30000) {
        const startTime = Date.now();
        const requests = [];
        const results = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            avgLatency: 0,
            p95Latency: 0,
            p99Latency: 0,
            latencies: []
        };

        while (Date.now() - startTime < duration) {
            for (let i = 0; i < concurrency; i++) {
                const requestPromise = this.makeRequest(endpoint, method)
                    .then(latency => {
                        results.successfulRequests++;
                        results.latencies.push(latency);
                    })
                    .catch(err => {
                        results.failedRequests++;
                        this.logger.error(`Request failed: ${err.message}`);
                    })
                    .finally(() => {
                        results.totalRequests++;
                    });

                requests.push(requestPromise);
            }

            await Promise.all(requests);
            requests.length = 0; // Clear array for next batch
        }

        // Calculate statistics
        results.latencies.sort((a, b) => a - b);
        results.avgLatency = results.latencies.reduce((a, b) => a + b, 0) / results.latencies.length;
        results.p95Latency = results.latencies[Math.floor(results.latencies.length * 0.95)];
        results.p99Latency = results.latencies[Math.floor(results.latencies.length * 0.99)];

        this.results.api[endpoint] = results;
        return results;
    }

    async makeRequest(endpoint, method) {
        const start = performance.now();
        try {
            await axios({
                method,
                url: endpoint,
                timeout: 5000
            });
            return performance.now() - start;
        } catch (error) {
            throw error;
        }
    }

    async testWebSocket(url, messageRate = 10, duration = 30000) {
        const results = {
            totalMessages: 0,
            successfulMessages: 0,
            failedMessages: 0,
            avgLatency: 0,
            latencies: []
        };

        return new Promise((resolve) => {
            const ws = new WebSocket(url);
            const startTime = Date.now();
            let interval;

            ws.on('open', () => {
                interval = setInterval(() => {
                    if (Date.now() - startTime >= duration) {
                        clearInterval(interval);
                        ws.close();
                        return;
                    }

                    const timestamp = Date.now();
                    ws.send(JSON.stringify({ timestamp }));
                    results.totalMessages++;
                }, 1000 / messageRate);
            });

            ws.on('message', (data) => {
                const message = JSON.parse(data);
                const latency = Date.now() - message.timestamp;
                results.successfulMessages++;
                results.latencies.push(latency);
            });

            ws.on('error', (error) => {
                results.failedMessages++;
                this.logger.error(`WebSocket error: ${error.message}`);
            });

            ws.on('close', () => {
                if (results.latencies.length > 0) {
                    results.avgLatency = results.latencies.reduce((a, b) => a + b, 0) / results.latencies.length;
                }
                this.results.websocket[url] = results;
                resolve(results);
            });
        });
    }

    async testWebRTC(peerCount = 2, duration = 30000) {
        // Implement WebRTC load testing
        // This would involve creating multiple peer connections
        // and measuring connection establishment time, data channel
        // performance, and media streaming quality
        const results = {
            totalConnections: 0,
            successfulConnections: 0,
            failedConnections: 0,
            avgEstablishmentTime: 0,
            avgBitrate: 0,
            packetLoss: 0
        };

        // WebRTC load testing implementation would go here
        // This is a placeholder for the actual implementation

        this.results.webrtc['peerTest'] = results;
        return results;
    }

    getResults() {
        return this.results;
    }

    clearResults() {
        this.results = {
            api: {},
            websocket: {},
            webrtc: {}
        };
    }
}

module.exports = new LoadTester();
