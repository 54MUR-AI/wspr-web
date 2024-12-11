const nodemailer = require('nodemailer');
const { WebClient } = require('@slack/web-api');

class AlertService {
  constructor() {
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    this.slackClient = new WebClient(process.env.SLACK_TOKEN);
    this.slackChannel = process.env.SLACK_CHANNEL;
  }

  async checkThresholds(metrics) {
    const alerts = [];

    // Call Quality Thresholds
    if (metrics.type === 'call') {
      if (metrics.packetsLost > 100) {
        alerts.push({
          level: 'warning',
          message: `High packet loss detected: ${metrics.packetsLost} packets lost`,
          context: metrics,
        });
      }

      if (metrics.jitter > 50) {
        alerts.push({
          level: 'warning',
          message: `High jitter detected: ${metrics.jitter}ms`,
          context: metrics,
        });
      }

      if (metrics.roundTripTime > 300) {
        alerts.push({
          level: 'warning',
          message: `High latency detected: ${metrics.roundTripTime}ms`,
          context: metrics,
        });
      }
    }

    // File Transfer Thresholds
    if (metrics.type === 'transfer') {
      if (metrics.speed < 50 * 1024) { // Less than 50 KB/s
        alerts.push({
          level: 'warning',
          message: `Slow file transfer detected: ${Math.round(metrics.speed / 1024)} KB/s`,
          context: metrics,
        });
      }

      if (metrics.errors > 0) {
        alerts.push({
          level: 'error',
          message: `File transfer errors detected: ${metrics.errors} errors`,
          context: metrics,
        });
      }
    }

    // Error Rate Thresholds
    if (metrics.type === 'error') {
      const errorRate = metrics.count / metrics.timeWindow;
      if (errorRate > 0.1) { // More than 10% error rate
        alerts.push({
          level: 'error',
          message: `High error rate detected: ${Math.round(errorRate * 100)}%`,
          context: metrics,
        });
      }
    }

    // Performance Thresholds
    if (metrics.type === 'performance') {
      if (metrics.value < 0.7) { // Performance below 70%
        alerts.push({
          level: 'warning',
          message: `Low performance detected: ${Math.round(metrics.value * 100)}%`,
          context: metrics,
        });
      }
    }

    return alerts;
  }

  async sendEmailAlert(alert) {
    const mailOptions = {
      from: process.env.ALERT_EMAIL_FROM,
      to: process.env.ALERT_EMAIL_TO,
      subject: `[${alert.level.toUpperCase()}] WSPR Alert: ${alert.message}`,
      text: `
Alert Details:
${alert.message}

Context:
${JSON.stringify(alert.context, null, 2)}

Time: ${new Date().toISOString()}
      `,
    };

    try {
      await this.emailTransporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }

  async sendSlackAlert(alert) {
    try {
      await this.slackClient.chat.postMessage({
        channel: this.slackChannel,
        text: `[${alert.level.toUpperCase()}] WSPR Alert: ${alert.message}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*[${alert.level.toUpperCase()}] WSPR Alert*\n${alert.message}`,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `\`\`\`${JSON.stringify(alert.context, null, 2)}\`\`\``,
            },
          },
        ],
      });
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }

  async processAlerts(alerts) {
    for (const alert of alerts) {
      // Send email for all alerts
      await this.sendEmailAlert(alert);

      // Send Slack message for error level alerts
      if (alert.level === 'error') {
        await this.sendSlackAlert(alert);
      }

      // Store alert in database for historical tracking
      await this.storeAlert(alert);
    }
  }

  async storeAlert(alert) {
    // TODO: Implement alert storage in database
    // This will be used for alert history and analysis
  }
}

module.exports = new AlertService();
