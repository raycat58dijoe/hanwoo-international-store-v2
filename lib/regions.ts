// North America regions for the checkout address form (US / Canada / Mexico).

export const US_STATES: { code: string; name: string }[] = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" }, { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" }, { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" }, { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" }, { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" }, { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" }, { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" }, { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" }, { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" }, { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" }, { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" }, { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" }, { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" }, { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" }, { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" }, { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" }, { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" }, { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" },
];

export const CA_PROVINCES: { code: string; name: string }[] = [
  { code: "AB", name: "Alberta" },
  { code: "BC", name: "British Columbia" },
  { code: "MB", name: "Manitoba" },
  { code: "NB", name: "New Brunswick" },
  { code: "NL", name: "Newfoundland and Labrador" },
  { code: "NS", name: "Nova Scotia" },
  { code: "NT", name: "Northwest Territories" },
  { code: "NU", name: "Nunavut" },
  { code: "ON", name: "Ontario" },
  { code: "PE", name: "Prince Edward Island" },
  { code: "QC", name: "Quebec" },
  { code: "SK", name: "Saskatchewan" },
  { code: "YT", name: "Yukon" },
];

export const MX_STATES: { code: string; name: string }[] = [
  { code: "AG", name: "Aguascalientes" }, { code: "BC", name: "Baja California" },
  { code: "BS", name: "Baja California Sur" }, { code: "CM", name: "Campeche" },
  { code: "CS", name: "Chiapas" }, { code: "CH", name: "Chihuahua" },
  { code: "CO", name: "Coahuila" }, { code: "CL", name: "Colima" },
  { code: "DF", name: "Ciudad de México" }, { code: "DG", name: "Durango" },
  { code: "GT", name: "Guanajuato" }, { code: "GR", name: "Guerrero" },
  { code: "HG", name: "Hidalgo" }, { code: "JA", name: "Jalisco" },
  { code: "MX", name: "México" }, { code: "MI", name: "Michoacán" },
  { code: "MO", name: "Morelos" }, { code: "NA", name: "Nayarit" },
  { code: "NL", name: "Nuevo León" }, { code: "OA", name: "Oaxaca" },
  { code: "PU", name: "Puebla" }, { code: "QT", name: "Querétaro" },
  { code: "QR", name: "Quintana Roo" }, { code: "SL", name: "San Luis Potosí" },
  { code: "SI", name: "Sinaloa" }, { code: "SO", name: "Sonora" },
  { code: "TB", name: "Tabasco" }, { code: "TM", name: "Tamaulipas" },
  { code: "TL", name: "Tlaxcala" }, { code: "VE", name: "Veracruz" },
  { code: "YU", name: "Yucatán" }, { code: "ZA", name: "Zacatecas" },
];

// Countries offered at checkout — North America first (target market).
export const CHECKOUT_COUNTRIES: { code: string; name: string }[] = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "MX", name: "Mexico" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "JP", name: "Japan" },
  { code: "OTHER", name: "Other" },
];

export function regionsForCountry(country: string): { code: string; name: string }[] | null {
  if (country === "US") return US_STATES;
  if (country === "CA") return CA_PROVINCES;
  if (country === "MX") return MX_STATES;
  return null; // free-text state/province for other countries
}

// Postal-code validation per country.
export function isValidPostalCode(country: string, zip: string): boolean {
  const v = zip.trim();
  if (country === "US") return /^\d{5}(-\d{4})?$/.test(v); // 10001 / 10001-1234
  if (country === "CA") return /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(v); // K1A 0B1
  if (country === "MX") return /^\d{5}$/.test(v); // 01000
  return v.length >= 2; // loose check for other countries
}
