// background.js

// Log when the background script is loaded
console.log('Background script loaded');

// Listener for the keyboard command (Alt+M)
chrome.commands.onCommand.addListener((command) => {
  console.log('Command received:', command);
  if (command === '_execute_action') {
    // Get the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        const tabId = tabs[0].id;

        // Send a message to the content script to start the selection
        chrome.tabs.sendMessage(tabId, { action: 'start-selection' }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Error sending message to content script:', chrome.runtime.lastError.message);
          } else {
            console.log('Content script responded:', response);
          }
        });
      } else {
        console.error('No active tab found.');
      }
    });
  }
});

// Listener for messages from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'capture') {
    // Capture the visible part of the active tab
    chrome.tabs.captureVisibleTab(
      null,
      { format: 'png', quality: 100 }, // Specify format and quality
      (dataUrl) => {
        if (chrome.runtime.lastError) {
          console.error('Error capturing visible tab:', chrome.runtime.lastError.message);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
          return;
        }
        sendResponse({ success: true, dataUrl: dataUrl });
      }
    );

    // Return true to indicate that the response will be sent asynchronously
    return true;
  } else if (message.action === 'performOCR') {
    const imageData = message.imageData;
    const selectionData = message.selection;

    // Create a FormData object
    const formData = new FormData();
    // Convert Base64 string back to Blob
    const blob = dataURLtoBlob(imageData);
    formData.append('image', blob, 'screenshot.png');
    formData.append('selection', JSON.stringify(selectionData));

    // Perform the fetch request to the /ocr endpoint
    fetch('http://127.0.0.1:5001/ocr', {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        sendResponse({ success: true, data: data });
      })
      .catch((error) => {
        console.error('Error during OCR request:', error);
        sendResponse({ success: false, error: error.toString() });
      });

    // Return true to indicate asynchronous response
    return true;
  } else if (message.action === 'getAnswer') {
    // Perform the fetch request to the /answer endpoint
    fetch('http://127.0.0.1:5001/answer', {
      method: 'POST',
      body: JSON.stringify({ question: message.question }),
      headers: { 'Content-Type': 'application/json' },
    })
      .then((response) => response.json())
      .then((data) => {
        sendResponse({ success: true, data: data });
      })
      .catch((error) => {
        console.error('Error during answer request:', error);
        sendResponse({ success: false, error: error.toString() });
      });

    // Return true to indicate asynchronous response
    return true;
  }
});

// Helper function to convert Base64 data URL to Blob
function dataURLtoBlob(dataurl) {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : '';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}
