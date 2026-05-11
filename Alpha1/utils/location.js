/**
 * Location utilities for geospatial queries.
 * All coordinates are [longitude, latitude] — MongoDB convention.
 */

const RADIUS_PRESETS = {
  "500m": 500,
  "1km": 1000,
  "3km": 3000,
  campus: 1500,
  barangay: 2000,
  "dorm-area": 300,
  "office-area": 500,
  "city-wide": 10000,
};

/**
 * Returns a MongoDB $geoWithin query for a circle.
 * @param {number} lng
 * @param {number} lat
 * @param {number} radiusMeters
 */
function geoWithinQuery(lng, lat, radiusMeters) {
  const radiusRadians = radiusMeters / 6378100; // Earth radius in meters
  return {
    location: {
      $geoWithin: {
        $centerSphere: [[lng, lat], radiusRadians],
      },
    },
  };
}

/**
 * Returns a MongoDB $near query with max/min distance.
 * Sorts results by proximity automatically.
 * @param {number} lng
 * @param {number} lat
 * @param {number} maxMeters
 * @param {number} minMeters
 */
function geoNearQuery(lng, lat, maxMeters, minMeters = 0) {
  return {
    location: {
      $near: {
        $geometry: { type: "Point", coordinates: [lng, lat] },
        $maxDistance: maxMeters,
        $minDistance: minMeters,
      },
    },
  };
}

/**
 * Calculates straight-line distance in meters between two [lng, lat] points.
 * Uses Haversine formula.
 */
function distanceMeters([lng1, lat1], [lng2, lat2]) {
  const R = 6378100;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Returns approximate location label (e.g. "~500m away") instead of exact coords.
 * Used for public post displays before handoff is confirmed.
 */
function approximateDistance(meters) {
  if (meters < 100) return "Very nearby";
  if (meters < 500) return "Less than 500m away";
  if (meters < 1000) return "Less than 1km away";
  if (meters < 3000) return `About ${Math.round(meters / 1000, 1)}km away`;
  return `${(meters / 1000).toFixed(1)}km away`;
}

/**
 * Resolves a radius preset string to meters.
 * Falls through to numeric value if given directly.
 */
function resolveRadius(input) {
  if (typeof input === "number") return input;
  return RADIUS_PRESETS[input] || 1000;
}

module.exports = {
  geoWithinQuery,
  geoNearQuery,
  distanceMeters,
  approximateDistance,
  resolveRadius,
  RADIUS_PRESETS,
};
