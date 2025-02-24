async function fetchData() {
    try {
      const response = await fetch("https://rawcdn.githack.com/akabab/superhero-api/0.2.0/api/all.json");
      if (!response.ok) throw new Error("Failed to fetch data");
      heroes = await response.json();
      //console.log(heroes)
      return heroes;
    } catch (error) {
      console.error("Error fetching data:", error);
      return []; // Return an empty array in case of an error
    }
  }
  

function getHeroSlugFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get("slug"); // Get the "id" parameter from the URL
}

async function getHeroBySlug(slug) {
    const heroes = await fetchData(); // Always fetch fresh data
    return heroes.find(hero =>{
        return hero.slug === slug
    });
}

document.addEventListener("DOMContentLoaded",async() => {
    const heroSlug = getHeroSlugFromURL();
    if (!heroSlug) {
        document.body.innerHTML = "<h2>Hero not found!</h2>";
        return undefined;
    }
    const hero = await getHeroBySlug(heroSlug);
    console.log(hero);
    if (!hero) {
        document.body.innerHTML = "<h2>Hero not found!</h2>";
        return undefined;
    }

    document.querySelectorAll(".heroName").forEach(el => {
        el.textContent = hero.name;
    });
    document.getElementById("heroImage").src = hero.images.lg;
    displayHeroDetails(hero);
});

function displayHeroDetails(hero) {
    const container = document.getElementById("heroDetails"); // The parent element where details will be appended
    container.innerHTML = ""; // Clear previous content

    function addDetail(specification, value) {
        const p = document.createElement("p");
        p.innerHTML = `${specification}: <span>${value || "N/A"}</span>`;
        container.appendChild(p);
    }

    function processObject(obj, prefix = "") {
        for (const key in obj) {
            if (obj.hasOwnProperty(key) && key !== "name" && key !== "images" && key !== "id" && key !== "slug") {
                const value = obj[key];

                if (Array.isArray(value)) {
                    // Special handling for height and weight inside "appearance"
                    if (prefix === "appearance" && (key === "height" || key === "weight")) {
                        addDetail(key, value[1] || "N/A"); // Use second element
                    } else {
                        addDetail(key, value.join(", "));
                    }
                } else if (typeof value === "object" && value !== null) {
                    processObject(value, key); // Recursively process nested objects
                } else {
                    addDetail(key, value);
                }
            }
        }
    }

    processObject(hero);
}
