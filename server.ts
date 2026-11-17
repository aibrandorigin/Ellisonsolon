import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import nodemailer, { type Transporter } from 'nodemailer';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const DEFAULT_NOTIFICATION_RECIPIENT = process.env.NOTIFICATION_EMAIL || 'ellisonsolon@gmail.com';

interface EnquiryPayload {
  id: string;
  createdAt: string;
  customerName: string;
  phone: string;
  email?: string;
  emailRecipient?: string;
  enquiryType: string;
  service?: string;
  preferredDate?: string;
  preferredTime?: string;
  floorPlanInterest?: string;
  message?: string;
  location?: string;
  additionalDetails?: Record<string, string>;
}

// In-memory deduplication cache: enquiryId -> { timestamp, status }
const processedEnquiries = new Map<string, { timestamp: number; status: 'sent' | 'failed' }>();

// Cleanup stale entries older than 30 minutes
setInterval(() => {
  const cutoff = Date.now() - 30 * 60 * 1000;
  for (const [id, entry] of processedEnquiries.entries()) {
    if (entry.timestamp < cutoff) {
      processedEnquiries.delete(id);
    }
  }
}, 5 * 60 * 1000);

/**
 * Creates email transporter based on environment configuration
 */
function getEmailTransporter(): { transporter: Transporter | null; provider: string } {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (host && user && pass) {
    return {
      transporter: nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      }),
      provider: `smtp (${host})`,
    };
  }

  if (process.env.RESEND_API_KEY) {
    return {
      transporter: nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        auth: {
          user: 'resend',
          pass: process.env.RESEND_API_KEY,
        },
      }),
      provider: 'resend',
    };
  }

  if (process.env.SENDGRID_API_KEY) {
    return {
      transporter: nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY,
        },
      }),
      provider: 'sendgrid',
    };
  }

  return {
    transporter: null,
    provider: 'unconfigured',
  };
}

/**
 * Generates email subject based on enquiry type and customer name
 */
function generateEmailSubject(enquiry: EnquiryPayload): string {
  const type = enquiry.enquiryType?.trim();
  const name = enquiry.customerName?.trim() || 'Visitor';
  if (type) {
    return `New ${type} Enquiry — ${name}`;
  }
  return `New Website Enquiry — ${name}`;
}

/**
 * Formats a clean, professional HTML email matching the design specification
 */
function generateHtmlEmail(enquiry: EnquiryPayload): string {
  const dateFormatted = enquiry.createdAt
    ? new Date(enquiry.createdAt).toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: 'America/Chicago',
      }) + ' (CT)'
    : new Date().toLocaleString();

  const additionalEntries = enquiry.additionalDetails
    ? Object.entries(enquiry.additionalDetails).filter(([_, v]) => Boolean(v))
    : [];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${generateEmailSubject(enquiry)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.5;
      background-color: #f1f5f9;
      margin: 0;
      padding: 24px;
      color: #1e293b;
    }
    .wrapper {
      max-width: 620px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
    }
    .header {
      background: linear-gradient(135deg, #17222d 0%, #233242 100%);
      color: #ffffff;
      padding: 28px 24px;
    }
    .pill {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 4px 12px;
      border-radius: 9999px;
      background-color: rgba(250, 240, 215, 0.2);
      color: #FAF0D7;
      border: 1px solid rgba(197, 168, 128, 0.5);
      margin-bottom: 10px;
    }
    .header-title {
      margin: 0 0 4px 0;
      font-size: 22px;
      font-weight: 700;
      color: #FAF0D7;
      letter-spacing: -0.01em;
    }
    .header-subtitle {
      margin: 0;
      font-size: 13px;
      color: #cbd5e1;
    }
    .body {
      padding: 28px 24px;
    }
    .section-title {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #64748b;
      margin: 22px 0 12px 0;
      padding-bottom: 6px;
      border-bottom: 1px solid #e2e8f0;
    }
    .section-title:first-child {
      margin-top: 0;
    }
    .row {
      display: flex;
      margin-bottom: 8px;
      font-size: 13px;
    }
    .label {
      width: 150px;
      flex-shrink: 0;
      font-weight: 600;
      color: #475569;
    }
    .value {
      flex: 1;
      color: #0f172a;
    }
    .value strong {
      font-weight: 700;
    }
    .value a {
      color: #1e40af;
      text-decoration: none;
    }
    .value a:hover {
      text-decoration: underline;
    }
    .message-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #c5a880;
      border-radius: 6px;
      padding: 14px 16px;
      font-size: 13px;
      color: #334155;
      white-space: pre-wrap;
      margin-top: 8px;
    }
    .footer {
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 18px 24px;
      font-size: 12px;
      color: #64748b;
      text-align: center;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="pill">New Website Enquiry</div>
      <h1 class="header-title">${enquiry.enquiryType || 'General Enquiry'}</h1>
      <p class="header-subtitle">Submitted on The Ellis on Solon Luxury Apartments website</p>
    </div>

    <div class="body">
      <div class="section-title">Enquiry Reference</div>
      <div class="row">
        <span class="label">Enquiry ID:</span>
        <span class="value"><strong>${enquiry.id}</strong></span>
      </div>
      <div class="row">
        <span class="label">Received:</span>
        <span class="value">${dateFormatted}</span>
      </div>
      <div class="row">
        <span class="label">Enquiry Type:</span>
        <span class="value">${enquiry.enquiryType || 'General Enquiry'}</span>
      </div>

      <div class="section-title">Customer Details</div>
      <div class="row">
        <span class="label">Name:</span>
        <span class="value"><strong>${enquiry.customerName}</strong></span>
      </div>
      <div class="row">
        <span class="label">Phone:</span>
        <span class="value"><a href="tel:${enquiry.phone}">${enquiry.phone}</a></span>
      </div>
      ${enquiry.email ? `
      <div class="row">
        <span class="label">Email:</span>
        <span class="value"><a href="mailto:${enquiry.email}">${enquiry.email}</a></span>
      </div>
      ` : ''}

      ${(enquiry.service || enquiry.preferredDate || enquiry.preferredTime || enquiry.floorPlanInterest || enquiry.location) ? `
      <div class="section-title">Enquiry & Tour Details</div>
      ${enquiry.service ? `
      <div class="row">
        <span class="label">Service / Format:</span>
        <span class="value"><strong>${enquiry.service}</strong></span>
      </div>` : ''}
      ${enquiry.preferredDate ? `
      <div class="row">
        <span class="label">Preferred Date:</span>
        <span class="value">${enquiry.preferredDate}</span>
      </div>` : ''}
      ${enquiry.preferredTime ? `
      <div class="row">
        <span class="label">Preferred Time:</span>
        <span class="value">${enquiry.preferredTime}</span>
      </div>` : ''}
      ${enquiry.floorPlanInterest ? `
      <div class="row">
        <span class="label">Floor Plan Interest:</span>
        <span class="value">${enquiry.floorPlanInterest}</span>
      </div>` : ''}
      ${enquiry.location ? `
      <div class="row">
        <span class="label">Location:</span>
        <span class="value">${enquiry.location}</span>
      </div>` : ''}
      ` : ''}

      ${enquiry.message ? `
      <div class="section-title">Customer Message / Notes</div>
      <div class="message-card">${enquiry.message}</div>
      ` : ''}

      ${additionalEntries.length > 0 ? `
      <div class="section-title">Additional Details</div>
      ${additionalEntries.map(([k, v]) => `
      <div class="row">
        <span class="label">${k}:</span>
        <span class="value">${v}</span>
      </div>`).join('')}
      ` : ''}
    </div>

    <div class="footer">
      This enquiry was submitted through the website.<br/>
      <strong>The Ellis on Solon</strong> &bull; 1000 Solon Place Way, Waxahachie, TX 75165 &bull; (972) 938-0980
    </div>
  </div>
</body>
</html>`;
}

/**
 * Formats a clean plain-text email version
 */
function generateTextEmail(enquiry: EnquiryPayload): string {
  const dateFormatted = enquiry.createdAt
    ? new Date(enquiry.createdAt).toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: 'America/Chicago',
      }) + ' (CT)'
    : new Date().toLocaleString();

  let text = `NEW WEBSITE ENQUIRY\n\n`;
  text += `Enquiry ID: ${enquiry.id}\n`;
  text += `Received: ${dateFormatted}\n\n`;

  text += `CUSTOMER DETAILS\n`;
  text += `Name: ${enquiry.customerName}\n`;
  text += `Phone: ${enquiry.phone}\n`;
  if (enquiry.email) text += `Email: ${enquiry.email}\n`;
  text += `\n`;

  text += `ENQUIRY DETAILS\n`;
  text += `Type: ${enquiry.enquiryType || 'General Enquiry'}\n`;
  if (enquiry.service) text += `Service: ${enquiry.service}\n`;
  if (enquiry.preferredDate) text += `Preferred Date: ${enquiry.preferredDate}\n`;
  if (enquiry.preferredTime) text += `Preferred Time: ${enquiry.preferredTime}\n`;
  if (enquiry.floorPlanInterest) text += `Floor Plan: ${enquiry.floorPlanInterest}\n`;
  if (enquiry.location) text += `Location: ${enquiry.location}\n`;
  if (enquiry.message) text += `\nMessage:\n${enquiry.message}\n`;

  if (enquiry.additionalDetails && Object.keys(enquiry.additionalDetails).length > 0) {
    text += `\nAdditional Details:\n`;
    for (const [k, v] of Object.entries(enquiry.additionalDetails)) {
      if (v) text += `${k}: ${v}\n`;
    }
  }

  text += `\n--------------------------------\n`;
  text += `This enquiry was submitted through the website.\n`;
  return text;
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '5mb' }));

  // Basic API Health Check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      time: new Date().toISOString(),
      recipient: DEFAULT_NOTIFICATION_RECIPIENT,
    });
  });

  // Get Email Provider Configuration Status (without exposing secrets)
  app.get('/api/email-status', (_req: Request, res: Response) => {
    const { transporter, provider } = getEmailTransporter();
    res.json({
      configured: transporter !== null,
      provider,
      recipient: DEFAULT_NOTIFICATION_RECIPIENT,
    });
  });

  // Export Complete Firestore Database Backup as Downloadable JSON
  const handleExportDatabase = async (_req: Request, res: Response) => {
    try {
      const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
      if (!fs.existsSync(configPath)) {
        res.status(500).json({ error: 'Firebase configuration file not found on server.' });
        return;
      }

      const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const fbApp = getApps().length === 0 ? initializeApp(firebaseConfig, 'server-export') : getApps()[0];
      const fbDb = getFirestore(fbApp, firebaseConfig.firestoreDatabaseId);

      const [propertyContentSnap, enquiriesSnap] = await Promise.all([
        getDocs(collection(fbDb, 'property_content')),
        getDocs(collection(fbDb, 'enquiries')),
      ]);

      const propertyContentRaw: Record<string, any> = {};
      propertyContentSnap.forEach((docSnap) => {
        propertyContentRaw[docSnap.id] = docSnap.data();
      });

      const enquiriesRaw: Record<string, any> = {};
      const enquiriesList: any[] = [];
      enquiriesSnap.forEach((docSnap) => {
        const data = docSnap.data();
        enquiriesRaw[docSnap.id] = data;
        enquiriesList.push({ id: docSnap.id, ...data });
      });

      enquiriesList.sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      });

      const reconstructChunkedSection = (sectionName: string): any[] => {
        const meta = propertyContentRaw[`${sectionName}_meta`];
        if (meta && typeof meta.chunkCount === 'number' && meta.chunkCount > 0) {
          const items: any[] = [];
          for (let i = 0; i < meta.chunkCount; i++) {
            const chunk = propertyContentRaw[`${sectionName}_chunk_${i}`];
            if (chunk && Array.isArray(chunk.items)) {
              items.push(...chunk.items);
            }
          }
          return items;
        }
        const legacy = propertyContentRaw[sectionName];
        if (legacy && Array.isArray(legacy.list)) {
          return legacy.list;
        }
        return [];
      };

      const propertyInfoData = propertyContentRaw['property_info']?.data
        ? { ...propertyContentRaw['property_info'].data }
        : null;
      const propertyImages = reconstructChunkedSection('property_images');
      if (propertyInfoData && propertyImages.length > 0) {
        propertyInfoData.images = propertyImages;
      }

      const structuredData = {
        propertyInfo: propertyInfoData,
        floorPlans: reconstructChunkedSection('floor_plans'),
        amenities: reconstructChunkedSection('amenities'),
        galleryItems: reconstructChunkedSection('gallery'),
        galleryCategories: Array.isArray(propertyContentRaw['categories']?.list)
          ? propertyContentRaw['categories'].list
          : [],
        neighborhoodSpots: reconstructChunkedSection('neighborhood'),
        specialOffers: reconstructChunkedSection('specials'),
        enquiries: enquiriesList,
      };

      const dateStamp = new Date().toISOString().slice(0, 10);
      const payload = {
        metadata: {
          exportedAt: new Date().toISOString(),
          sourceProjectId: firebaseConfig.projectId,
          sourceDatabaseId: firebaseConfig.firestoreDatabaseId,
          collections: ['property_content', 'enquiries'],
          documentCounts: {
            property_content: Object.keys(propertyContentRaw).length,
            enquiries: Object.keys(enquiriesRaw).length,
          },
          structuredCounts: {
            floorPlans: structuredData.floorPlans.length,
            amenities: structuredData.amenities.length,
            galleryItems: structuredData.galleryItems.length,
            galleryCategories: structuredData.galleryCategories.length,
            neighborhoodSpots: structuredData.neighborhoodSpots.length,
            specialOffers: structuredData.specialOffers.length,
            enquiries: structuredData.enquiries.length,
          },
        },
        structuredData,
        rawFirestoreCollections: {
          property_content: propertyContentRaw,
          enquiries: enquiriesRaw,
        },
      };

      const jsonOutput = JSON.stringify(payload, null, 2);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="ellis-on-solon-database-backup-${dateStamp}.json"`
      );
      res.setHeader('Cache-Control', 'no-store');
      res.status(200).send(jsonOutput);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('[DatabaseExport] Failed to export Firestore database:', errMsg);
      res.status(500).json({
        error: 'Failed to export database',
        details: errMsg,
      });
    }
  };

  app.get('/api/download-database', handleExportDatabase);
  app.get('/api/export-database', handleExportDatabase);

  // Send Enquiry Email Notification Endpoint
  app.post('/api/send-enquiry-email', async (req: Request, res: Response) => {
    const { enquiry, isRetry } = (req.body || {}) as { enquiry: EnquiryPayload; isRetry?: boolean };
    const targetRecipient =
      enquiry?.emailRecipient &&
      enquiry.emailRecipient.includes('@') &&
      enquiry.emailRecipient !== 'aibrandorigin@gmail.com'
        ? enquiry.emailRecipient.trim()
        : DEFAULT_NOTIFICATION_RECIPIENT;

    try {
      if (!enquiry || !enquiry.id || !enquiry.customerName) {
        res.status(400).json({
          success: false,
          status: 'failed',
          error: 'Missing required enquiry information (id, customerName)',
        });
        return;
      }

      // Check deduplication (prevent double clicks and duplicate emails unless explicitly retried)
      const existing = processedEnquiries.get(enquiry.id);
      if (!isRetry && existing) {
        if (existing.status === 'sent') {
          console.log(`[EmailService] Deduplication: enquiry ${enquiry.id} already sent. Skipping.`);
          res.json({
            success: true,
            status: 'sent',
            deduplicated: true,
            recipient: targetRecipient,
            message: 'Notification already sent for this enquiry.',
            timestamp: new Date().toISOString(),
          });
          return;
        }
        // Rapid double click suppression within 15 seconds
        if (Date.now() - existing.timestamp < 15000) {
          console.log(`[EmailService] Deduplication: enquiry ${enquiry.id} rapid duplicate click suppressed.`);
          res.json({
            success: false,
            status: 'failed',
            deduplicated: true,
            recipient: targetRecipient,
            error: 'Duplicate submission request in progress.',
            timestamp: new Date().toISOString(),
          });
          return;
        }
      }

      const { transporter, provider } = getEmailTransporter();

      if (!transporter) {
        const errorMsg = 'Email provider credentials not configured. Please set SMTP_USER / SMTP_PASS or RESEND_API_KEY in environment variables.';
        console.warn(`[EmailService] Notice: ${errorMsg} for enquiry ${enquiry.id}`);
        processedEnquiries.set(enquiry.id, { timestamp: Date.now(), status: 'failed' });

        res.status(503).json({
          success: false,
          status: 'failed',
          error: errorMsg,
          recipient: targetRecipient,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Build authenticated email
      const fromAddress = process.env.SMTP_FROM || `"The Ellis on Solon" <${process.env.SMTP_USER || 'noreply@theellisonsolon.com'}>`;
      const subject = generateEmailSubject(enquiry);
      const html = generateHtmlEmail(enquiry);
      const text = generateTextEmail(enquiry);

      // Reply-To uses customer's valid email where provided
      const isValidEmail = enquiry.email && enquiry.email.includes('@') && enquiry.email.includes('.');
      const replyTo = isValidEmail ? enquiry.email.trim() : undefined;

      console.log(`[EmailService] Sending enquiry ${enquiry.id} notification to ${targetRecipient} via ${provider}...`);

      const info = await transporter.sendMail({
        from: fromAddress,
        to: targetRecipient,
        replyTo,
        subject,
        text,
        html,
      });

      console.log(`[EmailService] Enquiry ${enquiry.id} notification sent successfully. MessageId: ${info.messageId}`);
      processedEnquiries.set(enquiry.id, { timestamp: Date.now(), status: 'sent' });

      res.json({
        success: true,
        status: 'sent',
        messageId: info.messageId,
        recipient: targetRecipient,
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('[EmailService] Error dispatching enquiry email:', errMsg);

      if (req.body?.enquiry?.id) {
        processedEnquiries.set(req.body.enquiry.id, { timestamp: Date.now(), status: 'failed' });
      }

      res.status(500).json({
        success: false,
        status: 'failed',
        error: errMsg,
        recipient: targetRecipient,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Mount Vite middleware in development or serve static in production
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    const distIndexPath = path.resolve(distPath, 'index.html');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
    }
    app.get('*', (_req: Request, res: Response) => {
      if (fs.existsSync(distIndexPath)) {
        res.sendFile(distIndexPath);
      } else {
        const rootIndex = path.resolve(__dirname, 'index.html');
        if (fs.existsSync(rootIndex)) {
          res.sendFile(rootIndex);
        } else {
          res.status(200).send('Application is running.');
        }
      }
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] The Ellis on Solon app running on http://0.0.0.0:${PORT}`);
    console.log(`[Server] Default email notification recipient set to: ${DEFAULT_NOTIFICATION_RECIPIENT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
