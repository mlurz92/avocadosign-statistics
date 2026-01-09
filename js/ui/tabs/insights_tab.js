window.insightsTab = (() => {

    function _getComparisonData(studyId, allStats) {
        if (!studyId || !allStats) return null;

        let cohortId, performanceT2, comparisonASvsT2, n;

        if (studyId.startsWith('bf_')) {
            cohortId = studyId.split('_')[1];
            const bfMetric = window.APP_CONFIG.DEFAULT_SETTINGS.PUBLICATION_BRUTE_FORCE_METRIC;
            const cohortStats = allStats[cohortId];
            if (!cohortStats) return null;
            performanceT2 = cohortStats.performanceT2Bruteforce?.[bfMetric];
            comparisonASvsT2 = cohortStats.comparisonASvsT2Bruteforce?.[bfMetric];
            n = cohortStats.descriptive?.patientCount || 0;
        } else {
            const studySet = window.studyT2CriteriaManager.getStudyCriteriaSetById(studyId);
            if (!studySet) return null;
            cohortId = studySet.applicableCohort || 'Overall';
            const cohortStats = allStats[cohortId];
            if (!cohortStats) return null;
            performanceT2 = cohortStats.performanceT2Literature?.[studyId];
            comparisonASvsT2 = cohortStats.comparisonASvsT2Literature?.[studyId];
            n = cohortStats.descriptive?.patientCount || 0;
        }

        const performanceAS = allStats[cohortId]?.performanceAS;
        if (!performanceAS || !performanceT2 || !comparisonASvsT2) return null;
        
        return { cohortId, n, performanceAS, performanceT2, comparisonASvsT2 };
    }

    function _renderPowerAnalysis(allStats) {
        const selectedStudyId = window.state.getInsightsPowerStudyId();
        const compData = _getComparisonData(selectedStudyId, allStats);
        const inputsContainer = document.getElementById('power-analysis-inputs');
        const resultsContainer = document.getElementById('power-analysis-results');
        const texts = window.APP_CONFIG.UI_TEXTS.insightsTab.powerAnalysis;

        if (!inputsContainer || !resultsContainer) return;

        const mode = document.querySelector('input[name="power-analysis-mode"]:checked')?.value || 'posthoc';
        let inputsHTML = '';
        let resultsHTML = '<p class="text-muted small">Awaiting calculation...</p>';
        
        if (!compData || !compData.comparisonASvsT2?.delong) {
            inputsContainer.innerHTML = '<p class="text-warning small">Comparison data for power analysis is not available for the selected criteria set.</p>';
            resultsContainer.innerHTML = '<p class="text-center text-muted small mt-3">Please select a valid T2 criteria set for comparison.</p>';
            return;
        }
        
        const { delong } = compData.comparisonASvsT2;
        const observedEffectSize = Math.abs(delong.diffAUC);
        const alpha = parseFloat(document.getElementById('power-alpha')?.value) || 0.05;

        if (mode === 'posthoc') {
            inputsHTML = `
                <div class="mb-2">
                    <label for="power-alpha" class="form-label small">${texts.alphaLabel}</label>
                    <input type="number" class="form-control form-control-sm" id="power-alpha" value="${alpha}" step="0.01" min="0.001" max="0.2">
                </div>
                <div class="mb-2">
                    <label for="power-effect-size-info" class="form-label small">Observed AUC Difference (Effect Size):</label>
                    <input type="text" class="form-control form-control-sm" id="power-effect-size-info" value="${formatNumber(observedEffectSize, 3)}" readonly>
                </div>`;
            
            const power = window.statisticsService.calculatePostHocPower(delong, alpha);
            resultsHTML = `<div class="text-center">
                <p class="mb-1 small text-muted">${texts.postHocResult}</p>
                <h3 class="fw-bold text-primary mb-1">${isNaN(power) ? 'N/A' : formatPercent(power, 1)}</h3>
                <p class="small text-muted mb-0">The probability of detecting the observed effect, given the sample size (N=${compData.n}).</p>
            </div>`;
        } else {
            const targetPower = parseFloat(document.getElementById('power-target')?.value) || 0.8;
            const effectSize = parseFloat(document.getElementById('power-effect-size')?.value) || observedEffectSize;

            inputsHTML = `
                <div class="mb-2">
                    <label for="power-alpha" class="form-label small">${texts.alphaLabel}</label>
                    <input type="number" class="form-control form-control-sm" id="power-alpha" value="${alpha}" step="0.01" min="0.001" max="0.2">
                </div>
                <div class="mb-2">
                    <label for="power-target" class="form-label small">${texts.powerLabel}</label>
                    <input type="number" class="form-control form-control-sm" id="power-target" value="${targetPower}" step="0.05" min="0.5" max="0.99">
                </div>
                <div class="mb-2">
                    <label for="power-effect-size" class="form-label small">${texts.effectSizeLabel}</label>
                    <input type="number" class="form-control form-control-sm" id="power-effect-size" value="${formatNumber(effectSize, 3, '', true)}" step="0.01" min="0.01" max="0.5">
                </div>`;
            
            const delongForSampleSize = {...delong, diffAUC: effectSize, n: compData.n};
            const requiredN = window.statisticsService.calculateRequiredSampleSize(delongForSampleSize, targetPower, alpha);
            resultsHTML = `<div class="text-center">
                <p class="mb-1 small text-muted">${texts.sampleSizeResult}</p>
                <h3 class="fw-bold text-primary mb-1">${isNaN(requiredN) ? 'N/A' : formatNumber(requiredN, 0)}</h3>
                <p class="small text-muted mb-0">Total patients needed to achieve ${formatPercent(targetPower,0)} power for an AUC difference of ${formatNumber(effectSize,3)}.</p>
            </div>`;
        }
        
        window.uiManager.updateElementHTML(inputsContainer.id, inputsHTML);
        window.uiManager.updateElementHTML(resultsContainer.id, resultsHTML);
    }

    function _renderNodeCountAnalysis(allStats) {
        const selectedSetId = window.state.getInsightsLiteratureSetId();
        const resultsContainer = document.getElementById('node-count-analysis-results');
        if (!resultsContainer) return;

        const studySet = window.studyT2CriteriaManager.getStudyCriteriaSetById(selectedSetId);
        if (!studySet) {
            resultsContainer.innerHTML = '<p class="text-warning small">Selected criteria set not found.</p>';
            return;
        }

        const cohortId = studySet.applicableCohort || 'Overall';
        const cohortStats = allStats[cohortId];
        const litSetCounts = cohortStats?.aggregateNodeCountsLiterature?.[selectedSetId];

        if (!cohortStats || !litSetCounts) {
             resultsContainer.innerHTML = '<p class="text-muted small">Aggregate node count data not available for this selection.</p>';
             return;
        }
        
        const texts = window.APP_CONFIG.UI_TEXTS.insightsTab.nodeCountAnalysis;
        const nPatients = cohortStats.descriptive.patientCount;

        const createCountRow = (header, positive, total) => `
            <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                <span class="fw-bold small">${header}</span>
                <span class="badge bg-light text-dark fs-6">${formatNumber(positive, 0)} / ${formatNumber(total, 0)}</span>
            </div>`;

        resultsContainer.innerHTML = `
            <h6 class="mb-3">${texts.resultsHeader}${getCohortDisplayName(cohortId)} (N=${nPatients})</h6>
            <div class="row">
                <div class="col-md-4">
                    <div class="p-2 border rounded bg-light h-100">
                        <p class="text-center small fw-bold mb-2">${texts.pathologyHeader}</p>
                        ${createCountRow('Positive / Total:', litSetCounts.pathology.positive, litSetCounts.pathology.total)}
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="p-2 border rounded bg-light h-100">
                        <p class="text-center small fw-bold mb-2">${texts.asHeader}</p>
                        ${createCountRow('Positive / Total:', litSetCounts.as.positive, litSetCounts.as.total)}
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="p-2 border rounded bg-light h-100">
                        <p class="text-center small fw-bold mb-2">${texts.t2Header}</p>
                        ${createCountRow('Positive / Total:', litSetCounts.t2.positive, litSetCounts.t2.total)}
                    </div>
                </div>
            </div>`;
    }
    
    function _renderView(allStats){
        const insightsView = window.state.getInsightsView();
        const contentArea = document.getElementById('insights-content-area');
        if (!contentArea) return;

        if (insightsView === 'node-count-analysis') {
            const currentGlobalCohort = window.state.getCurrentCohort();
            const globalCohortStats = allStats[currentGlobalCohort];
            let globalCountsHTML = '';
            if (globalCohortStats && globalCohortStats.aggregateNodeCounts) {
                const counts = globalCohortStats.aggregateNodeCounts;
                const patientCount = globalCohortStats.descriptive.patientCount;
                globalCountsHTML = `
                    <div class="col-12 mb-4">
                        <div class="card bg-light border-2">
                            <div class="card-header text-center fw-bold">Total Lymph Nodes Evaluated in Cohort: ${getCohortDisplayName(currentGlobalCohort)} (N=${patientCount})</div>
                            <div class="card-body">
                                <div class="row text-center">
                                    <div class="col-4">
                                        <h6 class="text-muted">Pathology</h6>
                                        <p class="h4 mb-0">${formatNumber(counts.pathology.total, 0)}</p>
                                    </div>
                                    <div class="col-4">
                                        <h6 class="text-muted">Avocado Sign (T1-CE)</h6>
                                        <p class="h4 mb-0">${formatNumber(counts.as.total, 0)}</p>
                                    </div>
                                    <div class="col-4">
                                        <h6 class="text-muted">T2-weighted</h6>
                                        <p class="h4 mb-0">${formatNumber(counts.t2.total, 0)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>`;
            }
             contentArea.innerHTML = globalCountsHTML;
        } else {
            contentArea.innerHTML = '';
        }

        let cardHTML = '';
        
        switch(insightsView) {
            case 'power-analysis':
                const powerStudyId = window.state.getInsightsPowerStudyId();
                cardHTML = window.uiComponents.createStatisticsCard('power-analysis', window.APP_CONFIG.UI_TEXTS.insightsTab.powerAnalysis.cardTitle, window.uiComponents.createPowerAnalysisCardHTML(powerStudyId), true);
                contentArea.innerHTML += `<div class="row justify-content-center"><div class="col-xl-10">${cardHTML}</div></div>`;
                _renderPowerAnalysis(allStats);
                break;
            case 'node-count-analysis':
                const litSetId = window.state.getInsightsLiteratureSetId();
                cardHTML = window.uiComponents.createStatisticsCard('node-count-analysis', window.APP_CONFIG.UI_TEXTS.insightsTab.nodeCountAnalysis.cardTitle, window.uiComponents.createNodeCountAnalysisCardHTML(litSetId), true);
                contentArea.innerHTML += `<div class="row justify-content-center"><div class="col-xl-10">${cardHTML}</div></div>`;
                _renderNodeCountAnalysis(allStats);
                break;
        }
    }

    function render(allStats) {
        const insightsView = window.state.getInsightsView();
        const texts = window.APP_CONFIG.UI_TEXTS.insightsTab;
        
        const html = `
            <div class="row mb-4">
                <div class="col-12 d-flex justify-content-center">
                    <div class="btn-group btn-group-sm" role="group" aria-label="Insights View Selection">
                        <input type="radio" class="btn-check" name="insightsView" id="view-power-analysis" value="power-analysis" ${insightsView === 'power-analysis' ? 'checked' : ''}>
                        <label class="btn btn-outline-primary" for="view-power-analysis"><i class="fas fa-battery-half me-2"></i>${texts.powerAnalysis.cardTitle}</label>
                        
                        <input type="radio" class="btn-check" name="insightsView" id="view-node-count-analysis" value="node-count-analysis" ${insightsView === 'node-count-analysis' ? 'checked' : ''}>
                        <label class="btn btn-outline-primary" for="view-node-count-analysis"><i class="fas fa-sitemap me-2"></i>${texts.nodeCountAnalysis.cardTitle}</label>
                    </div>
                </div>
            </div>
            <div id="insights-content-area"></div>
        `;

        setTimeout(() => _renderView(allStats), 10);

        return html;
    }

    return Object.freeze({
        render,
        renderPowerAnalysis: _renderPowerAnalysis,
        renderNodeCountAnalysis: _renderNodeCountAnalysis,
        renderView: _renderView
    });

})();