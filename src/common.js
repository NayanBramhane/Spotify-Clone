export const ACCESS_TOKEN = "ACCESS_TOKEN";
export const TOKEN_TYPE = "TOKEN_TYPE";
export const EXPIRES_IN = "EXPIRES_IN";
//key for storing tracks data in local storage
export const LOADED_TRACKS = "LOADED_TRACKS";

const APP_URL = import.meta.env.VITE_APP_URL;

//these are endpoints from api
export const ENDPOINT = {
  userInfo: "me",
  featuredPlaylist: "browse/featured-playlists?limit=5",
  toplists: "browse/categories/toplists/playlists?limit=10",
  playlist: "playlists",
  userPlaylist: "me/playlists",
};

//playlist: "https://developer.spotify.com/documentation/web-api/reference/get-playlist"

export const logout = () => {
  localStorage.removeItem(ACCESS_TOKEN);
  localStorage.removeItem(EXPIRES_IN);
  localStorage.removeItem(TOKEN_TYPE);
  //this works because APP_URL takes us to http://localhost:3000
  //here we have a main.js file which checks if we accessToken or not
  //and navigates to the login or dashboard page accordingly
  window.location.href = APP_URL;
};

//utility function for storing the api track data in local storage
export const setItemInLocalStorage = (key, value) =>
  localStorage.setItem(key, JSON.stringify(value));
//access the value from key
export const getItemFromLocalStorage = (key) =>
  JSON.parse(localStorage.getItem(key));

export const SECTIONTYPE = {
  DASHBOARD: "DASHBOARD",
  PLAYLIST: "PLAYLIST",
};
