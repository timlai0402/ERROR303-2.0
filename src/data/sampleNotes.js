// Sample delivery notes for Demo Mode. When no AI key is configured (or the app is
// hosted statically), these pre-extracted results stand in for the AI response.
export const SAMPLE_NOTES = [
  {
    id: 'do-packright',
    label: 'PackRight DO',
    src: 'samples/delivery-note-packright.png',
    result: {
      supplier: 'PackRight Packaging Sdn Bhd',
      documentNo: 'DO-24187',
      date: null,
      lines: [
        { description: 'CORRUGATED CARTON BOX MED 40x30x30CM', quantity: 100, unit: 'pcs' },
        { description: 'OPP TAPE CLEAR 48MM x 100M', quantity: 36, unit: 'roll' },
        { description: 'BUBBLE WRAP 1M x 50M', quantity: 4, unit: 'roll' },
        { description: 'A6 SHIPPING LABEL 500PCS/ROLL', quantity: 10, unit: 'roll' },
        { description: 'STRETCH FILM 500MM x 23MIC', quantity: 12, unit: 'roll' },
      ],
    },
  },
  {
    id: 'inv-safeguard',
    label: 'SafeGuard Invoice',
    src: 'samples/delivery-note-safeguard.png',
    result: {
      supplier: 'SafeGuard Medical Supply',
      documentNo: 'INV SG-5521',
      date: null,
      lines: [
        { description: "NITRILE EXAM GLOVES (M) 100'S", quantity: 40, unit: 'box' },
        { description: "3-PLY SURGICAL FACE MASK 50'S", quantity: 30, unit: 'box' },
        { description: 'HAND SANITIZER GEL 500ML', quantity: 24, unit: 'bottle' },
        { description: 'ISOPROPYL ALCOHOL 75% 1L', quantity: 12, unit: 'bottle' },
      ],
    },
  },
  {
    id: 'do-cleanpro',
    label: 'CleanPro DO',
    src: 'samples/delivery-note-cleanpro.png',
    result: {
      supplier: 'CleanPro Distribution',
      documentNo: 'DO CP-0932',
      date: null,
      lines: [
        { description: 'GARBAGE BAG BLACK (L) 20PCS/ROLL', quantity: 50, unit: 'roll' },
        { description: 'KITCHEN PAPER TOWEL 6 ROLL PACK', quantity: 20, unit: 'pack' },
        { description: 'FLOOR CLEANER LEMON 2L', quantity: 12, unit: 'bottle' },
        { description: "DISINFECTANT WET WIPES 80'S", quantity: 18, unit: 'pack' },
      ],
    },
  },
];
