# SelfHostLLM - GPU Memory Calculator

A web-based calculator for estimating GPU memory requirements and maximum concurrent requests for self-hosted LLM inference.

🔗 **Live Demo**: [https://selfhostllm.org](https://selfhostllm.org)

## Overview

This tool helps you calculate how many concurrent requests your GPU setup can handle when running large language models (LLMs) locally. It takes into account:

- GPU VRAM capacity
- Model size and parameters
- Context window length
- Quantization methods
- KV cache overhead

## How It Works

### The Formula

```
Max Concurrent Requests = Available Memory / KV Cache per Request
```

### Calculation Breakdown

1. **Total VRAM Available**
   ```
   Total VRAM = Number of GPUs × VRAM per GPU
   ```

2. **Model Memory (Adjusted for Quantization)**
   ```
   Adjusted Model Memory = Base Model Memory × Quantization Factor
   ```
   The model weights are loaded once and stay in memory.

3. **KV Cache per Request**
   ```
   KV Cache = (Context Length × Adjusted Model Memory × KV Overhead) / 1000
   ```
   This memory is needed for each active request's attention cache.

4. **Available Memory for Inference**
   ```
   Available = Total VRAM - System Overhead - Model Memory
   ```
   This is what's left for KV caches after loading the model.

5. **Maximum Concurrent Requests**
   ```
   Max Requests = Available Memory / KV Cache per Request
   ```

## Mixture-of-Experts (MoE) Models

The calculator automatically detects and handles MoE models differently:

- **Total Parameters**: The full model size (e.g., Mixtral 8x7B = 56B total parameters)
- **Active Parameters**: Only a subset of experts are used per token (e.g., ~14B active)
- **Memory Calculation**: Uses active memory instead of total memory for accurate estimates
- **Why this matters**: You only need RAM for active experts, not the entire model

**Example**: Mixtral 8x7B shows "~94GB total, ~16GB active" - calculations use 16GB

## Key Assumptions

- **Worst-case scenario**: All requests use the full context window
- In reality, most requests use much less context, so you may handle more concurrent requests
- KV cache grows linearly with actual tokens used, not maximum context
- System overhead is estimated at ~2GB for frameworks and OS
- Different attention mechanisms (MHA, MQA, GQA) affect memory usage
- Framework overhead and memory fragmentation can impact real-world performance
- Dynamic batching and memory management can improve real-world throughput
- **MoE models**: Memory requirements can vary based on routing algorithms and expert utilization patterns

## Features

- **Multiple input methods**: Select from common models, specify parameters, or input memory directly
- **Extensive model database**: Includes latest 2025 models from all major providers
- **MoE model support**: Automatic detection and accurate memory calculations for MoE architectures
- **Quantization options**: FP16, INT8, INT4, MXFP4, and Extreme quantization
- **Context presets**: From 1K to 1M tokens
- **Performance estimation**: GPU-specific speed and throughput predictions
- **URL sharing**: Share your configuration with others
- **Mobile responsive**: Works on all devices
- **Mac version**: Specialized calculator for Apple Silicon Macs

## Supported Models

The calculator includes memory profiles for 100+ models from all major providers:

### Latest 2025 Models
- **Moonshot AI Kimi**: K2 Base/Instruct (1T params, 32B active)
- **Alibaba Qwen 3**: 270M to 235B including MoE variants
- **DeepSeek V3/R1**: Latest reasoning models with distilled versions
- **Zhipu AI GLM**: ChatGLM to GLM-4.5 including MoE models
- **Google Gemma 3**: 270M to 27B with multimodal capabilities
- **Mistral Codestral**: Latest code-specialized models

### Established Models
- **Meta Llama**: 1B to 405B parameters
- **Alibaba Qwen**: 2B to 110B including QwenCoder variants
- **DeepSeek**: 7B to 671B including reasoning models
- **Mistral**: 7B to 123B (Mistral Large)
- **Mixtral MoE**: 8x7B and 8x22B with accurate active memory calculations
- **Google Gemma**: 2B to 27B models
- **Microsoft Phi**: 3.8B to 14B optimized models
- **Command R**: 35B and 104B
- **GPT-OSS**: 20B and 120B open-source variants

## Contributing

Feedback, bug reports, and contributions are welcome! Please feel free to:

- Open an issue for bugs or feature requests
- Submit pull requests with improvements
- Share your experience and suggestions

## Feedback & Comments

We'd love to hear from you! If you have:
- Suggestions for improving the calculation methodology
- Additional models to include
- Real-world performance data to share
- Feature requests or bug reports

Please [open an issue](https://github.com/erans/selfhostllm/issues) or [submit a pull request](https://github.com/erans/selfhostllm/pulls).

## License

MIT License

## Author

Copyright © 2025 [Eran Sandler](https://eran.sandler.co.il)

- Twitter/X: [@erans](https://x.com/erans)
- BlueSky: [esandler.bsky.social](https://bsky.app/profile/esandler.bsky.social)
- LinkedIn: [/in/erans](https://linkedin.com/in/erans)
- GitHub: [@erans](https://github.com/erans)

## Acknowledgments

This calculator is based on community knowledge and research about LLM memory requirements. The estimates are approximate and actual usage may vary based on specific implementations and optimizations.
