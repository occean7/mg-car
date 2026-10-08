export const MAX_VEHICLE_PHOTOS = 12;
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

export function vehicleImages(vehicle) {
  return vehicle.images?.length ? vehicle.images : vehicle.image_url ? [vehicle.image_url] : [];
}

export function imageSource(url) {
  return url?.startsWith("/api/") ? `${process.env.REACT_APP_BACKEND_URL}${url}` : url;
}