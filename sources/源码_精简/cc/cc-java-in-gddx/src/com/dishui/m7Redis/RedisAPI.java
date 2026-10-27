package com.dishui.m7Redis;

import redis.clients.jedis.Jedis;

import java.util.*;

/**
 * Created by zengyx on 16/6/12.
 * redis api
 */
public class RedisAPI {

    public static class StringRedis{
        /**
         * 存储数据, String类型
         * @param key
         * @param value
         */
        public static String set(String key ,String value) {
            Jedis jedis = RedisConnection.getJedisResource();
            String result = null;
            if(jedis != null){
                result = jedis.set(key, value);
                RedisConnection.closeResource(jedis);
            }
            return result;
        }

        /**
         * 存储数据, String类型
         * @param key
         * @param value
         */
        public static String set(String key ,String value, int database) {
            Jedis jedis = RedisConnection.getJedisResource(database);
            String result = null;
            if(jedis != null){
                result = jedis.set(key, value);
                RedisConnection.closeResource(jedis);
            }
            return result;
        }

        /**
         * 存储数据,并设置过期时间
         * @param key
         * @param value
         * @param expireSeconds
         * @return
         */
        public static String setex(String key, String value, int expireSeconds){
            Jedis jedis = RedisConnection.getJedisResource();
            String status = null;
            if(jedis != null){
                status = jedis.setex(key, expireSeconds, value);
                RedisConnection.closeResource(jedis);
            }
            return status;
        }

        /**
         * 存储数据,并设置过期时间
         * @param key
         * @param value
         * @param expireSeconds
         * @return
         */
        public static String setex(String key, String value, int expireSeconds, int database){
            Jedis jedis = RedisConnection.getJedisResource(database);
            String status = null;
            if(jedis != null){
                status = jedis.setex(key, expireSeconds, value);
                RedisConnection.closeResource(jedis);
            }
            return status;
        }

        /**
         * 批量存储数据
         * @param keyvalues
         * @return
         */
        public static String multiSet(String...  keyvalues){
            Jedis jedis = RedisConnection.getJedisResource();
            String status = null;
            if(jedis != null){
                status = jedis.mset(keyvalues);
                RedisConnection.closeResource(jedis);
            }
            return status;
        }

        /**
         * 批量存储数据
         * @param maps hash表
         * @return
         */
        public static void set(HashMap<String, String> maps){
            Jedis jedis = RedisConnection.getJedisResource();
            if(jedis != null){
                for(Iterator iterator=maps.keySet().iterator(); iterator.hasNext();){
                    String key = (String)iterator.next();
                    String value = maps.get(key);
                    jedis.set(key, value);
                }
                RedisConnection.closeResource(jedis);
            }
        }


        /**
         * 根据key获取value
         * @param key
         * @return
         */
        public static String get(String key){
            Jedis jedis = RedisConnection.getJedisResource();
            String result = null;
            if(jedis != null){
                result = jedis.get(key);
                RedisConnection.closeResource(jedis);
            }

            return result;
        }

        /**
         * 根据key获取value
         * @param key
         * @return
         */
        public static String get(String key, int database){
            Jedis jedis = RedisConnection.getJedisResource(database);
            String result = null;
            if(jedis != null){
                result = jedis.get(key);
                RedisConnection.closeResource(jedis);
            }
            return result;
        }

        /**
         * 对key的值进行增量计算
         * @param key
         * @param increment 每次增加的值
         * @return
         */
        public static long incr(String key, int increment){
            Jedis jedis = RedisConnection.getJedisResource();
            long value = 0;
            if(jedis != null){
                value = jedis.incrBy(key, increment);
                RedisConnection.closeResource(jedis);
            }
            return value;
        }

        /**
         * 对key的值进行增量计算
         * @param key
         * @param increment 每次增加的值
         * @return
         */
        public static long incr(String key, int increment, int database){
            Jedis jedis = RedisConnection.getJedisResource(database);
            long value = 0;
            if(jedis != null){
                value = jedis.incrBy(key, increment);
                RedisConnection.closeResource(jedis);
            }
            return value;
        }

        /**
         * 对key的值进行增量计算
         * @param key
         * @param decr 每次递减的值
         * @return
         */
        public static long decr(String key, int decr){
            Jedis jedis = RedisConnection.getJedisResource();
            long value = 0;
            if(jedis != null){
                value = jedis.decrBy(key, decr);
                RedisConnection.closeResource(jedis);
            }
            return value;
        }

        /**
         * 对key的值进行增量计算
         * @param key
         * @param decr 每次递减的值
         * @return
         */
        public static long decr(String key, int decr, int database){
            Jedis jedis = RedisConnection.getJedisResource(database);
            long value = 0;
            if(jedis != null){
                value = jedis.decrBy(key, decr);
                RedisConnection.closeResource(jedis);
            }
            return value;
        }

        /**
         * 删除
         */
        public static void delete(String key){
            Jedis jedis = RedisConnection.getJedisResource();
            if(jedis != null){
                jedis.del(key);
                RedisConnection.closeResource(jedis);
            }
        }

        /**
         * 删除
         */
        public static void delete(String key, int database){
            Jedis jedis = RedisConnection.getJedisResource(database);
            if(jedis != null){
                jedis.del(key);
                RedisConnection.closeResource(jedis);
            }
        }

        /**
         * 拼接字符串
         * @return
         */
        public static long append(String key, String appendValue){
            long length = 0;
            Jedis jedis = RedisConnection.getJedisResource();
            if(jedis != null){
                length = jedis.append(key, appendValue);
                RedisConnection.closeResource(jedis);
            }
            return length;
        }

        /**
         * 拼接字符串
         * @return
         */
        public static long append(String key, String appendValue, int database){
            long length = 0;
            Jedis jedis = RedisConnection.getJedisResource(database);
            if(jedis != null){
                length = jedis.append(key, appendValue);
                RedisConnection.closeResource(jedis);
            }
            return length;
        }
    }

    public static class ListRedis{

        /**
         * 从右边入队列
         * @param key
         * @param value
         */
        public static long rpush(String key, String value){
            long size = 0;
            Jedis jedis = RedisConnection.getJedisResource();
            if(jedis != null){
                size = jedis.rpush(key, value);
                RedisConnection.closeResource(jedis);
            }
            return size;
        }

        /**
         * 从右边入队列
         * @param key
         * @param value
         */
        public static long rpush(String key, String value, int database){
            long size = 0;
            Jedis jedis = RedisConnection.getJedisResource(database);
            if(jedis != null){
                size = jedis.rpush(key, value);
                RedisConnection.closeResource(jedis);
            }
            return size;
        }

        /**
         * 从左边入队列
         * @param key
         * @param value
         */
        public static long lpush(String key, String value){
            long size = 0;
            Jedis jedis = RedisConnection.getJedisResource();
            if(jedis != null){
                size = jedis.lpush(key, value);
                RedisConnection.closeResource(jedis);
            }
            return size;
        }

        /**
         * 从左边入队列
         * @param key
         * @param value
         */
        public static long lpush(String key, String value, int database){
            long size = 0;
            Jedis jedis = RedisConnection.getJedisResource(database);
            if(jedis != null){
                size = jedis.lpush(key, value);
                RedisConnection.closeResource(jedis);
            }
            return size;
        }

        /**
         * 获取队列的长度
         * @param key
         * @return
         */
        public static int length(String key){
            int size = 0;
            Jedis jedis = RedisConnection.getJedisResource();
            if(jedis != null){
                size = jedis.llen(key).intValue();
                RedisConnection.closeResource(jedis);
            }
            return size;
        }

        /**
         * 获取队列的长度
         * @param key
         * @return
         */
        public static int length(String key, int database){
            int size = 0;
            Jedis jedis = RedisConnection.getJedisResource(database);
            if(jedis != null){
                size = jedis.llen(key).intValue();
                RedisConnection.closeResource(jedis);
            }
            return size;
        }

        /**
         * 从左侧取出一个数据
         * @param key
         * @return
         */
        public static String lpop(String key){
            Jedis jedis = RedisConnection.getJedisResource();
            String result = null;
            if(jedis != null){
                result= jedis.lpop(key);
                RedisConnection.closeResource(jedis);
            }
            return result;
        }

        /**
         * 从左侧取出一个数据
         * @param key
         * @param database
         * @return
         */
        public static String lpop(String key, int database){
            Jedis jedis = RedisConnection.getJedisResource(database);
            String result = null;
            if(jedis != null){
                result = jedis.lpop(key);
                RedisConnection.closeResource(jedis);
            }
            return result;
        }

        /**
         * 从右侧取出一个数据
         * @param key
         * @return
         */
        public static String rpop(String key){
            Jedis jedis = RedisConnection.getJedisResource();
            String result = null;
            if(jedis != null){
                result = jedis.rpop(key);
                RedisConnection.closeResource(jedis);
            }
            return result;
        }

        /**
         * 从右侧取出一个数据
         * @param key
         * @param database
         * @return
         */
        public static String rpop(String key, int database){
            Jedis jedis = RedisConnection.getJedisResource(database);
            String result = null;
            if(jedis != null){
                result = jedis.rpop(key);
                RedisConnection.closeResource(jedis);
            }
            return result;
        }

        /**
         * 获取列表里从start 到 end位置的值
         * @param key
         * @param start
         * @param end
         * @return
         */
        public static List<String> lrange(String key, int start, int end){
            Jedis jedis = RedisConnection.getJedisResource();
            List<String> result = null;
            if(jedis != null){
                result =  jedis.lrange(key, start, end);
                RedisConnection.closeResource(jedis);
            }

            return result;
        }

        /**
         * 获取列表里从start 到 end位置的值
         * @param key
         * @param start
         * @param end
         * @return
         */
        public static List<String> lrange(String key, int start, int end, int database){
            Jedis jedis = RedisConnection.getJedisResource(database);
            List<String> result = null;
            if(jedis != null){
                result= jedis.lrange(key, start, end);
                RedisConnection.closeResource(jedis);
            }
            return result;
        }

        /**
         * 修剪队列中的数据
         * @param key
         * @param start
         * @param end
         * @return 成功返回 "OK"
         */
        public static String ltrim(String key, int start, int end){
            Jedis jedis = RedisConnection.getJedisResource();
            if(jedis != null){
                return jedis.ltrim(key, start, end);
            }
            return null;
        }

        /**
         * 修剪队列中的数据
         * @param key
         * @param start
         * @param end
         * @return 成功返回 "OK"
         */
        public static String ltrim(String key, int start, int end, int database){
            Jedis jedis = RedisConnection.getJedisResource(database);
            String result = null;
            if(jedis != null){
                result = jedis.ltrim(key, start, end);
                RedisConnection.closeResource(jedis);
            }
            return result;
        }


        /**
         * 获取队列中的索引位置的值
         * @param key
         * @param  index
         * @return 成功返回 "OK"
         */
        public static String lindex(String key, long index){
            Jedis jedis = RedisConnection.getJedisResource();
            String result = null;
            if(jedis != null){
                result = jedis.lindex(key, index);
                RedisConnection.closeResource(jedis);
            }
            return result;
        }

        /**
         * 替换队列中的某个索引的数据
         * @param key
         * @param value
         * @param index
         * @return OK
         */
        public static String replaceByIndex(String key, String value, long index){
            Jedis jedis = RedisConnection.getJedisResource();
            String result = null;
            if(jedis != null){
                result = jedis.lset(key, index, value);
                RedisConnection.closeResource(jedis);
            }
            return result;
        }

        /**
         * 从队列中移除数据
         * @param key
         * @param value
         * @param count 为负,则从尾到头数
         * @return
         */
        public static long lrem(String key, String value, long count){
            Jedis jedis = RedisConnection.getJedisResource();
            long result = -1;
            if(jedis!=null){
                result = jedis.lrem(key, count, value);
                RedisConnection.closeResource(jedis);
            }

            return result;
        }

        /**
         * 返回当前push数据的索引值
         * @param key
         * @param value
         * @return
         */
        public static long lpushx(String key, String value){
            Jedis jedis = RedisConnection.getJedisResource();
            long result = -1;
            if(jedis != null){
                result = jedis.lpushx(key, value);
                RedisConnection.closeResource(jedis);
            }
            return result;
        }



    }


    /**
     * hash结构
     */
    public static class HashRedis{
        /**
         * 插入一条hash结构记录
         * @param key
         * @param field
         * @param value
         * @return 0,1
         */
        public static long hset(String key, String field, String value){
            Jedis jedis = RedisConnection.getJedisResource();
            long result = -1;
            if(jedis!= null){
                result = jedis.hset(key, field, value);
                RedisConnection.closeResource(jedis);
            }
            return result;
        }

        /**
         * 插入一条hash结构记录
         * @param key
         * @param field
         * @param value
         * @return 0,1
         */
        public static long hset(String key, String field, String value, int database){
            Jedis jedis = RedisConnection.getJedisResource(database);
            long result =-1;
            if(jedis!= null){
                result = jedis.hset(key, field, value);
                RedisConnection.closeResource(jedis);
            }
            return result;
        }

        /**
         * 如果不存在field,则插入
         * @param key
         * @param field
         * @param value
         * @return
         */
        public static long hsetnx(String key, String field, String value){
            Jedis jedis = RedisConnection.getJedisResource();
            long result =-1;
            if(jedis!= null){
                result = jedis.hsetnx(key, field, value);
                RedisConnection.closeResource(jedis);
            }
            return result;
        }

        /**
         * 如果不存在field,则插入
         * @param key
         * @param field
         * @param value
         * @return
         */
        public static long hsetnx(String key, String field, String value, int database){
            Jedis jedis = RedisConnection.getJedisResource(database);
            long result = -1;
            if(jedis!= null){
                result = jedis.hsetnx(key, field, value);
                RedisConnection.closeResource(jedis);
            }
            return result;
        }

        /**
         * 插入hashmap
         * @param key
         * @param fieldValues
         * @return
         */
        public static String hmset(String key, HashMap<String ,String> fieldValues){
            Jedis jedis = RedisConnection.getJedisResource();
            String result = null;
            if(jedis != null){
                result = jedis.hmset(key, fieldValues);
                RedisConnection.closeResource(jedis);
            }
            return result;
        }

        /**
         * 插入hashmap
         * @param key
         * @param fieldValues
         * @return
         */
        public static String hmset(String key, HashMap<String ,String> fieldValues, int database){
            Jedis jedis = RedisConnection.getJedisResource(database);
            String result = null;
            if(jedis != null){
                result = jedis.hmset(key, fieldValues);
                RedisConnection.closeResource(jedis);
            }
            return result;
        }

        /**
         * 获取field对应的值
         * @param key
         * @param field
         * @return
         */
        public static String hget(String key, String field){
            Jedis jedis = RedisConnection.getJedisResource();
            String result = null;
            if(jedis != null){
                result = jedis.hget(key, field);
                RedisConnection.closeResource(jedis);
            }
            return result;
        }

        /**
         * 获取field对应的值
         * @param key
         * @param field
         * @return
         */
        public static String hget(String key, String field, int database){
            Jedis jedis = RedisConnection.getJedisResource(database);
            String result = null;
            if(jedis != null){
                result =  jedis.hget(key, field);
                RedisConnection.closeResource(jedis);
            }
            return result;
        }

        /**
         * 获取field对应的值
         * @param key
         * @param field
         * @return
         */
        public static List<String> hmget(String key, String... field){
            Jedis jedis = RedisConnection.getJedisResource();
            List<String> result = null;
            if(jedis != null){
                result = jedis.hmget(key, field);
                RedisConnection.closeResource(jedis);
            }
            return result;
        }

        /**
         * 获取field对应的值
         * @param key
         * @param field
         * @return
         */
        public static List<String> hmget(int database, String key, String... field){
            Jedis jedis = RedisConnection.getJedisResource(database);
            List<String> result = null;
            if(jedis != null){
                result = jedis.hmget(key, field);
                RedisConnection.closeResource(jedis);
            }
            return result;
        }


        /**
         * 判断field是否存在
         * @param key
         * @param field
         * @return
         */
        public static boolean hexists(String key, String field){
            Jedis jedis = RedisConnection.getJedisResource();
            boolean result = false;
            if(jedis != null){
                result = jedis.hexists(key, field);
                RedisConnection.closeResource(jedis);
            }
            return result;
        }

        /**
         * 判断field是否存在
         * @param key
         * @param field
         * @return
         */
        public static boolean hexists(String key, String field, int database){
            Jedis jedis = RedisConnection.getJedisResource(database);
            boolean result = false;
            if(jedis != null){
                result = jedis.hexists(key, field);
                RedisConnection.closeResource(jedis);
            }
            return result;
        }

        /**
         * 删除field键
         * @param key
         * @param field
         */
        public static int hdel(String key, String field){
            Jedis jedis = RedisConnection.getJedisResource();
            int result =-1;
            if(jedis != null){
                result = jedis.hdel(key, field).intValue();
                RedisConnection.closeResource(jedis);
            }
            return result;
        }

        /**
         * 删除field键
         * @param key
         * @param field
         */
        public static int hdel(String key, String field, int database){
            Jedis jedis = RedisConnection.getJedisResource(database);
            int result =-1;
            if(jedis != null){
                result = jedis.hdel(key, field).intValue();
                RedisConnection.closeResource(jedis);
            }
            return result;
        }

        /**
         * 获取key下面的键值对数量
         * @param key
         * @return
         */
        public static int hlen(String key){
            Jedis jedis = RedisConnection.getJedisResource();
            int result =-1;
            if(jedis != null){
                result = jedis.hlen(key).intValue();
                RedisConnection.closeResource(jedis);
            }
            return result;
        }

        /**
         * 获取key下面的键值对数量
         * @param key
         * @return
         */
        public static int hlen(String key, int database){
            Jedis jedis = RedisConnection.getJedisResource(database);
            int result = -1;
            if(jedis != null){
                result = jedis.hlen(key).intValue();
                RedisConnection.closeResource(jedis);
            }
            return result;
        }

        /**
         * 获取key下面的所有键值对
         * @param  key
         * @return
         */
        public static Map<String ,String> hgetAll(String key, int database){
            Jedis jedis = RedisConnection.getJedisResource(database);
            Map<String, String> result = null;
            if(jedis != null){
                result = jedis.hgetAll(key);
                RedisConnection.closeResource(jedis);
            }
            return result;
        }

        /**
         * 获取key下面的所有键值对
         * @param  key
         * @return
         */
        public static Map<String ,String> hgetAll(String key){
            Jedis jedis = RedisConnection.getJedisResource();
            Map<String, String> result = null;
            if(jedis != null){
                result = jedis.hgetAll(key);
                RedisConnection.closeResource(jedis);
            }
            return result;
        }

    }

    /**
     * set类型操作
     */
    public static class SetReis{
        /**
         * 给key增加一个值,存在则返回0
         * @param key
         * @param value
         * @return 0, 1
         */
        public static long add(String key, String value){
            Jedis jedis = RedisConnection.getJedisResource();
            long result =-1;
            if(jedis != null){
                result = jedis.sadd(key, value);
                RedisConnection.closeResource(jedis);
            }
            return result;
        }

        /**
         * 给key增加一个值,存在则返回0
         * @param key
         * @param value
         * @return 0, 1
         */
        public static long add(String key, String value, int database){
            Jedis jedis = RedisConnection.getJedisResource(database);
            long result =-1;
            if(jedis != null){
                result = jedis.sadd(key, value);
                RedisConnection.closeResource(jedis);
            }
            return result;
        }

        /**
         * 获取key的所有值
         * @param key
         * @return
         */
        public static Set<String> members(String key){
            Jedis jedis = RedisConnection.getJedisResource();
            Set<String> result = null;
            if(jedis != null){
                result =  jedis.smembers(key);
                RedisConnection.closeResource(jedis);
            }
            return result;
        }

        /**
         * 获取key的所有值
         * @param key
         * @return
         */
        public static Set<String> members(String key, int database){
            Jedis jedis = RedisConnection.getJedisResource(database);
            Set<String> result = null;
            if(jedis != null){
                result = jedis.smembers(key);
                RedisConnection.closeResource(jedis);
            }
            return result;
        }

        /**
         * 移除集合中的某个值
         * @param key
         * @param value
         * @return
         */
        public static long rem(String key, String value){
            Jedis jedis = RedisConnection.getJedisResource();
            long result =-1;
            if(jedis != null){
                result = jedis.srem(key, value);
                RedisConnection.closeResource(jedis);
            }
            return result;
        }

        /**
         * 移除集合中的某个值
         * @param key
         * @param value
         * @return
         */
        public static long rem(String key, String value, int database){
            Jedis jedis = RedisConnection.getJedisResource(database);
            long result =-1;
            if(jedis != null){
                result = jedis.srem(key, value);
                RedisConnection.closeResource(jedis);
            }
            return result;
        }

        /**
         * 移除集合中的一个值并返回
         * @param key
         * @return
         */
        public static String pop(String key){
            Jedis jedis = RedisConnection.getJedisResource();
            String result =null;
            if(jedis != null){
                result = jedis.spop(key);
                RedisConnection.closeResource(jedis);
            }
            return result;
        }

        /**
         * 移除集合中的一个值并返回
         * @param key
         * @return
         */
        public static String pop(String key, int database){
            Jedis jedis = RedisConnection.getJedisResource(database);
            String result =null;
            if(jedis != null){
                result = jedis.spop(key);
                RedisConnection.closeResource(jedis);
            }
            return result;
        }

        /**
         * 获取成员的数量
         * @param key
         * @return
         */
        public static long count(String key){
            Jedis jedis = RedisConnection.getJedisResource();
            long result =-1;
            if(jedis != null){
                result = jedis.scard(key);
                RedisConnection.closeResource(jedis);
            }
            return result;
        }

        /**
         * 获取成员的数量
         * @param key
         * @return
         */
        public static long count(String key, int database){
            Jedis jedis = RedisConnection.getJedisResource(database);
            long result =-1;
            if(jedis != null){
                result = jedis.scard(key);
                RedisConnection.closeResource(jedis);
            }
            return result;
        }

        /**
         * value是否存在key中
         * @param key
         * @param value
         * @return
         */
        public static boolean exists(String key, String value){
            Jedis jedis = RedisConnection.getJedisResource();
            boolean result = false;
            if(jedis != null){
                result = jedis.sismember(key, value);
                RedisConnection.closeResource(jedis);
            }
            return result;
        }



    }


}
