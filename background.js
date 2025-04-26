// Keep track of tabs that need calculation after redirect
const tabsPendingCalculation = new Set();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "processPage") {
    const tabId = message.tabId;
    chrome.scripting.executeScript(
      {
        target: { tabId },
        func: checkPageAndRedirectIfNeeded,
      },
      (results) => {
        const result = results[0].result;
        if (result.needsRedirect) {
          tabsPendingCalculation.add(tabId);
          chrome.tabs.update(tabId, { url: result.redirectUrl });
        } else {
          runCalculation(tabId);
        }
      }
    );
  }
});

chrome.webNavigation.onCompleted.addListener((details) => {
  if (tabsPendingCalculation.has(details.tabId) && details.frameId === 0) {
    tabsPendingCalculation.delete(details.tabId);
    setTimeout(() => {
      runCalculation(details.tabId);
    }, 500);
  }
});

function runCalculation(tabId) {
  chrome.scripting.executeScript({
    target: { tabId },
    func: calculateResults,
  });
}

// Function to check if page has correct parameters
function checkPageAndRedirectIfNeeded() {
  const requiredParams = {
    type: "damage-done",
    view: "events",
    ability: "257542",
  };

  const currentUrl = new URL(window.location.href);
  const params = currentUrl.searchParams;

  let needsRedirect = false;
  for (const [key, value] of Object.entries(requiredParams)) {
    if (!params.has(key) || params.get(key) !== value) {
      newUrl.searchParams.set(key, value);
      needsRedirect = true;
    }
  }

  // Return the result
  return needsRedirect
    ? { needsRedirect: true, redirectUrl: newUrl.toString() }
    : { needsRedirect: false };
}

// Function to calculate results
function calculateResults() {
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
