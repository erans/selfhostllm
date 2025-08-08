// ASCII Art Styles for Mac version
const asciiArts = [
    // Style 1: Mac-themed ASCII
    ` ███╗   ███╗ █████╗  ██████╗    ██╗     ██╗     ███╗   ███╗
 ████╗ ████║██╔══██╗██╔════╝    ██║     ██║     ████╗ ████║
 ██╔████╔██║███████║██║         ██║     ██║     ██╔████╔██║
 ██║╚██╔╝██║██╔══██║██║         ██║     ██║     ██║╚██╔╝██║
 ██║ ╚═╝ ██║██║  ██║╚██████╗    ███████╗███████╗██║ ╚═╝ ██║
 ╚═╝     ╚═╝╚═╝  ╚═╝ ╚═════╝    ╚══════╝╚══════╝╚═╝     ╚═╝`,
    
    // Style 2: Apple-inspired
    `╔═╗┌─┐┬  ┌─┐╦ ╦┌─┐┌─┐┌┬┐  ╦  ╦  ╔╦╗  ╔╦╗┌─┐┌─┐
╚═╗├┤ │  ├┤ ╠═╣│ │└─┐ │   ║  ║  ║║║  ║║║├─┤│  
╚═╝└─┘┴─┘└  ╩ ╩└─┘└─┘ ┴   ╩═╝╩═╝╩ ╩  ╩ ╩┴ ┴└─┘`,
    
    // Style 3: Minimal Mac
    `mac llm compatibility checker`,
    
    // Style 4: Classic
    `  __  __    _    ____   _     _     __  __ 
 |  \\/  |  / \\  / ___| | |   | |   |  \\/  |
 | |\\/| | / _ \\| |     | |   | |   | |\\/| |
 | |  | |/ ___ \\ |___  | |___| |___| |  | |
 |_|  |_/_/   \\_\\____| |_____|_____|_|  |_|`
];

// Display random ASCII art on page load
function displayRandomAsciiArt() {
    const randomIndex = Math.floor(Math.random() * asciiArts.length);
    const asciiElement = document.getElementById('ascii-art');
    if (asciiElement) {
        asciiElement.textContent = asciiArts[randomIndex];
    }
}

// Update Mac specs when a model is selected
function updateMacSpecs() {
    const macModel = document.getElementById('mac-model');
    const ramInput = document.getElementById('mac-ram');
    
    if (macModel.value) {
        const selectedOption = macModel.options[macModel.selectedIndex];
        const ram = selectedOption.getAttribute('data-ram');
        if (ram) {
            ramInput.value = ram;
            checkCompatibility();
        }
    }
}

// Update model selection and check compatibility
function updateModelSelection() {
    checkCompatibility();
}

// Get Mac chip bandwidth based on model
function getMacBandwidth(macModel) {
    // Extract chip type from mac model ID
    if (!macModel) return 120; // Default M4 bandwidth
    
    const modelLower = macModel.toLowerCase();
    
    // M4 series
    if (modelLower.includes('m4-max')) return 546;
    if (modelLower.includes('m4-pro')) return 273;
    if (modelLower.includes('m4')) return 120;
    
    // M3 series
    if (modelLower.includes('m3-ultra')) return 819;  // Released in 2025
    if (modelLower.includes('m3-max')) return 400;
    if (modelLower.includes('m3-pro')) return 150;  // Reduced from M2 Pro
    if (modelLower.includes('m3')) return 100;
    
    // M2 series
    if (modelLower.includes('m2-ultra')) return 800;
    if (modelLower.includes('m2-max')) return 400;
    if (modelLower.includes('m2-pro')) return 200;
    if (modelLower.includes('m2')) return 100;
    
    // M1 series
    if (modelLower.includes('m1-ultra')) return 800;
    if (modelLower.includes('m1-max')) return 400;
    if (modelLower.includes('m1-pro')) return 200;
    if (modelLower.includes('m1')) return 68;
    
    return 120; // Default
}

// Calculate performance estimate
function calculatePerformance(modelMemory, quantization, contextLength, macModel) {
    const bandwidth = getMacBandwidth(macModel);
    const modelParams = parseFloat(document.getElementById('model-preset').value) || 7;
    
    // Model size efficiency factor
    let efficiency = 0.8;
    if (modelParams <= 7) {
        efficiency = 0.8;
    } else if (modelParams <= 30) {
        efficiency = 0.6;
    } else if (modelParams <= 70) {
        efficiency = 0.4;
    } else {
        efficiency = 0.25;
    }
    
    // Quantization speed boost
    let quantBoost = 1.0;
    if (quantization <= 0.25) {
        quantBoost = 2.2;
    } else if (quantization <= 0.3) {
        quantBoost = 2.0;
    } else if (quantization <= 0.5) {
        quantBoost = 1.8;
    } else if (quantization <= 0.75) {
        quantBoost = 1.4;
    }
    
    // Context length impact
    let contextImpact = 1.0;
    if (contextLength >= 131072) {
        contextImpact = 0.4;
    } else if (contextLength >= 32768) {
        contextImpact = 0.7;
    } else if (contextLength >= 8192) {
        contextImpact = 0.9;
    }
    
    // Calculate tokens per second
    // Formula: (bandwidth / model_memory_gb) * efficiency * quant_boost * context_impact
    const baseSpeed = (bandwidth / modelMemory) * efficiency * quantBoost * contextImpact;
    
    // Apply realistic scaling factor
    const tokensPerSecond = baseSpeed * 0.7; // Conservative estimate
    
    return {
        tokensPerSecond: tokensPerSecond,
        bandwidth: bandwidth,
        efficiency: efficiency,
        quantBoost: quantBoost,
        contextImpact: contextImpact
    };
}

// Main compatibility check function
function checkCompatibility() {
    const macRam = parseFloat(document.getElementById('mac-ram').value) || 16;
    const systemOverhead = parseFloat(document.getElementById('system-overhead').value) || 4;
    const modelSelect = document.getElementById('model-preset');
    const quantization = parseFloat(document.getElementById('quantization').value) || 1.0;
    const contextLength = parseInt(document.getElementById('context-length').value) || 8192;
    
    const selectedOption = modelSelect.options[modelSelect.selectedIndex];
    const baseMemory = parseFloat(selectedOption.getAttribute('data-memory')) || 14;
    
    // Calculate memory requirements
    const modelMemory = baseMemory * quantization;
    const kvCachePerToken = modelMemory * 0.00002; // Approximate KV cache per token
    const kvCacheMemory = contextLength * kvCachePerToken;
    const totalMemoryNeeded = modelMemory + kvCacheMemory;
    const availableRam = macRam - systemOverhead;
    const memoryMargin = availableRam - totalMemoryNeeded;
    
    // Display results
    const resultsDiv = document.getElementById('results');
    resultsDiv.classList.remove('hidden');
    
    // Update values
    document.getElementById('total-ram').textContent = `${macRam.toFixed(0)} GB`;
    document.getElementById('available-ram').textContent = `${availableRam.toFixed(1)} GB`;
    document.getElementById('model-memory').textContent = `${modelMemory.toFixed(1)} GB`;
    document.getElementById('kv-cache-memory').textContent = `${kvCacheMemory.toFixed(1)} GB`;
    document.getElementById('total-memory-needed').textContent = `${totalMemoryNeeded.toFixed(1)} GB`;
    document.getElementById('memory-margin').textContent = memoryMargin >= 0 
        ? `+${memoryMargin.toFixed(1)} GB` 
        : `${memoryMargin.toFixed(1)} GB`;
    
    // Update compatibility status
    const statusDiv = document.getElementById('compatibility-status');
    statusDiv.className = 'compatibility-status';
    
    if (memoryMargin >= 2) {
        statusDiv.classList.add('compatible');
        statusDiv.innerHTML = `
            <div class="compatibility-icon">✓</div>
            <div>COMPATIBLE - Your Mac can run this model comfortably</div>
        `;
    } else if (memoryMargin >= 0) {
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
    
    // Generate recommendations
    generateRecommendations(memoryMargin, modelMemory, quantization, contextLength, availableRam);
    
    // Calculate and display performance if compatible
    const performanceSection = document.getElementById('performance-section');
    if (memoryMargin >= 0) {
        performanceSection.style.display = 'block';
        
        const macModel = document.getElementById('mac-model').value;
        const perf = calculatePerformance(modelMemory, quantization, contextLength, macModel);
        
        // Update performance metrics
        const tokensPerSec = Math.round(perf.tokensPerSecond);
        document.getElementById('tokens-per-second').textContent = `${tokensPerSec} tokens/sec`;
        
        // Generation time for 100 tokens
        const genTime = tokensPerSec > 0 ? (100 / tokensPerSec).toFixed(1) : 'N/A';
        document.getElementById('generation-time').textContent = `${genTime} seconds`;
        
        // Performance rating
        let rating = '';
        let ratingClass = '';
        if (tokensPerSec > 50) {
            rating = '🟢 Excellent';
            ratingClass = 'excellent';
        } else if (tokensPerSec > 30) {
            rating = '🟢 Good';
            ratingClass = 'good';
        } else if (tokensPerSec > 15) {
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
        let notes = [];
        
        if (tokensPerSec < 15) {
            notes.push('• Consider using stronger quantization (INT4) for better speed');
        }
        if (contextLength > 32768 && tokensPerSec < 30) {
            notes.push('• Reduce context length for faster generation');
        }
        if (macModel && macModel.includes('m4-pro') && tokensPerSec < 30) {
            notes.push('• This model may benefit from M4 Max for better performance');
        }
        if (tokensPerSec > 30) {
            notes.push('• Performance should be smooth for most use cases');
        }
        
        notesDiv.innerHTML = notes.length > 0 ? `<h4>Performance Tips:</h4>${notes.join('<br>')}` : '';
    } else {
        performanceSection.style.display = 'none';
    }
    
    // Update URL with parameters
    updateURL();
}

// Generate recommendations based on compatibility
function generateRecommendations(memoryMargin, modelMemory, quantization, contextLength, availableRam) {
    const recommendationsDiv = document.getElementById('recommendations');
    let recommendations = [];
    
    if (memoryMargin < 0) {
        // Model doesn't fit
        recommendations.push(`<h4>Recommendations to make it work:</h4><ul>`);
        
        // Calculate what would work
        const neededRam = Math.abs(memoryMargin);
        
        if (quantization > 0.25) {
            recommendations.push(`<li>Try a higher quantization level (more compression)</li>`);
        }
        
        if (contextLength > 2048) {
            const reducedContext = Math.floor(contextLength / 2);
            recommendations.push(`<li>Reduce context length to ${reducedContext} tokens</li>`);
        }
        
        if (modelMemory > availableRam * 0.8) {
            recommendations.push(`<li>Consider a smaller model (current requires ${modelMemory.toFixed(1)}GB)</li>`);
        }
        
        recommendations.push(`<li>Upgrade to a Mac with at least ${Math.ceil(neededRam + 16)}GB RAM</li>`);
        recommendations.push(`</ul>`);
    } else if (memoryMargin < 2) {
        // Tight fit
        recommendations.push(`<h4>Optimization suggestions:</h4><ul>`);
        recommendations.push(`<li>Close other applications to free up memory</li>`);
        recommendations.push(`<li>Consider using quantization for better performance</li>`);
        recommendations.push(`<li>Monitor memory usage during inference</li>`);
        recommendations.push(`</ul>`);
    } else {
        // Good fit
        recommendations.push(`<h4>You can also try:</h4><ul>`);
        
        if (quantization < 1.0 && memoryMargin > 10) {
            recommendations.push(`<li>Use less quantization for better quality</li>`);
        }
        
        if (contextLength < 32768 && memoryMargin > 5) {
            recommendations.push(`<li>Increase context length for longer conversations</li>`);
        }
        
        if (memoryMargin > 20) {
            recommendations.push(`<li>Try a larger model for better performance</li>`);
        }
        
        recommendations.push(`<li>Use tools like Ollama, LM Studio, or llama.cpp</li>`);
        recommendations.push(`</ul>`);
    }
    
    recommendationsDiv.innerHTML = recommendations.join('');
}

// Update URL with current parameters
function updateURL() {
    const params = new URLSearchParams();
    
    const macModel = document.getElementById('mac-model').value;
    const macRam = document.getElementById('mac-ram').value;
    const systemOverhead = document.getElementById('system-overhead').value;
    const modelPreset = document.getElementById('model-preset').value;
    const quantization = document.getElementById('quantization').value;
    const contextLength = document.getElementById('context-length').value;
    
    if (macModel) params.set('mac', macModel);
    if (macRam !== '16') params.set('ram', macRam);
    if (systemOverhead !== '4') params.set('overhead', systemOverhead);
    if (modelPreset !== '7') params.set('model', modelPreset);
    if (quantization !== '1.0') params.set('quant', quantization);
    if (contextLength !== '8192') params.set('context', contextLength);
    
    const newURL = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
    window.history.replaceState({}, '', newURL);
}

// Load parameters from URL
function loadFromURL() {
    const params = new URLSearchParams(window.location.search);
    
    if (params.has('mac')) {
        document.getElementById('mac-model').value = params.get('mac');
        updateMacSpecs();
    }
    
    if (params.has('ram')) {
        document.getElementById('mac-ram').value = params.get('ram');
    }
    
    if (params.has('overhead')) {
        document.getElementById('system-overhead').value = params.get('overhead');
    }
    
    if (params.has('model')) {
        document.getElementById('model-preset').value = params.get('model');
    }
    
    if (params.has('quant')) {
        document.getElementById('quantization').value = params.get('quant');
    }
    
    if (params.has('context')) {
        document.getElementById('context-length').value = params.get('context');
    }
    
    // Run calculation if we have parameters
    if (params.toString()) {
        checkCompatibility();
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    displayRandomAsciiArt();
    loadFromURL();
});

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