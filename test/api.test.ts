import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.ts';

describe('WiFi Connect API Tests', () => {
  it('should serve index.html with WiFi Connect title', async () => {
    const res = await request(app)
      .get('/')
      .expect(200);

    assert.match(res.headers['content-type'], /html/);
    assert.match(res.text, /WiFi Connect/);
    assert.match(res.text, /Print Card/);
    assert.match(res.text, /Create New/);
  });

  it('should return health check status successfully', async () => {
    const res = await request(app)
      .get('/api/health')
      .expect(200);

    assert.equal(res.body.status, 'ok');
    assert.equal(res.body.service, 'wifi-connect');
    assert.ok(res.body.timestamp);
  });

  describe('Empty SSID Validation', () => {
    it('should return 400 when SSID is missing', async () => {
      const res = await request(app)
        .post('/api/generate-qr')
        .send({
          password: 'secretpassword123'
        })
        .expect(400);

      assert.equal(res.body.success, false);
      assert.match(res.body.error, /Network name \(SSID\) is required/i);
    });

    it('should return 400 when SSID is an empty string', async () => {
      const res = await request(app)
        .post('/api/generate-qr')
        .send({
          ssid: '',
          password: 'secretpassword123'
        })
        .expect(400);

      assert.equal(res.body.success, false);
      assert.match(res.body.error, /Network name \(SSID\) is required/i);
    });

    it('should return 400 when SSID contains only whitespace', async () => {
      const res = await request(app)
        .post('/api/generate-qr')
        .send({
          ssid: '     ',
          password: 'secretpassword123'
        })
        .expect(400);

      assert.equal(res.body.success, false);
      assert.match(res.body.error, /Network name \(SSID\) is required/i);
    });
  });

  describe('Successful QR Code Generation', () => {
    it('should successfully generate a Wi-Fi QR code for WPA network', async () => {
      const res = await request(app)
        .post('/api/generate-qr')
        .send({
          ssid: 'MyHomeWiFi',
          password: 'SuperSecretPassword!',
          security: 'WPA',
          hidden: false
        })
        .expect(200);

      assert.equal(res.body.success, true);
      assert.ok(res.body.data);
      assert.equal(res.body.data.ssid, 'MyHomeWiFi');
      assert.equal(res.body.data.security, 'WPA');
      assert.equal(res.body.data.hidden, false);
      assert.equal(res.body.data.hasPassword, true);

      // Verify the generated QR code is a Base64 data URL
      assert.ok(typeof res.body.data.qrCodeDataUrl === 'string');
      assert.match(res.body.data.qrCodeDataUrl, /^data:image\/png;base64,/);

      // CRITICAL: Ensure password is NEVER leaked in response payload
      assert.strictEqual((res.body as any).password, undefined);
      assert.strictEqual((res.body.data as any).password, undefined);
    });

    it('should successfully generate a QR code for an Open / No Password network', async () => {
      const res = await request(app)
        .post('/api/generate-qr')
        .send({
          ssid: 'CafeGuestWiFi',
          security: 'nopass'
        })
        .expect(200);

      assert.equal(res.body.success, true);
      assert.equal(res.body.data.ssid, 'CafeGuestWiFi');
      assert.equal(res.body.data.security, 'nopass');
      assert.equal(res.body.data.hasPassword, false);
      assert.match(res.body.data.qrCodeDataUrl, /^data:image\/png;base64,/);
    });

    it('should successfully generate a QR code with special characters escaped', async () => {
      const res = await request(app)
        .post('/api/generate-qr')
        .send({
          ssid: 'Guest;Room:101\\Lobby,VIP',
          password: 'P@ss;w0rd:with,symbols\\and"quotes"',
          security: 'WPA'
        })
        .expect(200);

      assert.equal(res.body.success, true);
      assert.equal(res.body.data.ssid, 'Guest;Room:101\\Lobby,VIP');
      assert.match(res.body.data.qrCodeDataUrl, /^data:image\/png;base64,/);
    });

    it('should support hidden network flag', async () => {
      const res = await request(app)
        .post('/api/generate-qr')
        .send({
          ssid: 'StealthNetwork',
          password: 'securePassword99',
          security: 'WPA',
          hidden: true
        })
        .expect(200);

      assert.equal(res.body.success, true);
      assert.equal(res.body.data.hidden, true);
      assert.match(res.body.data.qrCodeDataUrl, /^data:image\/png;base64,/);
    });
  });
});
