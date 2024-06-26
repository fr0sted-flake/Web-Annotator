// This event listener ensures the functions are called once the DOM is fully loaded.

document.addEventListener("DOMContentLoaded", () => {
  try {
    loadHighlightColor(); // Load the saved highlight color from storage.
    addHighlightColorChangeListener(); // Save the new highlight color to storage when changed.
    addButtonEventListeners(); // Add event listeners for highlighting and adding notes.
    showStoredAnnotations(); // Display stored annotations.
    attachSearchButtonEventListener(); // Add event listener for the search button.
  } catch (error) {
    console.error("Error initializing the extension:", error);
  }
});

// Loads the saved highlight color from chrome.storage.sync and sets the color input field's value.
function loadHighlightColor() {
  chrome.storage.sync.get("highlightColor", (data) => {
    if (chrome.runtime.lastError) {
      console.error(
        "Error retrieving highlight color:",
        chrome.runtime.lastError
      );
      return;
    }
    const color = data.highlightColor || "#f67803"; // Default color
    const colorInput = document.getElementById("colorInput");
    if (colorInput) {
      colorInput.value = color;
      console.log("Highlight color loaded:", color);
    } else {
      console.error("Color input element not found.");
    }
  });
}

// Adds an event listener to the color input field to save the selected color to chrome.storage.sync whenever it changes.
function addHighlightColorChangeListener() {
  const colorInput = document.getElementById("colorInput");
  if (colorInput) {
    colorInput.addEventListener("change", (event) => {
      chrome.storage.sync.set({ highlightColor: event.target.value }, () => {
        if (chrome.runtime.lastError) {
          console.error(
            "Error saving highlight color:",
            chrome.runtime.lastError
          );
        } else {
          console.log("Highlight color saved:", event.target.value);
        }
      });
    });
  } else {
    console.error("Color input element not found.");
  }
}

// Adds click event listeners to buttons for highlighting and adding notes. When clicked, they send a message to the current tab.
function addButtonEventListeners() {
  const highlightButton = document.getElementById("btnHighlight");
  const addNoteButton = document.getElementById("btnAddNote");

  if (highlightButton) {
    highlightButton.addEventListener("click", () => {
      sendMessageToCurrentTab("highlight");
    });
  } else {
    console.error("Highlight button element not found.");
  }

  if (addNoteButton) {
    addNoteButton.addEventListener("click", () => {
      sendMessageToCurrentTab("addNote");
    });
  } else {
    console.error("Add Note button element not found.");
  }
}

// Sends a message to the active tab in the current window with the action (highlight or add note) and the selected highlight color.
function sendMessageToCurrentTab(action) {
  chrome.storage.sync.get("highlightColor", (data) => {
    if (chrome.runtime.lastError) {
      console.error(
        "Error retrieving highlight color:",
        chrome.runtime.lastError
      );
      return;
    }

    const color = data.highlightColor || "#f67803"; // Default color

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        console.error("Error querying active tab:", chrome.runtime.lastError);
        return;
      }

      if (tabs.length === 0) {
        console.error("No active tab found.");
        return;
      }

      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: action, color: color },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error(
              "Error sending message to tab:",
              chrome.runtime.lastError
            );
          } else {
            console.log("Message sent to tab:", response);
          }
        }
      );
    });
  });
}

// // Groups annotations by date and sorts them by time within each date.
// function rearrangeAnnotations(annotations) {
//   const rearranged = {};

//   // Rearranging annotations
//   annotations.forEach((item) => {
//     const formattedDate = new Date(item.time).toLocaleDateString();
//     if (!rearranged[formattedDate]) {
//       rearranged[formattedDate] = [];
//     }
//     rearranged[formattedDate].push(item);
//   });

//   // Sorting annotations by date
//   for (const date in rearranged) {
//     rearranged[date].sort((a, b) => b.time - a.time);
//   }

//   return rearranged;
// }

// Groups annotations by date and sorts them by time within each date.
function rearrangeAnnotations(annotations) {
  if (!Array.isArray(annotations)) {
    console.error("Invalid input: annotations must be an array.");
    return {};
  }

  const rearranged = {};

  // Rearranging annotations
  annotations.forEach((item) => {
    if (!item.time) {
      console.warn("Skipping annotation with missing time:", item);
      return;
    }

    const date = new Date(item.time);
    if (isNaN(date)) {
      console.warn("Skipping annotation with invalid time:", item);
      return;
    }

    const formattedDate = date.toLocaleDateString();
    if (!rearranged[formattedDate]) {
      rearranged[formattedDate] = [];
    }
    rearranged[formattedDate].push(item);
  });

  // Sorting annotations by date
  for (const date in rearranged) {
    rearranged[date].sort((a, b) => new Date(b.time) - new Date(a.time));
  }

  return rearranged;
}

// Retrieves stored annotations from chrome.storage.sync, rearranges them, and displays them.
function showStoredAnnotations() {
  chrome.storage.sync.get({ annotations: [] }, (data) => {
    if (chrome.runtime.lastError) {
      console.error("Error retrieving annotations:", chrome.runtime.lastError);
      return;
    }

    if (!Array.isArray(data.annotations)) {
      console.error("Invalid data format: annotations should be an array");
      return;
    }

    const annotations = data.annotations;
    const groupedAnnotations = rearrangeAnnotations(annotations);
    showAnnotations(groupedAnnotations);
  });
}

// Displays grouped annotations by date, including the most recent three items and an option to see more. Adds delete buttons for each annotation.
function showAnnotations(groupedItems) {
  const list = document.getElementById("listAnnotations");
  list.innerHTML = "";

  const sortedDates = Object.keys(groupedItems).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  sortedDates.forEach((date) => {
    const header = document.createElement("li");
    header.textContent = date;
    header.style.fontWeight = "normal";
    header.style.color = "#6574cd";
    list.appendChild(header);

    const items = groupedItems[date];
    const reversedItems = items.slice().reverse();

    if (reversedItems.length > 3) {
      const recentItems = reversedItems.slice(-3).reverse();
      recentItems.forEach((item) => {
        const listItem = document.createElement("li");
        listItem.style.color = item.color;
        if (item.type == "note") {
          listItem.textContent = `${item.selection} : ${item.content} (${
            new URL(item.link).hostname
          })`;
        } else {
          listItem.textContent = `${item.content} (${
            new URL(item.link).hostname
          })`;
        }
        const deleteButton = document.createElement("img");
        deleteButton.src = "assets/delete-icon.png";
        deleteButton.alt = "Delete";
        deleteButton.style.width = "8px";
        deleteButton.style.height = "8px";
        deleteButton.style.cursor = "pointer";
        deleteButton.style.marginLeft = "5px";
        deleteButton.addEventListener("click", () => {
          removeAnnotation(item);
        });
        listItem.appendChild(deleteButton);
        list.appendChild(listItem);
      });
      const moreListItem = document.createElement("li");
      moreListItem.textContent = "Show more";
      moreListItem.style.cursor = 'pointer';
      moreListItem.classList.add("more-item");
      moreListItem.addEventListener("click", () => {
        showEveryAnnotations(items);
      });
      list.appendChild(moreListItem);
    } else {
      reversedItems.forEach((item) => {
        const listItem = document.createElement("li");
        listItem.style.color = item.color;
        if (item.type == "note") {
          listItem.textContent = `${item.selection}: ${item.content} (${
            new URL(item.link).hostname
          })`;
        } else {
          listItem.textContent = `${item.content} (${
            new URL(item.link).hostname
          })`;
        }
        const deleteButton = document.createElement("img");
        deleteButton.src = "../delete-icon.png";
        deleteButton.alt = "Delete";
        deleteButton.style.width = "8px";
        deleteButton.style.height = "8px";
        deleteButton.style.cursor = "pointer";
        deleteButton.style.marginLeft = "5px";
        deleteButton.addEventListener("click", () => {
          removeAnnotation(item);
        });
        listItem.appendChild(deleteButton);
        list.appendChild(listItem);
      });
    }
  });
}

// Displays all annotations for a selected date, including delete buttons.
function showEveryAnnotations(annotations) {
  const list = document.getElementById("listAnnotations");
  list.innerHTML = "";

  const formattedDate = new Date(annotations[0].time).toLocaleDateString();
  const dateHeader = document.createElement("li");
  dateHeader.textContent = formattedDate;
  dateHeader.style.fontWeight = "bold";
  dateHeader.style.color = "#789abc";
  list.appendChild(dateHeader);

  annotations.forEach((item) => {
    const listItem = document.createElement("li");
    listItem.style.color = item.color;
    if (item.type === "note") {
      listItem.textContent = `${item.selection}: ${item.content} (${
        new URL(item.link).hostname
      })`;
    } else {
      listItem.textContent = `${item.content} (${new URL(item.link).hostname})`;
    }
    const deleteButton = document.createElement("img");
    deleteButton.src = "../delete-icon.png";
    deleteButton.alt = "Delete";
    deleteButton.style.width = "8px";
    deleteButton.style.height = "8px";
    deleteButton.style.cursor = "pointer";
    deleteButton.style.marginLeft = "5px";
    deleteButton.addEventListener("click", () => {
      removeAnnotation(item);
    });
    listItem.appendChild(deleteButton);
    list.appendChild(listItem);
  });
}

// Adds an event listener to the search button, filters annotations based on the search term, and displays the filtered results.
function attachSearchButtonEventListener() {
  document.getElementById("btnSearch").addEventListener("click", () => {
    const term = document.getElementById("inputSearch").value.toLowerCase();
    chrome.storage.sync.get({ annotations: [] }, (data) => {
      const annotations = data.annotations;
      const filteredAnnotations = annotations.filter((item) => {
        const itemText =
          item.type === "note"
            ? `${item.selection}: ${item.content}`
            : item.content;
        return itemText.toLowerCase().includes(term);
      });
      showFilteredAnnotations(filteredAnnotations);
    });
  });
}

// Groups filtered annotations by date and displays them.
function showFilteredAnnotations(filteredAnnotations) {
  const list = document.getElementById("listAnnotations");
  list.innerHTML = "";

  const groupedItems = groupItemsByDate(filteredAnnotations);
  const sortedDates = Object.keys(groupedItems).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  sortedDates.forEach((date) => {
    const dateHeader = document.createElement("li");
    dateHeader.textContent = date;
    dateHeader.style.fontWeight = "bold";
    dateHeader.style.color = "#6574cd";
    list.appendChild(dateHeader);

    const dateItems = groupedItems[date];

    dateItems.forEach((item) => {
      const listItem = document.createElement("li");
      listItem.style.color = item.color;
      if (item.type === "note") {
        listItem.textContent = `${item.selection}: ${item.content} (${
          new URL(item.link).hostname
        })`;
      } else {
        listItem.textContent = `${item.content} (${
          new URL(item.link).hostname
        })`;
      }
      const deleteButton = document.createElement("img");
      deleteButton.src = "../delete-icon.png";
      deleteButton.alt = "Delete";
      deleteButton.style.width = "8px";
      deleteButton.style.height = "8px";
      deleteButton.style.cursor = "pointer";
      deleteButton.style.marginLeft = "5px";
      deleteButton.addEventListener("click", () => {
        removeItem(item);
      });
      listItem.appendChild(deleteButton);
      list.appendChild(listItem);
    });
  });
}

// Removes an annotation from storage and updates the displayed list.
function removeAnnotation(toBeDeleted) {
  chrome.storage.sync.get({ annotations: [] }, (data) => {
    const annotations = data.annotations;
    const updatedAnnotations = annotations.filter(
      (annotation) => annotation.time !== toBeDeleted.time
    );
    chrome.storage.sync.set({ annotations: updatedAnnotations }, () => {
      const groupedItems = groupItemsByDate(updatedAnnotations);
      showAnnotations(groupedItems);
    });
  });
}



function exportUserAnnotations() {
  if (typeof window.jspdf === "undefined") {
    console.error("jsPDF is not loaded.");
    return;
  }

  const { jsPDF } = window.jspdf;

  chrome.storage.sync.get({ annotations: [] }, (data) => {
    const annotations = data.annotations;

    const highlights = annotations.filter((item) => item.type === "highlight");
    const notes = annotations.filter((item) => item.type === "note");

    const doc = new jsPDF();

    let yOffset = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;

    function addBoldText(text, x, y) {
      doc.setFont("helvetica", "bold");
      doc.text(text, x, y);
      doc.setFont("helvetica", "normal");
    }

    if (highlights.length > 0) {
      doc.setFontSize(16);
      addBoldText("Highlights:", 10, yOffset);
      yOffset += 10;

      highlights.forEach((highlight) => {
        doc.setFontSize(10);
        doc.setTextColor(highlight.color);

        let lines = doc.splitTextToSize(
          `Highlight: ${highlight.content}`,
          pageWidth - margin * 2
        );
        doc.text(lines, 10, yOffset);
        yOffset += lines.length * 10;

        doc.setTextColor(0, 0, 0);

        lines = doc.splitTextToSize(
          `URL: ${highlight.link}`,
          pageWidth - margin * 2
        );
        doc.text(lines, 10, yOffset);
        yOffset += lines.length * 7;

        const date = new Date(highlight.time).toLocaleString();
        lines = doc.splitTextToSize(`Date: ${date}`, pageWidth - margin * 2);
        doc.text(lines, 10, yOffset);
        yOffset += lines.length * 20;
      });
    }

    if (notes.length > 0) {
      yOffset += 10;
      doc.setFontSize(16);
      addBoldText("Notes:", 10, yOffset);
      yOffset += 10;

      notes.forEach((note) => {
        doc.setFontSize(12);
        doc.setTextColor(note.color);

        let lines = doc.splitTextToSize(
          `Note: ${note.content}`,
          pageWidth - margin * 2
        );
        doc.text(lines, 10, yOffset);
        yOffset += lines.length * 10;

        doc.setTextColor(0, 0, 0);

        lines = doc.splitTextToSize(
          `Text: ${note.selection}`,
          pageWidth - margin * 2
        );
        doc.text(lines, 10, yOffset);
        yOffset += lines.length * 7;

        lines = doc.splitTextToSize(
          `URL: ${note.link}`,
          pageWidth - margin * 2
        );
        doc.text(lines, 10, yOffset);
        yOffset += lines.length * 7;

        const date = new Date(note.time).toLocaleString();
        lines = doc.splitTextToSize(`Date: ${date}`, pageWidth - margin * 2);
        doc.text(lines, 10, yOffset);
        yOffset += lines.length * 20;
      });
    }

    doc.save("user_annotations.pdf");
  });
}

// function exportUserAnnotations() {

//   if (typeof window.jspdf === 'undefined') {
//       console.error('jsPDF is not loaded.');
//       return;
//   }

//   const { jsPDF } = window.jspdf;

//   chrome.storage.sync.get({ annotations: [] }, (data) => {
//       const annotations = data.annotations;

//       const highlights = annotations.filter(annotation => annotation.type === 'highlight');
//       const notes = annotations.filter(annotation => annotation.type === 'note');

//       const doc = new jsPDF();
//       let yOffset = 20; 
//       const pageWidth = doc.internal.pageSize.getWidth();
//       const margin = 10;

//       function addSectionHeader(text, y) {
//           doc.setFontSize(18);
//           doc.setFont('helvetica', 'bold');
//           doc.text(text, margin, y);
//           doc.setFont('helvetica', 'normal');
//           doc.setFontSize(12);
//       }

//       function addAnnotationDetails(annotation, y) {
//           doc.setTextColor(annotation.color);

//           let lines = doc.splitTextToSize(annotation.type === 'highlight' ? `Highlight: ${annotation.text}` : `Note: ${annotation.text}`, pageWidth - margin * 2);
//           doc.text(lines, margin, y);
//           y += lines.length * 6;

//           doc.setTextColor(0, 0, 0);
//           lines = doc.splitTextToSize(`Source Text: ${annotation.select}`, pageWidth - margin * 2);
//           doc.text(lines, margin, y);
//           y += lines.length * 6;

//           lines = doc.splitTextToSize(`URL: ${annotation.url}`, pageWidth - margin * 2);
//           doc.text(lines, margin, y);
//           y += lines.length * 6;

//           const date = new Date(annotation.timestamp).toLocaleString();
//           lines = doc.splitTextToSize(`Date: ${date}`, pageWidth - margin * 2);
//           doc.text(lines, margin, y);
//           y += lines.length * 10;

//           return y;
//       }

//       // Title Page
//       doc.setFontSize(22);
//       doc.text('Annotations Report', pageWidth / 2, 15, { align: 'center' });
//       doc.setFontSize(14);
//       doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 25, { align: 'center' });

//       // Highlights Section
//       if (highlights.length > 0) {
//           yOffset = 40; 
//           addSectionHeader('Highlights', yOffset);
//           yOffset += 10;

//           highlights.forEach(highlight => {
//               yOffset = addAnnotationDetails(highlight, yOffset);
//               yOffset += 10; // Add extra space between entries
//           });
//       }

//       // Notes Section
//       if (notes.length > 0) {
//           yOffset += 20; 
//           addSectionHeader('Notes', yOffset);
//           yOffset += 10;

//           notes.forEach(note => {
//               yOffset = addAnnotationDetails(note, yOffset);
//               yOffset += 10; // Add extra space between entries
//           });
//       }

//       doc.save('user_annotations.pdf');
//   });
// }

// function exportAnnotations() {
//     chrome.storage.sync.get({ annotations: [] }, (data) => {
//         const annotations = data.annotations;

//         const highlights = annotations.filter(annotation => annotation.type === 'highlight');
//         const notes = annotations.filter(annotation => annotation.type === 'note');

//         let exportText = '';

//         if (highlights.length > 0) {
//             exportText += 'Highlights:\n';
//             highlights.forEach(highlight => {
//                 exportText += `- Text: ${highlight.text}\n  Color: ${highlight.color}\n  URL: ${highlight.url}\n\n`;
//             });
//         }

//
//
// }

document.getElementById("btnExport").addEventListener("click", () => {
  exportUserAnnotations();
});
