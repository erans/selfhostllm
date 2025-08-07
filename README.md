# SelfHostLLM - GPU Memory Calculator

A web-based calculator for estimating GPU memory requirements and maximum concurrent requests for self-hosted LLM inference.

🔗 **Live Demo**: [https://selfhostllm.com](https://selfhostllm.com)

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

## Key Assumptions

- **Worst-case scenario**: All requests use the full context window
- In reality, most requests use much less context, so you may handle more concurrent requests
- KV cache grows linearly with actual tokens used, not maximum context
- System overhead is estimated at ~2GB for frameworks and OS
- Different attention mechanisms (MHA, MQA, GQA) affect memory usage
- Framework overhead and memory fragmentation can impact real-world performance
- Dynamic batching and memory management can improve real-world throughput

## Features

- **Multiple input methods**: Select from common models, specify parameters, or input memory directly
- **Extensive model database**: Includes Llama, Qwen, DeepSeek, Mistral, and more
- **Quantization options**: FP16, INT8, INT4, MXFP4, and Extreme quantization
- **Context presets**: From 2K to 1M tokens
- **URL sharing**: Share your configuration with others
- **Mobile responsive**: Works on all devices

## Supported Models

The calculator includes memory profiles for popular open-source models:

- **Llama Series**: 1B to 405B parameters
- **Qwen Series**: Including Qwen and QwenCoder variants
- **DeepSeek**: From 1.3B to 671B (DeepSeek-R1)
- **Mistral**: 7B to 123B (Mistral Large)
- **Command R**: 35B and 104B
- **DBRX**: 132B
- **Arctic**: 480B
- **Mixtral**: 8x7B and 8x22B
- **GPT-OSS**: 20B and 120B

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
