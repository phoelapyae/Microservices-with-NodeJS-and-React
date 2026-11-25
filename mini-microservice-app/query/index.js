const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const posts = {};

const eventBusUrl = process.env.EVENT_BUS_URL || 'http://event-bus-svc:4005';

const fetchEvents = async (retries = 10, delay = 2000) => {
  try {
    return await axios.get(`${eventBusUrl}/events`);
  } catch (err) {
    if (retries <= 0) {
      throw err;
    }

    console.log(`Event bus unavailable at ${eventBusUrl}, retrying in ${delay}ms...`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchEvents(retries - 1, delay);
  }
};

const handleEvent = (type, data) => {
  if (type === 'PostCreated') {
    const { id, title } = data;

    posts[id] = { id, title, comments: [] };
  }

  if (type === 'CommentCreated') {
    const { id, content, postId, status } = data;

    const post = posts[postId];

    post.comments.push({ id, content, status });
  }

  if (type === 'CommentUpdated') {
    const { id, content, postId, status } = data;

    const post = posts[postId];
    const comment = post.comments.find((comment) => {
      return comment.id === id;
    });

    comment.status = status;
    comment.content = content;
  }
};

app.get('/posts', (req, res) => {
  return res.send(posts);
});

app.post('/events', (req, res) => {
  const { type, data } = req.body;

  handleEvent(type, data);

  return res.send({});
});

app.listen(4002, async () => {
  console.log('Listening on 4002');

  const res = await fetchEvents();

  for (let event of res.data) {
    console.log('Processing event:', event.type);
    handleEvent(event.type, event.data);
  }
});