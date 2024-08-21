function toCharacter() {
  return async function* toCharacterStrategy(stream) {
    for await (const data of stream) {
      const characters = data.value.split('');
      for (let i = 0; i < characters.length; i++) {
        yield { value: characters[i], index: data.index + i, latency: data.latency };
      }
    }
  };
}

function* segment(value, options) {
  const segmenter = new Intl.Segmenter(options.locale, { granularity: 'word' });
  for (const data of segmenter.segment(value)) {
    yield data.segment;
  }
}

function toWord(options) {
  return async function* toWordStrategy(stream) {
    for await (const data of stream) {
      const cursor = { current: data.index };
      const segments = segment(data.value, options);

      for (const word of segments) {
        yield { value: word, index: cursor.current, latency: data.latency };
        cursor.current += word.length;
      }
    }
  };
}


const textChunks = [
  '微风轻拂，',
  '湖面泛起层层涟漪，如同大自然的琴弦在低声吟唱。',
  '一艘小船在湖面上缓缓行驶，船桨在水中划出一道道优雅的弧线。',
  '船上的老渔夫静静地坐在船尾，手握钓竿，目光深邃如同湖水一般平静。',
  '他那满是岁月痕迹的脸上，挂着一丝淡淡的笑意，仿佛在与大自然进行着无声的对话。',
  '湖边的柳树枝条轻柔地垂下，随风摇曳，仿佛在为这幅宁静的画面增添一抹柔和的韵律。',
  '天边的云彩缓缓移动，不时映射出夕阳的余晖，',
  '让湖面染上了一层金色的光辉。',
  '渔夫的钓线在水中静静漂浮，偶尔泛起一圈圈小小的波纹，仿佛在等待着某个时刻的来临。',
  '这一刻，时间仿佛静止，只有自然的声音在耳边轻轻回响，让人感受到一种久违的平静与祥和。',
];

const textStream = [
  { value: textChunks.join(''), index: 0, latency: 50 },
];

async function charTypeWriter() {
  const characterStream = toCharacter()(textStream);

  for await (const char of characterStream) {
    process.stdout.write(char.value);
    await new Promise(resolve => setTimeout(resolve, char.latency));
  }
}

async function wordTypeWriter() {
  // https://www.techonthenet.com/js/language_tags.php
  // zh_Hans: Chinese in simplified script (=zh, zh-Hans, zh-CN, zh-Hans-CN)
  const wordStream = toWord({ locale: 'zh-Hans' })(textStream);

  for await (const word of wordStream) {
    process.stdout.write(word.value);
    await new Promise((resolve) => setTimeout(resolve, word.latency));
  }
}

// charTypeWriter();
wordTypeWriter();
