window.exportService = (() => {

    function downloadFile(filename, content, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async function exportChartsAsSvg(chartContainerIds, fileNamePrefix = 'Radiology_Chart') {
        if (!Array.isArray(chartContainerIds) || chartContainerIds.length === 0) {
            window.uiManager.showToast('No chart container IDs provided for export.', 'warning');
            return;
        }
        
        let chartsExported = 0;
        for (const containerId of chartContainerIds) {
            const originalContainer = document.getElementById(containerId);
            if (!originalContainer) {
                continue;
            }

            const svgElement = originalContainer.querySelector('svg');
            if (svgElement) {
                try {
                    const cleanSvgElement = svgElement.cloneNode(true);
                    let svgString = new XMLSerializer().serializeToString(cleanSvgElement);
                    svgString = `<?xml version="1.0" standalone="no"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n` + svgString;
                    const filename = `${fileNamePrefix}_${containerId}_${getCurrentDateString('YYYYMMDD')}.svg`;
                    downloadFile(filename, svgString, 'image/svg+xml;charset=utf-8');
                    chartsExported++;
                } catch (error) {
                    console.error(`Error exporting chart ${containerId}:`, error);
                }
            }
        }

        if (chartsExported > 0) {
            window.uiManager.showToast(`${chartsExported} chart(s) exported successfully!`, 'success');
        } else {
            window.uiManager.showToast('No rendered charts found to export. Please visit the corresponding tabs first.', 'warning');
        }
    }

    return Object.freeze({
        exportChartsAsSvg
    });
})();