import os
import redis

# Try connecting to the redis hostname provided by docker-compose
# Note: we are running this on the host, so we should test localhost:6379
r = redis.Redis(host='localhost', port=6379, db=0)
try:
    r.ping()
    print("Successfully connected to Redis from host")
except Exception as e:
    print(f"Failed to connect to Redis from host: {e}")
