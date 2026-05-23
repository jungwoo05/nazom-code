export const manufacturers = [
  { id: 'benz', name: '벤츠' },
  { id: 'bmw', name: 'BMW' },
  { id: 'audi', name: '아우디' },
  { id: 'volkswagen', name: '폭스바겐' },
  { id: 'porsche', name: '포르쉐' },
  { id: 'mini', name: '미니' },
  { id: 'jaguar', name: '재규어' },
  { id: 'landrover', name: '랜드로버' },
  { id: 'volvo', name: '볼보' },
  { id: 'lexus', name: '렉서스' },
  { id: 'maserati', name: '마세라티' },
  { id: 'toyota', name: '토요타' },
  { id: 'nissan', name: '닛산' },
  { id: 'infiniti', name: '인피니티' },
  { id: 'ford', name: '포드' }
];

export const carModels = {
  benz: [
    { id: 'a-class', name: 'A-Class' },
    { id: 'b-class', name: 'B-Class' },
    { id: 'c-class', name: 'C-Class' },
    { id: 'e-class', name: 'E-Class' },
    { id: 's-class', name: 'S-Class' },
    { id: 'cla', name: 'CLA' },
    { id: 'glb', name: 'GLB' },
    { id: 'glc', name: 'GLC' },
    { id: 'gle', name: 'GLE' },
  ],
  bmw: [
    { id: '1-series', name: '1 Series' },
    { id: '3-series', name: '3 Series' },
    { id: '5-series', name: '5 Series' },
    { id: '7-series', name: '7 Series' },
    { id: 'x3', name: 'X3' },
    { id: 'x5', name: 'X5' },
    { id: 'x7', name: 'X7' },
  ],
  audi: [
    { id: 'a4', name: 'A4' },
    { id: 'a6', name: 'A6' },
    { id: 'a8', name: 'A8' },
    { id: 'q5', name: 'Q5' },
    { id: 'q7', name: 'Q7' },
  ]
};

// Fallback for others
const defaultModels = [
  { id: 'sedan', name: '세단' },
  { id: 'suv', name: 'SUV' },
  { id: 'coupe', name: '쿠페' }
];

export const getModelsForManufacturer = (manufacturerId) => {
  return carModels[manufacturerId] || defaultModels;
};

// Return last 20 years
export const getYears = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 20 }, (_, i) => currentYear - i);
};

export const detailedModels = {
  'e-class': [
    { id: 'e250', name: 'E 250' },
    { id: 'e300', name: 'E 300' },
    { id: 'e350', name: 'E 350' },
    { id: 'e220d', name: 'E 220 d' },
  ],
  '5-series': [
    { id: '520i', name: '520i' },
    { id: '530i', name: '530i' },
    { id: '523d', name: '523d' },
  ]
};

const defaultDetailedModels = [
  { id: 'base', name: '기본형' },
  { id: 'premium', name: '프리미엄' },
  { id: 'sport', name: '스포츠' }
];

export const getDetailedModelsForModel = (modelId) => {
  return detailedModels[modelId] || defaultDetailedModels;
};
