# Anwendungsbeschreibung: Nodal Staging Analysis Tool
**Version: 5.3.0-ajr-publication-final**

## Teil 1: Einleitung und Grundkonzepte

### 1.1. Wissenschaftlicher Auftrag der Anwendung

Das **Nodal Staging Analysis Tool** ist eine interaktive, webbasierte Forschungsumgebung, die speziell für die wissenschaftliche Untersuchung der MRT-basierten Diagnostik des Rektumkarzinoms entwickelt wurde. Ihr primäres Ziel ist die rigorose und reproduzierbare Analyse der diagnostischen Leistungsfähigkeit verschiedener Kriterien zur Bestimmung des mesorektalen Lymphknotenstatus (N-Status) auf Patientenebene.

Der wissenschaftliche Kern der Anwendung ist die vergleichende Evaluation des neuartigen, kontrastmittelgestützten **Avocado Signs (AS)**. Um eine umfassende Validierung zu gewährleisten, wird die Performance des AS gegen ein mehrstufiges System von T2-gewichteten (T2w) Vergleichsstandards gemessen:

1.  **Etablierte Literatur-Kriterien:** Direkt in der Anwendung implementierte und validierte Kriterien aus einflussreichen Publikationen und Konsensus-Empfehlungen von Fachgesellschaften (z. B. ESGAR, SAR).
2.  **Optimierter Daten-Benchmark:** Ein computergestützt ermitteltes "Best-Case-Szenario" für T2w-Kriterien. Mittels einer integrierten Brute-Force-Analyse identifiziert die Anwendung für jede Patientenkohorte die mathematisch leistungsstärkste Kombination aus morphologischen Merkmalen und logischen Verknüpfungen.

Die Anwendung unterstützt den gesamten wissenschaftlichen Prozess: von der explorativen Datenanalyse und interaktiven Kriteriendefinition über tiefgehende statistische Vergleiche bis hin zur automatisierten Generierung eines vollständigen, publikationsreifen Manuskriptentwurfs. Dieser Entwurf ist speziell auf die formalen und stilistischen Anforderungen des **American Journal of Roentgenology (AJR)** zugeschnitten.

### 1.2. Wichtiger Nutzungshinweis

**Haftungsausschluss:** Dieses Tool ist ausschließlich für wissenschaftliche Forschungs- und Lehrzwecke bestimmt. Die dargestellten Daten, Statistiken und generierten Texte basieren auf einem statischen, pseudonymisierten Forschungsdatensatz. **Die Ergebnisse und Funktionen dürfen unter keinen Umständen zur klinischen Diagnosestellung, zur direkten Behandlungsplanung oder für andere primärmedizinische Zwecke herangezogen werden.** Die wissenschaftliche, klinische und ethische Verantwortung für die Interpretation und Verwendung der Ergebnisse liegt vollumfänglich beim Anwender.

### 1.3. Das fundamentale Bedienkonzept: Das Dual-Kontext-System

Für eine methodisch saubere Analyse ist das Verständnis des dualen Kontext-Systems der Anwendung essenziell. Es wurde entwickelt, um maximale Flexibilität bei der Datenexploration zu ermöglichen und gleichzeitig absolute wissenschaftliche Strenge bei statistischen Vergleichen zu garantieren.

*   **Globaler Kohorten-Kontext:**
    *   **Steuerung:** Erfolgt über die drei Haupt-Buttons im Anwendungs-Header: `Overall`, `Surgery alone`, `Neoadjuvant therapy`.
    *   **Zweck:** Dient der allgemeinen, explorativen Analyse. Eine hier getroffene Auswahl filtert den Datensatz, der in den Tabs `Data` und `Analysis` sowie in der "Single View" des `Statistics`-Tabs angezeigt wird. Dies ist der primäre, vom Nutzer frei wählbare Arbeitskontext.

*   **Analyse-Kontext (Die methodische Sperre):**
    *   **Aktivierung:** Dieser Kontext wird **automatisch** aktiviert, sobald der Nutzer eine Analyse durchführt, die einen methodisch sauberen Vergleich erfordert. Dies geschieht in folgenden Situationen:
        *   Im `Comparison`-Tab, wenn ein T2-Kriterienset für den Vergleich mit dem AS ausgewählt wird.
        *   Im `Insights`-Tab, wenn Module wie die "Power Analysis" aufgerufen werden, die auf einem spezifischen Vergleich basieren.
        *   Im `Statistics`-Tab in der "Comparison View", die zwei Kohorten direkt gegenüberstellt.
    *   **Zweck:** Der Analyse-Kontext stellt sicher, dass statistische Vergleichstests (z.B. DeLong-Test) ausschließlich auf der korrekten, für diese spezifische Fragestellung validen Patientenkohorte durchgeführt werden. Wählt man z.B. ein Literatur-Kriterium, das nur für primär operierte Patienten validiert wurde, sperrt die Anwendung den Datenkontext temporär auf die "Surgery alone"-Kohorte.
    *   **Visuelles Feedback:** Während ein Analyse-Kontext aktiv ist, werden die globalen Kohorten-Buttons im Header **deaktiviert und ausgegraut**. Ein gut sichtbares, blaues Informationsbanner erscheint im aktiven Tab und informiert den Nutzer präzise über den aktiven Zustand, z.B.: `Analysis Context Active: Comparing against ESGAR 2016 (Surgery alone). Analysis is locked to the Surgery alone cohort (N=29) to ensure a methodologically valid comparison.`
    *   **Deaktivierung:** Die Sperre wird automatisch aufgehoben, sobald der Nutzer zu einem Tab wechselt, der keinen spezifischen Vergleichskontext erfordert (z.B. zurück zu `Data` oder `Publication`).

Dieses System ist das Herzstück der methodischen Integrität der Anwendung und verhindert fehlerhafte wissenschaftliche Schlussfolgerungen.

### 1.4. Initialer Start und Setup

Beim ersten Start der Anwendung oder wenn keine zwischengespeicherten Analyseergebnisse vorhanden sind, wird ein Dialogfenster angezeigt:

*   **Initial Analysis Setup:** Dieses Modal informiert den Nutzer darüber, dass für die Erstellung eines vollständigen Publikationsentwurfs eine einmalige, rechenintensive "Brute-Force-Analyse" für jede Patientenkohorte erforderlich ist.
    *   **Aktion `Yes, start the analysis`:** Startet die automatische, sequenzielle Analyse aller drei Kohorten. Ein Fortschrittsmodal wird angezeigt, das den genauen Verlauf visualisiert.
    *   **Aktion `No, I'll do it manually later`:** Schließt das Modal. Der Nutzer kann die Analyse später manuell im `Analysis`-Tab für jede Kohorte einzeln starten.

---

## Teil 2: Die Anwendungsmodule im Detail (Tab-Struktur)

Die Anwendung ist in sieben spezialisierte Module (Tabs) gegliedert.

### 2.1. Data-Tab

*   **Zweck:** Ansicht, Sortierung und Exploration des pseudonymisierten Patientendatensatzes. Arbeitet immer im **globalen Kohorten-Kontext**.
*   **Komponenten und Funktionen:**
    *   **Patiententabelle:** Eine voll interaktive Tabelle zeigt die Patienten der ausgewählten globalen Kohorte.
        *   **Spalten:** ID, Nachname, Vorname, Geschlecht, Alter, Therapie, N/AS/T2-Status (kompakter Überblick über den Befund von Pathologie, Avocado Sign und T2-Kriterien) und klinische Notizen.
        *   **Sortierung:** Ein Klick auf einen Spaltenkopf sortiert die Tabelle auf- oder absteigend. Ein visueller Indikator (Pfeil-Icon) zeigt die aktive Sortierung an.
        *   **Spezial-Sortierung:** Die Spalte "N/AS/T2" ermöglicht eine Sub-Sortierung. Ein Klick auf die kleinen Labels `N`, `AS` oder `T2` im Spaltenkopf sortiert die Tabelle spezifisch nach dem jeweiligen Status.
    *   **Detailansicht (Lymphknoten-Merkmale):** Bei Patienten mit erfassten T2-Lymphknoten ist die Tabellenzeile klickbar (erkennbar am `>`-Icon am Zeilenende). Ein Klick expandiert die Zeile und legt eine detaillierte Liste aller individuellen T2-Lymphknoten dieses Patienten frei. Für jeden Knoten werden seine morphologischen Eigenschaften (Größe, Form, Rand, Homogenität, Signalintensität) mit entsprechenden Icons und Werten angezeigt.
    *   **"Expand/Collapse All Details"-Button:** Ein globaler Schalter oberhalb der Tabelle, um die Detailansicht für alle Patienten in der aktuellen Ansicht gleichzeitig zu öffnen oder zu schließen.

### 2.2. Analysis-Tab

*   **Zweck:** Das interaktive "Labor" der Anwendung. Hier werden T2-Kriterien live definiert, ihre Auswirkungen analysiert und computergestützte Optimierungen durchgeführt. Arbeitet im **globalen Kohorten-Kontext**.
*   **Komponenten und Funktionen:**
    *   **Dashboard:** Eine Reihe von Diagrammen am oberen Rand visualisiert die Verteilung von Alter, Geschlecht, Therapie und der drei Status-Marker (N, AS, T2) für die aktuell ausgewählte globale Kohorte.
    *   **"Define T2 Criteria"-Karte:**
        *   **Kriterien-Schalter:** Jedes der fünf T2-Merkmale (Size, Shape, Border, Homogeneity, Signal) kann per Checkbox aktiviert oder deaktiviert werden.
        *   **Werte-Einstellung:** Für aktive Kriterien können die genauen Werte eingestellt werden (z.B. Größenschwellenwert per Schieberegler und Direkteingabe, Auswahl von "round" vs. "oval" per Button-Klick).
        *   **Logik-Schalter:** Ein prominenter Schalter (`AND`/`OR`) oben rechts legt die logische Verknüpfung der aktiven Kriterien fest.
        *   **Status-Indikator:** Die Karte zeigt durch einen gestrichelten Rahmen an, wenn die aktuellen Einstellungen noch nicht gespeichert wurden.
        *   **Aktions-Buttons:**
            *   `Reset to Default`: Setzt alle Kriterien auf den vordefinierten Standard zurück.
            *   `Apply & Save`: Übernimmt die aktuellen Einstellungen global für die gesamte Anwendung, berechnet alle T2-Status neu und speichert die Konfiguration dauerhaft im Browser.
    *   **"Diagnostic Performance"-Karte:** Zeigt in Echtzeit die diagnostische Güte (Sensitivität, Spezifität, PPV, NPV, Accuracy, AUC) der *aktuell im Definitions-Panel eingestellten T2-Kriterien*. Diese Karte reagiert sofort auf jede Änderung an den Kriterien und bietet so ein direktes Feedback.
    *   **"Criteria Optimization (Brute-Force)"-Karte:**
        *   **Start:** Der Nutzer wählt eine Zielmetrik (z.B. "Balanced Accuracy") und startet mit `Start` die Analyse. Ein Fortschrittsbalken informiert über den Verlauf.
        *   **Ergebnis:** Nach Abschluss wird das beste Ergebnis (höchster Wert der Zielmetrik) angezeigt. Mit `Apply Best` können die gefundenen optimalen Kriterien direkt in das Definitions-Panel geladen und anschließend gespeichert werden. `Top 10` öffnet eine modale Detailansicht der besten Ergebnisse.
    *   **"Brute-Force Optima (Saved Results)"-Karte:** Dient als persistenter Speicher. Sie zeigt eine Übersicht der besten Ergebnisse aller bisher durchgeführten Optimierungsläufe für jede Kohorte und Metrik. Ein Klick auf `Apply` lädt nicht nur die Kriterien, sondern schaltet auch den **globalen Kohorten-Kontext** automatisch auf die passende Kohorte um.

### 2.3. Statistics-Tab

*   **Zweck:** Formale und tiefgehende statistische Auswertung und Gegenüberstellung.
*   **Workflow & Komponenten:**
    *   **Ansichts-Umschalter:**
        *   `Single View`: Analysiert eine einzelne Kohorte, basierend auf der **globalen Kohortenauswahl**.
        *   `Comparison View`: Erlaubt die Auswahl von zwei Kohorten aus Dropdown-Menüs für einen direkten statistischen Vergleich. Hierbei wird der **Analyse-Kontext** aktiviert.
    *   **Statistik-Karten:** In beiden Ansichten werden dynamisch Karten generiert, die detaillierte Tabellen zu folgenden Aspekten enthalten:
        *   **Descriptive Statistics:** Demografie, Statusverteilungen, Lymphknoten-Statistiken.
        *   **Diagnostic Performance:** Tabellarische Auflistung aller Gütemetriken mit 95%-Konfidenzintervallen und Angabe der verwendeten statistischen Methode. Separate Karten für AS und die aktuell angewendeten T2-Kriterien.
        *   **Statistical Comparison:** Zeigt die Ergebnisse des direkten Vergleichs von AS vs. T2 (DeLong-Test für AUC, McNemar-Test für Accuracy).
        *   **Association Analysis:** Berechnet Odds Ratios (OR) und Risk Differences (RD) für einzelne Merkmale in Bezug auf den N-Status.
    *   **Criteria Comparison Table (nur in "Single View"):** Eine umfassende Tabelle, die die Performance des AS mit der Performance der *angewendeten* T2-Kriterien sowie einer kuratierten Liste von *Literatur-Kriterien* vergleicht. Hierbei wird der **Analyse-Kontext** intern genutzt, um sicherzustellen, dass die Performance-Werte der Literatur-Kriterien immer aus der methodologisch korrekten Kohorte stammen, was transparent in der Tabelle vermerkt wird.

### 2.4. Comparison-Tab

*   **Zweck:** Visueller und tabellarischer Direktvergleich des AS mit einem frei wählbaren T2-Benchmark unter Einhaltung methodischer Korrektheit durch den **Analyse-Kontext**.
*   **Workflow & Komponenten:**
    *   **Vergleichsbasis-Auswahl:** Ein zentrales Dropdown-Menü erlaubt die Auswahl des T2-Vergleichsstandards. Die Liste enthält alle Literatur-Kriterien sowie die gespeicherten Brute-Force-Optima.
    *   **Automatischer Analyse-Kontext:** Die Auswahl eines Kriteriums aktiviert sofort den **Analyse-Kontext** und sperrt die Kohorte auf die für diesen Vergleich passende Gruppe.
    *   **Dynamische Ausgabe:** Basierend auf der Auswahl werden gerendert:
        *   **Balkendiagramm:** Visualisiert die fünf Kernmetriken (Sens, Spez, PPV, NPV, AUC) für AS und den gewählten T2-Standard nebeneinander.
        *   **Vergleichstabelle:** Listet die Metriken mit 95% CIs auf und enthält eine `p-Value`-Spalte, die das Ergebnis des direkten statistischen Vergleichs anzeigt.
        *   **Info-Karte:** Beschreibt die Quelle, die Definition und die zugehörige Kohorte des ausgewählten T2-Vergleichsstandards.

### 2.5. Insights-Tab

*   **Zweck:** Bereitstellung von spezialisierten, weiterführenden Analysen.
*   **Workflow & Komponenten:**
    *   **Ansichts-Umschalter:** `Power Analysis` und `Aggregate Lymph Node Counts`.
    *   **Power Analysis:**
        *   **Funktion:** Ermöglicht Post-hoc-Poweranalysen und A-priori-Stichprobenkalkulationen für den Vergleich des AS mit einem auswählbaren T2-Literatur- oder Brute-Force-Kriterium.
        *   **Kontext:** Nutzt den **Analyse-Kontext** für methodisch korrekte Berechnungen.
    *   **Aggregate Lymph Node Counts:**
        *   **Funktion:** Bietet eine detaillierte Aufschlüsselung der Lymphknotenzahlen.
        *   **Kontextsensitive Anzeige:** Exklusiv in dieser Ansicht wird ein Banner mit der **Gesamtzahl aller evaluierten Lymphknoten** (Pathologie, T1-CE, T2w) der **globalen Kohorte** angezeigt. Zusätzlich kann ein Literatur-Kriterienset ausgewählt werden, um die resultierenden positiven vs. totalen Knoten für dieses spezifische Set und dessen zugehörige Kohorte zu sehen.

### 2.6. Publication-Tab

*   **Zweck:** Das finale Ausgabemodul. Es generiert einen vollständigen, wissenschaftlichen Manuskriptentwurf.
*   **Workflow & Komponenten:**
    *   **Struktur:** Die Ansicht ist in zwei Hauptbereiche geteilt: eine seitliche Navigationsleiste und den Hauptinhaltsbereich.
    *   **Navigationsleiste:**
        *   **Gesamtwortzahl:** Ganz oben wird die Gesamtzahl der Wörter des Manuskript-Hauptteils angezeigt.
        *   **Sektions-Links:** Eine klickbare Gliederung aller Manuskript-Abschnitte (Title Page, Abstract, Introduction, etc.).
        *   **Abschnittszähler:** Neben jedem relevanten Abschnitt wird die aktuelle Wort- bzw. Elementzahl angezeigt (z.B. `350` für Wörter im Abstract, `32` für Referenzen). Die Anzeige ist neutral gehalten und dient der Orientierung.
    *   **Inhaltsbereich:**
        *   **Dynamische Generierung:** Der Inhalt wird automatisch basierend auf den aktuellsten Analyseergebnissen generiert. Texte, Tabellen und Abbildungsplatzhalter werden in der korrekten Reihenfolge und Formatierung eingefügt.
        *   **AJR-Konformität:** Alle Formatierungen, insbesondere die Darstellung statistischer Werte (z.B. `P < .001`), folgen den Richtlinien des AJR.
        *   **Manuelle Bearbeitung:** Über einen `Edit`-Button kann der gesamte Inhalt manuell überarbeitet werden. Mit `Save` werden die Änderungen im Browser gespeichert, mit `Reset` wird der Text auf die letzte automatisch generierte Version zurückgesetzt.

### 2.7. Export-Tab

*   **Zweck:** Bereitstellung von Inhalten für die externe Weiterverwendung.
*   **Komponenten und Funktionen:** Bietet drei Hauptfunktionen per Button-Klick:
    *   `Export Full Manuscript as Markdown`: Erstellt eine `.md`-Datei des gesamten Manuskripts.
    *   `Export Tables as Markdown`: Extrahiert alle Tabellen und speichert sie als einzelne `.md`-Dateien.
    *   `Export Charts as SVG`: Extrahiert alle Diagramme als verlustfreie `.svg`-Vektorgrafiken.