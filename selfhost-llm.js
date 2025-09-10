// URL parameter management
function updateURL() {
    const params = new URLSearchParams();
    
    // GPU Configuration
    const gpuType = document.getElementById('gpu-type').value;
    if (gpuType) params.set('gpu', gpuType);
    params.set('gpu_count', document.getElementById('gpu-count').value);
    params.set('sys_overhead', document.getElementById('system-overhead').value);
    
    // Model Configuration
    const modelInputType = document.querySelector('input[name="model-input-type"]:checked').value;
    params.set('model_type', modelInputType);
    
    if (modelInputType === 'preset') {
        params.set('model', document.getElementById('model-preset').value);
    } else if (modelInputType === 'parameters') {
        params.set('model_params', document.getElementById('model-parameters').value);
    } else if (modelInputType === 'memory') {
        params.set('model_memory', document.getElementById('model-memory-input').value);
    }
    
    // Quantization
    params.set('quant', document.getElementById('quantization').value);
    
    // Context Configuration
    const contextInputType = document.querySelector('input[name="context-input-type"]:checked').value;
    params.set('context_type', contextInputType);
    
    if (contextInputType === 'preset') {
        params.set('context', document.getElementById('context-preset').value);
    } else {
        params.set('context_custom', document.getElementById('context-custom').value);
    }
    
    // KV Cache
    params.set('kv_cache', document.getElementById('kv-cache-overhead').value);
    
    // Update URL without reloading page
    const newURL = window.location.pathname + '?' + params.toString();
    window.history.replaceState({}, '', newURL);
}

function loadFromURL() {
    const params = new URLSearchParams(window.location.search);
    
    // GPU Configuration
    if (params.has('gpu')) {
        document.getElementById('gpu-type').value = params.get('gpu');
        updateGPUSpecs();
    }
    if (params.has('gpu_count')) {
        document.getElementById('gpu-count').value = params.get('gpu_count');
    }
    if (params.has('sys_overhead')) {
        document.getElementById('system-overhead').value = params.get('sys_overhead');
    }
    
    // Model Configuration
    if (params.has('model_type')) {
        const modelType = params.get('model_type');
        document.querySelector(`input[name="model-input-type"][value="${modelType}"]`).checked = true;
        updateModelInputMethod();
        
        if (modelType === 'preset' && params.has('model')) {
            document.getElementById('model-preset').value = params.get('model');
        } else if (modelType === 'parameters' && params.has('model_params')) {
            document.getElementById('model-parameters').value = params.get('model_params');
        } else if (modelType === 'memory' && params.has('model_memory')) {
            document.getElementById('model-memory-input').value = params.get('model_memory');
        }
    }
    
    // Quantization
    if (params.has('quant')) {
        document.getElementById('quantization').value = params.get('quant');
    }
    
    // Context Configuration
    if (params.has('context_type')) {
        const contextType = params.get('context_type');
        document.querySelector(`input[name="context-input-type"][value="${contextType}"]`).checked = true;
        updateContextInputMethod();
        
        if (contextType === 'preset' && params.has('context')) {
            document.getElementById('context-preset').value = params.get('context');
        } else if (contextType === 'custom' && params.has('context_custom')) {
            document.getElementById('context-custom').value = params.get('context_custom');
        }
    }
    
    // KV Cache
    if (params.has('kv_cache')) {
        document.getElementById('kv-cache-overhead').value = params.get('kv_cache');
    }
    
    // Calculate after loading
    calculate();
}

// Get GPU memory bandwidth based on model
function getGPUBandwidth(gpuModel) {
    if (!gpuModel) return 0;
    
    const bandwidthMap = {
        // RTX 40 Series
        'rtx4090': 1008,
        'rtx4080': 736,
        'rtx4070ti': 504,
        'rtx4070': 504,
        'rtx4060ti': 288,
        'rtx4060ti8': 288,
        
        // RTX 30 Series
        'rtx3090ti': 936,
        'rtx3090': 936,
        'rtx3080ti': 912,
        'rtx3080': 760,
        
        // NVIDIA Professional
        'a100': 1600,  // 40GB variant
        'a100-80': 2000,  // 80GB variant
        'h100': 3000,
        'v100': 900,
        'rtx6000': 960,  // RTX 6000 Ada
        'l40s': 864,
        'l40': 864,
        'l4': 300,
        't4': 320,
        
        // AMD Radeon
        'rx7900xtx': 960,
        'rx7900xt': 800,
        
        // AMD Instinct
        'mi300x': 5325,
        'mi250x': 3200
    };
    
    return bandwidthMap[gpuModel] || 0;
}

// Calculate performance estimate
function calculatePerformance(modelMemory, quantization, contextLength, gpuModel, gpuCount) {
    const bandwidth = getGPUBandwidth(gpuModel) * gpuCount;
    if (!bandwidth) return null;
    
    // Get model parameters from preset if available
    let modelParams = 7;
    const modelInputType = document.querySelector('input[name="model-input-type"]:checked').value;
    if (modelInputType === 'preset') {
        const modelSelect = document.getElementById('model-preset');
        modelParams = parseFloat(modelSelect.value) || 7;
    } else if (modelInputType === 'parameters') {
        modelParams = parseFloat(document.getElementById('model-parameters').value) || 7;
    }
    
    // Model size efficiency factor (larger models are less efficient)
    let efficiency = 0.8;
    if (modelParams <= 7) {
        efficiency = 0.85;
    } else if (modelParams <= 30) {
        efficiency = 0.7;
    } else if (modelParams <= 70) {
        efficiency = 0.5;
    } else {
        efficiency = 0.3;
    }
    
    // Quantization speed boost
    let quantBoost = 1.0;
    if (quantization <= 0.25) {
        quantBoost = 2.5;
    } else if (quantization <= 0.3) {
        quantBoost = 2.2;
    } else if (quantization <= 0.5) {
        quantBoost = 1.8;
    } else if (quantization <= 0.75) {
        quantBoost = 1.3;
    }
    
    // Context length impact
    let contextImpact = 1.0;
    if (contextLength >= 131072) {
        contextImpact = 0.3;
    } else if (contextLength >= 32768) {
        contextImpact = 0.6;
    } else if (contextLength >= 8192) {
        contextImpact = 0.85;
    }
    
    // Multi-GPU scaling (not perfect linear scaling)
    let multiGpuScaling = 1.0;
    if (gpuCount > 1) {
        multiGpuScaling = 0.85 + (0.15 / gpuCount);
    }
    
    // Calculate tokens per second
    // Formula: (bandwidth / model_memory_gb) * efficiency * quant_boost * context_impact * scaling
    const baseSpeed = (bandwidth / modelMemory) * efficiency * quantBoost * contextImpact * multiGpuScaling;
    
    // Apply realistic scaling factor
    const tokensPerSecond = baseSpeed * 0.6; // Conservative estimate for datacenter GPUs
    
    return {
        tokensPerSecond: tokensPerSecond,
        bandwidth: bandwidth,
        efficiency: efficiency,
        quantBoost: quantBoost,
        contextImpact: contextImpact,
        multiGpuScaling: multiGpuScaling
    };
}

function updateGPUSpecs() {
    const select = document.getElementById('gpu-type');
    const vramInput = document.getElementById('vram-per-gpu');
    
    if (select.value) {
        const selectedOption = select.options[select.selectedIndex];
        const vram = selectedOption.getAttribute('data-vram');
        vramInput.value = vram;
    } else {
        vramInput.value = '';
    }
    
    calculate();
    if (typeof updateURL === 'function') updateURL();
}

function updateModelInputMethod() {
    const inputType = document.querySelector('input[name="model-input-type"]:checked').value;
    
    // Toggle visibility using hidden class
    document.getElementById('model-preset-group').classList.toggle('hidden', inputType !== 'preset');
    document.getElementById('model-parameters-group').classList.toggle('hidden', inputType !== 'parameters');
    document.getElementById('model-memory-group').classList.toggle('hidden', inputType !== 'memory');
    
    calculate();
}

function updateModelSelection() {
    const modelSelect = document.getElementById('model-preset');
    const selectedOption = modelSelect.options[modelSelect.selectedIndex];
    const defaultQuant = selectedOption.getAttribute('data-quant');
    
    // Set the quantization dropdown to the model's default
    if (defaultQuant) {
        document.getElementById('quantization').value = defaultQuant;
    }
    
    calculate();
    if (typeof updateURL === 'function') updateURL();
}

function updateContextInputMethod() {
    const inputType = document.querySelector('input[name="context-input-type"]:checked').value;
    
    // Toggle visibility using hidden class
    document.getElementById('context-preset-group').classList.toggle('hidden', inputType !== 'preset');
    document.getElementById('context-custom-group').classList.toggle('hidden', inputType !== 'custom');
    
    calculate();
}

function calculate() {
    const gpuCount = parseInt(document.getElementById('gpu-count').value) || 1;
    const vramPerGpu = parseFloat(document.getElementById('vram-per-gpu').value) || 0;
    const systemOverhead = parseFloat(document.getElementById('system-overhead').value) || 2;
    
    // Get model memory based on input method
    let modelMemory;
    const modelInputType = document.querySelector('input[name="model-input-type"]:checked').value;
    
    if (modelInputType === 'preset') {
        const modelSelect = document.getElementById('model-preset');
        const selectedOption = modelSelect.options[modelSelect.selectedIndex];
        // For MoE models, use active memory if available, otherwise use total memory
        const activeMemory = selectedOption.getAttribute('data-active-memory');
        if (activeMemory) {
            modelMemory = parseFloat(activeMemory);
        } else {
            modelMemory = parseFloat(selectedOption.getAttribute('data-memory')) || 14;
        }
    } else if (modelInputType === 'parameters') {
        const paramCount = parseFloat(document.getElementById('model-parameters').value) || 7;
        modelMemory = paramCount * 2; // Rough estimate: 2GB per billion parameters in FP16
    } else if (modelInputType === 'memory') {
        modelMemory = parseFloat(document.getElementById('model-memory-input').value) || 14;
    }
    
    // Get context length based on input method
    let contextLength;
    const contextInputType = document.querySelector('input[name="context-input-type"]:checked').value;
    
    if (contextInputType === 'preset') {
        contextLength = parseInt(document.getElementById('context-preset').value) || 4096;
    } else {
        contextLength = parseInt(document.getElementById('context-custom').value) || 4096;
    }
    
    const quantization = parseFloat(document.getElementById('quantization').value);
    const kvCacheOverhead = parseFloat(document.getElementById('kv-cache-overhead').value) / 100;
    
    // Calculate memory requirements
    const totalVRAM = gpuCount * vramPerGpu;
    const adjustedModelMemory = modelMemory * quantization;
    const kvCachePerRequest = (contextLength * adjustedModelMemory * kvCacheOverhead) / 1000; // Rough estimate
    const availableMemory = totalVRAM - systemOverhead - adjustedModelMemory;
    
    // Calculate concurrent requests
    const maxConcurrentRequests = availableMemory / kvCachePerRequest;
    const effectiveContext = contextLength;
    
    // Update results
    document.getElementById('total-vram').textContent = totalVRAM.toFixed(1) + ' GB';
    document.getElementById('model-memory').textContent = adjustedModelMemory.toFixed(1) + ' GB';
    document.getElementById('kv-cache-memory').textContent = kvCachePerRequest.toFixed(2) + ' GB';
    document.getElementById('available-memory').textContent = Math.max(0, availableMemory).toFixed(1) + ' GB';
    document.getElementById('concurrent-requests').textContent = Math.max(0, maxConcurrentRequests).toFixed(2);
    document.getElementById('effective-context').textContent = effectiveContext.toLocaleString() + ' tokens';
    
    // Show warnings
    const warningsDiv = document.getElementById('warnings');
    warningsDiv.innerHTML = '';
    
    if (availableMemory < 0) {
        warningsDiv.innerHTML += '<div class="warning">⚠ INSUFFICIENT MEMORY: Model requires more VRAM than available!</div>';
    }
    
    if (maxConcurrentRequests < 1 && availableMemory > 0) {
        warningsDiv.innerHTML += '<div class="warning">⚠ LOW MEMORY: Can handle less than 1 concurrent request with this context length!</div>';
    }
    
    // Calculate and display performance if GPU is selected
    const gpuType = document.getElementById('gpu-type').value;
    const performanceSection = document.getElementById('performance-section');
    
    if (gpuType && availableMemory >= 0 && performanceSection) {
        const perf = calculatePerformance(adjustedModelMemory, quantization, contextLength, gpuType, gpuCount);
        
        if (perf) {
            performanceSection.style.display = 'block';
            
            // Update performance metrics
            const tokensPerSec = perf.tokensPerSecond.toFixed(2);
            document.getElementById('tokens-per-second').textContent = `${tokensPerSec} tokens/sec`;
            
            // Generation time for 100 tokens
            const tokensPerSecNum = parseFloat(tokensPerSec);
            const genTime = tokensPerSecNum > 0 ? (100 / tokensPerSecNum).toFixed(1) : 'N/A';
            document.getElementById('generation-time').textContent = `${genTime} seconds`;
            
            // Performance rating
            let rating = '';
            let ratingClass = '';
            if (tokensPerSecNum > 100) {
                rating = '🟢 Excellent';
                ratingClass = 'excellent';
            } else if (tokensPerSecNum > 50) {
                rating = '🟢 Good';
                ratingClass = 'good';
            } else if (tokensPerSecNum > 25) {
                rating = '🟡 Moderate';
                ratingClass = 'moderate';
            } else if (tokensPerSecNum > 10) {
                rating = '🟡 Slow';
                ratingClass = 'slow';
            } else {
                rating = '🔴 Very Slow';
                ratingClass = 'very-slow';
            }
            
            const ratingElement = document.getElementById('performance-rating');
            if (ratingElement) {
                ratingElement.textContent = rating;
                ratingElement.className = `metric-value ${ratingClass}`;
            }
            
            // Performance notes
            const notesDiv = document.getElementById('performance-notes');
            if (notesDiv) {
                let notes = [];
                
                if (tokensPerSecNum < 25) {
                    notes.push('• Consider stronger quantization (INT4) for better speed');
                }
                if (contextLength > 32768 && tokensPerSecNum < 50) {
                    notes.push('• Reduce context length for faster generation');
                }
                if (gpuCount === 1 && tokensPerSecNum < 30) {
                    notes.push('• Consider adding more GPUs for better performance');
                }
                if (tokensPerSecNum > 50) {
                    notes.push('• Performance should be smooth for most use cases');
                }
                
                notesDiv.innerHTML = notes.length > 0 ? `<h4>Performance Tips:</h4>${notes.join('<br>')}` : '';
            }
        } else {
            performanceSection.style.display = 'none';
        }
    } else if (performanceSection) {
        performanceSection.style.display = 'none';
    }
    
    if (totalVRAM > 0) {
        document.getElementById('results').classList.remove('hidden');
    }
    
    // Update URL with current configuration
    if (typeof updateURL === 'function') {
        updateURL();
    }
}

// ASCII Art Style - Circuit Board (GPU version)
const asciiArt = `▓█████ ▓█████  ██▓      █████▒██░ ██  ▒█████    ██████ ▄▄▄█████▓ ██▓     ██▓     ███▄ ▄███▓
▒██    ▒██   ▀ ▓██▒    ▓██   ▒▓██░ ██▒▒██▒  ██▒▒██    ▒ ▓  ██▒ ▓▒▓██▒    ▓██▒    ▓██▒▀█▀ ██▒
▒▓██▄   ▒███   ▓██░    ▒████ ░▒██▀▀██░▒██░  ██▒▒▓██▄    ▒ ▓██░ ▒░▓██░    ▓██░    ▓██    ▓██░
▒██  ▀█▄ ▒▓█  ▄ ▒██▄    ░▓█▒  ░░▓█ ░██ ▒██   ██░ ▒   ██▒░ ▓██▓ ░ ▒██▄    ▒██▄    ▒██    ▒██ 
░██▄▄▄▄██░▒████▒░██████▒░▒█░   ░▓█▒░██▓░ ████▓▒░▒██████▒▒  ▒██▒ ░ ░██████▒░██████▒▒██▒   ░██▒
 ▓█   ▓██▒░ ▒░ ░░ ▒░▓  ░ ▒ ░    ▒ ░░▒░▒░ ▒░▒░▒░ ▒ ▒▓▒ ▒ ░  ▒ ░░   ░ ▒░▓  ░░ ▒░▓  ░░ ▒░   ░  ░`;

// Display ASCII art on page load
function displayAsciiArt() {
    const asciiElement = document.getElementById('ascii-art');
    if (asciiElement) {
        asciiElement.textContent = asciiArt;
    }
}

// Share dialog functions
function showShareDialog() {
    const dialog = document.getElementById('shareDialog');
    const overlay = document.getElementById('overlay');
    const urlContainer = document.getElementById('shareUrl');
    
    urlContainer.textContent = window.location.href;
    
    dialog.classList.add('active');
    overlay.classList.add('active');
}

function closeShareDialog() {
    const dialog = document.getElementById('shareDialog');
    const overlay = document.getElementById('overlay');
    
    dialog.classList.remove('active');
    overlay.classList.remove('active');
}

function copyShareLink() {
    const urlText = document.getElementById('shareUrl').textContent;
    
    navigator.clipboard.writeText(urlText).then(() => {
        const copyButton = event.target;
        const originalText = copyButton.textContent;
        copyButton.textContent = '✅ Copied!';
        
        setTimeout(() => {
            copyButton.textContent = originalText;
        }, 2000);
    }).catch(err => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = urlText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        const copyButton = event.target;
        const originalText = copyButton.textContent;
        copyButton.textContent = '✅ Copied!';
        
        setTimeout(() => {
            copyButton.textContent = originalText;
        }, 2000);
    });
}

// Show explanation dialog
function showHowCalculated(event) {
    event.preventDefault();
    const dialog = document.getElementById('explanationDialog');
    const overlay = document.getElementById('overlay');
    
    dialog.classList.add('active');
    overlay.classList.add('active');
    overlay.onclick = closeExplanationDialog;
}

// Close explanation dialog
function closeExplanationDialog() {
    const dialog = document.getElementById('explanationDialog');
    const overlay = document.getElementById('overlay');
    
    dialog.classList.remove('active');
    overlay.classList.remove('active');
    overlay.onclick = closeShareDialog;
}

// Show performance explanation dialog
function showPerformanceExplanation(event) {
    event.preventDefault();
    const dialog = document.getElementById('performanceExplanationDialog');
    const overlay = document.getElementById('overlay');
    
    dialog.classList.add('active');
    overlay.classList.add('active');
    overlay.onclick = closePerformanceExplanation;
}

// Close performance explanation dialog
function closePerformanceExplanation() {
    const dialog = document.getElementById('performanceExplanationDialog');
    const overlay = document.getElementById('overlay');
    
    dialog.classList.remove('active');
    overlay.classList.remove('active');
    overlay.onclick = closeShareDialog;
}

// Close dialog on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeShareDialog();
        closeExplanationDialog();
        closePerformanceExplanation();
    }
});

// Initialize on page load
window.onload = function() {
    displayAsciiArt();
    
    // First check if we have URL parameters
    if (window.location.search) {
        loadFromURL();
    } else {
        // Default initialization
        updateModelInputMethod();
        updateContextInputMethod();
        updateGPUSpecs();
        calculate();
    }
};