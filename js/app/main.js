class App {
    constructor() {
        this.rawData = typeof window.patientDataRaw !== 'undefined' ? window.patientDataRaw : [];
        this.processedData = [];
        this.allCohortStats = null;
        this.bruteForceModal = null;
        this.libraryStatus = {};
    }

    async init() {
        try {
            this.registerServiceWorker();
            this.libraryStatus = await this.checkDependencies();
            
            Object.entries(this.libraryStatus).forEach(([lib, status]) => {
                if (!status) {
                     window.uiManager.showToast(`Warning: Library '${lib}' failed to load. Some features may be unavailable.`, 'warning', 5000);
                }
            });

            window.state.init();
            window.t2CriteriaManager.init();
            this.initializeBruteForceManager();
            window.eventManager.init(this);

            this.processedData = window.dataProcessor.processAllData(this.rawData);
            if (this.processedData.length === 0) {
                window.uiManager.showToast("Warning: No valid patient data loaded.", "warning");
            }

            const modalElement = document.getElementById('brute-force-modal');
            if (modalElement) {
                this.bruteForceModal = new bootstrap.Modal(modalElement);
            }
            
            window.state.setActiveTabId('analysis');

            this.recalculateAllStats();
            this.refreshCurrentTab();
            
            window.uiManager.initializeTooltips(document.body);
            window.uiManager.updateLayoutMetrics();
            window.uiManager.markCriteriaSavedIndicator(window.t2CriteriaManager.isUnsaved());
            window.uiManager.showToast('Application initialized.', 'success', 2500);

        } catch (error) {
            const appContainer = document.getElementById('app-container');
            if(appContainer) {
                 window.uiManager.updateElementHTML('app-container', `<div class="alert alert-danger m-5"><strong>Initialization Error:</strong> ${error.message}.<br>Please check the browser console for more details.</div>`);
            } else {
                 document.body.innerHTML = `<div class="alert alert-danger m-5"><strong>Fatal Initialization Error:</strong> ${error.message}. App container not found.</div>`;
            }
        }
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                })
                .catch(error => {
                });
        }
    }

    checkDependencies() {
        return new Promise((resolve) => {
            const internalModules = { 
                state: window.state, t2CriteriaManager: window.t2CriteriaManager, studyT2CriteriaManager: window.studyT2CriteriaManager, 
                dataProcessor: window.dataProcessor, statisticsService: window.statisticsService, bruteForceManager: window.bruteForceManager, 
                uiManager: window.uiManager, uiComponents: window.uiComponents, tableRenderer: window.tableRenderer, chartRenderer: window.chartRenderer, 
                flowchartRenderer: window.flowchartRenderer, dataTab: window.dataTab, analysisTab: window.analysisTab, 
                statisticsTab: window.statisticsTab, comparisonTab: window.comparisonTab, insightsTab: window.insightsTab,
                eventManager: window.eventManager, APP_CONFIG: window.APP_CONFIG
            };

            for (const dep in internalModules) {
                if (typeof internalModules[dep] === 'undefined' || internalModules[dep] === null) {
                    throw new Error(`Core module or dependency '${dep}' is not available.`);
                }
            }
            if (typeof window.patientDataRaw === 'undefined' || window.patientDataRaw === null) {
                throw new Error("Global 'patientDataRaw' is not available.");
            }

            const librariesToWaitFor = {
                d3: () => !!window.d3,
                tippy: () => !!window.tippy,
                bootstrap: () => !!window.bootstrap
            };

            const pollInterval = 100;
            const timeout = 5000;
            let elapsedTime = 0;

            const intervalId = setInterval(() => {
                const allLoaded = Object.values(librariesToWaitFor).every(checkFn => checkFn());

                if (allLoaded) {
                    clearInterval(intervalId);
                    const finalStatus = {};
                    Object.keys(librariesToWaitFor).forEach(lib => finalStatus[lib] = true);
                    resolve(finalStatus);
                } else {
                    elapsedTime += pollInterval;
                    if (elapsedTime >= timeout) {
                        clearInterval(intervalId);
                        const finalStatus = {};
                        Object.keys(librariesToWaitFor).forEach(lib => finalStatus[lib] = librariesToWaitFor[lib]());
                        resolve(finalStatus);
                    }
                }
            }, pollInterval);
        });
    }

    initializeBruteForceManager() {
        const bfCallbacks = {
            onStarted: (payload) => {
                window.uiManager.updateBruteForceUI('started', payload, true, window.state.getCurrentCohort());
            },
            onProgress: (payload) => {
                window.uiManager.updateBruteForceUI('progress', payload, true, window.state.getCurrentCohort());
            },
            onResult: (payload) => {
                const bfResults = window.bruteForceManager.getAllResults();
                const cohortBfResults = bfResults[payload.cohort] || {};
                
                window.uiManager.updateBruteForceUI('result', cohortBfResults[payload.metric], true, payload.cohort);
                if (payload?.results?.length > 0) {
                    this.showBruteForceDetails(payload.metric, payload.cohort);
                    window.uiManager.showToast('Optimization finished.', 'success');
                    this.recalculateAllStats();
                    this.refreshCurrentTab();
                } else {
                    window.uiManager.showToast('Optimization finished with no valid results.', 'warning');
                }
                this.updateUI();
            },
            onCancelled: (payload) => {
                window.uiManager.updateBruteForceUI('cancelled', {}, window.bruteForceManager.isWorkerAvailable(), payload.cohort);
                window.uiManager.showToast('Optimization cancelled.', 'warning');
                this.updateUI();
            },
            onError: (payload) => {
                window.uiManager.showToast(`Optimization Error: ${payload?.message || 'Unknown'}`, 'danger');
                window.uiManager.updateBruteForceUI('error', payload, window.bruteForceManager.isWorkerAvailable(), payload.cohort);
                this.updateUI();
            }
        };
        window.bruteForceManager.init(bfCallbacks);
    }
    
    filterAndPrepareData() {
        try {
            const activeCohortId = window.state.getActiveCohortId();
            const filteredByCohort = window.dataProcessor.filterDataByCohort(this.processedData, activeCohortId);
            const appliedCriteria = window.t2CriteriaManager.getAppliedCriteria();
            const appliedLogic = window.t2CriteriaManager.getAppliedLogic();
            const evaluatedData = window.t2CriteriaManager.evaluateDataset(filteredByCohort, appliedCriteria, appliedLogic);

            const activeTabId = window.state.getActiveTabId();
            const sortState = activeTabId === 'data' ? window.state.getDataTableSort() : window.state.getAnalysisTableSort();
            if(sortState && sortState.key) {
                 evaluatedData.sort(getSortFunction(sortState.key, sortState.direction, sortState.subKey));
            }
            return evaluatedData;
        } catch (error) {
            window.uiManager.showToast("Error during data preparation.", "danger");
            return [];
        }
    }
    
    recalculateAllStats() {
        const criteria = window.t2CriteriaManager.getAppliedCriteria();
        const logic = window.t2CriteriaManager.getAppliedLogic();
        const bruteForceResults = window.bruteForceManager.getAllResults();
        this.allCohortStats = window.statisticsService.calculateAllPublicationStats(this.processedData, criteria, logic, bruteForceResults);
    }

    _prepareComparisonData() {
        const globalCohort = window.state.getCurrentCohort(); 
        const selectedStudyId = window.state.getComparisonStudyId();
        const patientCount = (this.allCohortStats[globalCohort]?.descriptive?.patientCount) || 0;
        
        let performanceAS, performanceT2, comparisonASvsT2, comparisonCriteriaSet, t2ShortName;
        let cohortForComparison = globalCohort;
        let patientCountForComparison = patientCount;

        if (selectedStudyId.startsWith('bf_')) {
            const cohortId = selectedStudyId.split('_')[1];
            cohortForComparison = cohortId;
            const bfMetric = window.APP_CONFIG.DEFAULT_SETTINGS.PUBLICATION_BRUTE_FORCE_METRIC;
            const statsForBfCohort = this.allCohortStats[cohortId];
            
            if (statsForBfCohort) {
                patientCountForComparison = statsForBfCohort.descriptive?.patientCount || 0;
                performanceAS = statsForBfCohort.performanceAS;
                performanceT2 = statsForBfCohort.performanceT2Bruteforce?.[bfMetric];
                comparisonASvsT2 = statsForBfCohort.comparisonASvsT2Bruteforce?.[bfMetric];
                const bfDef = statsForBfCohort.bruteforceDefinitions?.[bfMetric];
                
                if (bfDef) {
                    comparisonCriteriaSet = {
                        id: selectedStudyId,
                        name: `Best Case T2 (${getCohortDisplayName(cohortId)})`,
                        displayShortName: `BF T2 (${getCohortDisplayName(cohortId)})`,
                        criteria: bfDef.criteria,
                        logic: bfDef.logic,
                        studyInfo: {
                            isDynamic: true,
                            patientCohort: `${getCohortDisplayName(cohortId)} (N=${patientCountForComparison})`,
                            keyCriteriaSummary: window.studyT2CriteriaManager.formatCriteriaForDisplay(bfDef.criteria, bfDef.logic, false)
                        }
                    };
                    t2ShortName = comparisonCriteriaSet.displayShortName;
                }
            }
        } else {
            const studySet = window.studyT2CriteriaManager.getStudyCriteriaSetById(selectedStudyId);
            if (studySet) {
                cohortForComparison = studySet.applicableCohort || window.APP_CONFIG.COHORTS.OVERALL.id;
                const statsForStudyCohort = this.allCohortStats[cohortForComparison];
                if (statsForStudyCohort) {
                    patientCountForComparison = statsForStudyCohort.descriptive?.patientCount || 0;
                    performanceAS = statsForStudyCohort.performanceAS;
                    performanceT2 = statsForStudyCohort.performanceT2Literature?.[selectedStudyId];
                    comparisonASvsT2 = statsForStudyCohort.comparisonASvsT2Literature?.[selectedStudyId];
                    comparisonCriteriaSet = studySet;
                    t2ShortName = studySet.displayShortName || studySet.name;
                }
            }
        }

        return {
            globalCohort, patientCount,
            processedData: this.processedData,
            statsGesamt: this.allCohortStats[window.APP_CONFIG.COHORTS.OVERALL.id], 
            statsSurgeryAlone: this.allCohortStats[window.APP_CONFIG.COHORTS.SURGERY_ALONE.id], 
            statsNeoadjuvantTherapy: this.allCohortStats[window.APP_CONFIG.COHORTS.NEOADJUVANT.id],
            statsCurrentCohort: this.allCohortStats[globalCohort],
            performanceAS, performanceT2, comparison: comparisonASvsT2,
            comparisonCriteriaSet, cohortForComparison, patientCountForComparison, t2ShortName
        };
    }

    updateUI() {
        const currentCohort = window.state.getCurrentCohort();
        const activeTabId = window.state.getActiveTabId();
        const analysisContext = window.state.getAnalysisContext();
        
        const isLocked = !!analysisContext || (activeTabId === 'statistics' && window.state.getStatsLayout() === 'vergleich');
        window.uiManager.updateCohortButtonsUI(currentCohort, isLocked);
        
        if (activeTabId === 'comparison') {
            window.uiManager.updateComparisonViewUI(window.state.getComparisonView(), window.state.getComparisonStudyId());
        } else if (activeTabId === 'export') {
            window.uiManager.updateExportUI();
        }
    }

    processTabChange(tabId) {
        if (window.state.setActiveTabId(tabId)) {
            this.refreshCurrentTab();
        }
    }

    renderCurrentTab() {
        const tabId = window.state.getActiveTabId();
        const currentDataForTab = this.filterAndPrepareData();
        const globalCohort = window.state.getCurrentCohort();
        const activeCohort = window.state.getActiveCohortId();
        const criteria = window.t2CriteriaManager.getAppliedCriteria();
        const logic = window.t2CriteriaManager.getAppliedLogic();
        const allBruteForceResults = window.bruteForceManager.getAllResults();
        
        let currentComparisonData = null;
        if (tabId === 'comparison') {
            currentComparisonData = this._prepareComparisonData();
        }

        switch (tabId) {
            case 'data': window.uiManager.renderTabContent('data', () => window.dataTab.render(currentDataForTab, window.state.getDataTableSort())); break;
            case 'analysis': window.uiManager.renderTabContent('analysis', () => window.analysisTab.render(currentDataForTab, window.t2CriteriaManager.getCurrentCriteria(), window.t2CriteriaManager.getCurrentLogic(), window.state.getAnalysisTableSort(), activeCohort, window.bruteForceManager.isWorkerAvailable(), this.allCohortStats[activeCohort], allBruteForceResults)); break;
            case 'statistics': window.uiManager.renderTabContent('statistics', () => window.statisticsTab.render(this.processedData, criteria, logic, window.state.getStatsLayout(), window.state.getStatsCohort1(), window.state.getStatsCohort2(), globalCohort)); break;
            case 'comparison': window.uiManager.renderTabContent('comparison', () => window.comparisonTab.render(window.state.getComparisonView(), currentComparisonData, window.state.getComparisonStudyId())); break;
            case 'insights': window.uiManager.renderTabContent('insights', () => window.insightsTab.render(this.allCohortStats, this.processedData)); break;
            case 'export': window.uiManager.renderTabContent('export', () => window.exportTab.render()); break;
        }
    }

    handleCohortChange(newCohort, source = "user") {
        if (window.state.setCurrentCohort(newCohort)) {
            window.state.clearAnalysisContext();
            this.refreshCurrentTab();
            if (source === "user") {
                window.uiManager.showToast(`Cohort '${getCohortDisplayName(newCohort)}' selected.`, 'info');
            } else if (source === "auto_bf_apply") {
                 window.uiManager.showToast(`Cohort automatically set to '${getCohortDisplayName(newCohort)}' to match applied criteria.`, 'info', 4000);
                 window.uiManager.highlightElement(`btn-cohort-${newCohort}`);
            }
        }
    }
    
    applyAndRefreshAll() {
        window.t2CriteriaManager.applyCriteria();
        this.recalculateAllStats();
        this.refreshCurrentTab();
        window.uiManager.markCriteriaSavedIndicator(false);
        window.uiManager.showToast('T2 criteria applied & saved.', 'success');
    }

    startBruteForceAnalysis() {
        const metric = document.getElementById('brute-force-metric')?.value || 'Balanced Accuracy';
        const cohortId = window.state.getActiveCohortId();
        const dataForWorker = window.dataProcessor.filterDataByCohort(this.processedData, cohortId).map(p => ({
            id: p.id, nStatus: p.nStatus, t2Nodes: p.t2Nodes
        }));
        
        if (dataForWorker.length > 0) {
            window.bruteForceManager.startAnalysis(dataForWorker, metric, cohortId);
        } else {
            window.uiManager.showToast("No data for optimization in this cohort.", "warning");
        }
    }

    applyBestBruteForceCriteria(metric, cohortId = null) {
        const targetCohort = cohortId || window.state.getActiveCohortId();
        const bfResult = window.bruteForceManager.getResultsForCohortAndMetric(targetCohort, metric);
        
        if (!bfResult?.bestResult?.criteria) {
            window.uiManager.showToast(`No valid brute-force result for metric '${metric}' in cohort '${getCohortDisplayName(targetCohort)}' to apply.`, 'warning');
            return;
        }

        if (cohortId && window.state.getCurrentCohort() !== cohortId) {
            this.handleCohortChange(cohortId, "auto_bf_apply");
        }

        const best = bfResult.bestResult;
        Object.keys(best.criteria).forEach(key => {
            if (key === 'logic') return;
            const criterion = best.criteria[key];
            window.t2CriteriaManager.toggleCriterionActive(key, criterion.active);
            if (criterion.active) {
                if (key === 'size') window.t2CriteriaManager.updateCriterionThreshold(criterion.threshold);
                else window.t2CriteriaManager.updateCriterionValue(key, criterion.value);
            }
        });
        window.t2CriteriaManager.updateLogic(best.logic);
        this.applyAndRefreshAll();
        window.uiManager.showToast(`Best brute-force criteria for '${metric}' applied & saved.`, 'success');
    }

    showBruteForceDetails(metric, cohortId = null) {
        const targetCohortId = cohortId || window.state.getActiveCohortId();
        const resultData = window.bruteForceManager.getResultsForCohortAndMetric(targetCohortId, metric);
        window.uiManager.updateElementHTML('brute-force-modal-body', window.uiComponents.createBruteForceModalContent(resultData));
        if (this.bruteForceModal) {
            const modalTitleEl = document.getElementById('bruteForceModalLabel');
            if (modalTitleEl) {
                modalTitleEl.textContent = 'Brute-Force Optimization Results';
            }
            this.bruteForceModal.show();
        }
    }

    showMismatchDetails(mismatchKey) {
        const mismatchData = window.state.getMismatchData();
        if (!mismatchData || !mismatchData[mismatchKey]) {
            window.uiManager.showToast('Could not find data for this mismatch category.', 'warning');
            return;
        }
    
        const patientList = mismatchData[mismatchKey];
        const texts = window.APP_CONFIG.UI_TEXTS.insightsTab.mismatchAnalysis;
        
        const keyToLabelMap = {
            'concordantCorrect': texts.concordantCorrect,
            'asSuperior': texts.asSuperior,
            't2Superior': texts.t2Superior,
            'concordantIncorrect': texts.concordantIncorrect
        };

        const title = `Patients in Category: ${keyToLabelMap[mismatchKey] || mismatchKey}`;
    
        let contentHTML = `<p>Found ${patientList.length} patients in this category.</p>`;
        if (patientList.length > 0) {
            contentHTML += '<ul class="list-group list-group-flush">';
            patientList.forEach(p => {
                contentHTML += `<li class="list-group-item d-flex justify-content-between align-items-center small">
                    <span>ID: ${p.id} - ${p.lastName}, ${p.firstName}</span>
                    <span class="badge bg-secondary rounded-pill">N: ${p.nStatus} | AS: ${p.asStatus} | T2: ${p.t2Status}</span>
                </li>`;
            });
            contentHTML += '</ul>';
        }
    
        const modalTitleEl = document.getElementById('bruteForceModalLabel');
        if (modalTitleEl) {
            modalTitleEl.textContent = title;
        }
        window.uiManager.updateElementHTML('brute-force-modal-body', contentHTML);
        if (this.bruteForceModal) {
            this.bruteForceModal.show();
        }
    }

    refreshCurrentTab() {
        this.recalculateAllStats();
        this.renderCurrentTab();
        this.updateUI();
    }
    
    async _ensureChartsAreRenderedForExport() {
        const hiddenContainerId = window.APP_CONFIG.UI_SETTINGS.HIDDEN_CHART_CONTAINER_ID;
        const hiddenContainer = document.getElementById(hiddenContainerId);
        if (!hiddenContainer || !this.allCohortStats) return;

        hiddenContainer.innerHTML = '';
        const chartTasks = [];

        Object.entries(this.allCohortStats).forEach(([cohortId, stats]) => {
            if (stats && stats.descriptive && stats.descriptive.patientCount > 0) {
                const desc = stats.descriptive;
                const tempAgeId = `export-age-${cohortId}`;
                const tempGenderId = `export-gender-${cohortId}`;
                
                hiddenContainer.innerHTML += `<div id="${tempAgeId}" style="width: 300px; height: 200px;"></div><div id="${tempGenderId}" style="width: 200px; height: 200px;"></div>`;
                
                chartTasks.push(() => window.chartRenderer.renderAgeDistributionChart(desc.ageData || [], tempAgeId));
                
                const genderData = [{label: 'Male', value: desc.sex.m ?? 0}, {label: 'Female', value: desc.sex.f ?? 0}];
                chartTasks.push(() => window.chartRenderer.renderPieChart(genderData, tempGenderId));
                
                if(stats.associationsApplied) {
                    const tempFeatureId = `export-feature-${cohortId}`;
                    hiddenContainer.innerHTML += `<div id="${tempFeatureId}" style="width: 450px; height: 350px;"></div>`;
                    const dataForChart = Object.values(stats.associationsApplied).filter(item => item.or && isFinite(item.or.value));
                    chartTasks.push(() => window.chartRenderer.renderFeatureImportanceChart(dataForChart, tempFeatureId));
                }
            }
        });

        const comparisonData = this._prepareComparisonData();
        if (comparisonData && comparisonData.performanceAS && comparisonData.performanceT2) {
            const tempCompBarId = 'export-comp-bar';
            hiddenContainer.innerHTML += `<div id="${tempCompBarId}" style="width: 450px; height: 350px;"></div>`;
            const chartData = [
                { metric: 'Sens.', AS: comparisonData.performanceAS.sens?.value || 0, T2: comparisonData.performanceT2.sens?.value || 0 },
                { metric: 'Spec.', AS: comparisonData.performanceAS.spec?.value || 0, T2: comparisonData.performanceT2.spec?.value || 0 },
                { metric: 'PPV', AS: comparisonData.performanceAS.ppv?.value || 0, T2: comparisonData.performanceT2.ppv?.value || 0 },
                { metric: 'NPV', AS: comparisonData.performanceAS.npv?.value || 0, T2: comparisonData.performanceT2.npv?.value || 0 },
                { metric: 'AUC', AS: comparisonData.performanceAS.auc?.value || 0, T2: comparisonData.performanceT2.auc?.value || 0 }
            ];
            chartTasks.push(() => window.chartRenderer.renderComparisonBarChart(chartData, tempCompBarId, {}, comparisonData.t2ShortName));
        }

        const flowchartStats = {
            Overall: this.allCohortStats[window.APP_CONFIG.COHORTS.OVERALL.id],
            surgeryAlone: this.allCohortStats[window.APP_CONFIG.COHORTS.SURGERY_ALONE.id],
            neoadjuvantTherapy: this.allCohortStats[window.APP_CONFIG.COHORTS.NEOADJUVANT.id]
        };
        const tempFlowchartId = 'export-flowchart';
        hiddenContainer.innerHTML += `<div id="${tempFlowchartId}" style="width: 600px; height: 450px;"></div>`;
        chartTasks.push(() => window.flowchartRenderer.renderFlowchart(flowchartStats, tempFlowchartId));

        chartTasks.forEach(task => task());
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    async exportCharts() {
        window.uiManager.showToast('Preparing charts for export...', 'info', 2000);
        await this._ensureChartsAreRenderedForExport();

        const allChartContainerIds = Array.from(document.querySelectorAll('[id^="chart-"], [id*="-chart-"], [id$="-chart"], [id^="export-"]')).map(el => el.id);
        const uniqueChartIds = [...new Set(allChartContainerIds)];

        window.exportService.exportChartsAsSvg(uniqueChartIds);

        const hiddenContainer = document.getElementById(window.APP_CONFIG.UI_SETTINGS.HIDDEN_CHART_CONTAINER_ID);
        if (hiddenContainer) {
            hiddenContainer.innerHTML = '';
        }
    }

    handleSortRequest(context, key, subKey) {
        let changed = false;
        if (context === 'data') {
            changed = window.state.updateDataTableSort(key, subKey);
        } else if (context === 'analysis') {
            changed = window.state.updateAnalysisTableSort(key, subKey);
        }
        
        if (changed) {
            this.refreshCurrentTab();
        }
    }

    startSequentialBruteForce() {
        window.uiManager.hideAutoBfModals();
        window.uiManager.showAutoBfProgress();
        this.isAutoBfRunning = true;
        
        const cohortsToRun = ['Overall', 'surgeryAlone', 'neoadjuvantTherapy'];
        this.autoBfQueue = cohortsToRun.map(cohortId => ({
            cohortId: cohortId,
            metric: window.APP_CONFIG.DEFAULT_SETTINGS.PUBLICATION_BRUTE_FORCE_METRIC
        }));
        
        this.autoBfQueue.totalTasks = cohortsToRun.length;
        
        this._runNextAutoBf();
    }

    declineAutoBruteForce() {
        saveToLocalStorage('avocadoSign_autoBfDeclined', true);
        window.uiManager.hideAutoBfModals();
        window.uiManager.showToast("Okay, you can run the optimization manually from the 'Analysis' tab later.", 'info', 5000);
    }

    _runNextAutoBf() {
        if (this.autoBfQueue.length > 0) {
            const nextTask = this.autoBfQueue.shift();
            const completedTasks = this.autoBfQueue.totalTasks - this.autoBfQueue.length - 1;
            const progressSoFar = (completedTasks / this.autoBfQueue.totalTasks) * 100;
            window.uiManager.updateAutoBfProgress(`Preparing analysis for cohort: <strong>${getCohortDisplayName(nextTask.cohortId)}</strong>...`, progressSoFar);

            const dataForWorker = window.dataProcessor.filterDataByCohort(this.processedData, nextTask.cohortId).map(p => ({
                id: p.id, nStatus: p.nStatus, t2Nodes: p.t2Nodes
            }));
            window.bruteForceManager.startAnalysis(dataForWorker, nextTask.metric, nextTask.cohortId);
        } else {
            this.isAutoBfRunning = false;
            window.uiManager.updateAutoBfProgress('All analyses complete!', 100);
            setTimeout(() => {
                window.uiManager.hideAutoBfModals();
                window.uiManager.showToast('Initial analysis complete! All features are now available.', 'success', 5000);
                this.recalculateAllStats();
                this.refreshCurrentTab();
            }, 1500);
        }
    }

    getRawData() { return this.rawData; }
    getProcessedData() { return this.processedData; }
}