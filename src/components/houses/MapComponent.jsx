// MapComponent.jsx
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Default coordinates for Ruiru, Nairobi, Kenya
const position = [-1.1784, 36.9742];

const MapComponent = () => {
  // Set default icon for the marker
  const icon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png', // Marker icon URL
    iconSize: [25, 41], // Size of the icon
    iconAnchor: [12, 41], // Anchor point of the icon
    popupAnchor: [1, -34], // Popup anchor point
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png', // Marker shadow URL
    shadowSize: [41, 41], // Size of the shadow
  });

  return (
    <MapContainer
      center={position}
      zoom={13}
      style={{ height: '300px', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={position} icon={icon}>
        <Popup>Ruiru, Nairobi, Kenya</Popup>
      </Marker>
    </MapContainer>
  );
};

export default MapComponent;
