// initializing
document.addEventListener("DOMContentLoaded", function () {
  checkPageStatus();
  document
    .getElementById("navigateView")
    .addEventListener("click", navigateToCorrectUrl);
  document
    .getElementById("executeButton")
    .addEventListener("click", runCalculation);
});

// Functions to execute scripts
async function navigateToCorrectUrl() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      func: navToPage,
    },
    () => {
      setTimeout(checkPageStatus, 500);
    }
  );
}

async function runCalculation() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: calculateResults,
  });
}

function checkPageStatus() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        func: isCorrectPage,
      },
      (results) => {
        const pageStatus = results[0].result;

        if (pageStatus.status === "wrong-site") {
          document.getElementById("executeButton").disabled = true;
          document.getElementById("navigateView").disabled = true;
          document.getElementById("statusMessage").textContent =
            "Not on warcraftlogs.com";
          document.getElementById("statusMessage").style.color = "red";
        } else if (pageStatus.status === "no-fight") {
          document.getElementById("executeButton").disabled = true;
          document.getElementById("navigateView").disabled = true;
          document.getElementById("statusMessage").textContent =
            "Not on a fight log.";
          document.getElementById("statusMessage").style.color = "red";
        } else if (pageStatus.status === "wrong-params") {
          document.getElementById("executeButton").disabled = true;
          document.getElementById("navigateView").disabled = false;
          document.getElementById("statusMessage").textContent =
            "Set the correct view first";
          document.getElementById("statusMessage").style.color = "orange";
        } else {
          document.getElementById("executeButton").disabled = false;
          document.getElementById("navigateView").disabled = true;
          document.getElementById("statusMessage").textContent =
            "Ready to calculate";
          document.getElementById("statusMessage").style.color = "green";
        }
      }
    );
  });
}

// Functions to run on page
function isCorrectPage() {
  const currentUrl = new URL(window.location.href);
  const params = currentUrl.searchParams;
  const host = currentUrl.hostname;

  const requiredParams = {
    type: "damage-done",
    view: "events",
    ability: "257542",
  };

  console.log("Current URL:", host);
  if (!host.includes("warcraftlogs")) {
    return { status: "wrong-site" };
  }

  if (!params.has("fight")) {
    return { status: "no-fight" };
  }

  // Check for required parameters
  for (const [key, value] of Object.entries(requiredParams)) {
    if (!params.has(key) || params.get(key) !== value) {
      return { status: "wrong-params" };
    }
  }

  return { status: "ready" };
}

function calculateResults() {
  const timestamps = [];
  document
    .querySelector(".summary-table > tbody")
    ?.querySelectorAll("tr")
    .forEach((row) => {
      const firstColumn = row.querySelector("td:nth-child(1)");
      if (firstColumn?.textContent) {
        // ignoring last character, sometimes a ms off
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

function navToPage() {
  const currentUrl = new URL(window.location.href);
  const params = currentUrl.searchParams;
  const newUrl = new URL(currentUrl.origin + currentUrl.pathname);

  const requiredParams = {
    type: "damage-done",
    view: "events",
    ability: "257542",
  };

  for (const [key, value] of params.entries()) {
    newUrl.searchParams.set(key, value);
  }

  for (const [key, value] of Object.entries(requiredParams)) {
    if (!params.has(key) || params.get(key) !== value) {
      newUrl.searchParams.set(key, value);
    }
  }
  window.location.href = newUrl.toString();
}
