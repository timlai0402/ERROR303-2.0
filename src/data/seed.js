// Generates realistic demo data relative to "now" so the dashboard always looks live.
import { allocateFifo, DAY, startOfDay } from '../lib/inventory.js';

export const USERS = [
  { id: 'u1', name: 'Aisyah Rahman', role: 'Owner', initials: 'AR' },
  { id: 'u2', name: 'Daniel Lee', role: 'Staff', initials: 'DL' },
  { id: 'u3', name: 'Priya Nair', role: 'Staff', initials: 'PN' },
];

export const SUPPLIERS = [
  { id: 's1', name: 'Mega Office Supplies Sdn Bhd', contact: 'Mr. Tan', phone: '60123450101', email: 'orders@megaoffice.example.com' },
  { id: 's2', name: 'CleanPro Distribution', contact: 'Ms. Wong', phone: '60123450202', email: 'sales@cleanpro.example.com' },
  { id: 's3', name: 'PackRight Packaging Sdn Bhd', contact: 'Encik Faiz', phone: '60123450303', email: 'order@packright.example.com' },
  { id: 's4', name: 'SafeGuard Medical Supply', contact: 'Dr. Lim', phone: '60123450404', email: 'supply@safeguard.example.com' },
  { id: 's5', name: 'Borong Runcit Hj. Ali', contact: 'Hj. Ali', phone: '60123450505', email: 'hjali.borong@example.com' },
  { id: 's6', name: 'BrightLite Electrical', contact: 'Mr. Kumar', phone: '60123450606', email: 'kumar@brightlite.example.com' },
];

// name, unit, category, avg daily usage, ending stock, alert level, lead days, supplier
const CATALOG = [
  ['Nitrile Gloves Medium (Box of 100)', 'box', 'Safety', 6, 22, 20, 5, 's4'],
  ['A4 Copy Paper 80gsm (Ream)', 'ream', 'Stationery', 9, 140, 40, 3, 's1'],
  ['Paper Towel Roll (Pack of 6)', 'pack', 'Cleaning', 3, 9, 10, 4, 's2'],
  ['Black Ballpoint Pen (Box of 12)', 'box', 'Stationery', 2, 48, 10, 3, 's1'],
  ['Hand Sanitiser 500ml', 'bottle', 'Safety', 4, 30, 12, 4, 's4'],
  ['Garbage Bag Large (Roll of 20)', 'roll', 'Cleaning', 5, 12, 15, 3, 's2'],
  ['Thermal Receipt Roll 80mm', 'roll', 'Retail', 8, 160, 40, 5, 's1'],
  ['Packing Tape Clear 48mm', 'roll', 'Packaging', 6, 70, 24, 3, 's3'],
  ['Corrugated Box Medium 40x30x30cm', 'pcs', 'Packaging', 15, 260, 80, 4, 's3'],
  ['Bubble Wrap Roll 1m x 50m', 'roll', 'Packaging', 1, 9, 3, 5, 's3'],
  ['Surgical Face Mask (Box of 50)', 'box', 'Safety', 3, 55, 15, 4, 's4'],
  ['Mineral Water 500ml (Carton of 24)', 'carton', 'Pantry', 2, 18, 6, 2, 's5'],
  ['3-in-1 Coffee Mix (Pack of 30)', 'pack', 'Pantry', 1.5, 20, 6, 3, 's5'],
  ['Floor Cleaner 2L', 'bottle', 'Cleaning', 1, 14, 4, 4, 's2'],
  ['Sticky Notes 3x3 Yellow (Pack of 12)', 'pack', 'Stationery', 1, 25, 5, 3, 's1'],
  ['AA Alkaline Battery (Pack of 4)', 'pack', 'Electrical', 1.2, 4, 6, 3, 's6'],
  ['Shipping Label A6 (Roll of 500)', 'roll', 'Packaging', 2, 30, 8, 3, 's3'],
  ['Stapler Refill No.10 (Box)', 'box', 'Stationery', 0.5, 40, 10, 3, 's1'],
  ['Disinfectant Wipes (Pack of 80)', 'pack', 'Cleaning', 2, 28, 10, 4, 's2'],
  ['LED Tube Light 18W', 'pcs', 'Electrical', 0, 24, 6, 7, 's6'],
];

function rng(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createSeed(now = Date.now()) {
  const rand = rng(20261101);
  const today0 = startOfDay(now);
  const staffIds = ['u1', 'u2', 'u2', 'u3', 'u3'];
  const pickStaff = () => staffIds[Math.floor(rand() * staffIds.length)];

  // time within business hours on a day offset (0 = today, -1 = yesterday...)
  const timeOn = (dayOffset, frac) => {
    const base = today0 + dayOffset * DAY;
    if (dayOffset === 0) {
      // keep today's events before "now"
      const span = Math.max(now - base - 5 * 60 * 1000, 10 * 60 * 1000);
      return new Date(base + span * (0.15 + 0.8 * frac)).toISOString();
    }
    return new Date(base + (8.5 + frac * 9.5) * 60 * 60 * 1000).toISOString();
  };

  const products = CATALOG.map(([name, unit, category, , , alertLevel, leadTimeDays, supplierId], i) => ({
    id: `p${i + 1}`,
    code: `SW-${1001 + i}`,
    name, unit, category, alertLevel, leadTimeDays, supplierId,
    createdAt: new Date(today0 - (40 + i) * DAY).toISOString(),
    createdBy: 'u1',
  }));

  const events = [];
  let batchCounter = 0;
  const batchNo = () => String(++batchCounter).padStart(4, '0');

  CATALOG.forEach(([, , , rate, final], i) => {
    const pid = `p${i + 1}`;
    // daily stock-outs over the last 14 days
    const outs = [];
    if (rate > 0) {
      for (let d = -13; d <= 0; d++) {
        let qty = Math.round(rate * (0.6 + rand() * 0.8));
        if (qty <= 0 && rand() < rate) qty = 1;
        if (qty <= 0) continue;
        const parts = qty >= 6 && rand() > 0.4 ? 2 : 1;
        let left = qty;
        for (let k = 0; k < parts; k++) {
          const q = k === parts - 1 ? left : Math.ceil(left / 2);
          left -= q;
          outs.push({ kind: 'out', pid, qty: q, at: timeOn(d, rand()) });
        }
      }
    }
    const total = outs.reduce((s, o) => s + o.qty, 0);
    if (total === 0) {
      events.push({ kind: 'in', pid, qty: final, at: timeOn(-20, 0.3), source: 'manual' });
    } else {
      const a = Math.round(total * 0.8);
      const keepB = final >= 10 ? Math.round(final * 0.6) : final;
      const b = total - a + keepB;
      const c = final - keepB;
      events.push({ kind: 'in', pid, qty: a, at: timeOn(-16, rand()), source: 'manual' });
      events.push({ kind: 'in', pid, qty: b, at: timeOn(-7, rand()), source: 'delivery-note' });
      if (c > 0) {
        // some restocks land today so "Today's Activity" has stock-ins
        const day = i % 3 === 0 ? 0 : -2;
        events.push({ kind: 'in', pid, qty: c, at: timeOn(day, rand() * 0.5), source: 'scan' });
      }
    }
    events.push(...outs);
  });

  events.sort((x, y) => new Date(x.at) - new Date(y.at));

  let batches = [];
  const movements = [];
  for (const e of events) {
    const staff = pickStaff();
    if (e.kind === 'in') {
      const b = {
        id: `b${batchCounter + 1}`, batchNo: batchNo(), productId: e.pid,
        qtyIn: e.qty, qtyRemaining: e.qty, receivedAt: e.at, staff, source: e.source,
      };
      batches.push(b);
      movements.push({ id: `m${movements.length + 1}`, type: 'in', productId: e.pid, qty: e.qty, at: e.at, staff, source: e.source, batchId: b.id, batchNo: b.batchNo });
    } else {
      const { allocations, updatedBatches } = allocateFifo(e.pid, e.qty, batches);
      batches = updatedBatches;
      movements.push({ id: `m${movements.length + 1}`, type: 'out', productId: e.pid, qty: e.qty, at: e.at, staff, source: rand() > 0.3 ? 'scan' : 'manual', allocations });
    }
  }

  // One new product registered today
  const newAt = timeOn(0, 0.55);
  const np = {
    id: 'p21', code: 'SW-1021', name: 'Cable Ties 200mm (Pack of 100)', unit: 'pack', category: 'Electrical',
    alertLevel: 5, leadTimeDays: 3, supplierId: 's6', createdAt: newAt, createdBy: 'u2',
  };
  products.push(np);
  const nb = { id: `b${batchCounter + 1}`, batchNo: batchNo(), productId: 'p21', qtyIn: 30, qtyRemaining: 30, receivedAt: newAt, staff: 'u2', source: 'scan' };
  batches.push(nb);
  movements.push({ id: `m${movements.length + 1}`, type: 'new', productId: 'p21', qty: 0, at: newAt, staff: 'u2', source: 'scan' });
  movements.push({ id: `m${movements.length + 1}`, type: 'in', productId: 'p21', qty: 30, at: newAt, staff: 'u2', source: 'scan', batchId: nb.id, batchNo: nb.batchNo });

  return {
    version: 1,
    business: { name: 'Kedai Maju Supplies', currency: 'RM' },
    users: USERS,
    suppliers: SUPPLIERS,
    products,
    batches,
    movements,
  };
}
