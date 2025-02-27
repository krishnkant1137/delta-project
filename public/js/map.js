mapboxgl.accessToken = mapToken;

const map = new mapboxgl.Map({
    container: 'map',
    center: listingGeometry, // ✅ Use listing location
    style: 'mapbox://styles/mapbox/streets-v11',
    zoom: 12
});
console.log("Listing Coordinates:", listingGeometry);


new mapboxgl.Marker()
    .setLngLat(listingGeometry) // ✅ Correct variable name
    .addTo(map);

