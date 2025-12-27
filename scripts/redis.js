// redis-server, running at port 6379
// redis-cli

// SET key value
// GET key
// DEL key
// EXISTS key
// KEYS *
// EXPIRE key time
// TTL key
// SETEX key time value

// LPUSH key value
// LPOP key
// LLEN key
// LRANGE key start end
// RPUSH key value
// RPOP key
// LSET key index value

// SADD key value
// SMEMBERS key
// SREM key value

// HSET key field value
// HGET key field
// HGETALL key
// HKEYS key
// HVALS key
// HDEL key field

import Redis from "redis";
const redisClient = Redis.createClient();

function getOrSetCache(key, cb) {
  return new Promise((resolve, reject) => {
    redisClient.get(key, async (err, data) => {
      if (err) return reject(err);
      if (data !== null) return resolve(JSON.parse(data));

      const freshData = await cb();
      redisClient.set(key, JSON.stringify(freshData));
      resolve(freshData);
    });
  });
}

const todos = await getOrSetCache(`todos?id=${id}`, async () => {
  const { data } = await axios.get("https://jsonplaceholder.typicode.com/todos", {
    params: { id },
  });

  return data;
});
