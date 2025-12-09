//==========================================================================================
//                                    DOM Element Selectors
//==========================================================================================

let search = document.querySelector(".search");
let input = document.querySelector("input");
let h1 = document.querySelector("h1");
let movies_container = document.querySelector(".movies-container");
let nothing = document.querySelector(".nothing");
let displayMore = document.querySelector(".displayMore");
let showMyWatchlistBtn = document.querySelector("#showMyWatchlist");
let overlay = document.querySelector(".overlay");
let closeOverlayBtn = document.querySelector(".x");
let buttonUp = document.querySelector(".button");
let filter = document.querySelector(".filter");
let filterPanel = document.querySelector(".filter-panel");
let applyfilterbtn = document.querySelector(".apply-filter-btn");
let clearfilterbtn = document.querySelector(".clear-filter-btn");
let closePanel = document.querySelector(".closePanel");

//==========================================================================================
//                                     Global Variables
//==========================================================================================
let page = 1;
let searchValue = "";
let totalResults = 0;
//==========================================================================================
//                                     Helper Functions
//==========================================================================================

// Function to add event listeners to "Details" buttons on movie cards
function addDetailsButtonListeners() {
  let buttons = document.querySelectorAll(".details-btn");
  buttons.forEach((button) => {
    if (button.getAttribute("data-details-listener-added") === "true") {
      return;
    }
    button.setAttribute("data-details-listener-added", "true");

    button.addEventListener("click", (e) => {
      let imdbId = e.target.dataset.imdbId;
      getMovieDetails(imdbId);
    });
  });
}

// Function to add event listeners to favorite buttons (heart icons) on movie cards
function addFavListener() {
  let favButtons = document.querySelectorAll(".fav-btn");
  favButtons.forEach((btn) => {
    if (btn.getAttribute("data-listener-added") === "true") {
      return;
    }
    btn.setAttribute("data-listener-added", "true");

    btn.addEventListener("click", async (e) => {
      // Added async here
      let favorites = JSON.parse(localStorage.getItem("myWatchlist")) || [];

      let movieData = {
        imdbID: btn.dataset.imdbId,
        Title: btn.dataset.title,
        Poster: btn.dataset.poster,
        Year: btn.dataset.year,
        // These will now be properly fetched
        Genre: btn.dataset.genre,
        Actors: btn.dataset.actors,
      };

      let existingIndex = favorites.findIndex(
        (f) => f.imdbID === movieData.imdbID
      );

      if (existingIndex !== -1) {
        favorites.splice(existingIndex, 1);
        btn.classList.remove("active");
        AddRemoveMessage("Removed", "From", movieData.Title);
      } else {
        // If movie not in watchlist, fetch full details before adding
        try {
          const response = await fetch(
            `https://www.omdbapi.com/?apikey=f7040840&i=${movieData.imdbID}`
          );
          const details = await response.json();
          if (details.Response === "True") {
            movieData.Genre = details.Genre || "N/A";
            movieData.Actors = details.Actors || "N/A";
          }
        } catch (error) {
          console.error(
            "Error fetching full movie details for watchlist:",
            error
          );
        }

        favorites.push(movieData);
        btn.classList.add("active");
        AddRemoveMessage("Added", "TO", movieData.Title);
      }
      localStorage.setItem("myWatchlist", JSON.stringify(favorites));

      if (movies_container.dataset.mode === "watchlist") {
        displayMyWatchlist();
      }
    });
  });
}

function checkMoreItems(totalResults, currentPage) {
  if (currentPage * 10 < totalResults) {
    displayMore.style.display = "flex";
  } else {
    displayMore.style.display = "none";
  }
}

function saveSearchState() {
  localStorage.setItem("lastSearchValue", JSON.stringify(searchValue));
  localStorage.setItem("lastSearchPage", JSON.stringify(page));
}

function clearSearchState() {
  localStorage.removeItem("lastSearchValue");
  localStorage.removeItem("lastSearchPage");
}

function getMovieDetails(imdbId) {
  if (!imdbId) {
    console.log("No IMDb ID provided for movie details.");
    return;
  }

  let dataUrl = `https://www.omdbapi.com/?apikey=f7040840&i=${imdbId}`;

  fetch(dataUrl)
    .then((response) => response.json())
    .then((movieDetails) => {
      console.log("Movie Details:", movieDetails);

      let poster =
        movieDetails.Poster === "N/A"
          ? "https://via.placeholder.com/300x447?text=No+Poster"
          : movieDetails.Poster;

      overlay.querySelector("img").src = poster;
      overlay.querySelector(
        "h2"
      ).textContent = `${movieDetails.Title} (${movieDetails.Year})`;
      overlay.querySelector(".dummy-rating-box").innerHTML = `
                <span>IMDb: ${movieDetails.imdbRating}</span>
                <span>Time: ${movieDetails.Runtime}</span>
                <span>Rated: ${movieDetails.Rated}</span>
            `;
      overlay.querySelector(".dummy-plot").textContent = movieDetails.Plot;
      overlay.querySelector(".dummy-other-details").innerHTML = `
                <p><strong>Genre:</strong> ${movieDetails.Genre}</p>
                <p><strong>Director:</strong> ${movieDetails.Director}</p>
                <p><strong>Actors:</strong> ${movieDetails.Actors}</p>
                <p><strong>Awards:</strong> ${movieDetails.Awards}</p>
            `;
      overlay.style.display = "flex";
    })
    .catch((error) => console.error("Error fetching movie details:", error));
}

// Modified getMovie to fetch full details for each film
// Modified getMovie to fetch full details for each film
async function getMovie(searchQuery, pageNumber) {
  let url = `https://www.omdbapi.com/?apikey=f7040840&s=${searchQuery}&page=${pageNumber}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    let loadingcircle = document.querySelector(".loading");
    if (loadingcircle) {
      loadingcircle.style.display = "none";
    }

    console.log("Search Results Data:", data);
    totalResults = data.totalResults;

    let favorites = JSON.parse(localStorage.getItem(`myWatchlist`)) || [];

    if (data.Search) {
      if (pageNumber === 1) {
        movies_container.innerHTML = "";
        movies_container.style.display = "grid";
      }
      nothing.style.display = "none";
      const fetchDetailsPromises = data.Search.map(async (film) => {
        const detailsResponse = await fetch(
          `https://www.omdbapi.com/?apikey=f7040840&i=${film.imdbID}`
        );
        const details = await detailsResponse.json();
        return {
          ...film,
          Genre: details.Genre || "N/A",
          Actors: details.Actors || "N/A",
        };
      });

      const filmsWithDetails = await Promise.all(fetchDetailsPromises);

      filmsWithDetails.forEach((film, index) => {
        let isFav = favorites.findIndex((f) => f.imdbID === film.imdbID) !== -1;
        let activeClass = isFav ? "active" : "";

        let poster =
          film.Poster === "N/A"
            ? "https://via.placeholder.com/300x447?text=No+Poster"
            : film.Poster;

        const movieCard = document.createElement("div");
        movieCard.classList.add("movie-card");
        movieCard.style.setProperty("--delay", `${index * 0.1}s`);

        movieCard.innerHTML = `
                        <div class="fav-btn ${activeClass}"
                            data-imdb-id="${film.imdbID}"
                            data-title="${film.Title}"
                            data-poster="${film.Poster}"
                            data-year="${film.Year}"
                            data-genre="${film.Genre || "N/A"}"
                            data-actors="${film.Actors || "N/A"}">
                            ♥
                        </div>
                        <img src="${poster}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x447?text=No+Poster'">
                        <h3>${film.Title}</h3>
                        <div class="year">Year : ${film.Year}</div>
                        <button class="details-btn" data-imdb-id="${
                          film.imdbID
                        }">Details</button>
                    `;
        movies_container.appendChild(movieCard);
      });

      addDetailsButtonListeners();
      addFavListener();
      checkMoreItems(totalResults, pageNumber);
    } else {
      // هذا الجزء كان خطأ، تم تصحيحه
      if (pageNumber === 1) {
        nothing.textContent = "No movies found for this name.";
        nothing.style.display = `block`;
        movies_container.innerHTML = "";
        movies_container.style.display = "block";
      }
      displayMore.style.display = `none`;
    }
  } catch (error) {
    console.error("Error fetching movie data:", error);
    let loadingcircle = document.querySelector(".loading");
    if (loadingcircle) loadingcircle.style.display = "none";
    nothing.textContent = "Error fetching data. Please try again later.";
    nothing.style.display = `block`;
    displayMore.style.display = `none`;
    movies_container.innerHTML = "";
  }
}

function displayMyWatchlist() {
  movies_container.innerHTML = "";
  nothing.style.display = `none`;
  displayMore.style.display = `none`;

  movies_container.dataset.mode = "watchlist";
  showMyWatchlistBtn.textContent = "Back to Search";

  let favorites = JSON.parse(localStorage.getItem("myWatchlist")) || [];

  if (favorites.length === 0) {
    nothing.textContent = "Your Watchlist is empty. Add some movies!";
    nothing.style.display = `block`;
    return;
  }

  favorites.forEach((film, index) => {
    let poster =
      film.Poster === "N/A"
        ? "https://via.placeholder.com/300x447?text=No+Poster"
        : film.Poster;

    const movieCard = document.createElement("div");
    movieCard.classList.add("movie-card");
    movieCard.style.setProperty("--delay", `${index * 0.1}s`);

    movieCard.innerHTML = `
            <div class="fav-btn active"
                data-imdb-id="${film.imdbID}"
                data-title="${film.Title}"
                data-poster="${film.Poster}"
                data-year="${film.Year}"
                data-genre="${film.Genre || "N/A"}"
                data-actors="${film.Actors || "N/A"}">
                ♥
            </div>
            <img src="${poster}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x447?text=No+Poster'">
            <h3>${film.Title}</h3>
            <div class="year">Year : ${film.Year}</div>
            <button class="details-btn" data-imdb-id="${
              film.imdbID
            }">Details</button>
        `;
    movies_container.appendChild(movieCard);
  });

  addDetailsButtonListeners();
  addFavListener();
}

function AddRemoveMessage(atr, atr2, film) {
  let AddingAndREmovungFIlm = document.querySelector(".AddingAndREmovungFIlm");
  AddingAndREmovungFIlm.innerHTML = `
    You <span>${atr} ${film}</span> ${atr2} Your Favorites .. <span><button class="remove">✕</button></span>
  `;
  AddingAndREmovungFIlm.style.display = "flex";

  let Timer = setTimeout(() => {
    AddingAndREmovungFIlm.style.display = "none";
  }, 4000);
  document.querySelector(".remove").addEventListener("click", () => {
    clearTimeout(Timer);
    AddingAndREmovungFIlm.style.display = "none";
  });
}

search.addEventListener("click", () => {
  searchValue = input.value.trim();
  movies_container.innerHTML = ``;
  displayMore.style.display = `none`;
  nothing.style.display = `none`;

  if (!searchValue) {
    nothing.textContent = "🎬 No movies found — try searching for something !";
    nothing.style.display = `block`;
    input.focus();
    clearSearchState();
    return;
  } else {
    movies_container.innerHTML = `
            <div class="loading">
              <div class="cssload-dots">
                  <div class="cssload-dot"></div>
                  <div class="cssload-dot"></div>
                  <div class="cssload-dot"></div>
                  <div class="cssload-dot"></div>
                  <div class="cssload-dot"></div>
              </div>
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                      <filter id="goo">
                          <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="12" ></feGaussianBlur>
                          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0 0 0 1 0 0 0 0 0 18 -7" result="goo" ></feColorMatrix>
                      </filter>
                  </defs>
              </svg>
            </div>
      `;
    movies_container.dataset.mode = "search";
    page = 1;
    getMovie(searchValue, page);
    saveSearchState();
  }
});

input.addEventListener("keyup", (e) => {
  if (e.key === `Enter`) {
    search.click();
  }
});

let debounceTimer;
input.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    search.click();
  }, 1000);
});

h1.addEventListener("click", () => {
  movies_container.innerHTML = ``;
  nothing.style.display = `none`;
  displayMore.style.display = `none`;
  input.value = "";
  input.focus();
  movies_container.dataset.mode = "initial";
  clearSearchState();
});

displayMore.addEventListener("click", () => {
  page++;
  getMovie(searchValue, page);
  saveSearchState();
});

if (showMyWatchlistBtn) {
  showMyWatchlistBtn.addEventListener("click", () => {
    if (movies_container.dataset.mode === "watchlist") {
      goBackToLastSearch();
    } else {
      saveSearchState();
      displayMyWatchlist();
    }
  });
}

closeOverlayBtn.addEventListener("click", () => {
  overlay.style.display = "none";
});

overlay.addEventListener("click", (e) => {
  if (e.target === overlay) {
    closeOverlayBtn.click();
  }
});

function goBackToLastSearch() {
  const savedSearchValue = JSON.parse(localStorage.getItem("lastSearchValue"));
  const savedPage = JSON.parse(localStorage.getItem("lastSearchPage"));

  movies_container.innerHTML = "";
  nothing.style.display = "none";
  displayMore.style.display = "none";
  input.value = "";

  if (savedSearchValue && savedPage) {
    searchValue = savedSearchValue;
    page = savedPage;
    input.value = searchValue;
    movies_container.dataset.mode = "search";
    getMovie(searchValue, page);
  } else {
    movies_container.dataset.mode = "initial";
  }
  showMyWatchlistBtn.textContent = "My Watchlist";
  input.focus();
}
filter.addEventListener("click", () => {
  filterPanel.classList.toggle("show-panel");
  closeswich();
});

closePanel.addEventListener("click", () => {
  filterPanel.classList.remove("show-panel");
  closeswich();
});
function closeswich() {
  if (filterPanel.classList.contains("show-panel")) {
    filter.innerHTML = `
      <svg fill="#fff" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
            </svg>
            Close
    `;
  } else {
    filter.innerHTML = `
      <svg fill="#fff" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
            </svg>
            Filter
      
    `;
  }
}

applyfilterbtn.addEventListener("click", () => {
  let filterYear = document
    .querySelector("#filter-year")
    .value.trim()
    .toLowerCase();
  let filterGenre = document
    .querySelector("#filter-genre")
    .value.trim()
    .toLowerCase();
  let filterActor = document
    .querySelector("#filter-actor")
    .value.trim()
    .toLowerCase();
  let cardsForApply = document.querySelectorAll(".movie-card");

  let resultsFound = false;

  cardsForApply.forEach((card) => {
    let favbtn = card.querySelector(".fav-btn");
    let movieYear = favbtn.dataset.year.trim().toLowerCase();
    let movieGenre = favbtn.dataset.genre.trim().toLowerCase();
    let movieActors = favbtn.dataset.actors.trim().toLowerCase();
    let isMatch = true;
    if (filterYear && movieYear.indexOf(filterYear) === -1) {
      isMatch = false;
    }

    if (filterGenre && movieGenre.indexOf(filterGenre) === -1) {
      isMatch = false;
    }

    if (filterActor) {
      const movieActorList = movieActors
        .split(",")
        .map((actor) => actor.trim().toLowerCase());
      const filterActorWords = filterActor
        .split(" ")
        .map((word) => word.trim());

      let actorMatch = false;

      for (const filterWord of filterActorWords) {
        if (filterWord) {
          if (
            movieActorList.some((actorName) => actorName.includes(filterWord))
          ) {
            actorMatch = true;
            break;
          }
        }
      }

      if (!actorMatch) {
        isMatch = false;
      }
    }

    if (isMatch) {
      card.style.display = "flex";
      resultsFound = true;
    } else {
      card.style.display = "none";
    }
  });

  if (!resultsFound && (filterYear || filterGenre || filterActor)) {
    nothing.textContent = "No movies match your filter criteria.";
    nothing.style.display = "block";
    displayMore.style.display = "none";
  } else {
    nothing.style.display = "none";
  }
  closePanel.click();
});

clearfilterbtn.addEventListener("click", () => {
  document.querySelector("#filter-year").value = "";
  document.querySelector("#filter-genre").value = "";
  document.querySelector("#filter-actor").value = "";
  let cardsForclear = document.querySelectorAll(".movie-card");
  cardsForclear.forEach((card) => {
    card.style.display = "flex";
  });
});

document.addEventListener("DOMContentLoaded", () => {
  input.focus();
  let savedSearchValue = JSON.parse(localStorage.getItem("lastSearchValue"));
  let savedPage = JSON.parse(localStorage.getItem("lastSearchPage"));

  if (savedPage && savedSearchValue) {
    searchValue = savedSearchValue;
    page = savedPage;
    input.value = searchValue;
    movies_container.dataset.mode = "search";
    getMovie(searchValue, page);
    showMyWatchlistBtn.textContent = "My Watchlist";
  } else {
    const suggestions = [
      "Marvel",
      "Avatar",
      "John Wick",
      "Harry Potter",
      "Batman",
      "Spider-Man",
      "Inception",
      "Interstellar",
      "Fast & Furious",
    ];

    const randomMovie =
      suggestions[Math.floor(Math.random() * suggestions.length)];

    nothing.style.display = "none";

    searchValue = randomMovie;
    movies_container.dataset.mode = "search";
    getMovie(randomMovie, 1);

    input.placeholder = `Suggested for you: ${randomMovie}...`;
  }
});

function after500() {
  if (window.scrollY >= 500) {
    buttonUp.style.display = "flex";
  } else {
    buttonUp.style.display = "none";
  }
}
window.addEventListener("scroll", after500);
after500();
buttonUp.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
});

const themeSwitch = document.querySelector(".lightandDArk");
const body = document.body;

if (localStorage.getItem("theme") === "light") {
  body.classList.add("light-mode");
  themeSwitch.classList.add("active-light");
}

// 3. لما تضغط على الزرار
themeSwitch.addEventListener("click", () => {
  body.classList.toggle("light-mode");

  themeSwitch.classList.toggle("active-light");

  if (body.classList.contains("light-mode")) {
    localStorage.setItem("theme", "light");
  } else {
    localStorage.setItem("theme", "dark");
  }
});
