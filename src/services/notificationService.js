const nodemailer = require('nodemailer');
const axios = require('axios');
const logger = require('../utils/logger');

class NotificationService {
  constructor() {
    // Configure email transporter
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });


    this.whatsappApiUrl = process.env.WHATSAPP_API_URL;
    this.whatsappToken = process.env.WHATSAPP_TOKEN;
  }

  async sendEmail(to, subject, htmlContent, attachments = []) {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL,
        to,
        subject,
        html: htmlContent,
        attachments
      };

      const result = await this.emailTransporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${to}`);
      return result;
    } catch (error) {
      logger.error('Email sending failed:', error);
      throw error;
    }
  }

  async sendWhatsAppMessage(phoneNumber, message, mediaUrl = null) {
    try {
      if (!this.whatsappApiUrl || !this.whatsappToken) {
        throw new Error('WhatsApp API not configured');
      }

      const payload = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: mediaUrl ? 'image' : 'text'
      };

      if (mediaUrl) {
        payload.image = {
          link: mediaUrl,
          caption: message
        };
      } else {
        payload.text = { body: message };
      }

      const response = await axios.post(
        `${this.whatsappApiUrl}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.whatsappToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info(`WhatsApp message sent to ${phoneNumber}`);
      return response.data;
    } catch (error) {
      logger.error('WhatsApp sending failed:', error);
      throw error;
    }
  }

  async shareCaptureViaEmail(userEmail, capture, aiSummary, imageUrl) {
    const subject = `Construction Capture Report - ${capture.site?.name || 'Site'}`;
    const htmlContent = this.generateCaptureEmailTemplate(capture, aiSummary, imageUrl);

    const attachments = [{
      filename: capture.fileName,
      path: imageUrl
    }];

    return this.sendEmail(userEmail, subject, htmlContent, attachments);
  }

  async shareCaptureViaWhatsApp(phoneNumber, capture, aiSummary, imageUrl) {
    const message = this.generateWhatsAppMessage(capture, aiSummary);
    return this.sendWhatsAppMessage(phoneNumber, message, imageUrl);
  }

  generateCaptureEmailTemplate(capture, aiSummary, imageUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { background-color: #f4f4f4; padding: 20px; border-radius: 5px; }
          .content { margin: 20px 0; }
          .summary { background-color: #e8f4f8; padding: 15px; border-radius: 5px; }
          .defects { background-color: #fff2e8; padding: 15px; border-radius: 5px; margin-top: 10px; }
          .metadata { font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Construction Capture Report</h1>
          <p><strong>Site:</strong> ${capture.site?.name || 'N/A'}</p>
          <p><strong>Date:</strong> ${new Date(capture.createdAt).toLocaleString()}</p>
          <p><strong>Operation Type:</strong> ${capture.site?.operationType || 'N/A'}</p>
        </div>
        
        <div class="content">
          <div class="summary">
            <h3>AI Analysis Summary</h3>
            <p>${aiSummary.summary || 'No summary available'}</p>
            ${aiSummary.progressStatus ? `<p><strong>Progress:</strong> ${aiSummary.progressStatus}%</p>` : ''}
          </div>
          
          ${aiSummary.defects && aiSummary.defects.length > 0 ? `
            <div class="defects">
              <h3>Identified Issues</h3>
              <ul>
                ${aiSummary.defects.map(defect => `
                  <li><strong>${defect.type}:</strong> ${defect.description} 
                      <span class="severity">(${defect.severity})</span></li>
                `).join('')}
              </ul>
            </div>
          ` : ''}
          
          <div class="metadata">
            <h4>Capture Details</h4>
            <p><strong>Location:</strong> ${capture.sensorData.latitude}, ${capture.sensorData.longitude}</p>
            <p><strong>Altitude:</strong> ${capture.sensorData.altitude}m</p>
            <p><strong>WBS ID:</strong> ${capture.wbsId || 'N/A'}</p>
            <p><strong>Structure Part:</strong> ${capture.structurePart || 'N/A'}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateWhatsAppMessage(capture, aiSummary) {
    let message = `📸 *Construction Report*\n\n`;
    message += `🏗️ *Site:* ${capture.site?.name || 'N/A'}\n`;
    message += `📅 *Date:* ${new Date(capture.createdAt).toLocaleString()}\n`;
    message += `⚙️ *Operation:* ${capture.site?.operationType || 'N/A'}\n\n`;

    if (aiSummary.summary) {
      message += `🤖 *AI Analysis:*\n${aiSummary.summary}\n\n`;
    }

    if (aiSummary.progressStatus) {
      message += `📊 *Progress:* ${aiSummary.progressStatus}%\n\n`;
    }

    if (aiSummary.defects && aiSummary.defects.length > 0) {
      message += `⚠️ *Issues Found:*\n`;
      aiSummary.defects.forEach((defect, index) => {
        message += `${index + 1}. ${defect.description} (${defect.severity})\n`;
      });
      message += '\n';
    }

    message += `📍 *Location:* ${capture.sensorData.latitude}, ${capture.sensorData.longitude}`;

    return message;
  }
}

module.exports = new NotificationService();