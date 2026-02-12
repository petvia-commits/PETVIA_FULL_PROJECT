export function getGps(){
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve({ lat:null, lng:null, accuracy:null });
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      () => resolve({ lat:null, lng:null, accuracy:null }),
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 0 }
    );
  });
}
