const assert = require('assert');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const catalogFiles = [
    path.join(rootDir, 'index.html'),
    path.join(rootDir, 'mac/index.html')
];

const expectedModels = [
    { label: 'Qwen3 0.6B (~1.2GB)', value: '0.6', memory: '1.2', quant: '1.0' },
    { label: 'Qwen3 1.7B (~3.4GB)', value: '1.7', memory: '3.4', quant: '1.0' },
    { label: 'Qwen3 30B-A3B Instruct 2507 (~61GB total, ~6.6GB active)', value: '3.3', memory: '61', activeMemory: '6.6', quant: '1.0' },
    { label: 'Qwen3 30B-A3B Thinking 2507 (~61GB total, ~6.6GB active)', value: '3.3', memory: '61', activeMemory: '6.6', quant: '1.0' },
    { label: 'Qwen3 235B-A22B Instruct 2507 (~470GB total, ~44GB active)', value: '22', memory: '470', activeMemory: '44', quant: '0.5' },
    { label: 'Qwen3 235B-A22B Thinking 2507 (~470GB total, ~44GB active)', value: '22', memory: '470', activeMemory: '44', quant: '0.5' },
    { label: 'Qwen3-Coder 30B-A3B Instruct (~61GB total, ~6.6GB active)', value: '3.3', memory: '61', activeMemory: '6.6', quant: '1.0' },
    { label: 'Qwen3-Coder 480B-A35B Instruct (~960GB total, ~70GB active)', value: '35', memory: '960', activeMemory: '70', quant: '0.5' },
    { label: 'Qwen3-Next 80B-A3B Instruct (~160GB total, ~6GB active)', value: '3', memory: '160', activeMemory: '6', quant: '1.0' },
    { label: 'Qwen3-Next 80B-A3B Thinking (~160GB total, ~6GB active)', value: '3', memory: '160', activeMemory: '6', quant: '1.0' },
    { label: 'Kimi K2.6 1T (~2000GB total, ~64GB active)', value: '32', memory: '2000', activeMemory: '64', quant: '0.5' },
    { label: 'Kimi Linear 48B-A3B Base (~96GB total, ~6GB active)', value: '3', memory: '96', activeMemory: '6', quant: '1.0' },
    { label: 'Kimi Linear 48B-A3B Instruct (~96GB total, ~6GB active)', value: '3', memory: '96', activeMemory: '6', quant: '1.0' },
    { label: 'DeepSeek V3.1 Terminus 671B (~1342GB total, ~74GB active)', value: '37', memory: '1342', activeMemory: '74', quant: '0.5' },
    { label: 'DeepSeek V3.2-Exp 671B (~1342GB total, ~74GB active)', value: '37', memory: '1342', activeMemory: '74', quant: '0.5' },
    { label: 'DeepSeek V4 Flash Base 284B (~568GB total, ~26GB active)', value: '13', memory: '568', activeMemory: '26', quant: '0.5' },
    { label: 'DeepSeek V4 Flash 284B (~568GB total, ~26GB active)', value: '13', memory: '568', activeMemory: '26', quant: '0.5' },
    { label: 'DeepSeek V4 Pro Base 1.6T (~3200GB total, ~98GB active)', value: '49', memory: '3200', activeMemory: '98', quant: '0.5' },
    { label: 'DeepSeek V4 Pro 1.6T (~3200GB total, ~98GB active)', value: '49', memory: '3200', activeMemory: '98', quant: '0.5' },
    { label: 'DeepSeek R1 671B (~1342GB total, ~74GB active)', value: '37', memory: '1342', activeMemory: '74', quant: '0.5' },
    { label: 'DeepSeek R1-0528 671B (~1342GB total, ~74GB active)', value: '37', memory: '1342', activeMemory: '74', quant: '0.5' },
    { label: 'DeepSeek R1-0528-Qwen3-8B (~16GB)', value: '8', memory: '16', quant: '1.0' },
    { label: 'GLM-4.5-Air MoE (~212GB total, ~24GB active)', value: '12', memory: '212', activeMemory: '24', quant: '0.5' },
    { label: 'GLM-4.5 MoE (~710GB total, ~64GB active)', value: '32', memory: '710', activeMemory: '64', quant: '0.5' },
    { label: 'GLM-4.7 358B-A32B MoE (~716GB total, ~64GB active)', value: '32', memory: '716', activeMemory: '64', quant: '0.5' },
    { label: 'GLM-5 754B-A40B MoE (~1508GB total, ~80GB active)', value: '40', memory: '1508', activeMemory: '80', quant: '0.5' },
    { label: 'GLM-5.1 754B-A40B MoE (~1508GB total, ~80GB active)', value: '40', memory: '1508', activeMemory: '80', quant: '0.5' },
    { label: 'Granite 4.0 Micro 3B (~6GB)', value: '3', memory: '6', quant: '1.0' },
    { label: 'Granite 4.1 3B (~6GB)', value: '3', memory: '6', quant: '1.0' },
    { label: 'Granite 4.1 8B (~16GB)', value: '8', memory: '16', quant: '1.0' },
    { label: 'Granite 4.1 30B (~60GB)', value: '30', memory: '60', quant: '0.5' }
];

function parseModelOptions(source) {
    const options = new Map();
    const optionPattern = /<option value="([^"]+)" data-memory="([^"]+)"(?: data-active-memory="([^"]+)")? data-quant="([^"]+)">([^<]+)<\/option>/g;
    let match;

    while ((match = optionPattern.exec(source)) !== null) {
        options.set(match[5], {
            value: match[1],
            memory: match[2],
            activeMemory: match[3],
            quant: match[4]
        });
    }

    return options;
}

for (const file of catalogFiles) {
    const source = fs.readFileSync(file, 'utf8');
    const options = parseModelOptions(source);
    const relativePath = path.relative(rootDir, file);

    for (const model of expectedModels) {
        assert.ok(options.has(model.label), `${relativePath} should include ${model.label}`);
        const option = options.get(model.label);
        assert.strictEqual(option.value, model.value, `${relativePath} ${model.label} should use value ${model.value}`);
        assert.strictEqual(option.memory, model.memory, `${relativePath} ${model.label} should use ${model.memory}GB total memory`);
        assert.strictEqual(option.activeMemory, model.activeMemory, `${relativePath} ${model.label} should use expected active memory`);
        assert.strictEqual(option.quant, model.quant, `${relativePath} ${model.label} should use default quant ${model.quant}`);
    }
}
