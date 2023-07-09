---
layout: "../layouts/BlogPost.astro"
title: "Machine Learning for web developers "
slug: ml-for-web-developers
description: ""
added: "July 9 2023"
tags: [AI]
---

TensorFlow.js is an open-source hardware-accelerated JavaScript library for training and deploying machine learning models. See more at https://www.tensorflow.org/js

```html
<script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs"></script>
<script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/qna"></script>
<script>
  const passage = "California is a state in the Western United States, located along the Pacific Coast."
  const question = "Where is California?"
  qna.load().then(model => {
    model.findAnswers(question, passage).then(answers => {
      console.log('Answers: ', answers);
    });
  });
</script>
```

Some examples just run in browsers:
- Recognizes emotions and changes design with content. The design will change based on your emotions.
- Smile to like something on social media instead of clicking the 'like' button.
- When you read a book on a computer, text changes size depending on your position in front of the screen.
- Are you sitting with correct posture right now? It can detect your posture and blurs a screen if it’s poor.

Resources:
- Teachable Machine: https://teachablemachine.withgoogle.com
- COCO - Common Objects in Context: http://cocodataset.org
- Pretrained models for TensorFlow.js: https://github.com/tensorflow/tfjs-models/tree/master
- Make a smart webcam with pre-trained model: https://codelabs.developers.google.com/codelabs/tensorflowjs-object-detection
- ML for front-end developers: https://docs.google.com/presentation/d/1f--c4Ui1VcmVgW4Gj3v-e_17GYfxRlbUSMnyk4sOVjg
- Machine Learning 101: https://docs.google.com/presentation/d/1kSuQyW5DTnkVaZEjGYCkfOxvzCqGEFzWBy4e9Uedd9k
- Charlie's side projects: https://charliegerard.dev/projects
