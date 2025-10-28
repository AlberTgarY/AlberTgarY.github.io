// Map initialization
let map;
let mapInitialized = false;

// Pre-defined starred locations (visitors cannot edit these)
const starredPlaces = [
    {
        lat: 51.5246,
        lng: -0.1340,
        name: "London, UK",
        description: "University College London - PhD studies"
    },
    {
        lat: 35.6762,
        lng: 139.6503,
        name: "Tokyo, Japan",
        description: "SIGGRAPH Asia 2024 at Haneda Airport"
    },
    {
        lat: 51.5074,
        lng: -0.1278,
        name: "King's College London, UK",
        description: "Undergraduate studies"
    }
    // Add more locations here by following the same format:
    // {
    //     lat: latitude,
    //     lng: longitude,
    //     name: "Location Name",
    //     description: "Description of this place"
    // }
];

// Initialize map function
window.initializeMap = function() {
    // Only initialize once
    if (mapInitialized) {
        map.invalidateSize();
        return;
    }

    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) return;

    // Create the map centered on the world
    map = L.map('map-container', {
        center: [20, 0],
        zoom: 2,
        minZoom: 2,
        maxZoom: 18,
        worldCopyJump: true
    });

    // Add tile layer (using OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);

    // Add markers for each starred place
    starredPlaces.forEach(place => {
        const marker = L.marker([place.lat, place.lng]).addTo(map);
        
        // Add popup with place information
        marker.bindPopup(`
            <div class="map-popup">
                <h3>${place.name}</h3>
                <p>${place.description}</p>
            </div>
        `);
        
        // Optional: open popup on hover
        marker.on('mouseover', function() {
            this.openPopup();
        });
    });

    // If there are places, fit the map to show all markers
    if (starredPlaces.length > 0) {
        const bounds = L.latLngBounds(starredPlaces.map(p => [p.lat, p.lng]));
        map.fitBounds(bounds, { padding: [50, 50] });
    }

    mapInitialized = true;
};

// Note: To add more locations to your map, edit the starredPlaces array above.
// Visitors cannot add locations - this is read-only for security and data integrity.
