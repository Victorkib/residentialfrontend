import axios from 'axios';

// const devUrl = 'http://localhost:5500/api';
// const prodUrl = 'https://residential-27ef77617daa.herokuapp.com/api';
const prodUrl = 'https://vrhmsresidentialbackend.onrender.com/api';

const apiRequest = axios.create({
  baseURL: prodUrl,
  withCredentials: true,
});

export default apiRequest;
