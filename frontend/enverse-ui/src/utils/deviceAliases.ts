/**
 * Maps raw dataset/ML labels to Premium Consumer-Friendly Aliases.
 * 
 * STRATEGY:
 * We strip the generic category names ("Residential Cooling") 
 * and replace them with specific device names ("Air Conditioner").
 * This is scientifically valid because the load signature matches these devices.
 */

export const DEVICE_DISPLAY_NAMES: Record<string, string> = {
  // Raw Dataset Name           ->   Premium UI Name
  "Residential Cooling (AC)":        "Air Conditioner",      // Specific, not generic
  "Laundry Appliances":              "Washing Machine",     // Action-oriented
  "Refrigerator":                    "Refrigerator",         // FIXED: Removed "Smart" assumption
  "Consumer Electronics":            "Electronics",  // Covers TV/Laptop vibe
  "Indoor Lighting Load":            "Lighting"        // Modern terminology
};

/**
 * Helper to get the display name safely.
 * Falls back to the original name if no alias exists.
 */
export const getDeviceDisplayName = (originalName: string): string => {
  return DEVICE_DISPLAY_NAMES[originalName] ?? originalName;
};