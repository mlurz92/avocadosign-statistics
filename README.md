# Nodal Staging Analysis Tool: Avocado Sign vs. T2 Criteria

![Version](https://img.shields.io/badge/version-5.3.0--analysis--only-blue)
![Architecture](https://img.shields.io/badge/architecture-client--side--SPA-orange)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-production--ready-success)

## 1. Executive Summary & Scientific Purpose

The **AvocadoSign Insights** application is a specialized, high-performance research tool designed for the rigorous statistical evaluation of MRI-based nodal staging in rectal cancer. Its primary purpose is to compare the diagnostic accuracy of the **"Avocado Sign"** (a novel morphological marker) against standard and experimental **T2-weighted MRI criteria**.

Unlike static statistical software, this tool features a **Reactive Analysis Engine** that allows researchers to:
1.  **Dynamically Redefine Malignancy:** Instantly observe how changing T2 criteria thresholds (e.g., size cutoff, border irregularity) impacts diagnostic performance.
2.  **Optimize Algorithmically:** Use brute-force permutation testing to discover mathematically optimal criteria sets.
3.  **Compare Methodologies:** Perform head-to-head statistical comparisons (McNemar, ROC) between the Avocado Sign and literature benchmarks.

---

## 2. Technical Architecture

The application is built as a **modern, server-less Single Page Application (SPA)** that runs entirely in the client's browser.

* **Core:** Vanilla JavaScript (ES6+), adhering to a modular Service-Oriented Architecture.
* **No Build Step:** The application uses native ES Modules (`import/export`). It can be hosted on any static file server or run locally without Node.js compilation.
* **Multithreading:** Computationally intensive tasks (Brute-Force Optimization) are offloaded to **Web Workers** to ensure the UI remains responsive (60fps) during calculations.
* **Dependencies:**
    * **D3.js (v7):** For high-precision, vector-based data visualization (ROC curves, Histograms, Flowcharts).
    * **Bootstrap 5.3:** For the responsive grid system and UI components (Modals, Toasts).
    * **Tippy.js:** For context-aware tooltips.
    * **FontAwesome 6:** For UI iconography.

---

## 3. Data Model & Input Specification

The application consumes a raw dataset (`data/data.js`) structured as a JSON array. Each patient object adheres to the following schema:

```json
{
  "id": "String (Unique Patient ID)",
  "nStatus": "String ('N0', 'N1', 'N1a', 'N1b', 'N2', 'N2a', 'N2b')",
  "t2Nodes": [
    {
      "size": "Number (Short-axis diameter in mm)",
      "shape": "String ('round' | 'oval' | 'irregular')",
      "border": "String ('smooth' | 'irregular' | 'spiculated')",
      "signal": "String ('homogeneous' | 'heterogeneous')",
      "avocadoSign": "Boolean (true = positive sign, false = negative)"
    }
  ]
}

```

* **N-Stage Parsing:** The application automatically maps detailed N-stages (e.g., N1a, N2b) to binary outcomes (N+ vs. N0) for statistical analysis.
* **Node Aggregation:** Patient-level diagnosis is determined by the "worst" node. If *any* node meets the malignancy criteria, the patient is classified as positive.

---

## 4. Comprehensive Feature Walkthrough

### 4.1. Global Controls & Cohort Management

Located in the sticky header, these controls affect the entire application state:

* **Cohort Selection:** Instantly filters the dataset into:
* **Overall:** Full dataset ().
* **Surgery Alone:** Patients with primary surgery (). Useful for assessing native nodal morphology without treatment artifacts.
* **Neoadjuvant Therapy:** Patients treated with CRT/TNT (). Useful for assessing restaging accuracy.


* **Quick Guide:** Modal overlay explaining core concepts.

### 4.2. Data Tab (Raw Data Inspection)

A tabular view of the filtered dataset.

* **Columns:** Patient ID, pN Status (Ground Truth), T2 Status (Computed based on current criteria), Avocado Sign Status.
* **Interactivity:**
* **Sorting:** Multi-level sorting (e.g., by N-Status, then Size).
* **Row Expansion:** Clicking a patient row reveals the specific attributes (Size, Shape, etc.) of every lymph node associated with that patient.



### 4.3. Analysis Tab (The Core Engine)

This tab controls the definition of "T2 Malignancy".

#### A. Manual Criteria Builder

* **Size Threshold:** A slider/input control allowing precision adjustment in **0.5mm increments**.
* **Morphological Features:** Boolean toggles for **Shape** (Round/Irregular), **Border** (Irregular/Spiculated), **Heterogeneity**, and **Signal Intensity**.
* **Logic Gate:**
* **OR Logic:** Malignant if (Size > Threshold) **OR** (Any selected feature is present). *High Sensitivity.*
* **AND Logic:** Malignant if (Size > Threshold) **AND** (Any selected feature is present). *High Specificity.*


* **Real-Time Feedback:** Updating any control immediately triggers a recalculation of the Confusion Matrix and Key Metrics (Sens/Spec/Acc).

#### B. Brute-Force Optimization

An algorithmic tool to find the "Best Case" T2 criteria.

* **Methodology:** The system generates every possible permutation of:
* Size thresholds (min to max in 0.5mm steps).
* Combinations of the 4 morphological features ( subsets).
* Logic operators (AND/OR).


* **Execution:** Runs asynchronously in a dedicated Web Worker to prevent UI freezing.
* **Target Metrics:** Optimization can be targeted for:
* **Balanced Accuracy:** .
* **Youden Index:** .
* **F1-Score:** Harmonic mean of PPV and Sensitivity.
* **AUC:** Area Under the ROC Curve.


* **Result Management:** The top 10 performing combinations are displayed. Users can "Apply" the best result directly to the Manual Criteria Builder. Results are cached per cohort.

### 4.4. Statistics Tab (Detailed Evaluation)

Offers two layout modes: **Single View** (Current Cohort) and **Comparison View** (Side-by-Side).

* **Descriptive Statistics:**
* **Demographics:** Age distribution (Histogram with KDE approximation), Sex (Pie Chart).
* **Tumor Characteristics:** T-Stage distribution, Distance from Anal Verge.


* **Diagnostic Performance:**
* **Confusion Matrix:** Absolute counts of TP, TN, FP, FN.
* **Detailed Metrics Table:** Calculates Sensitivity, Specificity, PPV, NPV, Positive/Negative Likelihood Ratios (LR+, LR-), Accuracy, Youden Index.
* **Confidence Intervals:** All metrics include **95% Confidence Intervals** calculated using the **Wilson Score Interval** method for robust estimation even at small sample sizes.


* **Visualization:**
* **ROC Curve:** Interactive SVG plot with AUC calculation.
* **Feature Importance (Forest Plot):** Calculates **Odds Ratios (OR)** for each individual T2 feature to quantify its association with malignancy (pN+).
* **Flowchart:** A Sankey-like diagram visualizing the flow of patients from the Total Cohort -> Index Test Result -> Reference Standard validation.



### 4.5. Comparison Tab (Hypothesis Testing)

Facilitates rigorous statistical comparison between the Avocado Sign and T2 Criteria.

* **Analysis Context:** When a comparison is active, the application "locks" the global cohort to ensure valid, apples-to-apples comparisons (e.g., comparing against ESGAR criteria forces the context to the cohort applicable to ESGAR).
* **Comparison Modes:**
* **vs. User Defined:** Compare against the current settings in the Analysis Tab.
* **vs. Literature:** Compare against built-in definitions (ESGAR, Mercury Study, Brown et al.).
* **vs. Brute-Force:** Compare against the mathematically optimal T2 criteria found earlier.


* **Statistical Tests:**
* **McNemar's Test:** Calculates the  statistic and P-value for paired nominal data to test if the difference in accuracy is significant.
* **DeLong's Method (Equivalent):** Statistical comparison of AUCs.


* **Visual Output:** Overlaid ROC curves and grouped bar charts (Sensitivity/Specificity).

### 4.6. Insights Tab (Deep Dive)

* **Mismatch Analysis:** Generates lists of specific patients where the diagnostic methods disagree:
* *Avocado Superior:* (AS correct, T2 incorrect).
* *T2 Superior:* (T2 correct, AS incorrect).
* Useful for case reviews to understand failure modes.


* **Added Value Analysis:**
* Analyzes the performance of the Avocado Sign **within the subgroup of T2-False Positives** (Specificity rescue).
* Analyzes performance **within T2-False Negatives** (Sensitivity rescue).


* **Power Analysis:** Post-hoc calculation of statistical power () based on sample size, , and observed effect size.

### 4.7. Export Tab

* **Vector Export:** Allows downloading all generated charts as **SVG files**.
* **Clean-up:** Automatically strips UI-specific styling (shadows, backgrounds) to produce publication-ready figures.

---

## 5. Mathematical Methodology

The application employs rigorous statistical methods:

* **Confidence Intervals:** Wilson Score Interval (continuity corrected where appropriate).
* **Odds Ratio (OR):**  from the  contingency table.
* **Likelihood Ratios:** ; .
* **McNemar's Test:**  for discordant pairs.

---

## 6. Installation & Usage

1. **Clone:** Clone the repository to a local machine.
2. **Data Setup:** Ensure `data/data.js` is populated with valid JSON data.
3. **Run:** Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari).
* *Note:* Due to CORS policies on some browsers, strict file:// access might be restricted for Web Workers. It is recommended to use a simple local server (e.g., VS Code Live Server, or `python -m http.server`).



---

*© 2025 Medical Research Tool - Avocado Sign Project*
