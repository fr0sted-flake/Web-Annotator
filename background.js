// chrome.runtime.onInstalled.addListener(() => {
//   chrome.storage.sync.set({ annotations: [] });
// });

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === 'saveAnnotation') {
//     chrome.storage.sync.get('annotations', (data) => {
//       let annotations = data.annotations || [];
//       annotations.push(request.annotation);
//       chrome.storage.sync.set({ annotations });
//     });
//   }
// });
