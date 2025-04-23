---
title: "Reading Dan's new articles"
description: ""
added: "Apr 20 2025"
tags: [react, code]
---

Dan is really a good writer. He has published several articles consecutively this April, which is uncommon in recent years. I'm particularly drawn to his storytelling style that captivates readers from beginning to end. Instead of sharing his original texts here, I'll show some code from his articles that demonstrates key ideas.

## React for Two Computers

```js
// 1. blueprint of tags
window.concat = (a, b) => a + b;

function greeting() {
  return {
    fn: 'alert',
    args: [{
      fn: 'concat',
      args: ['Hello, ', {
        fn: 'prompt',
        args: ['Who are you?']
      }]
    }]
  };
}

function interpret(json) {
  if (json && json.fn) {
    let fn = window[json.fn];
    let args = json.args.map((arg) => interpret(arg));
    let result = fn(...args);
    return interpret(result);
  } else {
    return json;
  }
}

interpret(greeting());
```

```js
// 2. dissolve some tags earlier and some later
function interpret(json, knownTags) {
  if (json && json.fn) {
    if (knownTags[json.fn]) {
      let fn = knownTags[json.fn];
      let args = json.args.map(arg => interpret(arg, knownTags));
      let result = fn(...args);
      return interpret(result, knownTags);
    } else {
      let args = json.args.map(arg => interpret(arg, knownTags));
      return { fn: json.fn, args };
    }
  } else {
    return json;
  }
}

const step1 = greeting();
 
const step2 = interpret(step1, {
  prompt: window.prompt,
  concat: (a, b) => a + b,
});
// {
//   fn: 'alert',
//   args: ['Hello, Dan']
// };
 
interpret(step2, {
  alert: window.alert,
});
```

```js
// 3. interpret and perform / Thinking and Doing

// interprets tags outside-in
// embed stuff and return tags
function interpret(json, knownTags) {
  if (json && json.fn) {
    if (knownTags[json.fn]) {
      let fn = knownTags[json.fn];
      let args = json.args;
      let result = fn(...args);
      return interpret(result, knownTags);
    } else {
      let args = json.args.map(arg => interpret(arg, knownTags));
      return { fn: json.fn, args };
    }
  } else if (Array.isArray(json)) {
    return json.map(item => interpret(item, knownTags));
  } else {
    return json;
  }
}

// run inside-out
// introspect stuff and need to know their arguments
function perform(json, knownTags) {
  if (json && json.fn) {
    let fn = knownTags[json.fn];
    let args = perform(json.args, knownTags);
    let result = fn(...args);
    return perform(result, knownTags);
  } else if (Array.isArray(json)) {
    return json.map(item => perform(item, knownTags));
  } else {
    return json;
  }
}
```

```js
// 4. convert a tree of Components to a tree of Primitives
function App() {
  return {
    type: "div", // Primitive (string)
    props: {
      children: [
        { type: "Greeting", props: {} }, // Component (function)
        {
          type: "p", // Primitive (string)
          props: {
            className: "text-purple-500",
            children: [
              "The time is: ",
              { type: "Clock", props: {} } // Component (function)
            ],
          },
        },
      ],
    },
  };
}

function Greeting() {
  return {
    type: "p",
    props: {
      children: [
        "Hello, ",
        {
          type: "input",
          props: { placeholder: "Who are you?" },
        },
      ],
    },
  };
}

function Clock() {
  return new Date().toString();
}

// If json.type is a function, that function itself is the Component.
// Otherwise, it must be a Primitive,
function interpret(json) {
  if (json && json.type) {
    if (typeof json.type === "function") {
      let Component = json.type;
      let props = json.props;
      let result = Component(props);
      return interpret(result);
    } else {
      let children = json.props.children && json.props.children.map(interpret);
      let props = { ...json.props, children };
      return { type: json.type, props };
    }
  } else if (Array.isArray(json)) {
    return json.map(interpret);
  } else {
    return json;
  }
}

function perform(json) {
  if (json && json.type) {
    let tagName = json.type;
    let node = document.createElement(tagName);
    for (let [propKey, propValue] of Object.entries(json.props)) {
      if (propKey === "children") {
        let children = perform(propValue);
        for (let child of [children].flat().filter(Boolean)) {
          node.appendChild(child);
        }
      } else {
        node[propKey] = propValue;
      }
    }
    return node;
  } else if (typeof json === "string") {
    return document.createTextNode(json);
  } else if (Array.isArray(json)) {
    return json.map((item) => perform(item));
  } else {
    return json;
  }
}

const primitives = interpret({ type: App, props: {} });
const tree = perform(primitives);
document.body.appendChild(tree);
```

```js
// 5. Early and Late Components
function App() {
  return {
    type: "div",
    props: {
      children: [
        { type: Greeting, props: {} },
        {
          type: "/src/Donut.js#Donut",
          props: {
            children: ["The time is: ", { type: Clock, props: {} }],
          },
        },
      ],
    },
  };
}

function Greeting() {
  return {
    type: "p",
    props: {
      children: [
        "Hello, ",
        {
          type: "input",
          props: { placeholder: "Who are you?" },
        },
      ],
    },
  };
}

function Clock() {
  return new Date().toString();
}

function Donut({ children }) {
  return {
    type: "p",
    props: {
      style: { color: prompt("Pick a color:") },
      children,
    },
  };
}

async function loadReference(lateReference) {
  // Pretend it was loaded over the network or from the bundler cache.
  await new Promise((resolve) => setTimeout(resolve, 3000));
  if (lateReference === "/src/Clock.js#Clock") {
    return Clock;
  } else if (lateReference === "/src/Donut.js#Donut") {
    return Donut;
  } else {
    throw Error("Module not found.");
  }
}

function interpret(json) {
  if (json && json.type) {
    if (typeof json.type === "function") {
      let Component = json.type;
      let props = json.props;
      let result = Component(props);
      return interpret(result);
    } else {
      let children = json.props.children && json.props.children.map(interpret);
      let props = { ...json.props, children };
      return { type: json.type, props };
    }
  } else if (Array.isArray(json)) {
    return json.map(interpret);
  } else {
    return json;
  }
}

function perform(json) {
  if (json && json.type) {
    let tagName = json.type;
    let node = document.createElement(tagName);
    for (let [propKey, propValue] of Object.entries(json.props)) {
      if (propKey === "children") {
        let children = perform(propValue);
        for (let child of [children].flat().filter(Boolean)) {
          node.appendChild(child);
        }
      } else if (propKey === "style") {
        for (let [styleKey, styleValue] of Object.entries(propValue)) {
          node.style[styleKey] = styleValue;
        }
      } else {
        node[propKey] = propValue;
      }
    }
    return node;
  } else if (typeof json === "string") {
    return document.createTextNode(json);
  } else if (Array.isArray(json)) {
    return json.map((item) => perform(item));
  } else {
    return json;
  }
}

const jsonString = JSON.stringify(interpret({ type: App, props: {} }));
const pendingPromises = [];
const lateComponents = JSON.parse(jsonString, (key, value) => {
  if (value && typeof value.type === "string" && value.type.includes("#")) {
    const promise = loadReference(value.type).then((fn) => {
      value.type = fn;
    });
    pendingPromises.push(promise);
  }
  return value;
});

async function render() {
  await Promise.all(pendingPromises);
  const primitives = interpret(lateComponents);
  const tree = perform(primitives);
  document.body.innerHTML = "";
  document.body.appendChild(tree);
}

render();
```

## JSX Over The Wire

```js
// 1. Model, View, ViewModel
type Like = {
  createdAt: string, // Timestamp
  likedById: number, // User ID
  postId: number     // Post ID
};
type Model = Like;

type LikeButtonProps = {
  totalLikeCount: number,
  isLikedByUser: boolean,
  friendLikes: string[]
}
type ViewModel = LikeButtonProps;
```

```js
// 2. BFF layer
import { getPost, getFriendLikes, getRecentPostIds } from '@your-company/data-layer';

// Only place generating props for `LikeButton` component
// which is showing “You, Alice, and 13 others liked this” 
async function LikeButtonViewModel({ postId }) {
  const [post, friendLikes] = await Promise.all([
    getPost(postId),
    getFriendLikes(postId, { limit: 2 }),
  ]);
  return {
    totalLikeCount: post.totalLikeCount,
    isLikedByUser: post.isLikedByUser,
    friendLikes: friendLikes.likes.map(l => l.firstName)
  };
}
 
async function PostDetailsViewModel({ postId }) {
  const [post, postLikes] = await Promise.all([
    getPost(postId),
    LikeButtonViewModel({ postId }),
  ]);
  return {
    postTitle: post.title,
    postContent: parseMarkdown(post.content),
    postAuthor: post.author,
    postLikes
  };
}
 
app.get('/screen/post-details/:postId', async (req, res) => {
  const postId = req.params.postId;
  const viewModel = await PostDetailsViewModel({ postId });
  res.json(viewModel);
});
 
app.get('/screen/post-list', async (req, res) => {
  const postIds = await getRecentPostIds();
  const viewModel = {
    posts: await Promise.all(postIds.map(postId =>
      PostDetailsViewModel({ postId })
    ))
  };
  res.json(viewModel);
});
```

```js
// 3. ViewModel Parameters

// Client doesn’t pass parameters like `?includeAvatars=true` to the server
// BFF itself knows a page include avatars or not, 
// and we have split BFF endpoints into units of reusable logic.
async function PostDetailsViewModel({
  postId,
  truncateContent,
  includeAvatars
}) {
  const [post, postLikes] = await Promise.all([
    getPost(postId),
    LikeButtonViewModel({ postId, includeAvatars }),
  ]);
  return {
    postTitle: post.title,
    postContent: parseMarkdown(post.content, {
      maxParagraphs: truncateContent ? 1 : undefined
    }),
    postAuthor: post.author,
    postLikes
  };
}
```

```js
// 4. Components as JSON

// Producing HTML as the primary output format is a dead end for interactive applications
// However, if tags are objects, they can be sent as JSON.
const json = (
  <Page title={`${person.firstName}'s Profile`}>
    <Header>
      <Avatar src={person.avatarUrl} />
      {person.isPremium && <PremiumBadge />}
    </Header>

    <Layout columns={featureFlags.includes('TWO_COL_LAYOUT') ? 2 : 1}>
      <Panel title="User Info">
        <UserDetails user={person} />
        {req.user.id === person.id && <EditButton />}
      </Panel>

      <Panel title="Activity">
        <ActivityFeed userId={person.id} limit={3} />
      </Panel>
    </Layout>
  </Page>
);

// /app/profile/123
{
  type: "Page",
  props: {
    title: "Jae's Profile",
    children: [{
      type: "Header",
      props: {
        children: [{
          type: "Avatar",
          props: {
            src: "https://example.com/avatar.jpg"
          }
        }, {
          type: "PremiumBadge",
          props: {},
        }]
      }
    }, {
      type: "Layout",
      props: {
        columns: 2,
        children: [
          // ...
        ]
      }
    }]
  }
}
```

```js
// 5. Connect the ViewModel to its component
async function LikeButtonViewModel({
  postId,
  includeAvatars
}) {
  const [post, friendLikes] = await Promise.all([
    getPost(postId),
    getFriendLikes(postId, { limit: includeAvatars ? 5 : 2 }),
  ]);
  return (
    <LikeButton
      totalLikeCount={post.totalLikeCount}
      isLikedByUser={post.isLikedByUser}
      friendLikes={friendLikes.likes.map(l => ({
        firstName: l.firstName,
        avatar: includeAvatars ? l.avatar : null,
      }))}
    />
  );
}
// {
//   type: "LikeButton",
//   props: {
//     totalLikeCount: 8,
//     isLikedByUser: false,
//     friendLikes: [{
//       firstName: 'Alice',
//       avatar: 'https://example.com/alice.jpg'
//     }, {
//       firstName: 'Bob',
//       avatar: 'https://example.com/bob.jpg'
//     }]
//   }
// }

// On the client, React will take these props and pass them to the component
function LikeButton({
  totalLikeCount,
  isLikedByUser,
  friendLikes
}) {
  let buttonText = 'Like';
  if (totalLikeCount > 0) {
    // e.g. "Liked by You, Alice, and 13 others"
    buttonText = formatLikeText(totalLikeCount, isLikedByUser, friendLikes);
  }
  return (
    <button className={isLikedByUser ? 'liked' : ''}>
      {buttonText}
    </button>
  );
}
```