import { useState } from 'react';
import { ArrowRight, ArrowLeft, CheckCircle, Car, Calendar, Settings, Wrench } from 'lucide-react';
import { manufacturers, getModelsForManufacturer, getYears, getDetailedModelsForModel } from '../data/mockData';
import './CarSelectionWidget.css';

const steps = [
  { key: 'manufacturer', label: '브랜드 선택', icon: Car },
  { key: 'model',        label: '차종 선택',   icon: Settings },
  { key: 'year',         label: '연식 선택',   icon: Calendar },
  { key: 'detailedModel',label: '세부 모델',   icon: Wrench },
];

const brandLogos = {
  benz: 'https://www.carmeolap.co.kr/img/car_logo/img_benz.png',
  bmw: 'https://www.carmeolap.co.kr/img/car_logo/img_bmw.png',
  audi: 'https://www.carmeolap.co.kr/img/car_logo/img_audi.png',
  volkswagen: 'https://www.carmeolap.co.kr/img/car_logo/img_volkswagen.png',
  porsche: 'https://www.carmeolap.co.kr/img/car_logo/img_porsche.png',
  mini: 'https://www.carmeolap.co.kr/img/car_logo/img_mini.png',
  jaguar: 'https://www.carmeolap.co.kr/img/car_logo/img_jaguar.png',
  landrover: 'https://www.carmeolap.co.kr/img/car_logo/img_landrover.png',
  volvo: 'https://www.carmeolap.co.kr/img/car_logo/img_volvo.png',
  lexus: 'https://www.carmeolap.co.kr/img/car_logo/img_lexus.png',
  maserati: 'https://www.carmeolap.co.kr/img/car_logo/img_maserati.png',
  toyota: 'https://www.carmeolap.co.kr/img/car_logo/img_toyota.png',
  nissan: 'https://www.carmeolap.co.kr/img/car_logo/img_nissan.png',
  infiniti: 'https://www.carmeolap.co.kr/img/car_logo/img_infiniti.png',
  ford: 'https://www.carmeolap.co.kr/img/car_logo/img_ford.png',
};

const CarSelectionWidget = ({ onProceed }) => {
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState({
    manufacturer: null, model: null, year: null, detailedModel: null
  });

  const getOptions = (s) => {
    switch (s) {
      case 0: return manufacturers;
      case 1: return selections.manufacturer ? getModelsForManufacturer(selections.manufacturer) : [];
      case 2: return selections.model ? getYears().map(y => ({ id: y, name: String(y) })) : [];
      case 3: return selections.year ? getDetailedModelsForModel(selections.model) : [];
      default: return [];
    }
  };

  const getSelectionValue = (idx) => {
    switch (idx) {
      case 0: return manufacturers.find(m => m.id === selections.manufacturer)?.name || null;
      case 1: return selections.model ? getModelsForManufacturer(selections.manufacturer).find(m => m.id === selections.model)?.name : null;
      case 2: return selections.year ? String(selections.year) : null;
      case 3: return selections.detailedModel ? getDetailedModelsForModel(selections.model).find(m => m.id === selections.detailedModel)?.name : null;
      default: return null;
    }
  };

  const handleSelect = (optId) => {
    const key = steps[step].key;
    const newSel = { ...selections, [key]: optId };
    if (step === 0) { newSel.model = null; newSel.year = null; newSel.detailedModel = null; }
    if (step === 1) { newSel.year = null; newSel.detailedModel = null; }
    if (step === 2) { newSel.detailedModel = null; }
    setSelections(newSel);
    if (step < 3) {
      setTimeout(() => setStep(s => s + 1), 50);
    }
  };

  const goBack = () => {
    setTimeout(() => setStep(s => s - 1), 50);
  };

  const isBrandStep = step === 0;
  const isYearStep = step === 2;
  const currentKey = steps[step].key;
  const selectedBrandName = getSelectionValue(0);

  return (
    <div className="wizard-widget">
      <div className="stepper">
        {steps.map((s, i) => {
          const val = getSelectionValue(i);
          const isActive = i === step;
          const isDone = i < step || (i === 3 && selections.detailedModel);
          const StepIcon = s.icon;
          return (
            <button
              key={s.key}
              className={`step-node ${isActive ? 'active' : ''} ${isDone ? 'done' : ''} ${i > step ? 'locked' : ''}`}
              onClick={() => i <= step && setStep(i)}
              disabled={i > step}
            >
              <div className="step-icon-wrap">
                {isDone ? <CheckCircle size={18} /> : <StepIcon size={18} />}
              </div>
              <div className="step-info">
                <span className="step-label">{s.label}</span>
                {val && <span className="step-value">{val}</span>}
              </div>
            </button>
          );
        })}
      </div>

      <div className="wizard-body">
        <div className="wizard-step-header">
          {step > 0 && (
            <button className="back-pill" onClick={goBack}>
              <ArrowLeft size={16}/> 이전
            </button>
          )}
          <div className="step-headline">
            <span className="step-number">STEP {step + 1}</span>
            <h3>{steps[step].label}을 선택해주세요</h3>
            {selectedBrandName && step > 0 && (
              <span className="context-hint">{selectedBrandName}</span>
            )}
          </div>
        </div>

        <div className={`options-area ${isBrandStep ? 'brand-grid' : isYearStep ? 'year-grid' : 'model-grid'}`}>
          {getOptions(step).map((opt) => {
            const isSelected = selections[currentKey] === opt.id;
            if (isBrandStep) {
              const logoUrl = brandLogos[opt.id];
              return (
                <button
                  key={opt.id}
                  className={`brand-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelect(opt.id)}
                >
                  <div className="brand-card-inner">
                    <img src={logoUrl} alt={opt.name} className="brand-logo-img" />
                    <span className="brand-name">{opt.name}</span>
                  </div>
                  {isSelected && <div className="brand-check"><CheckCircle size={14}/></div>}
                </button>
              );
            }
            return (
              <button
                key={opt.id}
                className={`option-pill ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelect(opt.id)}
              >
                {isSelected && <CheckCircle size={14} className="pill-check"/>}
                {opt.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="wizard-footer">
        <div className="selection-summary">
          {[0,1,2,3].map(i => getSelectionValue(i)).filter(Boolean).map((v, i) => (
            <span key={i} className="summary-tag">{v}</span>
          ))}
        </div>
        <button
          className="btn-primary proceed-btn"
          disabled={!selections.detailedModel}
          onClick={() => {
            onProceed({
              manufacturer: getSelectionValue(0),
              model: getSelectionValue(1),
              year: getSelectionValue(2),
              detailedModel: getSelectionValue(3)
            });
          }}
        >
          서비스 및 예약 진행 <ArrowRight size={18}/>
        </button>
      </div>
    </div>
  );
};

export default CarSelectionWidget;
