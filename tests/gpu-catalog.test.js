const assert = require('assert');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(rootDir, 'selfhost-llm.js'), 'utf8');

const expectedGpus = [
    { id: 'rtx5090', vram: '32', label: 'RTX 5090 (32GB VRAM)', bandwidth: 1792 },
    { id: 'rtx5080', vram: '16', label: 'RTX 5080 (16GB VRAM)', bandwidth: 960 },
    { id: 'rtx5070ti', vram: '16', label: 'RTX 5070 Ti (16GB VRAM)', bandwidth: 896 },
    { id: 'rtx5070', vram: '12', label: 'RTX 5070 (12GB VRAM)', bandwidth: 672 },
    { id: 'rtx5060ti', vram: '16', label: 'RTX 5060 Ti 16GB (16GB VRAM)', bandwidth: 448 },
    { id: 'rtx5060ti8', vram: '8', label: 'RTX 5060 Ti 8GB (8GB VRAM)', bandwidth: 448 },
    { id: 'rtx5060', vram: '8', label: 'RTX 5060 (8GB VRAM)', bandwidth: 448 },
    { id: 'rtx5050', vram: '8', label: 'RTX 5050 (8GB VRAM)', bandwidth: 320 },
    { id: 'rtxpro6000bw-ws', vram: '96', label: 'RTX PRO 6000 Blackwell Workstation (96GB VRAM)', bandwidth: 1792 },
    { id: 'rtxpro6000bw-maxq', vram: '96', label: 'RTX PRO 6000 Blackwell Max-Q Workstation (96GB VRAM)', bandwidth: 1792 },
    { id: 'rtxpro6000bw-server', vram: '96', label: 'RTX PRO 6000 Blackwell Server (96GB VRAM)', bandwidth: 1597 },
    { id: 'rtxpro5000bw-48', vram: '48', label: 'RTX PRO 5000 Blackwell (48GB VRAM)', bandwidth: 1344 },
    { id: 'rtxpro5000bw-72', vram: '72', label: 'RTX PRO 5000 Blackwell 72GB (72GB VRAM)', bandwidth: 1344 },
    { id: 'rtxpro4500bw', vram: '32', label: 'RTX PRO 4500 Blackwell Workstation (32GB VRAM)', bandwidth: 896 },
    { id: 'rtxpro4000bw', vram: '24', label: 'RTX PRO 4000 Blackwell (24GB VRAM)', bandwidth: 672 },
    { id: 'rtxpro4000bw-sff', vram: '24', label: 'RTX PRO 4000 Blackwell SFF (24GB VRAM)', bandwidth: 432 },
    { id: 'rtxpro2000bw', vram: '16', label: 'RTX PRO 2000 Blackwell (16GB VRAM)', bandwidth: 288 }
];

function parseGpuOptions(source) {
    const options = new Map();
    const optionPattern = /<option value="([^"]+)" data-vram="([^"]+)">([^<]+)<\/option>/g;
    let match;

    while ((match = optionPattern.exec(source)) !== null) {
        options.set(match[1], {
            vram: match[2],
            label: match[3]
        });
    }

    return options;
}

function parseBandwidths(source) {
    const mapMatch = source.match(/const bandwidthMap = \{([\s\S]*?)\n\s*\};/);
    assert.ok(mapMatch, 'getGPUBandwidth should define a bandwidthMap object');

    const bandwidths = new Map();
    const entryPattern = /'([^']+)':\s*([0-9.]+)/g;
    let match;

    while ((match = entryPattern.exec(mapMatch[1])) !== null) {
        bandwidths.set(match[1], Number(match[2]));
    }

    return bandwidths;
}

assert.ok(
    html.includes('<optgroup label="NVIDIA RTX 50 Series">'),
    'GPU selector should include an NVIDIA RTX 50 Series group'
);

const options = parseGpuOptions(html);
const bandwidths = parseBandwidths(script);

for (const gpu of expectedGpus) {
    assert.ok(options.has(gpu.id), `${gpu.id} should be available in the GPU selector`);
    assert.strictEqual(options.get(gpu.id).vram, gpu.vram, `${gpu.id} should have ${gpu.vram}GB VRAM`);
    assert.strictEqual(options.get(gpu.id).label, gpu.label, `${gpu.id} should use the expected display label`);
    assert.strictEqual(bandwidths.get(gpu.id), gpu.bandwidth, `${gpu.id} should have ${gpu.bandwidth} GB/s bandwidth`);
}
