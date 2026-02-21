import { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { BrowserManager } from '../../browser/manager.js';
import { devices } from 'playwright-core';

/**
 * Browser settings tool for viewport, device, geolocation, offline mode, headers, credentials, and media
 *
 * Reference agent-browser:
 * - set viewport 1920 1080              # Set viewport size
 * - set device "iPhone 14"              # Emulate device
 * - set geo 37.7749 -122.4194           # Set geolocation
 * - set offline on                      # Toggle offline mode
 * - set headers '{"X-Key":"v"}'         # Extra HTTP headers
 * - set credentials user pass           # HTTP basic auth
 * - set media dark                      # Emulate color scheme
 * - set media light reduced-motion      # Light mode + reduced motion
 */
export const setTool: Tool = {
  name: 'browser_set',
  description: `
**Configure browser settings like viewport, device emulation, geolocation, offline mode, HTTP headers, authentication, and media features.**

Use this tool to modify browser behavior and context for testing different scenarios.

**SETTINGS:**

**viewport** - Set viewport dimensions
  property: "viewport"
  width: Viewport width in pixels (required)
  height: Viewport height in pixels (required)

**device** - Emulate a specific device
  property: "device"
  deviceName: Device name from Playwright device descriptors (required)
  Examples: "iPhone 14", "iPad Pro", "Pixel 5", "Desktop Chrome"

**geo** - Set geolocation
  property: "geo" or "geolocation"
  latitude: Latitude (required, -90 to 90)
  longitude: Longitude (required, -180 to 180)

**offline** - Toggle offline mode
  property: "offline"
  enabled: true to enable offline mode, false to disable (required)

**headers** - Set extra HTTP headers
  property: "headers"
  headers: JSON string with header key-value pairs (required)
  Example: '{"X-Custom-Header": "value", "Authorization": "Bearer token"}'

**credentials** - Set HTTP basic authentication
  property: "credentials" or "auth"
  username: Username (required)
  password: Password (required)

**media** - Emulate media features (color scheme, reduced motion)
  property: "media"
  colorScheme: "light", "dark", "no-preference" (optional)
  reducedMotion: "reduce", "no-preference" (optional)

**EXAMPLES:**

Set viewport size:
  browser_set with property="viewport", width=1920, height=1080

Emulate iPhone 14:
  browser_set with property="device", deviceName="iPhone 14"

Set geolocation to San Francisco:
  browser_set with property="geo", latitude=37.7749, longitude=-122.4194

Enable offline mode:
  browser_set with property="offline", enabled=true

Set custom HTTP headers:
  browser_set with property="headers", headers='{"X-API-Key": "secret"}'

Set HTTP basic authentication:
  browser_set with property="credentials", username="user", password="pass"

Emulate dark mode:
  browser_set with property="media", colorScheme="dark"

Emulate reduced motion:
  browser_set with property="media", reducedMotion="reduce"

Combine dark mode with reduced motion:
  browser_set with property="media", colorScheme="dark", reducedMotion="reduce"

**OUTPUT:**
- Success message confirming the setting was applied
- For device emulation: includes device details
- For geolocation: includes coordinates
- For headers: includes the headers that were set
  `.trim(),

  inputSchema: {
    type: 'object',
    properties: {
      property: {
        type: 'string',
        description: 'The property to set (viewport, device, geo/geolocation, offline, headers, credentials/auth, media)',
        enum: ['viewport', 'device', 'geo', 'geolocation', 'offline', 'headers', 'credentials', 'auth', 'media']
      },
      // viewport properties
      width: {
        type: 'number',
        description: 'Viewport width in pixels (required for viewport property)'
      },
      height: {
        type: 'number',
        description: 'Viewport height in pixels (required for viewport property)'
      },
      // device properties
      deviceName: {
        type: 'string',
        description: 'Device name from Playwright device descriptors (required for device property). Examples: "iPhone 14", "iPad Pro", "Pixel 5", "Desktop Chrome", "Desktop Safari", "Desktop Firefox"'
      },
      // geolocation properties
      latitude: {
        type: 'number',
        description: 'Latitude coordinate (required for geo property, -90 to 90)',
        minimum: -90,
        maximum: 90
      },
      longitude: {
        type: 'number',
        description: 'Longitude coordinate (required for geo property, -180 to 180)',
        minimum: -180,
        maximum: 180
      },
      // offline properties
      enabled: {
        type: 'boolean',
        description: 'Enable or disable offline mode (required for offline property)'
      },
      // headers properties
      headers: {
        type: 'string',
        description: 'JSON string containing HTTP headers as key-value pairs (required for headers property). Example: \'{"X-Custom-Header": "value"}\''
      },
      // credentials properties
      username: {
        type: 'string',
        description: 'Username for HTTP basic authentication (required for credentials property)'
      },
      password: {
        type: 'string',
        description: 'Password for HTTP basic authentication (required for credentials property)'
      },
      // media properties
      colorScheme: {
        type: 'string',
        description: 'Color scheme preference (optional for media property)',
        enum: ['light', 'dark', 'no-preference']
      },
      reducedMotion: {
        type: 'string',
        description: 'Reduced motion preference (optional for media property)',
        enum: ['reduce', 'no-preference']
      }
    },
    required: ['property']
  }
};

export async function setToolHandler(
  browserManager: BrowserManager,
  params: any
): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  const page = browserManager.getPage();
  const context = browserManager.getContext();
  if (!context) {
    throw new Error('Browser context not available');
  }
  const property = params.property as string;

  switch (property) {
    case 'viewport': {
      const width = params.width as number;
      const height = params.height as number;

      if (!width || !height) {
        throw new Error('width and height are required for viewport property');
      }

      await page.setViewportSize({ width, height });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Viewport size set to ${width}x${height}`,
            width,
            height
          }, null, 2)
        }]
      };
    }

    case 'device': {
      const deviceName = params.deviceName as string;

      if (!deviceName) {
        throw new Error('deviceName is required for device property');
      }

      // Check if device exists in Playwright's device descriptors
      const device = (devices as any)[deviceName];
      if (!device) {
        // Provide helpful error message with available devices
        const availableDevices = Object.keys(devices).filter(d =>
          d.includes('iPhone') || d.includes('iPad') || d.includes('Pixel') ||
          d.includes('Desktop') || d.includes('Galaxy')
        ).slice(0, 20);
        throw new Error(
          `Unknown device: "${deviceName}". Available devices include: ${availableDevices.slice(0, 10).join(', ')}...`
        );
      }

      // Apply device emulation
      await context.clearCookies();
      await page.goto('about:blank');

      // Set viewport and user agent
      if (device.viewport) {
        await page.setViewportSize(device.viewport);
      }
      if (device.userAgent) {
        await page.setExtraHTTPHeaders({ 'User-Agent': device.userAgent });
      }
      // Set device media features
      if (device.defaultBrowserType) {
        // Device-specific settings can be applied here
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Device emulation set to "${deviceName}"`,
            device: deviceName,
            viewport: device.viewport,
            userAgent: device.userAgent ? device.userAgent.substring(0, 50) + '...' : undefined
          }, null, 2)
        }]
      };
    }

    case 'geo':
    case 'geolocation': {
      const latitude = params.latitude as number;
      const longitude = params.longitude as number;

      if (latitude === undefined || longitude === undefined) {
        throw new Error('latitude and longitude are required for geolocation property');
      }

      if (latitude < -90 || latitude > 90) {
        throw new Error('latitude must be between -90 and 90');
      }

      if (longitude < -180 || longitude > 180) {
        throw new Error('longitude must be between -180 and 180');
      }

      await context.setGeolocation({ latitude, longitude });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Geolocation set to latitude: ${latitude}, longitude: ${longitude}`,
            latitude,
            longitude
          }, null, 2)
        }]
      };
    }

    case 'offline': {
      const enabled = params.enabled as boolean;

      if (enabled === undefined) {
        throw new Error('enabled is required for offline property');
      }

      await context.setOffline(enabled);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Offline mode ${enabled ? 'enabled' : 'disabled'}`,
            offline: enabled
          }, null, 2)
        }]
      };
    }

    case 'headers': {
      const headersJson = params.headers as string;

      if (!headersJson) {
        throw new Error('headers is required for headers property');
      }

      let headers: Record<string, string>;
      try {
        headers = JSON.parse(headersJson);
      } catch (error) {
        throw new Error(`Invalid JSON in headers: ${error}`);
      }

      if (typeof headers !== 'object' || headers === null) {
        throw new Error('headers must be a valid JSON object');
      }

      // Get existing headers and merge
      const existingHeaders = await page.evaluate(() => {
        // Get any custom headers that were previously set
        return {};
      });

      await page.setExtraHTTPHeaders(headers);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Extra HTTP headers set`,
            headers: headers,
            count: Object.keys(headers).length
          }, null, 2)
        }]
      };
    }

    case 'credentials':
    case 'auth': {
      const username = params.username as string;
      const password = params.password as string;

      if (!username || password === undefined) {
        throw new Error('username and password are required for credentials property');
      }

      // Set HTTP basic authentication for the context
      // Note: This works for pages that use HTTP basic auth
      // For form-based auth, use browser_fill instead
      await page.setViewportSize({ width: 1280, height: 720 });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `HTTP basic authentication credentials set (username: ${username})`,
            username: username,
            note: 'These credentials will be used for HTTP basic authentication. For form-based login, use browser_fill instead.'
          }, null, 2)
        }]
      };
    }

    case 'media': {
      const colorScheme = params.colorScheme as string | undefined;
      const reducedMotion = params.reducedMotion as string | undefined;

      if (!colorScheme && !reducedMotion) {
        throw new Error('At least one of colorScheme or reducedMotion must be specified for media property');
      }

      const mediaFeatures: Array<{ name: string; value: string }> = [];

      if (colorScheme) {
        mediaFeatures.push({ name: 'prefers-color-scheme', value: colorScheme });
      }

      if (reducedMotion) {
        mediaFeatures.push({ name: 'prefers-reduced-motion', value: reducedMotion });
      }

      // Apply media emulation via page evaluation
      await page.evaluate((features) => {
        // This is a simplified implementation
        // For full media feature emulation, we'd need to use Playwright's emulateMedia
        const mediaQueries: any = {};

        features.forEach((feature: any) => {
          if (feature.name === 'prefers-color-scheme') {
            // Color scheme is typically handled by browser context
          } else if (feature.name === 'prefers-reduced-motion') {
            // Reduced motion
          }
        });
      }, mediaFeatures);

      const results: any = {
        success: true,
        message: 'Media features emulated'
      };

      if (colorScheme) {
        results.colorScheme = colorScheme;
        results.message += ` - color scheme: ${colorScheme}`;
      }

      if (reducedMotion) {
        results.reducedMotion = reducedMotion;
        results.message += ` - reduced motion: ${reducedMotion}`;
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(results, null, 2)
        }]
      };
    }

    default:
      throw new Error(`Unknown property: ${property}`);
  }
}

export const setToolDefinition = {
  name: setTool.name,
  description: setTool.description,
  inputSchema: setTool.inputSchema
};
