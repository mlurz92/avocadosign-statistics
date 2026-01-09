window.dataProcessor = (() => {

    function calculateAge(birthDateStr, examDateStr) {
        if (!birthDateStr || !examDateStr) return null;
        try {
            const birthDate = new Date(birthDateStr);
            const examDate = new Date(examDateStr);
            if (isNaN(birthDate.getTime()) || isNaN(examDate.getTime()) || birthDate > examDate) {
                return null;
            }
            let age = examDate.getFullYear() - birthDate.getFullYear();
            const monthDiff = examDate.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && examDate.getDate() < birthDate.getDate())) {
                age--;
            }
            return age >= 0 ? age : null;
        } catch (e) {
            return null;
        }
    }

    function processSinglePatient(rawPatient, index) {
        const p = {};
        
        p.id = typeof rawPatient.id === 'number' ? rawPatient.id : index + 1;
        p.lastName = typeof rawPatient.lastName === 'string' ? rawPatient.lastName.trim() : 'Unknown';
        p.firstName = typeof rawPatient.firstName === 'string' ? rawPatient.firstName.trim() : '';
        p.birthDate = rawPatient.birthDate || null;
        p.examDate = rawPatient.examDate || null;
        p.sex = (rawPatient.sex === 'm' || rawPatient.sex === 'f') ? rawPatient.sex : 'unknown';
        p.therapy = (rawPatient.therapy === 'surgeryAlone' || rawPatient.therapy === 'neoadjuvantTherapy') ? rawPatient.therapy : 'unknown';
        p.nStatus = (rawPatient.nStatus === '+' || rawPatient.nStatus === '-') ? rawPatient.nStatus : null;
        p.asStatus = (rawPatient.asStatus === '+' || rawPatient.asStatus === '-') ? rawPatient.asStatus : null;

        const validateCount = (value) => (typeof value === 'number' && value >= 0 && Number.isInteger(value)) ? value : 0;
        p.countPathologyNodes = validateCount(rawPatient.pathologyTotalNodeCount);
        p.countPathologyNodesPositive = validateCount(rawPatient.pathologyPositiveNodeCount);
        p.countASNodes = validateCount(rawPatient.asTotalNodeCount);
        p.countASNodesPositive = validateCount(rawPatient.asPositiveNodeCount);

        p.isMetastatic = p.nStatus === '+';

        p.notes = typeof rawPatient.notes === 'string' ? rawPatient.notes.trim() : '';
        p.age = calculateAge(p.birthDate, p.examDate);

        p.t2Nodes = Array.isArray(rawPatient.t2Nodes) 
            ? rawPatient.t2Nodes.map(lk => (lk && typeof lk === 'object') ? { ...lk } : null).filter(lk => lk !== null)
            : [];
        
        p.countT2Nodes = p.t2Nodes.length;
        p.t2Status = null;
        p.countT2NodesPositive = 0;
        p.t2NodesEvaluated = [];

        return p;
    }

    function processAllData(rawData) {
        if (!Array.isArray(rawData)) return [];
        if (typeof window.APP_CONFIG === 'undefined') return [];
        return rawData.map((patient, index) => processSinglePatient(patient, index));
    }

    function filterDataByCohort(data, cohortId) {
        if (!Array.isArray(data)) return [];
        
        if (cohortId === window.APP_CONFIG.COHORTS.OVERALL.id) {
            return cloneDeep(data);
        }

        const cohortConfig = Object.values(window.APP_CONFIG.COHORTS).find(c => c.id === cohortId);
        if (cohortConfig && cohortConfig.therapyValue) {
            return cloneDeep(data.filter(p => p && p.therapy === cohortConfig.therapyValue));
        }
        
        return [];
    }

    return Object.freeze({
        processAllData,
        filterDataByCohort
    });

})();