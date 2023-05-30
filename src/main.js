import './style.css'
const APP_URL = import.meta.env.VITE_APP_URL;

document.addEventListener("DOMContentLoaded", ()=>{
  
  // Check if you are logged in
  if(localStorage.getItem("accessToken")){
window.location.href = `${APP_URL}/dashboard/dashboard.html`;
  } else{
    window.location.href = `${APP_URL}/login/login.html`;
  }

})
