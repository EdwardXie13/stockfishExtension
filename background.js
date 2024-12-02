var stockfish = new Worker(chrome.extension.getURL('stockfish.js'));

// Event listener for Chrome Browser Action click
chrome.browserAction.onClicked.addListener(function (tab) {
  chrome.tabs.executeScript(
    tab.id,
    {
      code: `
        (function() {
          clickElementsByXPathsWithDelay([
            '//*[@id="board-layout-sidebar"]/div[2]/div[4]/button[1]',
            '//*[@id="share-modal"]/div/div[2]/div/header/div[2]/div[1]'
          ], 300);
        })();
      `
    },
    function () {
      if (chrome.runtime.lastError) {
        console.error('Script injection failed: ' + chrome.runtime.lastError.message);
      }
    }
  );
});

// Define a function to click elements by XPath with delay
function clickElementsByXPathsWithDelay(xpaths, delay) {
  function clickElement(xpath) {
    const element = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;

    if (element) {
      element.click();
      console.log('Element clicked for XPath:', xpath);
      return true;
    } else {
      console.log('Element not found for XPath:', xpath);
      return false;
    }
  }

  async function clickWithDelay() {
    for (let i = 0; i < xpaths.length; i++) {
      const clicked = clickElement(xpaths[i]);
      if (!clicked) {
        console.log('Stopping sequence, element not found:', xpaths[i]);
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    // After the clicks, grab the value of the share-fen element
    await getFenValue();
  }

  clickWithDelay();
}
  
// Function to get the FEN value from the XPath
async function getFenValue() {
  const xpathFen = "//*[@id='share-fen']";
  const elementFen = document.evaluate(xpathFen, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

  if (elementFen) {
    const value = elementFen.value || elementFen.textContent;
    console.log('FEN value:', value);
    
    // Call engine with the FEN value
    useStockfish(value);
  } else {
    console.log('FEN element not found');
  }
}

// Function to communicate with Stockfish engine
function useStockfish(fenValue) {
  // Assuming stockfish is initialized elsewhere in your code
  console.log(fenValue);
  stockfish.postMessage(`position fen ${fenValue}`);
  stockfish.postMessage("go depth 1");
}

  

stockfish.onmessage = function(event) {
    //NOTE: Web Workers wrap the response in an object.
    console.log(event.data ? event.data : event);
};