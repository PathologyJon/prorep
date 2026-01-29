const GRADE_MAP = {
    "3+3=6": "1", "3+4=7": "2", "4+3=7": "3",
    "4+4=8": "4", "3+5=8": "4", "5+3=8": "4",
    "4+5=9": "5", "5+4=9": "5", "5+5=10": "5"
};

let currentPartIndex = 0;
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function addPart() {
    if (currentPartIndex >= 26) return;
    const letter = alphabet[currentPartIndex];
    const container = document.getElementById('parts-container');
    const html = `
        <div class="part-card" id="card-${letter}">
            <div class="part-header-row">
                <h4>Part ${letter}</h4>
                <div class="flex-row">
                    <select class="report-field p-diag" data-letter="${letter}">
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
                    <select class="report-field p-site-select" onchange="toggleSiteInput('${letter}')" data-letter="${letter}">
                        <option value="Right anterior">Right anterior</option>
                        <option value="Right mid">Right mid</option>
                        <option value="Right posterior">Right posterior</option>
                        <option value="Left anterior">Left anterior</option>
                        <option value="Left mid">Left mid</option>
                        <option value="Left posterior">Left posterior</option>
                        <option value="other">Other (Free text)...</option>
                    </select>
                    <input type="text" class="report-field p-site-text" id="site-text-${letter}" 
                           style="display: none; margin-top: 5px;" placeholder="Enter custom site...">
                </div>
                <div class="cancer-logic-container full-width" id="logic-${letter}">
                    <div class="input-grid">
                        <div class="field-group"><label>Gleason patterns</label><input type="text" class="report-field p-patterns"></div>
                        <div class="field-group"><label>Cores (Inv/Tot)</label>
                            <div class="flex-row"><input type="number" class="report-field p-pos" value="1"><span>/</span><input type="number" class="report-field p-total" value="1"></div>
                        </div>
                        <div class="field-group"><label>Aggregate total length (mm)</label><input type="number" class="report-field p-agg" step="0.1"></div>
                        <div class="field-group"><label>Max length in core (mm)</label><input type="number" class="report-field p-max" step="0.1"></div>
                    </div>
                </div>
            </div>
        </div>`;
    container.insertAdjacentHTML('beforeend', html);
    currentPartIndex++;
    attachListeners();
    updateReport();
}

function updateReport() {
    const isMalignant = document.getElementById('isMalignant').value;
    const reportOutput = document.getElementById('report-output');
    const malignantUI = document.getElementById('malignant-ui');
    const benignConfig = document.getElementById('benign-config');

    // 1. BENIGN CASE LOGIC
    if (isMalignant === 'no') {
        malignantUI.style.display = 'none';
        benignConfig.style.display = 'block';
        
        const count = parseInt(document.getElementById('benignPartCount').value) || 1;
        let labels = [];
        for (let i = 0; i < count; i++) { labels.push("Part " + alphabet[i]); }
        
        reportOutput.innerText = labels.join(' & ') + ':\nThese are cores of benign prostate tissue. No malignancy is identified in the multiple tissue planes examined.';
        return;
    }

    // 2. MALIGNANT CASE LOGIC
    malignantUI.style.display = 'block';
    benignConfig.style.display = 'none';

    let rPos = 0, rTot = 0, lPos = 0, lTot = 0, maxInvolved = 0;
    const gleasonVal = document.getElementById('gleason').value;
    const gg = GRADE_MAP[gleasonVal] || "";
    document.getElementById('gradeGroup').value = gg;

    let partReportText = "";
    const cards = document.querySelectorAll('.part-card');
    
    cards.forEach(card => {
        const letter = card.id.replace('card-', '');
        const diag = card.querySelector('.p-diag').value;
        const cancerBox = document.getElementById(`logic-${letter}`);
        const siteSel = card.querySelector('.p-site-select');
        const siteText = card.querySelector('.p-site-text');
        const siteValue = siteText.style.display === 'block' ? siteText.value : siteSel.value;

        partReportText += `Part ${letter} - ${siteValue}\n`;

        if (diag === 'adenocarcinoma') {
            cancerBox.style.display = 'block';
            const pos = parseInt(card.querySelector('.p-pos').value) || 0;
            const tot = parseInt(card.querySelector('.p-total').value) || 0;
            const agg = card.querySelector('.p-agg').value || 0;
            const max = parseFloat(card.querySelector('.p-max').value) || 0;

            partReportText += `Gleason patterns: ${card.querySelector('.p-patterns').value || '---'}\n`;
            partReportText += `${pos} / ${tot} cores invaded by tumour\n`;
            partReportText += `Aggregate total length of tumour: ${agg} mm\n`;
            partReportText += `Maximum length of tumour in any core: ${max} mm\n\n`;

            if (siteValue.toLowerCase().includes('right')) { rPos += pos; rTot += tot; }
            if (siteValue.toLowerCase().includes('left')) { lPos += pos; lTot += tot; }
            if (max > maxInvolved) maxInvolved = max;
        } else {
            cancerBox.style.display = 'none';
            partReportText += `Diagnosis: ${diag.toUpperCase()}\n\n`;
        }
    });

    // Update Summary UI
    document.getElementById('rightSummary').value = `${rPos} / ${rTot}`;
    document.getElementById('leftSummary').value = `${lPos} / ${lTot}`;
    document.getElementById('mostInvolvedLen').value = maxInvolved;

    // Final Report Assembly
    let report = `Cancer type: ${document.getElementById('cancerType').value}\n`;
    if (document.getElementById('ihc').value === 'yes') report += `IHC: Confirmed with absent staining of basal cells (CK5/6 and P63) and positive staining for racemase with AMACR/P504S.\n`;
    
    report += `Overall Gleason score: ${gleasonVal || '---'}\n`;
    report += `Total cores involved (Right): ${rPos} / ${rTot}\n`;
    report += `Total cores involved (Left): ${lPos} / ${lTot}\n`;
    report += `Overall prognostic grade group: ${gg || '---'}\n`;
    report += `Tumour length of most involved core: ${maxInvolved} mm\n`;
    report += `Perineural invasion: ${document.getElementById('pni').value}\n`;
    report += `Extra prostatic invasion: ${document.getElementById('epi').value}\n\n`; // Spacing before parts
    
    report += partReportText;
    reportOutput.innerText = report;
}

function toggleSiteInput(letter) {
    const card = document.getElementById(`card-${letter}`);
    const sel = card.querySelector('.p-site-select');
    const txt = card.querySelector('.p-site-text');
    if (sel.value === 'other') { sel.style.display = 'none'; txt.style.display = 'block'; txt.focus(); attachListeners(); }
    updateReport();
}

function removePart(letter) { document.getElementById(`card-${letter}`).remove(); updateReport(); }

function attachListeners() {
    document.querySelectorAll('.report-field').forEach(f => {
        f.removeEventListener('input', updateReport); f.addEventListener('input', updateReport);
        f.removeEventListener('change', updateReport); f.addEventListener('change', updateReport);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('isMalignant').addEventListener('change', updateReport);
    document.getElementById('benignPartCount').addEventListener('input', updateReport);
    addPart(); 
});

function copyToClipboard() {
    const text = document.getElementById('report-output').innerText;
    navigator.clipboard.writeText(text).then(() => alert("Report Copied"));
}