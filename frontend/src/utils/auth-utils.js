// Cookie functions
export const setCookie = (name, value, days = 1) => {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value}; ${expires}; path=/; SameSite=Strict`;
  };
  
  export const getCookie = (name) => {
    const cookieName = `${name}=`;
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i].trim();
      if (cookie.indexOf(cookieName) === 0) {
        return cookie.substring(cookieName.length, cookie.length);
      }
    }
    return null;
  };
  
  export const deleteCookie = (name) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`;
  };
  
  // Session storage functions
  export const setSessionData = (key, value) => {
    sessionStorage.setItem(key, JSON.stringify(value));
  };
  
  export const getSessionData = (key) => {
    const data = sessionStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  };
  
  export const removeSessionData = (key) => {
    sessionStorage.removeItem(key);
  };
  
  // Authentication helpers
  export const storeAuthData = (token, userInfo) => {
    setCookie('token', token);
    setSessionData('userInfo', userInfo);
  };
  
  export const getAuthData = () => {
    return {
      token: getCookie('token'),
      userInfo: getSessionData('userInfo')
    };
  };
  
  export const clearAuthData = () => {
    deleteCookie('token');
    removeSessionData('userInfo');
  };