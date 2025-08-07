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
        modelMemory = parseFloat(selectedOption.getAttribute('data-memory')) || 14;
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
    
    if (totalVRAM > 0) {
        document.getElementById('results').classList.remove('hidden');
    }
    
    // Update URL with current configuration
    if (typeof updateURL === 'function') {
        updateURL();
    }
}

// Initialize on page load
window.onload = function() {
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