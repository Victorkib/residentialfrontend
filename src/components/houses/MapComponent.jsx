/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { InfinitySpin } from 'react-loader-spinner';
import { toast, ToastContainer } from 'react-toastify'; // Importing toast notifications
import 'react-toastify/dist/ReactToastify.css'; // Importing toast styles

const MapComponent = ({ location }) => {
  const [position, setPosition] = useState([-1.2864, 36.8172]); // Default to Nairobi
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [error, setError] = useState(false); // State to handle errors

  // Default icon for the marker
  const icon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    shadowSize: [41, 41],
  });

  useEffect(() => {
    // Function to fetch coordinates for the location
    const fetchCoordinates = async () => {
      setLoading(true); // Set loading to true
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            location
          )}&format=json`
        );
        const data = await response.json();
        if (data.length > 0) {
          const { lat, lon } = data[0]; // Get the first result's coordinates
          setPosition([lat, lon]); // Set the new position
        } else {
          toast.warn('Location not found, defaulting to Nairobi, Kenya'); // Toast warning
          setPosition([-1.2864, 36.8172]); // Default to Nairobi
          setError(true); // Set error state
        }
      } catch (error) {
        console.error('Error fetching coordinates:', error);
        toast.error('Error fetching location. Defaulting to Nairobi, Kenya'); // Toast error
        setPosition([-1.2864, 36.8172]); // Default to Nairobi
        setError(true); // Set error state
      } finally {
        setLoading(false); // Stop loading
      }
    };

    fetchCoordinates(); // Call the function to fetch coordinates
  }, [location]); // Run when location changes

  if (loading) {
    return <InfinitySpin color="#00BFFF" height={100} width={100} />; // Loading spinner
  }

  return (
    <>
      <ToastContainer />
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
          <Popup>{location || 'Nairobi, Kenya'}</Popup>
        </Marker>
      </MapContainer>
    </>
  );
};

export default MapComponent;
