console.log("main started!" + new Date());

function createPanel() {
    chrome.devtools.panels.create(
        "NetworkDuplicates",
        undefined,
        "panel.html",
        function(panel) { 
        }
    );
}
function createSidebarPane() {
    chrome.devtools.panels.sources.createSidebarPane("NestedIframes", (sidebar) => {
        chrome.devtools.inspectedWindow.eval(
            `
            function findNestedIframes(iframeNodes) {
                if (!iframeNodes.length) {
                    return null;
                }
                function nodeListToArray(nodeList) {
                    return Array.prototype.slice.call(nodeList);
                }
                function queryIframeForIframe(iframe) {
                    return iframe.contentDocument && iframe.contentDocument.querySelectorAll("iframe");
                }
                return nodeListToArray(iframeNodes)
                    .map(iframe => {
                        const nestedIframes = findNestedIframes(queryIframeForIframe(iframe) || []);
                        return {iframeID: iframe.id, iframeSRC: iframe.src, nestedIframes}
                    });
            }
            findNestedIframes(document.querySelectorAll('iframe'));
            `,
            function(result, error) { 
                if (error) {
                    console.error("Error: ", error);
                }
                if (result) {
                    console.log("result: ", result);
                    sidebar.setObject(result);
                }
            }
        );
    });
}

createPanel();
createSidebarPane();