function retrieveHighlightColorAndSendMessage(action) {
  chrome.storage.sync.get("highlightColor", (data) => {
    const color = data.highlightColor || "'#f67803";
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: action, color: color });
    });
  });
}

chrome.commands.onCommand.addListener((command) => {
  if (command === "highlight") {
    retrieveHighlightColorAndSendMessage("highlight");
  } else if (command === "addNote") {
    retrieveHighlightColorAndSendMessage("addNote");
  }
});
