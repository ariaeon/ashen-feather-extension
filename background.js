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
          const listener = (changedTabId, changeInfo) => {
            if (changedTabId === tabId && changeInfo.status === "complete") {
              // This specific tab has finished loading - remove listener immediately
              chrome.tabs.onUpdated.removeListener(listener);

              // Give a small delay for page to render fully
              setTimeout(() => {
                runCalculation(tabId);
              }, 500);
            }
          };

          // Add the specific listener before navigation
          chrome.tabs.onUpdated.addListener(listener);
          chrome.tabs.update(tabId, { url: result.redirectUrl });
        } else {
          runCalculation(tabId);
        }
      }
    );
  }
});

function runCalculation(tabId) {
  chrome.scripting.executeScript({
    target: { tabId },
    func: calculateResults,
  });
}

function checkPageAndRedirectIfNeeded() {
  const requiredParams = {
    type: "damage-done",
    view: "events",
    ability: "257542",
  };

  const currentUrl = new URL(window.location.href);
  const params = currentUrl.searchParams;

  // Create a new URL object - this line is missing in your code
  const newUrl = new URL(currentUrl.origin + currentUrl.pathname);

  // Copy all existing parameters first
  for (const [key, value] of params.entries()) {
    newUrl.searchParams.set(key, value);
  }

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
