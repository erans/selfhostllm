// ASCII Art Style - NPU Circuit Board (PC version)
const asciiArt = ` ██▓███   ▄████▄      ███▄    █  ██▓███   █    ██     ██▓     ██▓     ███▄ ▄███▓
▓██░  ██▒▒██▀ ▀█      ██ ▀█   █ ▓██░  ██▒ ██  ▓██▒   ▓██▒    ▓██▒    ▓██▒▀█▀ ██▒
▓██░ ██▓▒▒▓█    ▄    ▓██  ▀█ ██▒▓██░ ██▓▒▓██  ▒██░   ▒██░    ▒██░    ▓██    ▓██░
▒██▄█▓▒ ▒▒▓▓▄ ▄██▒   ▓██▒  ▐▌██▒▒██▄█▓▒ ▒▓▓█  ░██░   ▒██░    ▒██░    ▒██    ▒██ 
▒██▒ ░  ░▒ ▓███▀ ░   ▒██░   ▓██░▒██▒ ░  ░▒▒█████▓    ░██████▒░██████▒▒██▒   ░██▒
▒▓▒░ ░  ░░ ░▒ ▒  ░   ░ ▒░   ▒ ▒ ▒▓▒░ ░  ░░▒▓▒ ▒ ▒    ░ ▒░▓  ░░ ▒░▓  ░░ ▒░   ░  ░
░▒ ░       ░  ▒      ░ ░░   ░ ▒░░▒ ░     ░░▒░ ░ ░    ░ ░ ▒  ░░ ░ ▒  ░░  ░      ░
░░       ░              ░   ░ ░ ░░        ░░░ ░ ░      ░ ░     ░ ░   ░      ░   
         ░ ░                  ░             ░            ░  ░    ░  ░       ░   
         ░                                                                      
`;

// Display ASCII art on page load
function displayAsciiArt() {
    const asciiElement = document.getElementById('ascii-art');
    if (asciiElement) {
        asciiElement.textContent = asciiArt;
    }
}

// Update PC specs when a configuration is selected
function updatePCSpecs() {
    const pcConfig = document.getElementById('pc-config');
    const ramInput = document.getElementById('total-ram');

    if (pcConfig.value) {
        const selectedOption = pcConfig.options[pcConfig.selectedIndex];
        const ram = selectedOption.getAttribute('data-ram');

        if (ram) ramInput.value = ram;

        checkCompatibility();
    }
}

// Update bandwidth when RAM type changes
function updateBandwidth() {
    checkCompatibility();
}

// Update model selection and check compatibility
function updateModelSelection() {
    checkCompatibility();
}

// Get memory bandwidth from PC config
function getRamBandwidth() {
    const pcConfig = document.getElementById('pc-config');
    if (pcConfig.value) {
        const selectedOption = pcConfig.options[pcConfig.selectedIndex];
        return parseFloat(selectedOption.getAttribute('data-bandwidth')) || 100;
    }
    return 100; // Default bandwidth
}

// Get NPU TOPS from PC config
function getNpuTops() {
    const pcConfig = document.getElementById('pc-config');
    if (pcConfig.value) {
        const selectedOption = pcConfig.options[pcConfig.selectedIndex];
        return parseFloat(selectedOption.getAttribute('data-npu')) || 50;
    }
    return 50; // Default TOPS
}

// Calculate NPU performance estimate (tokens/second)
function calculateNPUPerformance(modelMemory, quantization, contextLength, npuTops, bandwidth) {
    const modelPreset = document.getElementById('model-preset');
    const modelParams = parseFloat(modelPreset.value) || 7;

    // NPU efficiency varies by model size
    let npuEfficiency = 1.0;
    if (modelParams <= 7) {
        npuEfficiency = 1.0;  // Best for small models
    } else if (modelParams <= 13) {
        npuEfficiency = 0.85;
    } else if (modelParams <= 30) {
        npuEfficiency = 0.65;
    } else {
        npuEfficiency = 0.4;  // Large models struggle on NPU
    }

    // Quantization boost for NPU
    let quantBoost = 1.0;
    if (quantization === 0.25) {
        quantBoost = 2.5;  // INT4 is ideal for NPU
    } else if (quantization === 0.5) {
        quantBoost = 1.8;  // INT8 is good for NPU
    } else if (quantization === 0.75) {
        quantBoost = 1.3;  // FP8
    } else {
        quantBoost = 0.5;  // FP16 is terrible for NPU
    }

    // Context length penalty
    let contextPenalty = 1.0;
    if (contextLength > 32768) {
        contextPenalty = 0.85;
    } else if (contextLength > 65536) {
        contextPenalty = 0.7;
    }

    // TOPS contribution
    const topsBoost = npuTops / 50;  // Normalized to 50 TOPS baseline

    // Bandwidth contribution (NPU is less bandwidth-bound than GPU)
    const bandwidthBoost = (bandwidth / 100) * 0.3 + 0.7;  // Bandwidth has 30% weight

    // Base performance: ~20 tok/s on 50 TOPS with 7B INT4 model
    const basePerformance = 20;

    const tokensPerSec = basePerformance * npuEfficiency * quantBoost * contextPenalty * topsBoost * bandwidthBoost;

    return Math.max(1, tokensPerSec);  // Minimum 1 tok/s
}

// Main compatibility check function
function checkCompatibility() {
    const totalRam = parseFloat(document.getElementById('total-ram').value) || 32;
    const systemOverhead = parseFloat(document.getElementById('system-overhead').value) || 6;
    const modelPreset = document.getElementById('model-preset');
    const selectedOption = modelPreset.options[modelPreset.selectedIndex];
    const baseMemory = parseFloat(selectedOption.getAttribute('data-memory')) || 14;
    const quantization = parseFloat(document.getElementById('quantization').value) || 0.25;
    const contextLength = parseInt(document.getElementById('context-length').value) || 8192;
    const npuTops = 50; // Default, will be updated by PC config
    const bandwidth = getRamBandwidth();

    // Calculate adjusted model memory
    const adjustedModelMemory = baseMemory * quantization;

    // Calculate KV cache (approximate: 2 bytes per parameter per token for FP16, scaled by quantization)
    const modelParams = parseFloat(modelPreset.value) || 7;
    const kvCachePerToken = (modelParams * 2 * quantization) / 1024 / 1024; // Convert to GB
    const kvCache = kvCachePerToken * contextLength;

    // Available RAM for inference
    const availableRam = totalRam - systemOverhead;
    const totalRequired = adjustedModelMemory + kvCache;

    // Check compatibility
    const compatible = availableRam >= totalRequired;
    const margin = availableRam - totalRequired;

    // Show results section
    const resultsDiv = document.getElementById('results');
    resultsDiv.classList.remove('hidden');

    // Update result values
    document.getElementById('total-ram-display').textContent = `${totalRam.toFixed(0)} GB`;
    document.getElementById('npu-tops-display').textContent = `${npuTops} TOPS`;
    document.getElementById('memory-bandwidth').textContent = `${bandwidth.toFixed(0)} GB/s`;
    document.getElementById('available-ram').textContent = `${availableRam.toFixed(1)} GB`;
    document.getElementById('model-memory').textContent = `${adjustedModelMemory.toFixed(1)} GB`;
    document.getElementById('kv-cache-memory').textContent = `${kvCache.toFixed(1)} GB`;
    document.getElementById('total-memory-needed').textContent = `${totalRequired.toFixed(1)} GB`;
    document.getElementById('memory-margin').textContent = margin >= 0
        ? `+${margin.toFixed(1)} GB`
        : `${margin.toFixed(1)} GB`;

    // Display compatibility status
    const statusDiv = document.getElementById('compatibility-status');
    const copilotReady = npuTops >= 40;
    statusDiv.className = 'compatibility-status';

    if (compatible && margin >= 2) {
        statusDiv.classList.add('compatible');
        statusDiv.innerHTML = `
            <div class="compatibility-icon">✓</div>
            <div>COMPATIBLE - Your PC can run this model comfortably</div>
        `;
    } else if (compatible && margin >= 0) {
        statusDiv.classList.add('warning');
        statusDiv.innerHTML = `
            <div class="compatibility-icon">⚠</div>
            <div>TIGHT FIT - Model will run but with limited headroom</div>
        `;
    } else {
        statusDiv.classList.add('incompatible');
        statusDiv.innerHTML = `
            <div class="compatibility-icon">✗</div>
            <div>INCOMPATIBLE - Insufficient RAM for this configuration</div>
        `;
    }

    // Performance section
    const performanceSection = document.getElementById('performance-section');
    if (compatible) {
        performanceSection.style.display = 'block';

        const tokensPerSec = calculateNPUPerformance(baseMemory, quantization, contextLength, npuTops, bandwidth);

        // Update performance metrics
        document.getElementById('tokens-per-second').textContent = `${tokensPerSec.toFixed(2)} tokens/sec`;

        // Generation time for 100 tokens
        const genTime = tokensPerSec > 0 ? (100 / tokensPerSec).toFixed(1) : 'N/A';
        document.getElementById('generation-time').textContent = `${genTime} seconds`;

        // Performance rating
        let rating = '';
        let ratingClass = '';
        if (tokensPerSec > 25) {
            rating = '🟢 Excellent';
            ratingClass = 'excellent';
        } else if (tokensPerSec > 18) {
            rating = '🟢 Good';
            ratingClass = 'good';
        } else if (tokensPerSec > 12) {
            rating = '🟡 Moderate';
            ratingClass = 'moderate';
        } else if (tokensPerSec > 8) {
            rating = '🟡 Slow';
            ratingClass = 'slow';
        } else {
            rating = '🔴 Very Slow';
            ratingClass = 'very-slow';
        }

        const ratingElement = document.getElementById('performance-rating');
        ratingElement.textContent = rating;
        ratingElement.className = `metric-value ${ratingClass}`;

        // Performance notes
        const notesDiv = document.getElementById('performance-notes');
        const notes = [];

        if (tokensPerSec < 12) {
            notes.push('• Performance may feel slow for interactive use');
        }
        if (modelParams > 30) {
            notes.push('• Consider using iGPU instead of NPU for models >30B');
        }
        if (npuTops >= 48) {
            notes.push('• ✓ Excellent NPU - supports Copilot+ features');
        }
        if (quantization === 1.0) {
            notes.push('• ⚠ FP16 is not recommended for NPU - use INT4 or INT8 instead');
        }
        if (bandwidth >= 200) {
            notes.push('• ✓ Exceptional memory bandwidth for LLM inference');
        }

        notesDiv.innerHTML = notes.length > 0 ? `<h4>Performance Tips:</h4>${notes.join('<br>')}` : '';
    } else {
        performanceSection.style.display = 'none';
    }

    // Recommendations
    const recommendationsDiv = document.getElementById('recommendations');
    let recommendations = [];

    if (!compatible) {
        if (quantization > 0.25) {
            recommendations.push(`<li>Try INT4 quantization (currently ${quantization === 0.5 ? 'INT8' : quantization === 0.75 ? 'FP8' : 'FP16'}) to reduce memory by ${((1 - 0.25/quantization) * 100).toFixed(0)}%</li>`);
        }
        if (contextLength > 8192) {
            recommendations.push(`<li>Reduce context length from ${contextLength} to 8192 or less</li>`);
        }
        if (modelParams > 7) {
            recommendations.push(`<li>Try a smaller model (current: ${modelParams}B parameters)</li>`);
        }
        recommendations.push(`<li>Consider upgrading to ${Math.ceil((totalRequired + systemOverhead) / 16) * 16} GB RAM</li>`);
    } else {
        const tokensPerSec = calculateNPUPerformance(baseMemory, quantization, contextLength, npuTops, bandwidth);

        if (tokensPerSec < 15) {
            if (quantization > 0.25) {
                recommendations.push(`<li>Switch to INT4 quantization for better speed</li>`);
            }
            if (contextLength > 16384) {
                recommendations.push(`<li>Reduce context length to improve performance</li>`);
            }
            if (modelParams > 13) {
                recommendations.push(`<li>This model (${modelParams}B) may be too large for optimal NPU performance - consider using iGPU instead</li>`);
            }
        }

        if (npuTops < 40) {
            recommendations.push(`<li>⚠ Your NPU (${npuTops} TOPS) is below the 40 TOPS Copilot+ threshold</li>`);
        }

        if (bandwidth < 100) {
            recommendations.push(`<li>Consider faster RAM (current: ${bandwidth.toFixed(0)} GB/s) for better performance with larger models</li>`);
        }
    }

    if (recommendations.length > 0) {
        recommendationsDiv.innerHTML = `
            <h4>Recommendations:</h4>
            <ul>${recommendations.join('')}</ul>
        `;
    } else {
        recommendationsDiv.innerHTML = `
            <h4>Recommendations:</h4>
            <p>✓ Your configuration is optimal for this model!</p>
        `;
    }

    // Update URL
    updateURL();
}

// Share dialog functions
function showShareDialog() {
    const overlay = document.getElementById('overlay');
    const dialog = document.getElementById('shareDialog');
    const urlDiv = document.getElementById('shareUrl');

    urlDiv.textContent = window.location.href;
    overlay.style.display = 'block';
    dialog.style.display = 'block';
}

function closeShareDialog() {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('shareDialog').style.display = 'none';
}

function copyShareLink() {
    const urlDiv = document.getElementById('shareUrl');
    const textArea = document.createElement('textarea');
    textArea.value = urlDiv.textContent;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);

    alert('Link copied to clipboard!');
}

// Show explanation dialog
function showHowCalculated(event) {
    event.preventDefault();
    const dialog = document.getElementById('explanationDialog');
    const overlay = document.getElementById('overlay');

    overlay.style.display = 'block';
    dialog.style.display = 'block';
}

// Close explanation dialog
function closeExplanationDialog() {
    const dialog = document.getElementById('explanationDialog');
    const overlay = document.getElementById('overlay');

    dialog.style.display = 'none';
    overlay.style.display = 'none';
}

// Show performance explanation dialog
function showPerformanceExplanation(event) {
    event.preventDefault();
    const dialog = document.getElementById('performanceExplanationDialog');
    const overlay = document.getElementById('overlay');

    overlay.style.display = 'block';
    dialog.style.display = 'block';
}

// Close performance explanation dialog
function closePerformanceExplanation() {
    const dialog = document.getElementById('performanceExplanationDialog');
    const overlay = document.getElementById('overlay');

    dialog.style.display = 'none';
    overlay.style.display = 'none';
}

// URL parameter management
function updateURL() {
    const params = new URLSearchParams();
    params.set('ram', document.getElementById('total-ram').value);
    params.set('overhead', document.getElementById('system-overhead').value);
    params.set('model', document.getElementById('model-memory').value);
    params.set('quant', document.getElementById('quantization').value);
    params.set('context', document.getElementById('context-length').value);
    params.set('npu', document.getElementById('npu-tops').value);
    params.set('ramtype', document.getElementById('ram-type').value);

    const pcConfig = document.getElementById('pc-config').value;
    if (pcConfig) params.set('config', pcConfig);

    const newURL = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newURL);
}

function loadFromURL() {
    const params = new URLSearchParams(window.location.search);

    if (params.has('ram')) document.getElementById('total-ram').value = params.get('ram');
    if (params.has('overhead')) document.getElementById('system-overhead').value = params.get('overhead');
    if (params.has('model')) document.getElementById('model-memory').value = params.get('model');
    if (params.has('quant')) document.getElementById('quantization').value = params.get('quant');
    if (params.has('context')) document.getElementById('context-length').value = params.get('context');
    if (params.has('npu')) document.getElementById('npu-tops').value = params.get('npu');
    if (params.has('ramtype')) document.getElementById('ram-type').value = params.get('ramtype');
    if (params.has('config')) document.getElementById('pc-config').value = params.get('config');

    if (params.size > 0) {
        checkCompatibility();
    }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    displayAsciiArt();
    loadFromURL();
});
