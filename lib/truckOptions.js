// Truck makes and models for standardized dropdowns
export const TRUCK_MAKES = [
  'Chevrolet',
  'Dodge',
  'Ford',
  'Freightliner',
  'GMC',
  'International',
  'Kenworth',
  'Mack',
  'Nissan',
  'Peterbilt',
  'Ram',
  'Toyota',
  'Volvo',
  'Western Star',
  'Hino',
  'Isuzu',
  'Mitsubishi Fuso',
  'Other',
];

// Models by make - when make is "Other", show text input instead
export const MAKE_MODELS = {
  Chevrolet: ['Silverado 1500', 'Silverado 2500', 'Silverado 3500', 'Colorado', 'Other'],
  Dodge: ['Ram 1500', 'Ram 2500', 'Ram 3500', 'Dakota', 'Other'],
  Ford: ['F-150', 'F-250', 'F-350', 'F-450', 'F-550', 'F-650', 'F-750', 'Super Duty', 'Ranger', 'Other'],
  Freightliner: ['Cascadia', 'Coronado', 'Columbia', 'M2', 'Business Class M2', 'Other'],
  GMC: ['Sierra 1500', 'Sierra 2500', 'Sierra 3500', 'Canyon', 'Other'],
  International: ['Lonestar', 'LT', 'RH', 'ProStar', 'DuraStar', 'Other'],
  Kenworth: ['T680', 'T880', 'W990', 'T800', 'T700', 'T370', 'T270', 'Other'],
  Mack: ['Anthem', 'Pinnacle', 'Granite', 'TerraPro', 'Other'],
  Nissan: ['Titan', 'Frontier', 'NV', 'Other'],
  Peterbilt: ['579', '567', '389', '367', '348', '520', 'Other'],
  Ram: ['1500', '2500', '3500', '4500', '5500', 'ProMaster', 'Other'],
  Toyota: ['Tacoma', 'Tundra', 'Other'],
  Volvo: ['VNL', 'VNR', 'VHD', 'Other'],
  'Western Star': ['49X', '47X', '5700', '4800', 'Other'],
  Hino: ['155', '195', '258', '268', '338', 'Other'],
  Isuzu: ['NPR', 'NQR', 'FRR', 'FTR', 'Other'],
  'Mitsubishi Fuso': ['FE', 'FG', 'FH', 'Other'],
  Other: ['Other'],
};

export const TRUCK_YEARS = (() => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear; y >= 1990; y--) years.push(y);
  return years;
})();

export const TRUCK_CONDITIONS = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
  { value: 'new', label: 'New' },
];

export function getModelsForMake(make) {
  if (!make) return [];
  return MAKE_MODELS[make] || ['Other'];
}
