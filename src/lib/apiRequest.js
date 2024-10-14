import axios from 'axios';

// const devUrl = 'http://localhost:5500/api';
const prodUrl = 'https://residential-27ef77617daa.herokuapp.com/api';
// const prodUrl = 'https://house-management-backend.onrender.com/api';

const apiRequest = axios.create({
  baseURL: prodUrl,
  withCredentials: true,
});

export default apiRequest;

// import axios from 'axios';
// const apiRequest = axios.create({
//   withCredentials: true, // Keep credentials for cookies, etc.
// });

// export default apiRequest;
