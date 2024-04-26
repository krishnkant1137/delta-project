mapboxgl.accessToken = mapToken;

const map = new mapboxgl.Map({
    container: 'map', // container ID
    center: listing.geometry.coordinates, // starting position [lng, lat]
    zoom: 9 // starting zoom
});

// console.log("working");
// console.log(listing.geometry.coordinates);

const marker = new mapboxgl.Marker({ color: 'red', rotation: 45 })
    .setLngLat(listing.geometry.coordinates)
    .addTo(map);
