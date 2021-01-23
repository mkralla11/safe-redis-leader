local key = KEYS[1]
local id = ARGV[1]

local current_id = redis.call('GET', key)
if (id == current_id) then
  redis.call('DEL', key)
  return 1
else
  return 0
end