import {jwtDecode, JwtPayload } from 'jwt-decode';

const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  try {
    const decodedToken: JwtPayload = jwtDecode<JwtPayload>(token);
    if (!decodedToken.exp) {
      throw new Error('Token does not have an expiration time');
    }
    const currentTime = Date.now() / 1000;
    return decodedToken.exp < currentTime;
  } catch (error) {
    console.error('Error decoding token:', error);
    return true;
  }
};

export default isTokenExpired;
