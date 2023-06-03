import { fetchRequest } from "../api";
import {
  ENDPOINT,
  LOADED_TRACKS,
  SECTIONTYPE,
  logout,
  setItemInLocalStorage,
  getItemFromLocalStorage,
} from "../common";

const audio = new Audio();
let displayName;

const onProfileClick = (event) => {
  //stop bubbling event
  event.stopPropagation();
  const profileMenu = document.querySelector("#profile-menu");
  profileMenu.classList.toggle("hidden");
  if (!profileMenu.classList.contains("hidden")) {
    profileMenu.querySelector("li#logout").addEventListener("click", logout);
  }
};

const onPlaylistItemClicked = (event, id) => {
  const section = { type: SECTIONTYPE.PLAYLIST, playlist: id };
  //read about History API from JS on ->
  //https://developer.mozilla.org/en-US/docs/Web/API/History/pushState
  history.pushState(section, "", `playlist/${id}`);
  loadSection(section);
};

const loadUserProfile = () => {
  return new Promise(async (resolve, reject) => {
    const defaultImage = document.querySelector("#default-image");
    const profileButton = document.querySelector("#user-profile-btn");
    const displayNameElement = document.querySelector("#display-name");

    //destructuring : display_name is the object we get and displayName is alias
    const { display_name: displayName, images } = await fetchRequest(
      ENDPOINT.userInfo
    );

    //check if image is present for user
    if (images?.length) {
      //add 'hidden' class from tailwind to hide default image
      defaultImage.classList.add("hidden");
    } else {
      defaultImage.classList.remove("hidden");
    }

    profileButton.addEventListener("click", onProfileClick);

    displayNameElement.textContent = displayName;
    resolve({ displayName });
  });
};

const loadPlaylist = async (endpoint, elementId) => {
  const {
    playlists: { items },
  } = await fetchRequest(endpoint);
  const playlistItemsSection = document.querySelector(`#${elementId}`);
  for (let { name, description, images, id } of items) {
    const playlistItem = document.createElement("section");
    playlistItem.className =
      "bg-black-secondary rounded p-4 hover:cursor-pointer hover:bg-light-black";
    playlistItem.id = id;
    playlistItem.setAttribute("data-type", "playlist");
    playlistItem.addEventListener("click", (event) =>
      onPlaylistItemClicked(event, id)
    );
    const [{ url: imageUrl }] = images;
    playlistItem.innerHTML = `<img src="${imageUrl}" alt="${name}" class="rounded mb-2 object-contain shadow"/>
    <h2 class="text-base font-semibold mb-4 truncate">${name}</h2>
    <h3 class="text-sm text-secondary line-clamp-2">${description}</h3>`;

    playlistItemsSection.appendChild(playlistItem);
  }
};

const loadPlaylists = () => {
  loadPlaylist(ENDPOINT.featuredPlaylist, "featured-playlist-items");
  loadPlaylist(ENDPOINT.toplists, "top-playlist-items");
};

const fillContentForDashboard = () => {
  const coverContent = document.querySelector("#cover-content");
  coverContent.innerHTML = `<h1 class="text-6xl">Hello ${displayName}</h1>`;
  const pageContent = document.querySelector("#page-content");
  const playlistMap = new Map([
    ["featured", "featured-playlist-items"],
    ["top playlist", "top-playlist-items"],
  ]);
  let innerHTML = "";
  for (let [type, id] of playlistMap) {
    innerHTML += `
    <article class="mb-4 p-4">
    <h1 class="mb-4 text-2xl font-bold capitalize">${type}</h1>
    <section
      id="${id}"
      class="featured-songs grid grid-cols-auto-fill-cards gap-4"
    ></section>
  </article>
  `;
  }
  pageContent.innerHTML = innerHTML;
};

const formatTime = (duration) => {
  const min = Math.floor(duration / 60_000);
  const sec = ((duration % 6_000) / 1000).toFixed(0);
  const formattedTime =
    sec == 60 ? min + 1 + ":00" : min + ":" + (sec < 10 ? "0" : "") + sec;
  return formattedTime;
};

//when clicked once on track
const onTrackSelection = (id, event) => {
  document.querySelectorAll("#tracks .track").forEach((trackItem) => {
    if (trackItem.id === id) {
      trackItem.classList.add("bg-gray", "selected");
    } else {
      trackItem.classList.remove("bg-gray", "selected");
    }
  });
};

const updateIconsForPlayMode = (id) => {
  //Main play button
  const playButton = document.querySelector("#play");
  playButton.querySelector("span").textContent = "pause_circle";
  //play button which comes on the left of every track
  const playButtonFromTracks = document.querySelector(`#play-track-${id}`);
  if (playButtonFromTracks) {
    playButtonFromTracks.textContent = "pause";
  }
};

const updateIconsForPauseMode = (id) => {
  const playButton = document.querySelector("#play");
  playButton.querySelector("span").textContent = "play_circle";
  const playButtonFromTracks = document.querySelector(`#play-track-${id}`);
  if (playButtonFromTracks) {
    playButtonFromTracks.textContent = "play_arrow";
  }
};

const onAudioMetadataLoaded = (id) => {
  const totalSongDuration = document.querySelector("#total-song-duration");
  totalSongDuration.textContent = `0:${audio.duration.toFixed(0)}`;
};

const togglePlay = () => {
  //if there is any song being played
  if (audio.src) {
    //if song is paused
    if (audio.paused) {
      audio.play();
    }
    //if song is playing
    else {
      audio.pause();
    }
  }
};

const findCurrentTrack = () => {
  //section with id "audio-control" which has play, prev,next and timeline
  const audioControl = document.querySelector("#audio-control");
  const trackId = audioControl.getAttribute("data-track-id");
  if (trackId) {
    const loadedTracks = getItemFromLocalStorage(LOADED_TRACKS);
    //searching the index of track from array which is currently being played in audio element
    const currentTrackIndex = loadedTracks?.findIndex(
      (track) => track.id === trackId
    );
    //return current track index and entire list of tracks
    return { currentTrackIndex, tracks: loadedTracks };
  }
  //return null if no song is playing, or no song is loaded in audio
  return null;
};

const playNextTrack = () => {
  //giving default values so that when function returns null, these values will be retured
  //If it is, an empty object {} is returned as the default value.
  const { currentTrackIndex = -1, tracks = null } = findCurrentTrack() ?? {};
  //code doesn't work when we write tracks.length
  //optional chaining, used to see in tracks array is not empty, null, or undefined
  if (currentTrackIndex > -1 && currentTrackIndex < tracks?.length - 1) {
    const currentTrack = tracks[currentTrackIndex + 1];
    playTrack(null, currentTrack);
    //code doesn't work with following line
    //playTrack(null, tracks[currentTrackIndex] + 1);
  }
};

const playPrevTrack = () => {
  //giving default values so that when function returns null, these values will be retured
  //If it is, an empty object {} is returned as the default value.
  const { currentTrackIndex = -1, tracks = null } = findCurrentTrack() ?? {};
  if (currentTrackIndex > 0) {
    const prevTrack = tracks[currentTrackIndex - 1];
    playTrack(null, prevTrack);
    //code doesn't work with following line
    // playTrack(null, tracks[currentTrackIndex] - 1);
  }
};

const playTrack = (
  event,
  { image, artistNames, name, duration, previewUrl, id }
) => {
  //whenever we click on play button of track, we don't want that track to be selected
  //we just want to play the song
  if (event?.stopPropagation) {
    event.stopPropagation();
  }

  //check if previewUrl (which we got when we clicked on track) and now playing
  //song (audio's src attribute) is same
  if (audio.src === previewUrl) {
    togglePlay();
  } else {
    const nowPlayingSongImage = document.querySelector("#now-playing-image");
    const songTitle = document.querySelector("#now-playing-song");
    const artists = document.querySelector("#now-playing-artists");
    //section with id "audio-control" which has play, prev,next and timeline
    const audioControl = document.querySelector("#audio-control");
    const songInfo = document.querySelector("#song-info");

    //set attribute of section which contains play, next, prev, song duration
    //song duration completed and timeline elements in it
    audioControl.setAttribute("data-track-id", id);
    nowPlayingSongImage.src = image.url;
    songTitle.textContent = name;
    artists.textContent = artistNames;

    //plays audio automatically, it also contains that song related information :)
    //set audio element's source
    audio.src = previewUrl;

    audio.play();
    songInfo.classList.remove("invisible");
  }
};

//storing the playlist tracks data from api in local storage
const loadPlaylistTracks = ({ tracks }) => {
  const trackSections = document.querySelector("#tracks");
  let trackNo = 1;
  const loadedTracks = [];
  //iterating through each track with filter which has previewUrl
  //since some tracks didn't have previewUrl;
  for (let trackItem of tracks.items.filter((item) => item.track.preview_url)) {
    let {
      id,
      artists,
      name,
      album,
      duration_ms: duration,
      preview_url: previewUrl,
    } = trackItem.track;
    let track = document.createElement("section");
    track.id = id;
    track.className =
      "track p-1 grid grid-cols-[50px_1fr_1fr_50px] items-center justify-items-start gap-4 rounded-md hover:bg-light-black";
    //we are doing 'img => img.height === 64' because
    //we are receving 3 images of different heights and
    //we are selecting the image with height 64
    let image = album.images.find((img) => img.height === 64);
    let artistNames = Array.from(artists, (artist) => artist.name).join(", ");
    track.innerHTML = `
    <p class="relative w-full flex items-center justify-center justify-self-center"><span class="track-no">${trackNo++}</span></p>
      <section class="grid grid-cols-[auto_1fr] place-items-center gap-2">
        <img class="h-10 w-10" src="${image.url}" alt="${name}" />
        <article class="flex flex-col justify-center">
          <h2 class="song-title text-base text-primary line-clamp-1">${name}</h2>
          <p class="text-xm line-clamp-1">${artistNames}</p>
        </article>
      </section>
    <p class="text-sm">${album.name}</p>
    <p class="text-sm">${formatTime(duration)}</p>
    `;

    track.addEventListener("click", (event) => onTrackSelection(id, event));
    //play button created at left side of hovering track when clicked
    const playButton = document.createElement("button");
    playButton.id = `play-track-${id}`;
    playButton.className = `play w-full absolute left-0 text-lg invisible material-symbols-outlined`;
    playButton.textContent = "play_arrow";
    playButton.addEventListener("click", (event) =>
      playTrack(event, { image, artistNames, name, duration, previewUrl, id })
    );
    track.querySelector("p").appendChild(playButton);
    trackSections.appendChild(track);
    //storing these values in array loadedTracks
    loadedTracks.push({
      id,
      artistNames,
      name,
      album,
      duration,
      previewUrl,
      image,
    });
  }
  //storing the array in LOADED_TRACKS key
  setItemInLocalStorage(LOADED_TRACKS, loadedTracks);
};

//Displaying tracks in the playlist
const fillContentForPlaylist = async (playlistId) => {
  const playlist = await fetchRequest(`${ENDPOINT.playlist}/${playlistId}`);
  const { name, description, images, tracks } = playlist;
  const coverElement = document.querySelector("#cover-content");
  coverElement.innerHTML = `<img  class="object-contain h-40 w-40" src="${images[0].url}" alt="${name}" />
  <section class="flex flex-col justify-center">
          <h2 id="playlist-name" class="text-8xl font-bold">${name}</h2>
          <p id="playlist-details" class="text-2xl">${description} songs</p>
          <p id="playlist-length" class="text-base">${tracks.items.length} songs</p>
        </section>
  `;
  const pageContent = document.querySelector("#page-content");
  pageContent.innerHTML = `
  <header id="playlist-header" class="mx-8  border-secondary border-b-[0.5px] z-10">
    <nav class="py-2">
      <ul
        class="grid grid-cols-[50px_1fr_1fr_50px] gap-4 text-secondary "
      >
        <li class="justify-self-center">#</li>
        <li>Title</li>
        <li>Album</li>
        <li>⏱</li>
      </ul>
    </nav>
  </header>
  <section id="tracks" class="px-8 text-secondary mt-4">
  </section>
  `;

  loadPlaylistTracks(playlist);
};

const onContentScroll = (event) => {
  const { scrollTop } = event.target;
  const header = document.querySelector(".header");
  const coverElement = document.querySelector("#cover-content");
  const totalHeight = coverElement.offsetHeight;
  const fiftyPercentHeight = totalHeight / 2;
  const coverOpacity =
    100 - (scrollTop >= totalHeight ? 100 : (scrollTop / totalHeight) * 100);
  coverElement.style.opacity = `${coverOpacity}%`;

  let headerOpacity = 0;
  // once 50% of cover element is crossed, start increasing the opacity
  if (scrollTop >= fiftyPercentHeight && scrollTop <= totalHeight) {
    let totatDistance = totalHeight - fiftyPercentHeight;
    let coveredDistance = scrollTop - fiftyPercentHeight;
    headerOpacity = (coveredDistance / totatDistance) * 100;
  } else if (scrollTop > totalHeight) {
    headerOpacity = 100;
  } else if (scrollTop < fiftyPercentHeight) {
    headerOpacity = 0;
  }
  header.style.background = `rgba(0 0 0 / ${headerOpacity}%)`;

  if (history.state.type === SECTIONTYPE.PLAYLIST) {
    const playlistHeader = document.querySelector("#playlist-header");
    if (headerOpacity >= 60) {
      playlistHeader.classList.add("sticky", "bg-black-secondary", "px-8");
      playlistHeader.classList.remove("mx-8");
      playlistHeader.style.top = `${header.offsetHeight}px`;
    } else {
      playlistHeader.classList.remove("sticky", "bg-black-secondary", "px-8");
      playlistHeader.classList.add("mx-8");
      playlistHeader.style.top = `revert`;
    }
  }
};

const loadSection = (section) => {
  if (section.type === SECTIONTYPE.DASHBOARD) {
    fillContentForDashboard();
    loadPlaylists();
  } else if (section.type === SECTIONTYPE.PLAYLIST) {
    //load the elements for playlist
    fillContentForPlaylist(section.playlist);
  }

  document
    .querySelector(".content")
    .removeEventListener("scroll", onContentScroll);

  document
    .querySelector(".content")
    .addEventListener("scroll", onContentScroll);
};

//user playlist clicked in sidenav
const onUserPlaylistClick = (id) => {
  const section = { type: SECTIONTYPE.PLAYLIST, playlist: id };
  history.pushState(section, "", `/dashboard/playlist/${id}`);
  loadSection(section);
};

//user playlist in sidenav
const loadUserPlaylists = async () => {
  const playlists = await fetchRequest(ENDPOINT.userPlaylist);
  const userPlaylistSelection = document.querySelector("#user-playlists > ul");
  userPlaylistSelection.innerHTML = ``;
  for (let { name, id } of playlists.items) {
    const li = document.createElement("li");
    li.textContent = name;
    li.className = "cursor-pointer hover:text-primary";
    li.addEventListener("click", () => onUserPlaylistClick(id));
    userPlaylistSelection.appendChild(li);
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  const volume = document.querySelector("#volume");
  const playButton = document.querySelector("#play");
  const songDurationCompleted = document.querySelector(
    "#song-duration-completed"
  );
  const songProgress = document.querySelector("#progress");
  const timeline = document.querySelector("#timeline");
  //section with id "audio-control" which has play, prev,next and timeline
  const audioControl = document.querySelector("#audio-control");
  const next = document.querySelector("#next");
  const prev = document.querySelector("#prev");
  let progressInterval;

  ({ displayName } = await loadUserProfile());
  loadUserPlaylists();
  const section = { type: SECTIONTYPE.DASHBOARD };
  // const section = { type: SECTIONTYPE.PLAYLIST, playlist: "37i9dQZF1DX5baCFRgbF3x", };
  //read about History API from JS on ->
  //https://developer.mozilla.org/en-US/docs/Web/API/History/pushState
  history.pushState(section, "", "");
  loadSection(section);

  document.addEventListener("click", (event) => {
    event.stopPropagation();
    const profileMenu = document.querySelector("#profile-menu");
    profileMenu.classList.toggle("hidden");
    if (!profileMenu.classList.contains("hidden")) {
      profileMenu.classList.add("hidden");
    }
  });

  //adding current music's data
  audio.addEventListener("loadedmetadata", onAudioMetadataLoaded);
  //add event listener for when audio starts to play
  audio.addEventListener("play", () => {
    //getting "id" from audio element
    const selectedTrackId = audioControl.getAttribute("data-track-id");
    const tracks = document.querySelector("#tracks");
    //from section select the element with "playing" class, here "playing" class is always unique
    const playingTrack = tracks?.querySelector("section.playing");
    //Finding currently playing track from audio element's "id"
    const selectedTrack = tracks?.querySelector(`[id="${selectedTrackId}"]`);

    //if currently playing track is not equal to selected track
    if (playingTrack?.id !== selectedTrack?.id) {
      playingTrack?.classList.remove("playing");
    }

    //adding green color class to whenever clicked on the track
    selectedTrack?.classList.add("playing");

    //check these conditions every 100ms
    //constantly updating song duration completed and timeline
    progressInterval = setInterval(() => {
      //if audio is paused do nothing
      if (audio.paused) {
        return;
      }
      //if song continues, keep showing update time completed by song
      //extra code bcoz it was diplaying like 0:3 and we improved it to 0:03
      //this code is only for 30 sec total song duration
      songDurationCompleted.textContent = `0:${
        audio.currentTime.toFixed(0) < 10
          ? "0" + audio.currentTime.toFixed(0)
          : audio.currentTime.toFixed(0)
      }`;
      //progress line which increases according to the song duration completed
      songProgress.style.width = `${
        (audio.currentTime / audio.duration) * 100
      }%`;
    }, 100);
    updateIconsForPlayMode(selectedTrackId);
  });

  //add event listener for when audio is paused
  audio.addEventListener("pause", () => {
    if (progressInterval) {
      //everytime a  new song is played, clear interval, means clear previous interval
      clearInterval(progressInterval);
    }
    const selectedTrackId = audioControl.getAttribute("data-track-id");
    updateIconsForPauseMode(selectedTrackId);
  });

  //code for volume change
  volume.addEventListener("change", () => {
    audio.volume = volume.value / 100;
  });

  timeline.addEventListener(
    "click",
    (e) => {
      const timelineWidth = window.getComputedStyle(timeline).width;
      const timeToSeek = (e.offsetX / parseInt(timelineWidth)) * audio.duration;
      audio.currentTime = timeToSeek;
      songProgress.style.width = `${
        (audio.currentTime / audio.duration) * 100
      }%`;
    },
    false
  );

  next.addEventListener("click", playNextTrack);
  prev.addEventListener("click", playPrevTrack);

  playButton.addEventListener("click", togglePlay);

  //when we click back button (<--) or forward button(-->)
  window.addEventListener("popstate", (event) => {
    loadSection(event.state);
  });
});
