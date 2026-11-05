import QRCode from 'qrcode';

export type SecurityType = 'WPA' | 'WEP' | 'nopass';

export interface WifiConfig {
  ssid: string;
  password?: string;
  security?: SecurityType;
  hidden?: boolean;
}

export interface QrResult {
  qrCodeDataUrl: string;
  ssid: string;
  security: SecurityType;
  hidden: boolean;
  hasPassword: boolean;
}

/**
 * Escapes special characters for Wi-Fi QR code syntax (ZXing / MeCard standard):
 * Backslash, semicolon, comma, colon, and double quotation mark.
 */
export function escapeWifiField(value: string): string {
  return value.replace(/([\\;,:\"])/g, '\\$1');
}

/**
 * Builds the standard Wi-Fi configuration string:
 * WIFI:S:<SSID>;T:<WPA|WEP|nopass>;P:<PASSWORD>;H:<true|false>;;
 */
export function buildWifiString(config: WifiConfig): string {
  const trimmedSsid = (config.ssid ?? '').trim();
  if (!trimmedSsid) {
    throw new Error('Network name (SSID) is required and cannot be empty.');
  }

  const security: SecurityType = config.security ?? (config.password ? 'WPA' : 'nopass');
  const escapedSsid = escapeWifiField(trimmedSsid);
  const hiddenFlag = config.hidden ? 'H:true;' : '';

  if (security === 'nopass' || !config.password) {
    return `WIFI:S:${escapedSsid};T:nopass;${hiddenFlag};`;
  }

  const escapedPassword = escapeWifiField(config.password);
  return `WIFI:S:${escapedSsid};T:${security};P:${escapedPassword};${hiddenFlag};`;
}

/**
 * Generates a Wi-Fi QR code strictly in-memory as a Base64 data URL.
 * Never persists to disk or database. Never logs passwords.
 */
export async function generateWifiQrCode(config: WifiConfig): Promise<QrResult> {
  const trimmedSsid = (config.ssid ?? '').trim();
  if (!trimmedSsid) {
    throw new Error('Network name (SSID) is required and cannot be empty.');
  }

  const security: SecurityType = config.security ?? (config.password ? 'WPA' : 'nopass');
  const wifiString = buildWifiString(config);

  // High quality QR code generation directly in-memory
  const qrCodeDataUrl = await QRCode.toDataURL(wifiString, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    margin: 2,
    width: 480,
    color: {
      dark: '#1e293b', // Deep slate for high contrast & crisp printing
      light: '#ffffff'  // Pure white background
    }
  });

  return {
    qrCodeDataUrl,
    ssid: trimmedSsid,
    security,
    hidden: Boolean(config.hidden),
    hasPassword: Boolean(config.password && security !== 'nopass')
  };
}

