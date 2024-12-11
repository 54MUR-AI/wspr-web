const { Alert } = require('../models/metrics');
const metricAggregator = require('./metricAggregator');
const { sendEmail } = require('../utils/email');
const { sendSlackNotification } = require('../utils/slack');
const alertAutomation = require('./alertAutomation');

class AlertRules {
    constructor() {
        this.rules = new Map();
        this.severityLevels = ['INFO', 'WARNING', 'ERROR', 'CRITICAL'];
    }

    addRule(name, conditions, actions, severity = 'WARNING') {
        if (!this.severityLevels.includes(severity)) {
            throw new Error(`Invalid severity level. Must be one of: ${this.severityLevels.join(', ')}`);
        }

        this.rules.set(name, {
            conditions,
            actions,
            severity,
            enabled: true
        });
    }

    async evaluateMetrics() {
        const hourlyCallMetrics = await metricAggregator.aggregateCallMetrics('HOUR');
        const hourlyTransferMetrics = await metricAggregator.aggregateTransferMetrics('HOUR');
        const hourlyPerformanceMetrics = await metricAggregator.aggregatePerformanceMetrics('HOUR');

        for (const [name, rule] of this.rules) {
            if (!rule.enabled) continue;

            try {
                const triggered = await this._evaluateConditions(rule.conditions, {
                    call: hourlyCallMetrics,
                    transfer: hourlyTransferMetrics,
                    performance: hourlyPerformanceMetrics
                });

                if (triggered) {
                    await this._executeActions(name, rule, {
                        call: hourlyCallMetrics,
                        transfer: hourlyTransferMetrics,
                        performance: hourlyPerformanceMetrics
                    });
                }
            } catch (error) {
                console.error(`Error evaluating rule ${name}:`, error);
            }
        }
    }

    async _evaluateConditions(conditions, metrics) {
        for (const condition of conditions) {
            const { metric, operator, threshold, category = 'performance' } = condition;
            const value = metrics[category][metric];

            switch (operator) {
                case '>':
                    if (!(value > threshold)) return false;
                    break;
                case '<':
                    if (!(value < threshold)) return false;
                    break;
                case '>=':
                    if (!(value >= threshold)) return false;
                    break;
                case '<=':
                    if (!(value <= threshold)) return false;
                    break;
                case '==':
                    if (value !== threshold) return false;
                    break;
                default:
                    throw new Error(`Unknown operator: ${operator}`);
            }
        }
        return true;
    }

    async _executeActions(ruleName, rule, metrics) {
        const alert = {
            ruleName,
            severity: rule.severity,
            timestamp: new Date(),
            metrics: JSON.stringify(metrics)
        };

        // Store alert in database
        const createdAlert = await Alert.create(alert);

        // Execute configured actions
        for (const action of rule.actions) {
            switch (action.type) {
                case 'email':
                    await sendEmail({
                        subject: `[${rule.severity}] Alert: ${ruleName}`,
                        body: this._formatAlertMessage(ruleName, rule, metrics)
                    });
                    break;
                case 'slack':
                    await sendSlackNotification({
                        message: this._formatAlertMessage(ruleName, rule, metrics),
                        severity: rule.severity
                    });
                    break;
                default:
                    console.warn(`Unknown action type: ${action.type}`);
            }
        }

        // Process alert for automation
        await alertAutomation.processAlert(createdAlert);
    }

    _formatAlertMessage(ruleName, rule, metrics) {
        return `
Alert: ${ruleName}
Severity: ${rule.severity}
Time: ${new Date().toISOString()}

Metrics:
${JSON.stringify(metrics, null, 2)}

Conditions Triggered:
${rule.conditions.map(c => 
    `- ${c.category}.${c.metric} ${c.operator} ${c.threshold}`
).join('\n')}
        `.trim();
    }

    // Example predefined rules
    initializeDefaultRules() {
        // High packet loss alert
        this.addRule('high-packet-loss', [
            { category: 'call', metric: 'avgPacketLoss', operator: '>', threshold: 5 }
        ], [
            { type: 'email' },
            { type: 'slack' }
        ], 'WARNING');

        // Critical system performance
        this.addRule('critical-cpu-usage', [
            { category: 'performance', metric: 'avgCpuUsage', operator: '>', threshold: 90 }
        ], [
            { type: 'email' },
            { type: 'slack' }
        ], 'CRITICAL');

        // Low transfer success rate
        this.addRule('low-transfer-success', [
            { category: 'transfer', metric: 'successRate', operator: '<', threshold: 95 }
        ], [
            { type: 'email' },
            { type: 'slack' }
        ], 'ERROR');
    }
}

module.exports = new AlertRules();
