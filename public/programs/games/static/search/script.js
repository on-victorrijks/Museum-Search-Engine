const keywords = [
    "Portrait", "Autoportrait", "Femme", "Homme", "Enfant", "Couple", 
    "Nu", "Silhouette", "Visage", "Mains", "Corps", "Yeux", "Regard",
    "Paysage", "Nature morte", "Scène de rue", "Intérieur", "Vie quotidienne",
    "Rêverie", "Fête", "Bataille", "Mythologie", "Religion", "Danse", "Musique",
    "Mer", "Montagne", "Rivière", "Forêt", "Ciel", "Nuages", "Soleil", "Lune", 
    "Nuit", "Aube", "Crépuscule", "Saisons", "Neige", "Fleurs", "Arbre", "Vent",
    "Cathédrale", "Château", "Colonne", "Voûte", "Fresque", "Mosaïque", 
    "Ruines", "Fenêtre",
    "Ange", "Démon", "Sirène", "Centaure", "Dragon", "Masque", "Squelette", 
    "Crâne", "Couronne", "Clé", "Échelle", "Labyrinthe"
];

let queries = [];
let debounceTimeout = null;

const searchInput = document.getElementById("searchInput");
const addTextPromptBtn = document.getElementById("addTextPrompt");
const queriesContainer = document.getElementById("queries_container");
const searchButton = document.getElementById("searchButton");
const resetButton = document.getElementById("resetButton");
const keywordsContainer = document.getElementById("keywords_container");
const resultsContainer = document.getElementById("results_container");
const colorsContainer = document.getElementById("colors_container");
const luminosityContainer = document.getElementById("luminosity_container");

let isLoading = false;

function setGridLoading(loading) {
    isLoading = loading;
    resultsContainer.setAttribute("loading", loading ? "true" : "false");
}

function initMasonry() {
    setGridLoading(true);
    setTimeout(() => {
        imagesLoaded(resultsContainer, function () {
            new Masonry(resultsContainer, {
                itemSelector: '.result',
                columnWidth: '.grid-sizer',
                percentPosition: true,
                horizontalOrder: true
            });
            setGridLoading(false);
        });
    }, 500);
}

function debounceSendQueries() {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(sendQueriesToServer, 100);
}

function sendQueriesToServer() {
    queries = queries.map(query => ({
        ...query,
        weight: parseFloat(document.getElementById(query.id)?.querySelector("input")?.value) || 0
    }));

    let filteredQueries = queries.filter(query => query.weight !== 0);

    if (filteredQueries.length === 0) {
        clearResults();
        return;
    }

    fetch('http://127.0.0.1:5000/api/search/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queries: filteredQueries }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            clearResults();
            data.result.forEach(appendResult);
            initMasonry();
        } else {
            console.error("Error:", data.error);
        }
    })
    .catch(console.error);
}

function formatTitle(title, maxLength) {
    if (title.length <= maxLength) return title;
    return title.slice(0, maxLength - 3) + "...";
}

function appendResult(result) {
    const resultDiv = document.createElement("div");
    resultDiv.className = "result";
    resultDiv.id = result.recordID;

    const image = document.createElement('img');
    image.src = `http://127.0.0.1:5000/images/${result.recordID}`;

    const textContainer = document.createElement("div");
    textContainer.className = "textContainer";

    const firstName = result["creator.firstNameCreator"];
    const lastName = result["creator.lastNameCreator"];
    const title = result["objectWork.titleText"];

    textContainer.innerHTML = `
        <h3>${firstName} ${lastName}</h3>
        <h1>${formatTitle(title, 50)}</h1>
    `;

    resultDiv.appendChild(textContainer);
    resultDiv.appendChild(image);
    resultsContainer.appendChild(resultDiv);
}

function clearResults() {
    document.querySelectorAll(".result").forEach(result => result.remove());
}

function addQuery(type, value) {
    let queryID = `${type}__${value}`;
    if (queries.some(q => q.id === queryID)) return;

    let queryDiv = document.createElement("div");
    queryDiv.className = "query";
    queryDiv.id = queryID;
    queryDiv.innerHTML = `
        <div class="topQ">
            <div class="topQText">
                <h3>${capitalize(type)}</h3>
                <h2>${value}</h2>
            </div>
            <button class="removeQuery">
                <img src="./static/search/assets/bin.svg">
            </button>
        </div>
        <div class="range">
            <div class="ticks">
                <h4>Non</h4>
                <h4>Pas vraiment</h4>
                <h4>Neutre</h4>
                <h4>Pourquoi pas</h4>
                <h4>Oui</h4>
            </div>
            <input type="range" min="-2" max="2" step="0.25" value="1">
        </div>
    `;

    queryDiv.querySelector(".removeQuery").addEventListener("click", () => removeQuery(queryID));
    queriesContainer.appendChild(queryDiv);

    queries.push({ id: queryID, type, value, weight: 1 });
    debounceSendQueries();
}

function removeQuery(queryID) {
    queries = queries.filter(query => query.id !== queryID);
    document.getElementById(queryID)?.remove();

    // Unselect keyword if it was a keyword query
    if (queryID.startsWith("keyword")) {
        let keyword = queryID.split("__")[1];
        document.querySelectorAll(".keyword").forEach(k => {
            if (k.textContent === keyword) {
                k.classList.remove("selected");
            }
        });
    } else if (queryID.startsWith("color")) {
        let color = queryID.split("__")[1];
        document.getElementById(color)?.classList.remove("selected");
    } else if (queryID.startsWith("luminosity")) {
        let luminosity = queryID.split("__")[1];
        document.getElementById(luminosity)?.classList.remove("selected");
    }

    debounceSendQueries();
}

/* togglers */
function toggleKeyword(keyword) {
    // Check in the queries if the keyword is already selected
    let found = false;
    queries.forEach(query => {
        if (query.type === "keyword" && query.value === keyword) {
            found = true;
        }
    });

    // Find the keywordElement
    let keywordElement = null;
    document.querySelectorAll(".keyword").forEach(k => {
        if (k.textContent === keyword) {
            keywordElement = k;
        }
    });

    if (found) {
        // Remove the keyword from the queries
        queries = queries.filter(query => !(query.type === "keyword" && query.value === keyword));
        // Remove the query from the container
        document.getElementById(`keyword__${keyword}`)?.remove();
        // Unselect the keyword
        keywordElement.classList.remove("selected");
        // Send the queries to the server
        debounceSendQueries();
    } else {
        addQuery("keyword", keyword);
        // Select the keyword
        keywordElement.classList.add("selected");
    }

}

function toggleColor(color) {
    // Check in the queries if the color is already selected
    let found = false;
    queries.forEach(query => {
        if (query.type === "color" && query.value === color.id) {
            found = true;
        }
    });

    // Find the color element
    let colorElement = document.getElementById(color.id);

    if (found) {
        // Remove the color from the queries
        queries = queries.filter(query => !(query.type === "color" && query.value === color.id));
        // Remove the query from the container
        document.getElementById(`color__${color.id}`)?.remove();
        // Unselect the color
        colorElement.classList.remove("selected");
        // Send the queries to the server
        debounceSendQueries();
    } else {
        addQuery("color", color.id);
        // Select the color
        colorElement.classList.add("selected");
    }
}    

function toggleLuminosity(luminosity) {
    // Check in the queries if the luminosity is already selected
    let found = false;
    queries.forEach(query => {
        if (query.type === "luminosity" && query.value === luminosity.id) {
            found = true;
        }
    });

    // Find the luminosity element
    let luminosityElement = document.getElementById(luminosity.id);

    if (found) {
        // Remove the luminosity from the queries
        queries = queries.filter(query => !(query.type === "luminosity" && query.value === luminosity.id));
        // Remove the query from the container
        document.getElementById(`luminosity__${luminosity.id}`)?.remove();
        // Unselect the luminosity
        luminosityElement.classList.remove("selected");
        // Send the queries to the server
        debounceSendQueries();
    } else {
        addQuery("luminosity", luminosity.id);
        // Select the luminosity
        luminosityElement.classList.add("selected");
    }
}


/* end togglers */


function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function toggleKeywords() {
    if (keywordsContainer.style.display === "none") {
        keywordsContainer.style.display = "flex";
    } else {
        keywordsContainer.style.display = "none";
    }

}

document.addEventListener("DOMContentLoaded", () => {
    keywords.forEach(keyword => {
        let div = document.createElement("div");
        div.className = "keyword";
        div.textContent = keyword;
        div.addEventListener("click", () => toggleKeyword(keyword));
        keywordsContainer.appendChild(div);
    });

    colorsContainer.querySelectorAll(".color").forEach(color => {
        color.addEventListener("click", () => toggleColor(color));
    });

    luminosityContainer.querySelectorAll(".luminosity").forEach(luminosity => {
        luminosity.addEventListener("click", () => toggleLuminosity(luminosity));
    });


    addTextPromptBtn.addEventListener("click", () => {
        if (searchInput.value.trim() !== "") {
            addQuery("text", searchInput.value.trim());
            searchInput.value = "";
        }
    });

    searchButton.addEventListener("click", sendQueriesToServer);

    resetButton.addEventListener("click", () => {
        queries = [];
        selectedKeywords = [];
        queriesContainer.innerHTML = "";

        // Unselect all keywords
        document.querySelectorAll(".keyword").forEach(k => k.classList.remove("selected"));
        // Unselect all colors
        document.querySelectorAll(".color").forEach(c => c.classList.remove("selected"));
        // Unselect all luminosities
        document.querySelectorAll(".luminosity").forEach(l => l.classList.remove("selected"));

        clearResults();
    });

    document.addEventListener("input", (event) => {
        if (event.target.type === "range") {
            debounceSendQueries();
        }
    });
});
