chrome.commands.onCommand.addListener((command) => {
  if (command === "highlight-text") {
    retrieveHighlightColorAndSendMessage('highlight');
  } else if (command === "add-note") {
    retrieveHighlightColorAndSendMessage('addNote');
  }
});

function retrieveHighlightColorAndSendMessage(action) {
  chrome.storage.sync.get('highlightColor', (data) => {
    const color = data.highlightColor || '#03daf6';
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: action, color: color });
    });
  });
}
