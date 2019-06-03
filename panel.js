console.log("panel started!" + new Date());
const requestTable = document.querySelector("#request-table");
const totalSpan = document.querySelector("#total-requests");
const clearButton = document.querySelector("#clear");
const pauseButton = document.querySelector("#pause");
const urlFileNameRegEx = /(?<=\/)([^\/\?#]+)\.([^\/\?#]+)(?=[^\/]*$)/;
const PAUSED = "paused";

let requests = [];

clearButton.onclick = clearRequests;
pauseButton.onclick = toggleListenOnRequests;
chrome.devtools.network.onRequestFinished.addListener(addRequest);
chrome.devtools.network.onNavigated.addListener(clearRequests);

function addRequest(request) {
    requests.push(request);
    render();
}
function clearRequests() {
    requests = [];
    render();
}
function toggleListenOnRequests() {
    if (pauseButton.hasAttribute(PAUSED)) {
        chrome.devtools.network.onRequestFinished.addListener(addRequest);
        pauseButton.removeAttribute(PAUSED);
        pauseButton.textContent = "❙❙";
    } else {
        chrome.devtools.network.onRequestFinished.removeListener(addRequest);
        pauseButton.setAttribute(PAUSED, "");
        pauseButton.textContent = "▶";
    }
}

function getRequestTableRows() {
    const requestCounter = requests.reduce((counter, current) => {
        const newCounter = {
            ...counter
        };
        const url = `${current.request.method}:${current.request.url}`;
        newCounter.urlCounter = {
            ...counter.urlCounter,
            [url]: counter.urlCounter[url] ? counter.urlCounter[url] + 1 : 1,
        }

        const fileMatch = current.request.url.match(urlFileNameRegEx);
        if (fileMatch) {
            const file = fileMatch && fileMatch[0];
            const uniqueOriginFileMap = file && counter.uniqueOriginFileMap[file];
            const uniqueOriginFileList = uniqueOriginFileMap && counter.uniqueOriginFileMap[file] || [];
            newCounter.uniqueOriginFileMap = {
                ...counter.uniqueOriginFileMap,
                [file]: uniqueOriginFileList.indexOf(url) === -1 ? 
                    uniqueOriginFileList.concat(url) :
                    uniqueOriginFileList
            }
        }

        return newCounter;
    }, { urlCounter: {}, uniqueOriginFileMap: {} });

    const uniqueOriginFileMap = requestCounter.uniqueOriginFileMap;
    const uniqueOriginFileData = Object.keys(uniqueOriginFileMap)
        .sort((file1, file2) => uniqueOriginFileMap[file2].length - uniqueOriginFileMap[file1].length)
        .map(file => `
                <td class="tooltip">
                    ${uniqueOriginFileMap[file].length}
                    <div class="tooltiptext">
                        ${uniqueOriginFileMap[file].join("<br>")}
                    </div>
                </td>
                <td class="request-url-col">${file}</td>`);
    const urlCounter = requestCounter.urlCounter;
    const requestTableRows = Object.keys(urlCounter)
        .sort((url1, url2) => urlCounter[url2] - urlCounter[url1])
        .map((url, i) => `
            <tr style="vertical-align: top;">
                <td>${urlCounter[url]}</td>
                <td class="request-url-col">${url}</td>
                ${uniqueOriginFileData[i] ? 
                    uniqueOriginFileData[i] :
                    ""
                }
            </tr>`)
        .join("");
    return requestTableRows;
}

function render() {
    const requestTableRows = getRequestTableRows();
    totalSpan.textContent = requests.length;
    requestTable.innerHTML = `
        <tr>
            <th>Count</th>
            <th class="request-url-col">Request url</th>
            <th>Count</th>
            <th class="request-url-col">Unique Origin file</th>
        </tr>
        ${requestTableRows}
    `;
}
