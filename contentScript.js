chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    // Check if the request is valid
    if (!request || !request.action || !request.color) {
      throw new Error("Invalid message format");
    }

    console.log("Received message:", request);

    // Check the action type and execute corresponding function
    switch (request.action) {
      case "highlight":
        applyHighlight(request.color);
        break;
      case "addNote":
        createNoteWithHighlight(request.color);
        break;
      default:
        throw new Error("Unknown action: " + request.action);
    }
  } catch (error) {
    console.error("Error while receiving the message:", error);
  }
});

function applyHighlight(color) {
  try {
    const userSelection = window.getSelection();

    // Check if user selection exists
    if (!userSelection || !userSelection.rangeCount) {
      alert("No text selected");
      throw new Error("No text selected");
    }

    const selectedRange = userSelection.getRangeAt(0);
    const selectedText = selectedRange.toString();

    // Check if selected text exists
    if (!selectedText.trim()) {
      alert("Empty selection");
      throw new Error("Empty selection");
    }

    const highlightSpan = document.createElement("span");
    highlightSpan.style.backgroundColor = color;

    const extractedContent = selectedRange.extractContents();
    extractedContent.childNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE && node.style.backgroundColor) {
        node.style.backgroundColor = "";
      }
    });

    highlightSpan.appendChild(extractedContent);
    selectedRange.insertNode(highlightSpan);
    // userSelection.removeAllRanges();

    const uniqueSelector = generateUniqueSelector(highlightSpan.parentElement);

    const newAnnotation = {
      id: generateUniqueId(),
      text: selectedText,
      url: window.location.href,
      color: color,
      type: "highlight",
      select: selectedText,
      timestamp: Date.now(),
      selector: uniqueSelector,
    };

    // Save annotation to storage
    chrome.storage.sync.get({ annotations: [] }, (data) => {
      const annotationsList = data.annotations;
      annotationsList.push(newAnnotation);
      chrome.storage.sync.set({ annotations: annotationsList }, () => {
        console.log("Highlight annotation saved:", newAnnotation);
      });
    });
  } catch (error) {
    console.error("Error applying highlight:", error);
    alert("Error applying highlight: " + error.message);
  }
}

// Utility function to generate a unique ID
function generateUniqueId() {
  return "_" + Math.random().toString(36).substr(2, 9);
}

function createNoteWithHighlight(color) {
  const userSelection = window.getSelection();
  if (!userSelection.rangeCount) {
    alert("Please select some text to add note there.");
    return;
  }
  if (userSelection.rangeCount > 0) {
    const selectedRange = userSelection.getRangeAt(0);
    const selectedText = selectedRange.toString();

    applyHighlight(color); // Highlight the selected text

    const noteElement = document.createElement("div");
    noteElement.contentEditable = true;
    noteElement.style.border = "0.5px solid #ffe97a";
    noteElement.style.backgroundColor = color;
    noteElement.style.display = "inline-block";
    noteElement.style.marginLeft = "4px";
    noteElement.style.padding = "3px";
    noteElement.style.fontSize = "0.75em";
    noteElement.style.borderRadius = "8px";
    noteElement.textContent = "Add a note here";
    selectedRange.collapse(false);
    selectedRange.insertNode(noteElement);

    const uniqueSelector = generateUniqueSelector(noteElement.parentElement);

    const newNote = {
      id: generateUniqueId(),
      text: noteElement.textContent,
      url: window.location.href,
      color: color,
      type: "note",
      select: selectedText,
      timestamp: Date.now(),
      selector: uniqueSelector,
    };

    chrome.storage.sync.get({ annotations: [] }, (data) => {
      const annotationsList = data.annotations;
      annotationsList.push(newNote);
      chrome.storage.sync.set({ annotations: annotationsList });
    });

    noteElement.addEventListener("input", () => {
      newNote.text = noteElement.textContent;
      chrome.storage.sync.get({ annotations: [] }, (data) => {
        const annotationsList = data.annotations;
        const index = annotationsList.findIndex((a) => a.id === newNote.id);
        if (index > -1) {
          annotationsList[index] = newNote;
          chrome.storage.sync.set({ annotations: annotationsList });
        }
      });
    });
    // Set focus on the note element
    noteElement.focus();
  }
}

function generateUniqueSelector(element) {
  if (element.id) {
    return `#${element.id}`;
  }
  if (element.className) {
    return `.${element.className.trim().split(/\s+/).join(".")}`;
    // For example, if element.className is "class1 class2 class3", after trimming whitespace and splitting, the result will be ["class1", "class2", "class3"]. This array can then be further processed or manipulated as needed. In this specific context, the individual class names are later joined with periods (.) to form a valid CSS class selector string.
  }
  return element.tagName.toLowerCase();
}

function reloadAnnotations() {
    console.log("reload called");
    chrome.storage.sync.get('annotations',(result) => {
        const annotationsList = result.annotations || [];
        annotationsList.forEach((annotation)=> {
            const elements = document.querySelectorAll(annotation.selector);
            elements.forEach(function (element) {
                const innerHTML = element.innerHTML;
                if (annotation.type === 'highlight') {
                    const highlightedText = `<span style="background-color:${annotation.color}">${annotation.text}</span>`;
                    element.innerHTML = innerHTML.replace(annotation.text, highlightedText);
                } else if (annotation.type === 'note') {
                    const noteText = `<span style="background-color:${annotation.color}">${annotation.select}</span><div contentEditable="true" style="border: 0.5px dashed black; background-color:${annotation.color}; display: inline-block; margin-left: 5px; padding: 3px; font-size: 0.8em;">${annotation.text}</div>`;
                    element.innerHTML = innerHTML.replace(annotation.select, noteText);
                }
            });
        });
    });
    console.log("reloaded");
}


// function reloadAnnotations() {
//     console.log("reload called");
//   chrome.storage.sync.get("annotations", (result) => {
//     const annotationsList = result.annotations || [];
//     annotationsList.forEach((annotation) => {
        
//       const elements = document.querySelectorAll(annotation.selector);
//       elements.forEach((element) => {
//         const range = document.createRange();
//         const treeWalker = document.createTreeWalker(
//           element,
//           NodeFilter.SHOW_TEXT,
//           null,
//           false
//         );

//         while (treeWalker.nextNode()) {
//           const currentNode = treeWalker.currentNode;
//           const nodeText = currentNode.nodeValue;

//           if (nodeText.includes(annotation.text)) {
//             const startIndex = nodeText.indexOf(annotation.text);
//             range.setStart(currentNode, startIndex);
//             range.setEnd(currentNode, startIndex + annotation.text.length);

//             const span = document.createElement("span");
//             span.style.backgroundColor = annotation.color;

//             if (annotation.type === "highlight") {
//               span.textContent = annotation.text;
//             } else if (annotation.type === "note") {
//               const noteContainer = document.createElement("div");
//               noteContainer.contentEditable = true;
//               noteContainer.style.border = "0.5px dashed black";
//               noteContainer.style.backgroundColor = annotation.color;
//               noteContainer.style.display = "inline-block";
//               noteContainer.style.marginLeft = "5px";
//               noteContainer.style.padding = "3px";
//               noteContainer.style.fontSize = "0.8em";
//               noteContainer.textContent = annotation.text;

//               // Attach input event listener to handle changes to the note content
//               noteContainer.addEventListener("input", () => {
//                 updateNoteInStorage(annotation, noteContainer.textContent);
//               });

//               span.appendChild(noteContainer);
//             }

//             range.deleteContents();
//             range.insertNode(span);
//             range.detach(); // Detach the range to clean up
//           }
//         }
//       });
//     });
//   });
//   console.log("reloaded");
// }

// Function to update note content in storage
function updateNoteInStorage(annotation, newTextContent) {
  chrome.storage.sync.get({ annotations: [] }, (data) => {
    const annotationsList = data.annotations;

    const index = annotationsList.findIndex((a) => a.id === annotation.id);

    // Update the note content
    if (index !== -1) {
      annotationsList[index].text = newTextContent;

      chrome.storage.sync.set({ annotations: annotationsList });
    }
  });
}

// Call the function to reload annotations when the content script is loaded
document.addEventListener("DOMContentLoaded", reloadAnnotations);

// Call the function to reload annotations when the window is reloaded
window.addEventListener("load", reloadAnnotations);