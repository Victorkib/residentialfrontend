import './Login.scss';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ForgotPassword from '../forgotPassword/ForgotPassword';
import apiRequest from '../../../lib/apiRequest';
import { useDispatch } from 'react-redux';
import { setAdmin } from '../../../features/Admin/adminSlice';
import { TailSpin } from 'react-loader-spinner';
import { toast, ToastContainer } from 'react-toastify';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Import Font Awesome eye icons

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false); // State to toggle between login and forgot password

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [adminBc, setAdminFromBc] = useState([]);
  const [showPassword, setShowPassword] = useState(false); // New state to toggle password visibility

  useEffect(() => {
    const checkIfthereIsAnUserLoggedIn = async () => {
      setLoading(true);
      try {
        const response = await apiRequest.get('/auth/getAdmins');
        if (response.status) {
          setAdminFromBc(response.data);
        }
      } catch (error) {
        console.log('error: ', error);
        setError(error?.response?.data?.message);
      } finally {
        setLoading(false);
      }
    };
    checkIfthereIsAnUserLoggedIn();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await apiRequest.post('/auth/login', {
        username,
        password,
        rememberMe: e.target.checkbox.checked, // Pass rememberMe option
      });

      if (response.status) {
        dispatch(setAdmin(response.data));
        localStorage.setItem('adminData', JSON.stringify(response.data));
        setLoading(false);
        toast.success('Success Login');
        navigate('/');
      }
    } catch (err) {
      setLoading(false);
      console.log('error: ', error);
      toast.error(error?.response?.data?.message || 'Failed To login!');
      setError(err.response?.data?.message || 'Failed to login.');
    }
  };

  return (
    <div className="login">
      {isForgotPassword ? (
        <ForgotPassword setIsForgotPassword={setIsForgotPassword} />
      ) : (
        <div>
          <form className="login-container" onSubmit={handleLogin}>
            <h1>Login</h1>
            <input
              type="text"
              placeholder="Username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <div className="password-container">
              <input
                type={showPassword ? 'text' : 'password'} // Toggle input type
                placeholder="Password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="eye-icon"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <div className="reset">
              <p>
                <input type="checkbox" id="checkbox" /> Remember Me
              </p>
              <span
                onClick={() => setIsForgotPassword(true)}
                className="forgot-password-link"
              >
                Forgot Password{' ?'}
              </span>
            </div>
            <span>
              {adminBc.length > 0 && adminBc[0]?.username ? (
                <>
                  <h6>Admin Found.Register Endpoint Not Allowed!</h6>
                </>
              ) : (
                <h6>
                  Don{"'"}t have an Account?{' '}
                  <Link to={'/register'} className="forgot-password-link">
                    Sign Up
                  </Link>
                </h6>
              )}
            </span>
            {error && <span className="loginError">{error}!</span>}
            <button type="submit" className="LoginBtn">
              Login
            </button>
          </form>
        </div>
      )}

      {loading && (
        <div className="loader-overlay">
          <TailSpin
            height="100"
            width="100"
            color="#4fa94d"
            ariaLabel="loading"
            visible={true}
          />
        </div>
      )}

      <ToastContainer />
    </div>
  );
}

export default Login;
