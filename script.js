const GRADE_MAP = {
    "3+3=6": "1", "3+4=7": "2", "4+3=7": "3",
    "4+4=8": "4", "3+5=8": "4", "5+3=8": "4",
    "4+5=9": "5", "5+4=9": "5", "5+5=10": "5"
};

let currentPartIndex = 0;
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Validation: Ensures Involved <= Total
function validateData() {
    let isValid = true;
    document.querySelectorAll('.part-card').forEach(card => {
        if (card.querySelector('.p-diag').value === 'adenocarcinoma') {
            const pos = parseInt(card.querySelector('.p-pos').value) || 0;
            const tot = parseInt(card.querySelector('.p-total').value) || 0;
            const input = card.querySelector('.p-pos');
            if (pos > tot) { input.classList.add('validation-error'); isValid = false; } 
            else { input.classList.remove('validation-error'); }
        }
    });
    ['rightSummary', 'leftSummary'].forEach(id => {
        const field = document.getElementById(id);
        if (field.value.includes('/')) {
            const parts = field.value.split('/').map(s => parseInt(s.trim()));
            if (parts[0] > parts[1]) { field.classList.add('validation-error'); isValid = false; } 
            else { field.classList.remove('validation-error'); }
        }
    });
    document.getElementById('copyBtn').disabled = !isValid;
    return isValid;
}

function checkDuplicateSites() {
    const siteCounts = {};
    const cards = document.querySelectorAll('.part-card');
    let hasDuplicate = false;

    // First, clear all previous error styling
    cards.forEach(card => {
        card.querySelector('.p-site-select').classList.remove('validation-error');
    });

    cards.forEach(card => {
        const sel = card.querySelector('.p-site-select');
        const siteValue = sel.value;

        // Only track if it's not 'other'
        if (siteValue !== 'other') {
            if (siteCounts[siteValue]) {
                siteCounts[siteValue].push(sel);
                hasDuplicate = true;
            } else {
                siteCounts[siteValue] = [sel];
            }
        }
    });

    // If duplicates exist, highlight all boxes involved in the conflict
    if (hasDuplicate) {
        for (const site in siteCounts) {
            if (siteCounts[site].length > 1) {
                siteCounts[site].forEach(element => {
                    element.classList.add('validation-error');
                });
            }
        }
    }

    // Disable copy button if there's a duplicate
    document.getElementById('copyBtn').disabled = hasDuplicate;
    return hasDuplicate;
}

// Active Calculations
function calcSide(side) {
    let p = 0, t = 0;
    document.querySelectorAll('.part-card').forEach(card => {
        const d = card.querySelector('.p-diag').value;
        const s = card.querySelector('.p-site-text').style.display === 'block' ? card.querySelector('.p-site-text').value : card.querySelector('.p-site-select').value;
        if (s.toLowerCase().includes(side)) {
            p += parseInt(card.querySelector('.p-pos').value) || 0;
            t += parseInt(card.querySelector('.p-total').value) || 0;
        }
    });
    document.getElementById(`${side}Summary`).value = `${p} / ${t}`;
    updateReport();
}

// Automatically retrieve maximum length of involved core
function calcMaxLen() {
    let max = 0;
    document.querySelectorAll('.part-card').forEach(card => {
        if (card.querySelector('.p-diag').value === 'adenocarcinoma') {
            const v = parseFloat(card.querySelector('.p-max').value) || 0;
            if (v > max) max = v;
        }
    });
    document.getElementById('mostInvolvedLen').value = max;
    updateReport();
}

// Find if tumour is right side, left side or both

function getTumourSiteStatus() {
    const rVal = document.getElementById('rightSummary').value || "";
    const lVal = document.getElementById('leftSummary').value || "";

    // Helper to extract the first number from "X / Y"
    const countPos = (str) => {
        if (!str.includes('/')) return 0;
        return parseInt(str.split('/')[0].trim()) || 0;
    };

    const rightPos = countPos(rVal);
    const leftPos = countPos(lVal);

    if (rightPos > 0 && leftPos > 0) return "Both sides";
    if (rightPos > 0) return "Right side";
    if (leftPos > 0) return "Left side";
    return "None identified";
}

// Dynamic Part Addition
function addPart() {
    if (currentPartIndex >= 26) return;
    const letter = alphabet[currentPartIndex];
    
    const html = `
        <div class="part-card" id="card-${letter}">
            <div class="part-header-row">
                <h4>Part ${letter}</h4>
                <div class="flex-row">
                    <select class="report-field p-diag" onchange="updateReport()">
                        <option value="adenocarcinoma">Adenocarcinoma</option>
                        <option value="benign">Benign</option>
                        <option value="asap">ASAP</option>
                        <option value="pin">PIN</option>
                    </select>
                    <button type="button" class="btn-remove" onclick="removePart('${letter}')">Remove</button>
                </div>
            </div>

            <div class="input-grid">
                <div class="field-group full-width">
                    <label>Site</label>
                    <select class="report-field p-site-select" onchange="toggleSiteInput('${letter}')">
                        <option value="Right anterior">Right anterior</option>
                        <option value="Right mid">Right mid</option>
                        <option value="Right posterior">Right posterior</option>
                        <option value="Left anterior">Left anterior</option>
                        <option value="Left mid">Left mid</option>
                        <option value="Left posterior">Left posterior</option>
                        <option value="other">Other...</option>
                    </select>
                    <input type="text" class="report-field p-site-text" id="site-text-${letter}" style="display: none; margin-top: 5px;" placeholder="Custom site name...">
                </div>

                <div class="field-group">
                    <label id="label-cores-${letter}">Specimen Cores (Inv / Tot)</label>
                    <div class="flex-row">
                        <span class="inv-group-${letter}">
                            <input type="number" class="report-field p-pos" value="0"> 
                            <span style="margin: 0 5px;">/</span>
                        </span>
                        <input type="number" class="report-field p-total" value="1">
                    </div>
                </div>

                <div class="full-width" id="logic-${letter}">
                    <div class="input-grid" style="margin-bottom: 0; grid-template-columns: 1fr 1fr 1fr;">
                        <div class="field-group">
                            <label>Gleason patterns</label>
                            <input type="text" class="report-field p-patterns" placeholder="e.g. 3, 4">
                        </div>
                        <div class="field-group">
                            <label>Aggregate Length (mm)</label>
                            <input type="number" class="report-field p-agg" step="1">
                        </div>
                        <div class="field-group">
                            <label>Maximum Length (mm)</label>
                            <input type="number" class="report-field p-max" step="1">
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

    document.getElementById('parts-container').insertAdjacentHTML('beforeend', html);
    currentPartIndex++;
    
    // Refresh event listeners so the new fields trigger the updateReport function
    attachListeners();
    // Run updateReport to ensure the initial state (Adeno vs Benign) is correctly displayed
    updateReport();
}

function updateReport() {
    validateData();
    const isDuplicate = checkDuplicateSites();
    const isM = document.getElementById('isMalignant').value;
    const out = document.getElementById('report-output');
    const cards = document.querySelectorAll('.part-card');
    const consultant = document.getElementById('consultantName').value || "{Name}";

    if (isM === 'no') {
        document.getElementById('malignant-ui').style.display = 'none';
        document.getElementById('benign-config').style.display = 'block';
        let labels = [];
        const count = parseInt(document.getElementById('benignPartCount').value) || 1;
        for (let i = 0; i < count; i++) labels.push("Part " + alphabet[i]);
        out.innerText = labels.join(' & ') + '\nThese are cores of benign prostate tissue. No malignancy is identified in the multiple tissue planes examined.' + `\n\nReported by: Dr ${consultant}, Consultant Histopathologist`;
        return;
    }

    document.getElementById('malignant-ui').style.display = 'block';
    document.getElementById('benign-config').style.display = 'none';

    const gv = document.getElementById('gleason').value;
    const gg = GRADE_MAP[gv] || "";
    document.getElementById('gradeGroup').value = gg;
    const isG7 = (gv === "3+4=7" || gv === "4+3=7");
    document.getElementById('g7-details').style.display = isG7 ? 'grid' : 'none';

    const siteResult = getTumourSiteStatus();
    document.getElementById('tumourSite').value = siteResult;

    let partText = "";
    cards.forEach(card => {
        const letter = card.id.replace('card-', '');
        const d = card.querySelector('.p-diag').value;
        const s = card.querySelector('.p-site-text').style.display === 'block' ? card.querySelector('.p-site-text').value : card.querySelector('.p-site-select').value;
        const log = document.getElementById(`logic-${letter}`);

        partText += `Part ${letter} - ${s}: `;
        if (d === 'adenocarcinoma') {
            log.style.display = 'block';
            partText += `\n`;
            partText += `Gleason patterns in order of frequency: ${card.querySelector('.p-patterns').value || '---'}\n`;
            partText += `Number of cores invaded by tumour: ${card.querySelector('.p-pos').value} / ${card.querySelector('.p-total').value}\n`;
            partText += `Aggregate total length of tumour: ${card.querySelector('.p-agg').value || 0} mm\nMaximum length of tumour in any core: ${card.querySelector('.p-max').value || 0} mm\n\n`;
        } else {
            log.style.display = 'none';
            partText += `${d.toUpperCase()}\n\n`;
        }
    });    

        // Include benign cores as demoninator of core count
    document.querySelectorAll('.part-card').forEach(card => {
        const letter = card.id.replace('card-', '');
        const d = card.querySelector('.p-diag').value;
        
        // Target the specific UI elements for this part
        const invG = card.querySelector(`.inv-group-${letter}`);
        const lbl = document.getElementById(`label-cores-${letter}`);
        const logic = document.getElementById(`logic-${letter}`);

        // --- NEW LOGIC START ---
        if (d === 'adenocarcinoma') {
            invG.style.display = 'inline-block';      // Show the "Inv /" part
            lbl.innerText = "Specimen Cores (Inv/Tot)"; // Set the malignant label
            logic.style.display = 'block';            // Show Gleason/Length fields
        } else {
            invG.style.display = 'none';              // Hide the "Inv /" part
            lbl.innerText = "Total cores";            // Set the benign label
            card.querySelector('.p-pos').value = 0;   // Force Involved to 0 for math
            logic.style.display = 'none';             // Hide Gleason/Length fields
        }
    });

    let r = `Cancer type: ${document.getElementById('cancerType').value}\n`;
    if (document.getElementById('ihc').value === 'yes') r += `Confirmed with absent staining of basal cells using CK5/6 and p63, and positive staining for Racemase (AMACR) using P504S\n`;
    r += `Overall Gleason score: ${gv || '---'}\n`;
    r += `Prognostic Grade Group: ${gg}\n`;
    if (isG7) r += `Cribriform morphology: ${document.getElementById('cribriform').value}\nPercent Pattern 4: ${document.getElementById('percent4').value}%\n\n`;
    r += `Maximum length in any core: ${document.getElementById('mostInvolvedLen').value} mm\n\n`;
    r += `Tumour site: ${siteResult}\n`;
    r += `Right side: ${document.getElementById('rightSummary').value} cores positive for tumour\nLeft side: ${document.getElementById('leftSummary').value} cores positive for tumour \n\n`
    r += `Perineural invasion: ${document.getElementById('pni').value}\nExtra prostatic invasion: ${document.getElementById('epi').value}\n\n${partText}`;
    r += `\n\nReported by: Dr ${consultant}, Consultant Histopathologist`;
    out.innerText = r;

}

// COPIES DATA TO CLIPBOARD IN CSV FORMAT (ONE ROW PER SPECIMEN)
function copyCSVToClipboard() {
    const headers = ["Overall_Gleason", "Overall_GG", "PNI", "EPI", "Part", "Site", "Diagnosis", "Part_Gleason", "Part_Inv", "Part_Total", "Part_MaxLen"];
    const rows = [headers.join(",")];

    document.querySelectorAll('.part-card').forEach(card => {
        const letter = card.id.replace('card-', '');
        const d = card.querySelector('.p-diag').value;
        const s = card.querySelector('.p-site-text').style.display === 'block' ? card.querySelector('.p-site-text').value : card.querySelector('.p-site-select').value;
        
        const row = [
            document.getElementById('gleason').value, 
            document.getElementById('gradeGroup').value,
            document.getElementById('pni').value, 
            document.getElementById('epi').value,
            letter, 
            s, 
            d,
            d === 'adenocarcinoma' ? card.querySelector('.p-patterns').value : "N/A",
            d === 'adenocarcinoma' ? card.querySelector('.p-pos').value : "0",
            d === 'adenocarcinoma' ? card.querySelector('.p-total').value : "0",
            d === 'adenocarcinoma' ? card.querySelector('.p-max').value : "0"
        ];
        rows.push(row.map(v => `"${v}"`).join(","));
    });

    navigator.clipboard.writeText(rows.join("\n")).then(() => alert("CSV Copied! Ready for Excel."));
}

function toggleSiteInput(l) {
    const c = document.getElementById(`card-${l}`);
    const sel = c.querySelector('.p-site-select');
    const txt = c.querySelector('.p-site-text');
    if (sel.value === 'other') { sel.style.display = 'none'; txt.style.display = 'block'; txt.focus(); }
    updateReport();
}

function removePart(l) { document.getElementById(`card-${l}`).remove(); updateReport(); }

function attachListeners() {
    document.querySelectorAll('.report-field').forEach(f => {
        f.addEventListener('input', updateReport);
        f.addEventListener('change', updateReport);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('isMalignant').addEventListener('change', updateReport);
    document.getElementById('benignPartCount').addEventListener('input', updateReport);
    document.getElementById('consultantName').addEventListener('input', updateReport); // Trigger update on name change
    loadConsultant(); // Load the saved name
    addPart();
});

function copyToClipboard() {
    navigator.clipboard.writeText(document.getElementById('report-output').innerText).then(() => alert("LIMS Report Copied!"));
}

// Saves the name to the browser so it's there next time you visit
function saveConsultant() {
    const name = document.getElementById('consultantName').value;
    localStorage.setItem('preferredConsultant', name);
    alert("Name saved for future reports!");
}

// Loads the name automatically when the page opens
function loadConsultant() {
    const savedName = localStorage.getItem('preferredConsultant');
    if (savedName) {
        document.getElementById('consultantName').value = savedName;
    }
}