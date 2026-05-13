// web/app/arcade/space-barrage/_game/utils/shipVariant.ts
//
// Player ship sprite picker for Space Barrage — mirrors asteroids'
// colorScheme.ts. `classic` is the original 11×11 wedge sprite from the
// initial release; `rocket` is the redesigned default with a more
// prominent fuselage.

import { createSetting } from '@arcade';

export type ShipVariant = 'classic' | 'rocket';

export const SHIP_VARIANTS: ShipVariant[] = ['classic', 'rocket'];

// Persistence — backed by `_arcade/createSetting`. Canonical key uses the
// arcade settings convention (`arcade-<game>:<setting>`); the legacy
// pre-rename key (`space-barrage:shipVariant`) is read as a fallback so
// existing players don't lose their pick.
const shipVariantSetting = createSetting<ShipVariant>(
  'arcade-space-barrage:shipVariant',
  {
    default: 'rocket',
    isValid: (raw): raw is ShipVariant => raw === 'classic' || raw === 'rocket',
    legacyKeys: ['space-barrage:shipVariant'],
  },
);

export const getShipVariant = shipVariantSetting.get;
export const setShipVariant = shipVariantSetting.set;
