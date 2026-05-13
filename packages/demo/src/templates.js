// ── Pre-built product templates for the demo ──────────────

export const TEMPLATES = {
  smartphone: {
    category: 'Smartphones',
    brand: 'Samsung',
    tone: 'professional',
    attributes: { model: 'Galaxy S24 Ultra', color: 'Titanium Black', storage: '512GB' },
    specifications: { processor: 'Snapdragon 8 Gen 3', RAM: '12GB', display: '6.8" Dynamic AMOLED 2X', battery: '5000mAh', camera: '200MP quad' },
    features: ['S Pen included', 'IP68 water resistance', '45W fast charging', 'Satellite connectivity', 'AI-powered photo editing'],
  },
  laptop: {
    category: 'Laptops',
    brand: 'Apple',
    tone: 'professional',
    attributes: { model: 'MacBook Pro 16"', color: 'Space Black', storage: '1TB SSD' },
    specifications: { chip: 'Apple M3 Pro', RAM: '36GB', display: '16.2" Liquid Retina XDR', battery: '22 hours', weight: '2.14 kg' },
    features: ['ProMotion 120Hz display', 'MagSafe charging', 'Thunderbolt 4 ports', 'Touch ID', 'Military-grade build quality'],
  },
  shoes: {
    category: 'Running Shoes',
    brand: 'Nike',
    tone: 'friendly',
    attributes: { model: 'Air Zoom Pegasus 41', color: 'Volt/Black', sizes: '6-14 US' },
    specifications: { sole: 'React foam midsole', upper: 'Breathable mesh', weight: '283g', drop: '10mm' },
    features: ['Air Zoom unit in forefoot', 'Reflective elements for visibility', 'Wide toe box', 'Durable rubber outsole'],
  },
  watch: {
    category: 'Smartwatches',
    brand: 'Apple',
    tone: 'luxury',
    attributes: { model: 'Watch Ultra 2', color: 'Natural Titanium', band: 'Alpine Loop' },
    specifications: { display: '49mm Always-On Retina', battery: '60 hours', GPS: 'Precision dual-frequency', water_resistance: '100m' },
    features: ['Action button', 'Siren (86 decibels)', 'Waypoint & backtrack', 'Depth gauge', 'Advanced workout metrics'],
  },
  furniture: {
    category: 'Office Furniture',
    brand: 'Herman Miller',
    tone: 'professional',
    attributes: { model: 'Aeron Chair', color: 'Graphite', size: 'Size B (Medium)' },
    specifications: { material: 'PostureFit SL support', armrests: '8Z Pellicle', weight_capacity: '136 kg', warranty: '12 years' },
    features: ['Fully adjustable lumbar support', 'Tilt limiter', 'Forward tilt', 'Height-adjustable arms', 'Ergonomic mesh back'],
  },
  book: {
    category: 'Books',
    brand: undefined,
    tone: 'casual',
    attributes: { title: 'Atomic Habits', author: 'James Clear', format: 'Hardcover', pages: '320' },
    specifications: { publisher: 'Avery', language: 'English', ISBN: '978-0735211292', year: '2018' },
    features: ['#1 New York Times bestseller', 'Practical habit-forming framework', 'Evidence-based strategies', 'Real-world case studies'],
  },
};
