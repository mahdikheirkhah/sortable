let heroes = [];
let filteredHeroes = [];
let currentPage = 1;
let pageSize = 20;
let totalPages = 1;
let currentSort = { column: null, order: "asc" };

async function fetchData() {
  try {
    const response = await fetch("https://rawcdn.githack.com/akabab/superhero-api/0.2.0/api/all.json");
    if (!response.ok) throw new Error("Failed to fetch data");
    heroes = await response.json();
    console.log(heroes)
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
    const row = document.createElement("tr");
    row.innerHTML = `
            <td><img src="${hero.images.xs}" alt="${hero.name}" width="50"></td>
            <td>${hero.name}</td>
            <td>${hero.biography.fullName || "N/A"}</td>
            <td>${hero.powerstats.intelligence || "N/A"}</td>
            <td>${hero.powerstats.strength || "N/A"}</td>
            <td>${hero.powerstats.speed || "N/A"}</td>
            <td>${hero.powerstats.durability || "N/A"}</td>
            <td>${hero.powerstats.power || "N/A"}</td>
            <td>${hero.powerstats.combat || "N/A"}</td>
            <td>${hero.appearance.race || "N/A"}</td>
            <td>${hero.appearance.gender || "N/A"}</td>
            <td>${
              hero.appearance.height ? hero.appearance.height[1] : "N/A"
            }</td>
            <td>${
              hero.appearance.weight ? hero.appearance.weight[1] : "N/A"
            }</td>
            <td>${hero.biography.placeOfBirth || "N/A"}</td>
            <td>${hero.biography.alignment || "N/A"}</td>
        `;
    tableBody.appendChild(row);
  });
}

async function sortAndRender(column, order) {
  const sortHeroes = filteredHeroes.length > 0 ? filteredHeroes : heroes;
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

    // Convert to number if applicable for other columns
    const isNumericColumn = [
      "powerstats.intelligence", "powerstats.strength", "powerstats.speed",
      "powerstats.durability", "powerstats.power", "powerstats.combat"
    ];
    if (isNumericColumn.includes(column)) {
      valA = Number(valA);
      valB = Number(valB);
    } else if (column === "appearance.weight") {
      valA = convertWeightToKg(valA);
      valB = convertWeightToKg(valB);
    } else if (column === "appearance.height") {
      valA = convertMeterToCm(valA);
      valB = convertMeterToCm(valB);
    }

    return order === "asc" ? (valA >= valB ? 1 : -1) : valA <= valB ? 1 : -1;
  });

  const numPageSize = pageSize === "all" ? sortedData.length : Number(pageSize);

  const startIndex = (currentPage-1) * numPageSize;
  const endIndex = startIndex + numPageSize;
  const currentDisplay = sortedData.slice(startIndex, endIndex);

  renderTable(currentDisplay);
  updatePaginationInfo();
  currentSort = { column, order };
}

function updatePaginationInfo() {
  document.getElementById("page-info").textContent = `Page ${currentPage} / ${totalPages}`;
}

// Function to handle pagination
function renderPaginatedTable(data) {
  totalPages = pageSize === "all" ? 1 : Math.ceil(data.length / pageSize);
  currentPage = Math.min(currentPage, totalPages); // Prevent out-of-range pages

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
  }
});

document.getElementById("next-page").addEventListener("click", () => {
  if (currentPage < totalPages) {
    currentPage++;
    sortAndRender(currentSort.column, currentSort.order);
  }
});

document.getElementById("display").addEventListener("change", (e) => {
  pageSize = e.target.value === "all" ? "all" : Number(e.target.value);
  currentPage = 1;
  totalPages = pageSize === "all" ? 1 : Math.ceil(heroes.length / pageSize); // Update pages
  updatePaginationInfo();
  sortAndRender(currentSort.column, currentSort.order);
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

function convertMeterToCm(height) {
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
      "powerstats.intelligence",
      "powerstats.strength",
      "powerstats.speed",
      "powerstats.durability",
      "powerstats.power",
      "powerstats.combat",
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

// search functionality
document.getElementById("search-bar").addEventListener("keyup", function () {
  // retrieve current search input and lowercase (case-insensitive)
  const searchTerm = this.value.toLowerCase();

  // filter heroes based on search term
  filteredHeroes = heroes
    // filter if name contain any part of the search term
    .filter((hero) => hero.name.toLowerCase().includes(searchTerm))
    .sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();

      // sort by exact match first
      if (nameA === searchTerm) return -1;
      if (nameB === searchTerm) return 1;

      // if name starts with search term, sort it first
      const startsWithA = nameA.startsWith(searchTerm);
      const startsWithB = nameB.startsWith(searchTerm);
      if (startsWithA && !startsWithB) return -1;
      if (!startsWithA && startsWithB) return 1;

      // otherwise, consider equal for sorting
      return 0;
    });
    
  // Update pagination based on search results
  currentPage = 1; // Reset to the first page
  totalPages = pageSize === "all" ? 1 : Math.ceil(filteredHeroes.length / pageSize); // Update total pages
  updatePaginationInfo();

  // Render the filtered and paginated results
  renderPaginatedTable(filteredHeroes);   
  
  });

document.addEventListener("DOMContentLoaded", async () => {
  const heroes = await fetchData(); // Fetch data once when the page loads
  totalPages = Math.ceil(heroes.length / pageSize);
  sortAndRender("name", "asc"); // Render the fetched data into the table
});