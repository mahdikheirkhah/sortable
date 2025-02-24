let heroes = [];
let filteredHeroes = [];
let currentPage = 1;
let pageSize = 20;
let totalPages = 1;
let currentSort = { column: null, order: "asc" };
let isCalledFromLoad = false;

async function fetchData() {
  try {
    const response = await fetch("https://rawcdn.githack.com/akabab/superhero-api/0.2.0/api/all.json");
    if (!response.ok) throw new Error("Failed to fetch data");
    heroes = await response.json();
    console.log(heroes);
    return heroes;
  } catch (error) {
    console.error("Error fetching data:", error);
    return []; // Return an empty array in case of an error
  }
}

// Function to render table
function renderTable(data) {
  const tableBody = document.querySelector("#data-table tbody");
  tableBody.innerHTML = ""; // Clear previous data

  data.forEach((hero) => {
    const powerstats = hero.powerstats;
    const powerstatsStr = `
      Intelligence: ${powerstats.intelligence || "N/A"}<br>
      Strength: ${powerstats.strength || "N/A"}<br>
      Speed: ${powerstats.speed || "N/A"}<br>
      Durability: ${powerstats.durability || "N/A"}<br>
      Power: ${powerstats.power || "N/A"}<br>
      Combat: ${powerstats.combat || "N/A"}<br>`;

    const row = document.createElement("tr");
    row.dataset.id = hero.slug; 
    row.innerHTML = `
        <td><img src="${hero.images.xs}" alt="${hero.name}" width="50" loading="lazy"></td>
        <td>${hero.name}</td>
        <td>${hero.biography.fullName || "N/A"}</td>
        <td>${powerstatsStr}</td>
        <td>${hero.appearance.race || "N/A"}</td>
        <td>${hero.appearance.gender || "N/A"}</td>
        <td>${getNestedValue(hero, "appearance.height")}</td>
        <td>${getNestedValue(hero, "appearance.weight")}</td>
        <td>${hero.biography.placeOfBirth || "N/A"}</td>
        <td>${hero.biography.alignment || "N/A"}</td>
    `;
    tableBody.appendChild(row);
  });
}

function sumPowerstats(powerstats) {
  // Extract the numeric values of powerstats and sum them up
  const stats = [
    powerstats.intelligence,
    powerstats.strength,
    powerstats.speed,
    powerstats.durability,
    powerstats.power,
    powerstats.combat
  ];

  // Filter out "N/A" or non-numeric values, and sum the rest
  return stats.reduce((sum, stat) => {
    const num = parseInt(stat, 10);
    return !isNaN(num) ? sum + num : sum;
  }, 0);
}

async function sortAndRender(column, order) {
  const sortHeroes = filteredHeroes.length > 0 ? filteredHeroes : heroes;
  console.log(filteredHeroes);
  console.log(column);
  console.log(order);
  const alignmentOrder = {
    "bad": 1,
    "neutral": 2,
    "good": 3
  };

  const sortedData = [...sortHeroes].sort((a, b) => {

    let valA = getNestedValue(a, column);
    let valB = getNestedValue(b, column);

    // Handle missing values
    if (valA === null || valA === "N/A" || valA === "-") return 1;
    if (valB === null || valB === "N/A" || valB === "-") return -1;

    // if alignment column, sort by alignmentOrder
    if (column === "biography.alignment") {
      const orderA = alignmentOrder[valA.toLowerCase()] || 999; // 999 for unknown values
      const orderB = alignmentOrder[valB.toLowerCase()] || 999;
      return order === "asc" ? orderA - orderB : orderB - orderA;
    }
    if (column === "powerstats") {
      valA = sumPowerstats(valA);
      valB = sumPowerstats(valB);
    }

    if (column === "appearance.weight") {
      valA = convertWeightToKg(valA);
      valB = convertWeightToKg(valB);
    } else if (column === "appearance.height") {
      valA = convertHeightToCm(valA);
      valB = convertHeightToCm(valB);
    }

    // If sorting alphabetically, use the first letter
    if (typeof valA === "string" && typeof valB === "string") {
      valA = valA.replace(/[^A-Za-z]/g, "").toUpperCase();
      valB = valB.replace(/[^A-Za-z]/g, "").toUpperCase();
    }

    return order === "asc" ? (valA >= valB ? 1 : -1) : valA <= valB ? 1 : -1;
  });

  const numPageSize = pageSize === "all" ? sortedData.length : Number(pageSize);

  const startIndex = (currentPage-1) * numPageSize;
  const endIndex = startIndex + numPageSize;
  const currentDisplay = sortedData.slice(startIndex, endIndex);

  renderTable(currentDisplay);
  updatePaginationInfo();
  updateURL();
  currentSort = { column, order };
}

function updatePaginationInfo() {
  const dataSource = filteredHeroes.length > 0 ? filteredHeroes : heroes;
  totalPages = pageSize === "all" ? 1 : Math.ceil(dataSource.length / pageSize);
  document.getElementById("page-info").textContent = `Page ${currentPage} / ${totalPages}`;
}


function renderPaginatedTable(data) {
  totalPages = pageSize === "all" ? 1 : Math.ceil(data.length / pageSize);
  currentPage = Math.min(currentPage, totalPages) || 1; // Ensure page doesn't go out of range

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = pageSize === "all" ? data.length : startIndex + Number(pageSize);
  const currentDisplay = data.slice(startIndex, endIndex);

  renderTable(currentDisplay);
  updatePaginationInfo();
}


// Event listeners for pagination buttons
document.getElementById("prev-page").addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    sortAndRender(currentSort.column, currentSort.order);
    updateURL();
  }
});

document.getElementById("next-page").addEventListener("click", () => {
  console.log(currentPage);
  if (currentPage < totalPages) {
    currentPage++;
    sortAndRender(currentSort.column, currentSort.order);
    updateURL();
  }
});

document.getElementById("display").addEventListener("change", (e) => {
  pageSize = e.target.value === "all" ? "all" : Number(e.target.value);
  currentPage = 1;  // Reset to the first page when changing page size

  // Update the pagination info and re-render the table
  const dataSource = filteredHeroes.length > 0 ? filteredHeroes : heroes;
  totalPages = pageSize === "all" ? 1 : Math.ceil(dataSource.length / pageSize);
  updatePaginationInfo();
  sortAndRender(currentSort.column, currentSort.order);

  // Update the dropdown value to reflect the selected page size
  document.getElementById("display").value = pageSize === "all" ? "all" : pageSize.toString();
});



// Convert weight to kg (handles "78 kg" and "2 tons")
function convertWeightToKg(weight) {
  if (!weight) return null;

  let match = weight.match(/(\d+|\d+,\d+)\s*(kg|tons)/i);
  if (!match) return null; // If no match, return null
  let digits = match[1].replace(",", ""); // Remove the comma
  let value = parseFloat(digits); // Extract numeric value
  let unit = match[2].toLowerCase(); // Extract unit
  return unit === "tons" ? value * 1000 : value; // Convert tons to kg
}

function convertHeightToCm(height) {
  if (!height) return null;
  let match = height.match(/(\d+|\d+.\d+)\s*(meters|cm)/i);
  if (!match) return null; // If no match, return null
  let value = parseFloat(match[1]); // Extract numeric value
  let unit = match[2].toLowerCase(); // Extract unit
  return unit === "meters" ? value * 100 : value; 
}

function getNestedValue(obj, path) {
  // Split the path into parts
  const keys = path.split(".");

  // Check if the last part refers to an array (height or weight)
  if (keys[keys.length - 1] === "height" || keys[keys.length - 1] === "weight") {
    const value = keys.reduce((acc, key) => (acc && acc[key] ? acc[key] : null), obj);

    // Ensure value is an array and has at least 2 elements
    if (Array.isArray(value) && value.length > 1) {
      let extractedValue = value[1];

      // Ensure extractedValue is a string before calling startsWith
      if (typeof extractedValue === "string" && extractedValue.startsWith("0")) {
        return "N/A";
      }

      return extractedValue || "N/A"; // If it's empty or falsy, return "N/A"
    }

    return "N/A"; // Return "N/A" if value is not a valid array
  }

  // For other paths, continue as normal
  return keys.reduce((acc, key) => (acc && acc[key] ? acc[key] : null), obj) || "N/A";
}

// Add sorting functionality to table headers
document.querySelectorAll("#data-table th").forEach((th, index) => {
  th.addEventListener("click", () => {
    const columns = [
      "name",
      "biography.fullName",
      "powerstats",
      "appearance.race",
      "appearance.gender",
      "appearance.height",
      "appearance.weight",
      "biography.placeOfBirth",
      "biography.alignment",
    ];

    const column = columns[index - 1];
    if (!column) return undefined;

    const newOrder =
      currentSort.column === column && currentSort.order === "asc"
        ? "desc"
        : "asc";
    sortAndRender(column, newOrder);
  });
});


document.getElementById("search-bar").addEventListener("keyup", async function () {
  heroes = await fetchData(); // Always fetch fresh data

  let selectedField = document.getElementById("search-field").value;
  let searchTerm = this.value.trim();

  if (!searchTerm) {
    filteredHeroes = [];
    return renderPaginatedTable(heroes);
  }
  let isNumericOP = false;
  let operator = null;
  let value = searchTerm;
  const operators = ["+", "-", "=", "!=", ">", "<", "~"];
  
  for (let op of operators) {
    if (searchTerm.startsWith(op)) {
      operator = op;
      switch (operator) {
        case "=": 
            isNumericOP = true;
        case "!=": 
            isNumericOP = true;
        case ">": 
             isNumericOP = true;
        case "<": 
            isNumericOP = true;
      }
      value = searchTerm.slice(op.length).trim();
      break;
    }
  }

  const columns = {
    "name": "name", "full_name": "biography.fullName", "race": "appearance.race",
    "gender": "appearance.gender", "place_of_birth": "biography.placeOfBirth",
    "alignment": "biography.alignment", "intelligence": "powerstats.intelligence",
    "strength": "powerstats.strength", "speed": "powerstats.speed",
    "durability": "powerstats.durability", "power": "powerstats.power",
    "combat": "powerstats.combat", "height": "appearance.height", "weight": "appearance.weight",
  };

  let column = columns[selectedField];
  if (!column) return;

  const isNumericColumn = ["powerstats.intelligence", "powerstats.strength", "powerstats.speed",
    "powerstats.durability", "powerstats.power", "powerstats.combat"];

  filteredHeroes = heroes.filter(hero => {
    let heroValue = getNestedValue(hero, column);
    let isNumeric = isNumericColumn.includes(column);
    if (isNumeric) {
      heroValue = Number(heroValue);
      value = Number(value);
      if (isNaN(heroValue) || isNaN(value)) return false;
    } 

    if (column === "appearance.weight") {
      isNumeric = true;
      heroValue = convertWeightToKg(heroValue);
      value = Number(value);
      if (isNaN(heroValue) || isNaN(value)) return false;
    } 
    if (column === "appearance.height") {
      isNumeric = true;
      heroValue = convertHeightToCm(heroValue);
      value = Number(value);
      if (isNaN(heroValue) || isNaN(value)) return false;
    }
    if (typeof heroValue === "string" && typeof value === "string"){
      heroValue = heroValue.toLowerCase();
      value = value.toLowerCase();
    }
    // Apply filters based on the operator
    console.log(isNumeric);
    if (isNumeric && isNumericOP){
      switch (operator) {
        case "=": 
            return heroValue === value;
        case "!=": 
            return heroValue !== value;
        case ">": 
            return heroValue > value;
        case "<": 
            return heroValue < value;
      }
    } else if (!isNumeric && !isNumericOP){
      switch (operator) {
        case "+":
            return heroValue.includes(value);
        case "-":
            return !heroValue.includes(value);
        case "~": 
            return heroValue.includes(value) || fuzzyMatch(heroValue, value);
        default: 
            return heroValue.startsWith(value);
      }
    } else{
      return false
    }
  });

  // Reset pagination for filtered results
  if(!isCalledFromLoad){
    currentPage = 1;
  }
  
  isCalledFromLoad = false;
  totalPages = Math.ceil(filteredHeroes.length / pageSize);
  renderPaginatedTable(filteredHeroes);
  updateURL();
});


// Basic fuzzy search using Levenshtein distance
function fuzzyMatch(str, term) {
  let distance = levenshteinDistance(str.toLowerCase(), term.toLowerCase());
  return distance <= 2; // Allow small typos
}

function levenshteinDistance(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]).map((row, i) =>
    row.concat(Array.from({ length: b.length }, (_, j) => (i === 0 ? j + 1 : 0)))
  );

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      matrix[i][j] =
        a[i - 1] === b[j - 1]
          ? matrix[i - 1][j - 1]
          : Math.min(matrix[i - 1][j - 1], matrix[i][j - 1], matrix[i - 1][j]) + 1;
    }
  }

  return matrix[a.length][b.length];
}

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  // Trigger the search immediately after loading if there's a search query
  if (params.has("sort") && params.has("order")) {
    currentSort.column = params.get("sort");
    currentSort.order = params.get("order");
  }
  if (params.has("pageSize")) {
    pageSize = params.get("pageSize") === "all" ? "all" : Number(params.get("pageSize"));
    if(pageSize !== "all" && pageSize !== 10 && pageSize !== 20 && pageSize !== 50 && pageSize !== 100){
      pageSize = 20;
    }
    document.getElementById("display").value = pageSize;
  }

  if (params.has("page")) {
    currentPage = parseInt(params.get("page"), 10) || 1;
  }

  if (params.has("search") && params.has("field")) {
    document.getElementById("search-bar").value = params.get("search");
    if (currentSort.column === null){
      currentSort.column = params.get("field");
    }
    document.getElementById("search-field").value = params.get("field");
    isCalledFromLoad = true;
    document.getElementById("search-bar").dispatchEvent(new Event('keyup')); // Simulate the keyup event
  } else{
      // Fetch the data
  heroes = await fetchData();  
  sortAndRender(currentSort.column || "name", currentSort.order || "asc");
  }
});



document.getElementById("table-body").addEventListener("click", (event) => {
  const row = event.target.closest("tr");
  if (!row) return;

  const heroSlug = row.dataset.id;
  if (heroSlug) {
      window.location.href = `detail.html?slug=${heroSlug}`;
  }
});

function updateURL() {
  const params = new URLSearchParams();

  if (document.getElementById("search-bar").value) {
    params.set("search", document.getElementById("search-bar").value);
  }

  if (document.getElementById("search-field").value) {
    params.set("field", document.getElementById("search-field").value);
  }

  if (currentSort.column) {
    params.set("sort", currentSort.column);
    params.set("order", currentSort.order);
  }

  params.set("page", currentPage);
  params.set("pageSize", pageSize);

  window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
}
