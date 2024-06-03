// Utility function to get a unique selector for an element
function getUniqueSelector(element) {
  if (element.id) {
    return `#${element.id}`;
  }
  if (element.className) {
    return `.${element.className.trim().split(/\s+/).join('.')}`;
  }
  return element.tagName.toLowerCase();
}

// Highlight selected text in yellow and save the highlight
function highlightSelection() {
  const selection = window.getSelection();
  if (!selection.isCollapsed) {
    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.style.backgroundColor = 'yellow';
    range.surroundContents(span);
    saveHighlight(span);
  }
}

// Save the highlighted text to chrome.storage
function saveHighlight(span) {
  const uniqueSelector = getUniqueSelector(span.parentElement);
  const highlightData = {
    selector: uniqueSelector,
    text: span.textContent,
    color: span.style.backgroundColor,
  };
  chrome.storage.local.get({ highlights: [] }, function (result) {
    const highlights = result.highlights;
    highlights.push(highlightData);
    chrome.storage.local.set({ highlights: highlights });
  });
}

// Restore highlights from chrome.storage
function restoreHighlights() {
  chrome.storage.local.get('highlights', function (result) {
    const highlights = result.highlights || [];
    highlights.forEach(function (highlight) {
      const elements = document.querySelectorAll(highlight.selector);
      elements.forEach(function (element) {
        const innerHTML = element.innerHTML;
        const highlightedText = `<span style="background-color:${highlight.color}">${highlight.text}</span>`;
        element.innerHTML = innerHTML.replace(highlight.text, highlightedText);
      });
    });
  });
}

document.addEventListener('mouseup', highlightSelection);
document.addEventListener('DOMContentLoaded', restoreHighlights);
restoreHighlights();
