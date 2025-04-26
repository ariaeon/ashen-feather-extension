document.getElementById("executeButton").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: processPage,
  });
});

function processPage() {
  // Check if all required parameters are present
  const requiredParams = {
    type: "damage-done",
    view: "events",
    ability: "257542",
  };

  const currentUrl = new URL(window.location.href);
  const params = currentUrl.searchParams;

  // Check if any parameters are missing or incorrect
  let correctPage = true;
  let missingParams = [];

  for (const [key, value] of Object.entries(requiredParams)) {
    if (!params.has(key) || params.get(key) !== value) {
      correctPage = false;
      missingParams.push(`${key}=${value}`);
    }
  }

  if (!correctPage) {
    alert(
      `You're not on the correct page. Please ensure these parameters are set:\n${missingParams.join(
        "\n"
      )}`
    );
    return;
  }

  // Only run calculation if we're on the correct page
  // Calculate results directly
  console.log("Calculating results...");
  const timestamps = [];
  document
    .querySelector(".summary-table > tbody")
    ?.querySelectorAll("tr")
    .forEach((row) => {
      const firstColumn = row.querySelector("td:nth-child(1)");
      if (firstColumn?.textContent) {
        timestamps.push(firstColumn.textContent?.trim().slice(0, -1));
      }
    });

  if (timestamps.length === 0) {
    alert("No timestamps found.");
    return;
  }

  const totalCasts = [...new Set(timestamps)].length;
  const singleHitsOnly = timestamps.filter((item, index) => {
    return (
      timestamps.indexOf(item) === index &&
      timestamps.lastIndexOf(item) === index
    );
  });

  const uptime = ((singleHitsOnly.length / totalCasts) * 100).toFixed(2);

  console.log(`Total casts: ${totalCasts}`);
  console.log(`Total single casts: ${singleHitsOnly.length}`);
  console.log(`Ashen feather has ${uptime}% uptime`);

  alert(`
    Total casts: ${totalCasts}
    Total single hit casts: ${singleHitsOnly.length}
    Ashen feather has ${uptime}% uptime
  `);
}
