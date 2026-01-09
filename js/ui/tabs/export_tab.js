window.exportTab = (() => {

    function render() {
        return `
            <div class="container-fluid p-4">
                <h4 class="mb-4"><i class="fas fa-download me-2"></i>Export Results</h4>
                <div class="row g-4">
                    <div class="col-md-6 col-lg-4">
                        <div class="card h-100 shadow-sm border-0">
                            <div class="card-body text-center p-4">
                                <div class="mb-3 text-primary">
                                    <i class="fas fa-chart-pie fa-3x"></i>
                                </div>
                                <h5 class="card-title">Analysis Charts</h5>
                                <p class="card-text text-muted small my-3">
                                    Export all generated charts (Demographics, Feature Importance, Comparisons, Flowcharts) as high-quality SVG vector graphics for use in presentations or external documents.
                                </p>
                                <div class="alert alert-light border small text-start" role="alert">
                                    <i class="fas fa-info-circle me-1 text-info"></i>
                                    <strong>Note:</strong> Charts are generated based on the current state of the <em>Statistics</em> and <em>Comparison</em> tabs.
                                </div>
                                <button id="btn-export-charts" class="btn btn-primary w-100">
                                    <i class="fas fa-file-export me-2"></i>Export Charts (SVG)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    return Object.freeze({
        render
    });
})();