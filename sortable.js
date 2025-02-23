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
  heroes = await fetchData(); // Always fetch fresh data
  console.log(heroes);
  const sortedData = [...heroes].sort((a, b) => {
    let valA = getNestedValue(a, column);
    let valB = getNestedValue(b, column);

    // Handle missing values
    if (valA === null || valA === "N/A" || valA === "-") return 1;
    if (valB === null || valB === "N/A" || valB === "-") return -1;

    // Convert to number if applicable
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

  renderTable(sortedData);
  currentSort = { column, order };
}


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
document.getElementById("search-bar").addEventListener("keyup", async function () {
  heroes = await fetchData(); // Always fetch fresh data

  let selectedField = document.getElementById("search-field").value;
  let searchTerm = this.value.trim();

  if (!searchTerm) return renderTable(heroes);

  let operator = null;
  let value = searchTerm;
  const operators = ["+", "-", "=", "!=", ">", "<", "~"];
  
  for (let op of operators) {
    if (searchTerm.startsWith(op)) {
      operator = op;
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

  const filteredHeroes = heroes.filter(hero => {
    let heroValue = getNestedValue(hero, column);
    
    if (isNumericColumn.includes(column)) {
      heroValue = Number(heroValue);
      value = Number(value);
      if (isNaN(heroValue) || isNaN(value)) return false;
    } 

    if (column === "appearance.weight") {
      heroValue = convertWeightToKg(heroValue);
      value = Number(value);
      if (isNaN(heroValue) || isNaN(value)) return false;
    } 
    if (column === "appearance.height") {
      heroValue = convertMeterToCm(heroValue);
      value = Number(value);
      if (isNaN(heroValue) || isNaN(value)) return false;
    }
    if (typeof heroValue === "string" && typeof value === "string"){
      heroValue = heroValue.toLowerCase();
      value = value.toLowerCase();
    }
    // Apply filters based on the operator
    switch (operator) {
      case "+": return heroValue.includes(value);
      case "-": return !heroValue.includes(value);
      case "=": return heroValue === value;
      case "!=": return heroValue !== value;
      case ">": return heroValue > value;
      case "<": return heroValue < value;
      case "~": return heroValue.includes(value) || fuzzyMatch(heroValue, value);
      default: return heroValue.startsWith(value);
    }
  });

  renderTable(filteredHeroes);
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
  const heroes = await fetchData(); // Fetch data once when the page loads
  renderTable(heroes); // Render the fetched data into the table
});