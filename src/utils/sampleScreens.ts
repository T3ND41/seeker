import { SamplePreset } from '../types';

/**
 * Generates pixel-perfect, high-fidelity sample screen PNG data URLs
 * directly using HTML5 Canvas 2D API for instantaneous, rock-solid accessibility testing.
 * Bypasses all SVG decoding/cross-origin iframe issues and guarantees 100% valid PNG images for Gemini vision.
 */

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function renderCheckoutToCanvas(width = 1280, height = 800): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  // Header Nav
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, width, 70);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('ShopEasy • Secure Checkout', 50, 44);

  // Cart button
  roundRect(ctx, 1050, 20, 180, 36, 6);
  ctx.fillStyle = '#334155';
  ctx.fill();
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText('Cart (3 items)', 1090, 43);

  // Stepper
  roundRect(ctx, 50, 90, 1180, 40, 8);
  ctx.fillStyle = '#1e293b';
  ctx.fill();
  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText('✓ 1. Shipping Address', 80, 115);

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(270, 110);
  ctx.lineTo(390, 110);
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.fillText('● 2. Payment Method (Active)', 410, 115);

  ctx.beginPath();
  ctx.moveTo(640, 110);
  ctx.lineTo(760, 110);
  ctx.stroke();

  ctx.fillStyle = '#94a3b8';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText('3. Review & Confirm', 780, 115);

  // Alert Banner
  roundRect(ctx, 50, 150, 1180, 48, 8);
  ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
  ctx.fill();
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#f87171';
  ctx.font = '600 15px system-ui, sans-serif';
  ctx.fillText('⚠️ Attention: Please re-enter your Card CVV security code to continue.', 75, 180);

  // Left Column: Payment Form
  roundRect(ctx, 50, 220, 750, 520, 12);
  ctx.fillStyle = '#1e293b';
  ctx.fill();
  ctx.strokeStyle = '#334155';
  ctx.stroke();

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText('Payment Information', 80, 260);

  // Card Number
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillText('CARD NUMBER', 80, 305);
  roundRect(ctx, 80, 318, 690, 46, 8);
  ctx.fillStyle = '#0f172a';
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.stroke();
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('4532 •••• •••• 8892', 96, 347);

  // Expiration Date
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillText('EXPIRATION DATE', 80, 395);
  roundRect(ctx, 80, 408, 330, 46, 8);
  ctx.fillStyle = '#0f172a';
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.stroke();
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('08 / 28', 96, 437);

  // CVV (Required)
  ctx.fillStyle = '#f87171';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('CVV (Required) *', 440, 395);
  roundRect(ctx, 440, 408, 330, 46, 8);
  ctx.fillStyle = '#0f172a';
  ctx.fill();
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#94a3b8';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('e.g. 123', 456, 437);

  // Name on Card
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillText('NAME ON CARD', 80, 485);
  roundRect(ctx, 80, 498, 690, 46, 8);
  ctx.fillStyle = '#0f172a';
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('Alex Morgan', 96, 527);

  // Checkbox: Save Card
  roundRect(ctx, 80, 565, 20, 20, 4);
  ctx.fillStyle = '#38bdf8';
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText('✓', 84, 580);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText('Save card securely for future purchases', 115, 580);

  // Submit Button
  roundRect(ctx, 80, 620, 690, 52, 10);
  ctx.fillStyle = '#0284c7';
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.fillText('Pay $149.50 & Complete Order', 320, 653);

  // Right Column: Order Summary
  roundRect(ctx, 830, 220, 400, 420, 12);
  ctx.fillStyle = '#1e293b';
  ctx.fill();
  ctx.strokeStyle = '#334155';
  ctx.stroke();

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText('Order Summary', 855, 260);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText('Subtotal (3 items)', 855, 305);
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText('$135.00', 1150, 305);

  ctx.fillStyle = '#94a3b8';
  ctx.fillText('Estimated Shipping', 855, 340);
  ctx.fillStyle = '#10b981';
  ctx.fillText('Free', 1170, 340);

  ctx.fillStyle = '#94a3b8';
  ctx.fillText('Sales Tax', 855, 375);
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText('$14.50', 1160, 375);

  ctx.strokeStyle = '#334155';
  ctx.beginPath();
  ctx.moveTo(855, 410);
  ctx.lineTo(1205, 410);
  ctx.stroke();

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText('Total Due', 855, 445);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText('$149.50', 1140, 445);

  // Promo code
  roundRect(ctx, 855, 480, 220, 40, 6);
  ctx.fillStyle = '#0f172a';
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.stroke();
  ctx.fillStyle = '#64748b';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('Promo Code', 870, 505);

  roundRect(ctx, 1085, 480, 120, 40, 6);
  ctx.fillStyle = '#334155';
  ctx.fill();
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillText('Apply', 1125, 505);

  return canvas.toDataURL('image/png');
}

function renderSecurityToCanvas(width = 1280, height = 800): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, width, height);

  // Sidebar
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, 240, height);
  ctx.fillStyle = '#60a5fa';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText('⚙️ CloudVault', 30, 50);

  // Nav Items
  roundRect(ctx, 16, 90, 208, 40, 8);
  ctx.fillStyle = '#1f2937';
  ctx.fill();
  ctx.fillStyle = '#60a5fa';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText('🛡️ Security & 2FA', 30, 115);

  ctx.fillStyle = '#9ca3af';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText('👤 Profile Settings', 30, 160);
  ctx.fillText('💳 Billing & Plans', 30, 205);
  ctx.fillText('👥 Team Members', 30, 250);

  // Main Header
  ctx.fillStyle = '#f9fafb';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText('Security Settings', 280, 60);
  ctx.fillStyle = '#9ca3af';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('Manage your two-factor authentication and login credentials.', 280, 90);

  // 2FA Card
  roundRect(ctx, 280, 130, 950, 260, 12);
  ctx.fillStyle = '#111827';
  ctx.fill();
  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#f9fafb';
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText('Two-Factor Authentication (2FA)', 310, 175);

  // Status badge
  roundRect(ctx, 310, 195, 170, 28, 6);
  ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
  ctx.fill();
  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('● DISABLED - High Risk', 320, 214);

  ctx.fillStyle = '#9ca3af';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText('Protect your account with an extra layer of security using an authenticator app.', 310, 255);

  // Enable 2FA Button
  roundRect(ctx, 310, 290, 250, 48, 8);
  ctx.fillStyle = '#2563eb';
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText('Enable 2FA Protection', 355, 320);

  // Password Card
  roundRect(ctx, 280, 420, 950, 280, 12);
  ctx.fillStyle = '#111827';
  ctx.fill();
  ctx.strokeStyle = '#1f2937';
  ctx.stroke();

  ctx.fillStyle = '#f9fafb';
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText('Change Password', 310, 465);

  ctx.fillStyle = '#9ca3af';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText('CURRENT PASSWORD', 310, 505);
  roundRect(ctx, 310, 515, 420, 42, 6);
  ctx.fillStyle = '#030712';
  ctx.fill();
  ctx.strokeStyle = '#374151';
  ctx.stroke();
  ctx.fillStyle = '#6b7280';
  ctx.fillText('••••••••••••', 325, 542);

  ctx.fillStyle = '#9ca3af';
  ctx.fillText('NEW PASSWORD', 310, 580);
  roundRect(ctx, 310, 590, 420, 42, 6);
  ctx.fillStyle = '#030712';
  ctx.fill();
  ctx.strokeStyle = '#374151';
  ctx.stroke();
  ctx.fillStyle = '#6b7280';
  ctx.fillText('Minimum 12 characters', 325, 617);

  roundRect(ctx, 310, 645, 180, 42, 8);
  ctx.fillStyle = '#374151';
  ctx.fill();
  ctx.fillStyle = '#e5e7eb';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText('Update Password', 345, 672);

  return canvas.toDataURL('image/png');
}

function renderFlightsToCanvas(width = 1280, height = 800): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = '#0a0f1d';
  ctx.fillRect(0, 0, width, height);

  // Header Nav
  ctx.fillStyle = '#111927';
  ctx.fillRect(0, 0, width, 70);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('✈️ SkyVoyage • Flight Booking', 40, 44);

  // Search summary banner
  roundRect(ctx, 40, 90, 1200, 60, 10);
  ctx.fillStyle = '#1e293b';
  ctx.fill();
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText('London Heathrow (LHR) ➔ New York (JFK)', 70, 125);
  ctx.fillStyle = '#38bdf8';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText('Depart: Thu, Oct 15 • 1 Passenger, Economy', 800, 125);

  // Filter chips
  const filters = ['Non-stop only (Active)', 'Under $700', 'Morning departure', 'Airline: All'];
  let curX = 40;
  filters.forEach((f, idx) => {
    roundRect(ctx, curX, 170, 180, 36, 18);
    ctx.fillStyle = idx === 0 ? '#0284c7' : '#1e293b';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(f, curX + 16, 193);
    curX += 195;
  });

  // Flight Card 1 (Recommended)
  roundRect(ctx, 40, 230, 1200, 130, 10);
  ctx.fillStyle = '#1e293b';
  ctx.fill();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Best Value badge
  roundRect(ctx, 60, 242, 100, 22, 4);
  ctx.fillStyle = '#10b981';
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillText('BEST VALUE', 74, 257);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('09:15', 70, 300);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText('LHR London', 70, 325);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('7h 30m • Non-stop', 280, 300);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('12:45', 460, 300);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText('JFK New York', 460, 325);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 28px system-ui, sans-serif';
  ctx.fillText('$580', 940, 305);

  roundRect(ctx, 1060, 275, 155, 46, 8);
  ctx.fillStyle = '#0284c7';
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText('Select Flight', 1095, 304);

  // Flight Card 2
  roundRect(ctx, 40, 390, 1200, 130, 10);
  ctx.fillStyle = '#1e293b';
  ctx.fill();
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('14:30', 70, 455);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText('LHR London', 70, 480);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('8h 10m • Non-stop', 280, 455);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('17:40', 460, 455);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText('JFK New York', 460, 480);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 28px system-ui, sans-serif';
  ctx.fillText('$618', 940, 460);

  roundRect(ctx, 1060, 430, 155, 46, 8);
  ctx.fillStyle = '#334155';
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText('Select Flight', 1095, 459);

  return canvas.toDataURL('image/png');
}

// Fallback transparent 1x1 PNG data URL
const FALLBACK_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

export function getPresetPng(presetId: string): string {
  try {
    if (presetId === 'checkout') return renderCheckoutToCanvas();
    if (presetId === 'security') return renderSecurityToCanvas();
    if (presetId === 'flights') return renderFlightsToCanvas();
  } catch (err) {
    console.warn('Canvas rendering error for preset:', presetId, err);
  }
  return FALLBACK_PNG;
}

export function rasterizeSvgToPng(dataUrlOrSvg: string, width = 1280, height = 800): Promise<string> {
  return new Promise((resolve) => {
    if (!dataUrlOrSvg) {
      resolve(FALLBACK_PNG);
      return;
    }

    // Already a standard raster image
    if (dataUrlOrSvg.startsWith('data:image/png') || dataUrlOrSvg.startsWith('data:image/jpeg') || dataUrlOrSvg.startsWith('data:image/webp')) {
      resolve(dataUrlOrSvg);
      return;
    }

    // If it's a known preset ID
    if (dataUrlOrSvg === 'checkout' || dataUrlOrSvg === 'security' || dataUrlOrSvg === 'flights') {
      resolve(getPresetPng(dataUrlOrSvg));
      return;
    }

    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve(FALLBACK_PNG);
      return;
    }

    try {
      // Use clean Image decoding without crossOrigin taint
      const img = new Image();
      let src = dataUrlOrSvg;

      if (!src.startsWith('data:')) {
        // Raw SVG string
        try {
          const b64 = window.btoa(unescape(encodeURIComponent(dataUrlOrSvg)));
          src = `data:image/svg+xml;base64,${b64}`;
        } catch {
          resolve(FALLBACK_PNG);
          return;
        }
      }

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/png'));
            return;
          }
        } catch (e) {
          console.warn('Canvas rasterization error:', e);
        }
        resolve(getPresetPng('checkout'));
      };

      img.onerror = () => {
        resolve(getPresetPng('checkout'));
      };

      img.src = src;
    } catch {
      resolve(getPresetPng('checkout'));
    }
  });
}

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'checkout',
    name: 'E-Commerce Checkout',
    category: 'E-Commerce & Forms',
    description: 'Shopping cart with required CVV error banner, credit card fields, and order summary.',
    defaultGoal: 'Fill in the required CVV code and complete order payment',
    dataUrl: typeof window !== 'undefined' ? renderCheckoutToCanvas() : FALLBACK_PNG,
  },
  {
    id: 'security',
    name: 'Account & 2FA Settings',
    category: 'SaaS Dashboard',
    description: 'Security control panel with disabled 2FA toggle button and password change form.',
    defaultGoal: 'Turn on Two-Factor Authentication (2FA) to secure my account',
    dataUrl: typeof window !== 'undefined' ? renderSecurityToCanvas() : FALLBACK_PNG,
  },
  {
    id: 'flights',
    name: 'Flight Booking Portal',
    category: 'Travel & Search',
    description: 'Flight search results with departure times, prices, and selection buttons.',
    defaultGoal: 'Select the best value direct flight from London to New York',
    dataUrl: typeof window !== 'undefined' ? renderFlightsToCanvas() : FALLBACK_PNG,
  },
];
