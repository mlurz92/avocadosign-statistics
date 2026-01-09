window.publicationService = (() => {

    const contentGenerators = {
        'title_main': window.generators.titlePageGenerator.generateTitlePageHTML,
        'abstract_main': window.generators.abstractGenerator.generateAbstractHTML,
        'introduction_main': window.generators.introductionGenerator.generateIntroductionHTML,
        'methoden_studienanlage_ethik': window.generators.methodsGenerator.generateStudyDesignHTML,
        'methoden_mrt_protokoll_akquisition': window.generators.methodsGenerator.generateMriProtocolAndImageAnalysisHTML,
        'methoden_vergleichskriterien_t2': window.generators.methodsGenerator.generateComparativeCriteriaHTML,
        'methoden_referenzstandard_histopathologie': window.generators.methodsGenerator.generateReferenceStandardHTML,
        'methoden_statistische_analyse_methoden': window.generators.methodsGenerator.generateStatisticalAnalysisHTML,
        'ergebnisse_patientencharakteristika': window.generators.resultsGenerator.generatePatientCharacteristicsHTML,
        'ergebnisse_vergleich_as_vs_t2': window.generators.resultsGenerator.generateComparisonHTML,
        'discussion_main': window.generators.discussionGenerator.generateDiscussionHTML,
        'stard_checklist': window.generators.stardGenerator.renderStardChecklist
    };

    function _generateAbbreviationsHTML(fullHtmlContent) {
        const potentialAbbreviations = {
            'AS': 'Avocado Sign',
            'AUC': 'Area under the receiver operating characteristic curve',
            'CI': 'Confidence interval',
            'DWI': 'diffusion-weighted imaging',
            'ER': 'European Radiology',
            'ESGAR': 'European Society of Gastrointestinal and Abdominal Radiology',
            'ESR': 'European Society of Radiology',
            'GDPR': 'General Data Protection Regulation',
            'IQR': 'Interquartile Range',
            'MDT': 'Multidisciplinary Tumour Board',
            'nCRT': 'neoadjuvant chemoradiotherapy',
            'NPV': 'Negative predictive value',
            'PPV': 'Positive predictive value',
            'SD': 'Standard Deviation',
            'STARD': 'Standards for Reporting of Diagnostic Accuracy Studies',
            'T2w': 'T2-weighted',
            'TNT': 'Total Neoadjuvant Therapy',
            'TSE': 'turbo spin-echo',
            'VIBE': 'volumetric interpolated breath-hold examination'
        };

        const coreAbbreviations = new Set(['AS', 'AUC', 'CI', 'DWI', 'ESGAR', 'ESR', 'GDPR', 'nCRT', 'NPV', 'PPV', 'T2w', 'TNT']);
        const textContent = fullHtmlContent.replace(/<[^>]+>/g, ' ');
        const counts = {};

        Object.keys(potentialAbbreviations).forEach(abbr => {
            const regex = new RegExp(`\\b${abbr}\\b`, 'g');
            const matches = textContent.match(regex);
            counts[abbr] = matches ? matches.length : 0;
        });

        const validAbbreviations = Object.entries(counts)
            .filter(([abbr, count]) => {
                if (!potentialAbbreviations[abbr]) return false;
                const isCore = coreAbbreviations.has(abbr);
                return (isCore && count > 0) || count >= 5;
            })
            .sort((a, b) => a[0].localeCompare(b[0]))
            .slice(0, 10)
            .map(([abbr]) => `<li><strong>${abbr}</strong> = ${potentialAbbreviations[abbr]}</li>`)
            .join('');

        if (validAbbreviations) {
            return `<div id="abbreviations-list" style="margin-top: 1.5rem;">
                        <h4 style="font-size: 1.1rem; font-weight: bold;">Abbreviations</h4>
                        <ul style="padding-left: 20px; margin-top: 0.5rem; list-style-position: inside; text-align: left;">${validAbbreviations}</ul>
                    </div>`;
        }
        return '';
    }

    function generateSectionHTML(sectionId, stats, commonData) {
        const generator = contentGenerators[sectionId];
        if (typeof generator === 'function') {
            try {
                return generator(stats, commonData);
            } catch (error) {
                return `<div class="alert alert-danger">An error occurred while generating content for section '${sectionId}'. Check console for details.</div>`;
            }
        }
        
        const mainSection = window.PUBLICATION_CONFIG.sections.find(s => s.id === sectionId);
        if (mainSection && Array.isArray(mainSection.subSections) && mainSection.subSections.length > 0) {
            let combinedHTML = '';
            mainSection.subSections.forEach(sub => {
                const subGenerator = contentGenerators[sub.id];
                if (typeof subGenerator === 'function') {
                    try {
                        combinedHTML += subGenerator(stats, commonData);
                    } catch (error) {
                        combinedHTML += `<div class="alert alert-danger">An error occurred while generating content for sub-section '${sub.label}'. Check console for details.</div>`;
                    }
                }
            });
            return combinedHTML;
        }
        
        if (sectionId === 'references_main') {
            return '';
        }

        return `<div class="alert alert-warning">Content generator for section ID '${sectionId}' not found.</div>`;
    }
    
    function generateFullPublicationHTML(allCohortStats, commonData) {
        if (!allCohortStats || !commonData) {
            return '<div class="alert alert-warning">Statistical data or common configuration is missing for publication generation.</div>';
        }

        let mainBodyHTML = '';
        window.PUBLICATION_CONFIG.sections.forEach(section => {
            if (['title_main', 'references_main', 'stard_checklist'].includes(section.id)) {
                return;
            }
            const sectionLabel = window.APP_CONFIG.UI_TEXTS.publicationTab.sectionLabels[section.labelKey] || section.labelKey;
            mainBodyHTML += `<section id="${section.id}"><h2>${sectionLabel}</h2>`;
            mainBodyHTML += generateSectionHTML(section.id, allCohortStats, commonData);
            mainBodyHTML += `</section>`;
        });
        
        let titlePageHTML = generateSectionHTML('title_main', allCohortStats, commonData);
        const abbreviationsHTML = _generateAbbreviationsHTML(mainBodyHTML);

        if (abbreviationsHTML) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = titlePageHTML;
            const keyResultsList = tempDiv.querySelector('h4+ul'); 
            if (keyResultsList) {
                keyResultsList.insertAdjacentHTML('afterend', abbreviationsHTML);
                titlePageHTML = tempDiv.innerHTML;
            }
        }
        
        const allReferences = commonData?.references || {};
        const { processedHtml, referencesHtml } = window.generators.referencesGenerator.processAndNumberReferences(mainBodyHTML, allReferences);
        
        const stardHtml = generateSectionHTML('stard_checklist', allCohortStats, commonData);

        return titlePageHTML + processedHtml + referencesHtml + stardHtml;
    }

    return Object.freeze({
        generateFullPublicationHTML,
        generateSectionHTML
    });

})();