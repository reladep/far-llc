const zipcodes = require('zipcodes');
const fs = require('fs');
const path = require('path');

const seen = new Map();
for (let z = 0; z <= 99999; z++) {
  const zip = String(z).padStart(5, '0');
  const info = zipcodes.lookup(zip);
  if (info && info.country === 'US') {
    const key = info.city + '|' + info.state;
    if (!seen.has(key)) {
      seen.set(key, {
        c: info.city,
        s: info.state,
        a: Math.round(info.latitude * 10000) / 10000,
        o: Math.round(info.longitude * 10000) / 10000,
      });
    }
  }
}

const cities = Array.from(seen.values()).sort((a, b) =>
  a.s.localeCompare(b.s) || a.c.localeCompare(b.c)
);

const outDir = path.join(__dirname, '..', 'src', 'data');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(
  path.join(outDir, 'us-cities.json'),
  JSON.stringify(cities)
);

console.log(`Generated ${cities.length} cities → src/data/us-cities.json`);
const size = fs.statSync(path.join(outDir, 'us-cities.json')).size;
console.log(`File size: ${(size / 1024).toFixed(0)}KB`);
