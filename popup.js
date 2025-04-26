document.getElementById("executeButton").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Send message to background script to handle everything
  chrome.runtime.sendMessage({
    action: "processPage",
    tabId: tab.id,
  });
});
