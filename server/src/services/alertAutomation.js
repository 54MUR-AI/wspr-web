const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const alertRules = require('./alertRules');
const monitoringService = require('./monitoring');
const { Alert } = require('../models/metrics');
const { sendEmail } = require('../utils/email');
const { sendSlackNotification } = require('../utils/slack');

class AlertAutomation {
    constructor() {
        this.automationRules = new Map();
        this.actionHandlers = {
            'restart_service': this._handleServiceRestart.bind(this),
            'scale_resources': this._handleResourceScaling.bind(this),
            'cleanup_storage': this._handleStorageCleanup.bind(this),
            'notify_team': this._handleTeamNotification.bind(this),
            'create_incident': this._handleIncidentCreation.bind(this),
            'throttle_traffic': this._handleTrafficThrottling.bind(this)
        };
    }

    addAutomationRule(alertPattern, actions) {
        this.automationRules.set(alertPattern, actions);
    }

    async processAlert(alert) {
        try {
            // Log the alert processing
            console.log(`Processing alert for automation: ${alert.ruleName}`);

            // Find matching automation rules
            for (const [pattern, actions] of this.automationRules) {
                if (this._matchesPattern(alert, pattern)) {
                    await this._executeActions(actions, alert);
                }
            }
        } catch (error) {
            console.error('Error in alert automation:', error);
            await this._notifyError(error, alert);
        }
    }

    _matchesPattern(alert, pattern) {
        // Match based on rule name, severity, and conditions
        if (typeof pattern === 'string') {
            return alert.ruleName === pattern;
        }
        
        if (pattern.severity && alert.severity !== pattern.severity) {
            return false;
        }
        
        if (pattern.metric) {
            const metrics = JSON.parse(alert.metrics);
            return this._evaluateMetricPattern(metrics, pattern.metric);
        }
        
        return true;
    }

    _evaluateMetricPattern(metrics, pattern) {
        const { category, name, threshold, operator } = pattern;
        const value = metrics[category]?.[name];
        
        if (value === undefined) return false;

        switch (operator) {
            case '>': return value > threshold;
            case '<': return value < threshold;
            case '>=': return value >= threshold;
            case '<=': return value <= threshold;
            case '==': return value === threshold;
            default: return false;
        }
    }

    async _executeActions(actions, alert) {
        for (const action of actions) {
            try {
                const handler = this.actionHandlers[action.type];
                if (handler) {
                    await handler(action, alert);
                } else {
                    console.warn(`Unknown action type: ${action.type}`);
                }
            } catch (error) {
                console.error(`Error executing action ${action.type}:`, error);
                await this._notifyError(error, alert);
            }
        }
    }

    async _handleServiceRestart({ service }, alert) {
        console.log(`Attempting to restart service: ${service}`);
        try {
            await execPromise(`pm2 restart ${service}`);
            await this._logAutomationAction('restart_service', { service }, alert);
        } catch (error) {
            throw new Error(`Failed to restart service ${service}: ${error.message}`);
        }
    }

    async _handleResourceScaling({ resource, amount }, alert) {
        console.log(`Scaling ${resource} by ${amount}`);
        try {
            // Implementation would depend on your infrastructure (AWS, GCP, etc.)
            // This is a placeholder for the actual implementation
            await this._logAutomationAction('scale_resources', { resource, amount }, alert);
        } catch (error) {
            throw new Error(`Failed to scale ${resource}: ${error.message}`);
        }
    }

    async _handleStorageCleanup({ path, ageInDays }, alert) {
        console.log(`Cleaning up storage: ${path}`);
        try {
            const command = `find ${path} -type f -mtime +${ageInDays} -delete`;
            await execPromise(command);
            await this._logAutomationAction('cleanup_storage', { path, ageInDays }, alert);
        } catch (error) {
            throw new Error(`Failed to clean up storage: ${error.message}`);
        }
    }

    async _handleTeamNotification({ team, channel }, alert) {
        try {
            const message = this._formatAlertMessage(alert, team);
            if (channel === 'slack') {
                await sendSlackNotification({ message, team });
            } else if (channel === 'email') {
                await sendEmail({
                    to: team.email,
                    subject: `[Automated Response] Alert: ${alert.ruleName}`,
                    body: message
                });
            }
            await this._logAutomationAction('notify_team', { team, channel }, alert);
        } catch (error) {
            throw new Error(`Failed to notify team: ${error.message}`);
        }
    }

    async _handleIncidentCreation({ priority }, alert) {
        try {
            // Implementation would integrate with your incident management system
            // This is a placeholder for the actual implementation
            await this._logAutomationAction('create_incident', { priority }, alert);
        } catch (error) {
            throw new Error(`Failed to create incident: ${error.message}`);
        }
    }

    async _handleTrafficThrottling({ rate }, alert) {
        try {
            // Implementation would depend on your traffic management system
            // This is a placeholder for the actual implementation
            await this._logAutomationAction('throttle_traffic', { rate }, alert);
        } catch (error) {
            throw new Error(`Failed to throttle traffic: ${error.message}`);
        }
    }

    async _logAutomationAction(actionType, details, alert) {
        try {
            await Alert.create({
                ruleName: `automation_${actionType}`,
                severity: alert.severity,
                timestamp: new Date(),
                metrics: JSON.stringify({
                    originalAlert: alert.ruleName,
                    actionType,
                    details
                })
            });
        } catch (error) {
            console.error('Failed to log automation action:', error);
        }
    }

    async _notifyError(error, alert) {
        try {
            const errorMessage = `
                Alert Automation Error
                Alert: ${alert.ruleName}
                Error: ${error.message}
                Stack: ${error.stack}
            `;
            
            await sendEmail({
                subject: '[ERROR] Alert Automation Failure',
                body: errorMessage
            });
            
            await sendSlackNotification({
                message: errorMessage,
                severity: 'ERROR'
            });
        } catch (notifyError) {
            console.error('Failed to notify error:', notifyError);
        }
    }

    _formatAlertMessage(alert, team) {
        return `
            🚨 Automated Response Alert
            
            Alert Rule: ${alert.ruleName}
            Severity: ${alert.severity}
            Team: ${team.name}
            Time: ${new Date().toISOString()}
            
            Metrics:
            ${JSON.stringify(JSON.parse(alert.metrics), null, 2)}
            
            Automated actions have been taken to address this alert.
            Please review the situation and ensure everything is operating correctly.
        `.trim();
    }

    // Initialize default automation rules
    initializeDefaultRules() {
        // High CPU usage automation
        this.addAutomationRule({
            severity: 'CRITICAL',
            metric: {
                category: 'performance',
                name: 'avgCpuUsage',
                threshold: 90,
                operator: '>'
            }
        }, [
            { type: 'scale_resources', resource: 'cpu', amount: 1 },
            { type: 'notify_team', team: { name: 'DevOps', email: 'devops@example.com' }, channel: 'slack' }
        ]);

        // Low storage space automation
        this.addAutomationRule({
            severity: 'WARNING',
            metric: {
                category: 'performance',
                name: 'diskUsage',
                threshold: 85,
                operator: '>'
            }
        }, [
            { type: 'cleanup_storage', path: '/tmp', ageInDays: 7 },
            { type: 'notify_team', team: { name: 'SysAdmin', email: 'sysadmin@example.com' }, channel: 'email' }
        ]);

        // High error rate automation
        this.addAutomationRule({
            severity: 'ERROR',
            metric: {
                category: 'performance',
                name: 'errorRate',
                threshold: 10,
                operator: '>'
            }
        }, [
            { type: 'restart_service', service: 'api-server' },
            { type: 'create_incident', priority: 'high' },
            { type: 'notify_team', team: { name: 'Engineering', email: 'engineering@example.com' }, channel: 'slack' }
        ]);
    }
}

module.exports = new AlertAutomation();
