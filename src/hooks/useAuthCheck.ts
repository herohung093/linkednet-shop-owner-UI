
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { getToken } from '../helper/getToken';
import isTokenExpired from '../helper/CheckTokenExpired';
import { refreshToken } from '../helper/RefreshToken';


const useAuthCheck = () => {
  const navigate = useNavigate();
  useEffect(() => {
    if (sessionStorage.getItem('authToken')) {
      const token = getToken();

      if (isTokenExpired(token)) {
        console.log('Token expired');
        refreshToken(navigate);
      }
    } else {
      navigate('/session-expired');
    }
  }, [navigate]);
};

export default useAuthCheck;
