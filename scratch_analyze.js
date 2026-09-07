const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'datasets', 'dataset_v4_multimodal_longitudinal_best.csv');
console.log('Reading dataset:', csvPath);
const rawData = fs.readFileSync(csvPath, 'utf8');

const lines = rawData.trim().split('\n').map(l => l.trim()).filter(Boolean);
const header = lines[0].split(',');
console.log(`Loaded ${lines.length - 1} rows with headers:`, header);

const records = [];
for (let i = 1; i < lines.length; i++) {
  const row = lines[i].split(',');
  if (row.length < header.length) continue;

  const item = {};
  header.forEach((h, idx) => {
    const val = row[idx];
    const num = parseFloat(val);
    item[h] = isNaN(num) ? val : num;
  });
  records.push(item);
}

console.log(`Parsed ${records.length} valid records.`);

// Group by Risk Tier
const tiers = { 0: [], 1: [], 2: [], 3: [] };
records.forEach(r => {
  const code = r.Risk_Tier_Code !== undefined ? r.Risk_Tier_Code : (r.Risk_Tier_Label === 'High Risk' ? 3 : r.Risk_Tier_Label === 'Moderate Risk' ? 2 : r.Risk_Tier_Label === 'Low Risk' ? 1 : 0);
  if (tiers[code]) tiers[code].push(r);
});

console.log('Tier distribution:');
console.log('  No Risk (0):', tiers[0].length);
console.log('  Low Risk (1):', tiers[1].length);
console.log('  Moderate Risk (2):', tiers[2].length);
console.log('  High Risk (3):', tiers[3].length);

// Compute baseline statistics per tier
function stats(arr, key) {
  const vals = arr.map(a => a[key]).filter(v => typeof v === 'number' && !isNaN(v)).sort((a,b) => a - b);
  if (!vals.length) return { mean: 0, min: 0, max: 0, p50: 0, p10: 0, p90: 0 };
  const sum = vals.reduce((a, b) => a + b, 0);
  const mean = sum / vals.length;
  const p10 = vals[Math.floor(vals.length * 0.1)];
  const p50 = vals[Math.floor(vals.length * 0.5)];
  const p90 = vals[Math.floor(vals.length * 0.9)];
  return {
    mean: Number(mean.toFixed(2)),
    min: Number(vals[0].toFixed(2)),
    max: Number(vals[vals.length - 1].toFixed(2)),
    p10: Number(p10.toFixed(2)),
    p50: Number(p50.toFixed(2)),
    p90: Number(p90.toFixed(2))
  };
}

const metrics = [
  'Somatic_Cell_Count_Actual',
  'Mean_EC',
  'Quarter_Differential_Ratio',
  'Milk_pH',
  'Milk_Temperature_C',
  'Milk_Yield_Liters',
  'Rumination_Minutes',
  'Lying_Hours',
  'Bedding_Hygiene_Score',
  'THI_Index'
];

const comparisons = {};
metrics.forEach(m => {
  comparisons[m] = {
    normal: stats(tiers[0], m),
    lowRisk: stats(tiers[1], m),
    moderateRisk: stats(tiers[2], m),
    highRisk: stats(tiers[3], m)
  };
});

console.log('\n--- Normal vs High Risk Comparison ---');
metrics.forEach(m => {
  console.log(`${m}:`);
  console.log(`   Normal (No Risk): Mean=${comparisons[m].normal.mean} (Range: ${comparisons[m].normal.min} - ${comparisons[m].normal.max})`);
  console.log(`   High Risk:        Mean=${comparisons[m].highRisk.mean} (Range: ${comparisons[m].highRisk.min} - ${comparisons[m].highRisk.max})`);
});
