---
layout: "../layouts/BlogPost.astro"
title: "Large language models and fine tuning"
slug: llm-and-fine-tuning
description: ""
added: "Apr 2 2023"
tags: [other]
---

A language model uses machine learning to conduct a probability distribution over words used to predict the most likely next word in a sentence based on the previous entry. Language models learn from text and can be used for producing original text, predicting the next word in a text, speech recognition, optical character recognition and handwriting recognition.

While ChatGPT uses a specific type of reinforcement learning called "Reinforcement Learning from Human Feedback (RLHF)", at a high level it is an example of a Large Language Model. In order to produce these natural language responses, LLMs make use of deep learning models, which use multi-layered neural networks to process, analyze, and make predictions.

> 预训练就像你家里面请了一个阿姨，这个阿姨从保洁公司送到你家里面的时候，她其实已经过预训练了。也就意味着保洁公司已经把如何打扫等一些做家政的基础的工作，都已经帮你训练了，她已经学会了。所以阿姨来了以后，我不用教她怎么拖地。甚至于在她进到保洁公司之前，她也经过她的小学老师预训练过汉语了。这样阿姨到我家里面来说，我需要对它进行 fine tune，就是微调，告诉它说我家里面什么地方，你怎么打扫什么东西，怎么摆放。其实可能有 2 个小时的微调，我就可以把阿姨调整到和我家里面的习惯一模一样了，所以这个成本就非常低。
> 
> Transformer 模型里面有两大部分，一个叫做 encoder，一个叫 decoder，就是编码器和解码器。你给它一个 apple 以后，它在内部会把它 encode 成 1536 维的一个向量，1536 个数字。这一堆数字就代表了在它训练模型里面苹果的含义。你还可以把任何一个数字让它再重新给 decode 成文字。但是 decode 成文字的时候，你可以给它各种各样的指令。比如我要把它用西班牙语 decode，它就会把这 1536 维数字 decode 成 manzana。如果你说用英文，它就会 decode 成 apple。这是一个 decode 过程，你还可以接着要求要 decode 多长，多长了以后它会慢慢添油加醋。比如你要 decode 成十个字，它不但会 decode 成苹果，它会 decode 一个红扑扑的苹果。如果要是你让它 decode 成 1000 个字，它也可以添油加醋的把这 1000 个字都给你 decode 出来。所以你会看到我们现在 GPT 的机器人很多的时候胡说八道的原因，因为它就是一个向量，就是 1536 维的一个向量。但是它会在解码的时候解码出很多的东西，但解码的过程中，当向量的信息不足的时候，它会补全。所以整个的输入加上 encoder 变成向量，通过 decoder 再输出的整个过程，我们把它叫做 transformer 变换器。
>
> Embedding 就是 1536 维的向量的本地搜索。这个部分我们甚至都没有做微调，仅仅是在本地建个数据库。相类比的话，就是阿姨来了，你跟她讲了半天，她听进去了，你可以知道你改变了阿姨的脑结构里面的某一些的脑细胞的回路、神经元的连接，你稍微改了改，我把它叫做 Fine-Tuning。但是我对阿姨还有另外一种用法，来了以后，我也不让她改任何东西，甚至于她的神经元我一点都不改。只不过每个水壶旁边贴个纸，上面写着水壶应该怎么操作，而且她也不需要记住，因为记住就改变了。她每次用水壶的时候看了以后并且理解，操作完了以后就忘。其实我们现在用的是这种模式，把所遇到的世界都贴满了这样的纸，而不需要去改变 1750 亿的参数中间的任何的参数。—— 来自[大白话聊 ChatGPT](https://d58hixvcd6.feishu.cn/docx/HfMEds7Z1ov37wxqM19czTBinWg)

## OpenAI Fine-tuning
GPT-3 has been pre-trained on a vast amount of text from the open internet. When given a prompt with just a few examples, it can often intuit what task you are trying to perform and generate a plausible completion. This is often called "few-shot learning." Fine-tuning improves on few-shot learning by training on many more examples than can fit in the prompt, letting you achieve better results on a wide number of tasks. Once a model has been fine-tuned, you won't need to provide examples in the prompt anymore.

[Fine-tuning](https://platform.openai.com/docs/guides/fine-tuning) is a powerful technique to create a new model that's specific to your use case. To fine-tune a model, you'll need a set of training examples that each consist of a single input ("prompt") and its associated output ("completion"). This is notably different from using our base models, where you might input detailed instructions or multiple examples in a single prompt. Your training data should be:
- Large (ideally thousands or tens of thousands of examples)
- High-quality (consistently formatted and cleaned of incomplete or incorrect examples)
- Representative (training data should be similar to the data upon which you’ll use your model)
- Sufficiently specified (i.e., containing enough information in the input to generate what you want to see in the output)

```json
// {"prompt": "<prompt text>", "completion": "<ideal generated text>"}
{"prompt": "burger -->", "completion": " edible"}
{"prompt": "paper towels -->", "completion": " inedible"}
{"prompt": "vino -->", "completion": " edible"}
{"prompt": "bananas -->", "completion": " edible"}
{"prompt": "dog toy -->", "completion": " inedible"}
...
```

```
# CSV, TSV, XLSX, JSON or JSONL file into a valid JSONL file
# https://jsonlines.org
openai tools fine_tunes.prepare_data -f <LOCAL_FILE>

# Start your fine-tuning job using the OpenAI CLI
openai api fine_tunes.create -t <TRAIN_FILE_ID_OR_PATH> -m <BASE_MODEL>

# List all created fine-tunes
openai api fine_tunes.list

# Retrieve the state of a fine-tune. The resulting object includes
# job status (which can be one of pending, running, succeeded, or failed)
# and other information
openai api fine_tunes.get -i <YOUR_FINE_TUNE_JOB_ID>
```

## Natural Language Processing
- Standford CS229: https://cs229.stanford.edu/notes2022fall
- Stanford CS224N: https://web.stanford.edu/class/cs224n/index.html
- Natural Language Processing: https://princeton-nlp.github.io/cos484
- Understanding Large Language Models: https://www.cs.princeton.edu/courses/archive/fall22/cos597G
