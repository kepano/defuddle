```json
{
  "title": "Notes on Distributed Training Methods This Week",
  "author": "",
  "site": "Example Newsletter",
  "published": "2026-04-15T00:00:00.000Z"
}
```

At the end of a recent podcast episode, we talked about how to actually retain what you learn from technical reading. The advice was to make some kind of demanding artifact. Write something up. Try to explain it. So in that spirit, here are notes on a few topics I have been learning about over the last week or two.

These notes are extremely rough, and they almost certainly contain mistakes. Please read them as a learning log rather than authoritative reference, and do not hesitate to push back on anything that seems wrong.

## Parallelism strategies

The three standard parallelism strategies for training large models are data parallelism, tensor parallelism, and pipeline parallelism. Modern systems combine all three, which is often referred to as three-dimensional parallelism, with the exact ratios depending on the hardware topology and model shape.

Data parallelism replicates the model across devices and splits the batch. Tensor parallelism splits individual operations, such as matrix multiplies, across devices. Pipeline parallelism splits the model by layer across devices, with micro-batches flowing through the pipeline to keep all devices busy.

## Communication patterns

Each parallelism strategy has a distinct communication pattern, and the efficiency of the training run depends heavily on how well those patterns map onto the underlying interconnect.

Tensor parallelism requires all-reduce operations between every device involved in a given shard, which scales poorly beyond a single node. Pipeline parallelism needs point-to-point sends between adjacent stages, which scales across nodes more gracefully.

## Practical implications

The interaction between these strategies, the interconnect, and the model architecture determines how a given cluster should be partitioned for training. Getting the partitioning right is often the difference between a fast run and one that is network-bound.