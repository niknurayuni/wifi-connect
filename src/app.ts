import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateWifiQrCode } from './services/qrService.ts';
import type { SecurityType } from './services/qrService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

export const app = express();

// Disable powered-by header for security
app.disable('x-powered-by');

// Parse JSON and form bodies
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// Safe privacy-first request logging middleware:
// Logs HTTP method, URL, status code, and duration.
// NEVER logs request body or sensitive data (passwords).
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Serve static frontend assets from /public
app.use(express.static(publicDir));

// Health check endpoint for Cloud Run and monitoring
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'wifi-connect',
    timestamp: new Date().toISOString()
  });
});

// API endpoint to generate Wi-Fi QR code
app.post('/api/generate-qr', async (req: Request, res: Response) => {
  try {
    const { ssid, password, security, hidden } = req.body ?? {};

    // Validate SSID
    if (!ssid || typeof ssid !== 'string' || !ssid.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Network name (SSID) is required.'
      });
    }

    const trimmedSsid = ssid.trim();
    if (trimmedSsid.length > 64) {
      return res.status(400).json({
        success: false,
        error: 'Network name (SSID) cannot exceed 64 characters.'
      });
    }

    // Validate and normalize security type
    let securityType: SecurityType = 'WPA';
    if (security === 'WEP' || security === 'nopass' || security === 'WPA') {
      securityType = security;
    } else if (security === 'None' || security === 'open') {
      securityType = 'nopass';
    } else if (!password && (!security || security === 'auto')) {
      securityType = 'nopass';
    }

    // Generate QR code entirely in-memory as Base64 data URL
    const qrResult = await generateWifiQrCode({
      ssid: trimmedSsid,
      password: typeof password === 'string' ? password : '',
      security: securityType,
      hidden: Boolean(hidden)
    });

    // Return the generated Base64 data URL and safe metadata (never returns password in response)
    return res.status(200).json({
      success: true,
      data: {
        qrCodeDataUrl: qrResult.qrCodeDataUrl,
        ssid: qrResult.ssid,
        security: qrResult.security,
        hidden: qrResult.hidden,
        hasPassword: qrResult.hasPassword
      }
    });
  } catch (error: any) {
    // Sanitized error handling: Never log req.body or passwords
    const errorMessage = error?.message || 'An unexpected error occurred while generating the QR code.';
    console.error(`[Error] /api/generate-qr failure: ${errorMessage}`);
    return res.status(400).json({
      success: false,
      error: errorMessage
    });
  }
});

// Fallback route to serve index.html for single-page app
app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Centralized error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Error] Unhandled application error:', err?.message ?? 'Unknown');
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});
