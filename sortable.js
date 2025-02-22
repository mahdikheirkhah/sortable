let heroes = [];
let currentSort = { column: "name", order: "asc" };

// Fetch superhero data
fetch("https://rawcdn.githack.com/akabab/superhero-api/0.2.0/api/all.json")
  .then((response) => response.json())
  .then((data) => {
    heroes = data;
    sortAndRender("name", "asc"); // Default sort by name (ascending)
  })
  .catch((error) => console.error("Error fetching data:", error));

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

// Sorting function
function sortAndRender(column, order) {
  const sortedData = [...heroes].sort((a, b) => {
    let valA = getNestedValue(a, column);
    let valB = getNestedValue(b, column);

    // Handle missing values (always sort them last)
    if (valA === null || valA === "N/A" || valA === "-") return 1;
    if (valB === null || valB === "N/A" || valB === "-" ) return -1;

    // Convert to number if applicable
    const isNumericColumn = [
      "powerstats.intelligence",
      "powerstats.strength",
      "powerstats.speed",
      "powerstats.durability",
      "powerstats.power",
      "powerstats.combat",
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
    if (!column) return;

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

  const filteredHeroes = heroes

    .filter((hero) => hero.name.toLowerCase().startsWith(searchTerm))
    .sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();

      if (nameA === searchTerm) return -1;
      if (nameB === searchTerm) return 1;
      
      
      const startsWithA = nameA.startsWith(searchTerm);
      const startsWithB = nameB.startsWith(searchTerm);
      if (startsWithA && !startsWithB) return -1;
      if (!startsWithA && startsWithB) return 1;
      
      return 0;
    });

  renderTable(filteredHeroes);
});
