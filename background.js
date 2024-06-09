chrome.commands.onCommand.addListener((command) => {

    // Highlight the selected text when the appropriate command is received
    if (command === "highlight-text") {
      chrome.storage.sync.get('highlightColor', (data) => {
        const highlightColor = data.highlightColor || '#03daf6';
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'highlight', color: highlightColor });
        });
      });
    }
  
    // Add a note to the selected text when the appropriate command is received
    else if (command === "add-note") {
      chrome.storage.sync.get('highlightColor', (data) => {
        const highlightColor = data.highlightColor || '#03daf6';
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'addNote', color: highlightColor });
        });
      });
    }
  });
  