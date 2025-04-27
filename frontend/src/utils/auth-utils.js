export const setCookie = (name, value, days = 1) => {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  console.log(`Setting cookie: ${name}=${value}; ${expires}; path=/; SameSite=Strict`);
  document.cookie = `${name}=${value}; ${expires}; path=/; SameSite=Strict`;
};

export const getCookie = (name) => {
  const cookieName = `${name}=`;
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i].trim();
    if (cookie.indexOf(cookieName) === 0) {
      const value = cookie.substring(cookieName.length, cookie.length);
      console.log(`Retrieved cookie: ${name}=${value}`);
      return value;
    }
  }
  console.log(`Cookie not found: ${name}`);
  return null;
};

export const deleteCookie = (name) => {
  console.log(`Deleting cookie: ${name}`);
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`;
};

export const setSessionData = (key, value) => {
  console.log(`Setting sessionStorage: ${key}=`, value);
  sessionStorage.setItem(key, JSON.stringify(value));
};

export const getSessionData = (key) => {
  const data = sessionStorage.getItem(key);
  console.log(`Retrieved sessionStorage: ${key}=${data}`);
  return data ? JSON.parse(data) : null;
};

export const removeSessionData = (key) => {
  console.log(`Removing sessionStorage: ${key}`);
  sessionStorage.removeItem(key);
};

export const storeAuthData = (token, userInfo) => {
  setCookie('token', token);
  setSessionData('userInfo', userInfo);
};

export const getAuthData = () => {
  const authData = {
    token: getCookie('token'),
    userInfo: getSessionData('userInfo')
  };
  console.log('Retrieved authData:', authData);
  return authData;
};

export const clearAuthData = () => {
  deleteCookie('token');
  removeSessionData('userInfo');
};