const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const events = [];

const postsUrl = process.env.POSTS_URL || 'http://posts-clusterip-svc:4000';
const commentsUrl = process.env.COMMENTS_URL || 'http://comments-svc:4001';
const queryUrl = process.env.QUERY_URL || 'http://query-svc:4002';
const moderationUrl = process.env.MODERATION_URL || 'http://moderation-svc:4003';

const publish = async (url, event) => {
  try {
    await axios.post(`${url}/events`, event);
  } catch (err) {
    console.log(`Failed to publish event to ${url}: ${err.message}`);
  }
};

app.post('/events', async (req, res) => {
  const event = req.body;

  events.push(event);

  await Promise.all([
    publish(postsUrl, event),
    publish(commentsUrl, event),
    publish(queryUrl, event),
    publish(moderationUrl, event),
  ]);

  return res.send({ status: 'OK' });
});

app.get('/events', (req, res) => {
  res.send(events);
});

app.listen(4005, () => {
  console.log('Listening on 4005');
});