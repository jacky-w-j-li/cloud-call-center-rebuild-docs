package com.dishui.m7Redis;

import redis.clients.jedis.*;

import java.util.HashSet;
import java.util.Properties;
import java.util.Set;

/**
 * Created by zengyx on 16/6/7.
 * redis连接类
 *
 */
public class RedisConnection {

    public static String ip = "121.40.194.97";
    public static int port = 6379;
    public static String password = "7moorcom";
    private static JedisPool jedisPool = null;

    public static JedisPool initPool(){
        if(jedisPool == null){
            JedisPoolConfig jedisPoolConfig = new JedisPoolConfig();
            //控制一个pool最多有多少个状态为idle(空闲的)的jedis实例。
            jedisPoolConfig.setMaxIdle(5);
            jedisPoolConfig.setMinIdle(0);

            //如果赋值为-1，则表示不限制；如果pool已经分配了maxTotal个jedis实例，则此时pool的状态为exhausted(耗尽)。
            jedisPoolConfig.setMaxTotal(100);

            //表示当borrow(引入)一个jedis实例时，最大的等待时间，如果超过等待时间，则直接抛出JedisConnectionException；
            jedisPoolConfig.setMaxWaitMillis(10000);

            //在borrow一个jedis实例时，是否提前进行validate操作；如果为true，则得到的jedis实例均是可用的；
            jedisPoolConfig.setTestOnBorrow(true);

            jedisPool = new JedisPool(jedisPoolConfig, ip, port, 5000, password);
        }
        return jedisPool;

    }

    public static JedisPool initPool(int database){
        if(jedisPool == null){
            JedisPoolConfig jedisPoolConfig = new JedisPoolConfig();
            //控制一个pool最多有多少个状态为idle(空闲的)的jedis实例。
            jedisPoolConfig.setMaxIdle(5);
            jedisPoolConfig.setMinIdle(0);

            //如果赋值为-1，则表示不限制；如果pool已经分配了maxTotal个jedis实例，则此时pool的状态为exhausted(耗尽)。
            jedisPoolConfig.setMaxTotal(100);

            //表示当borrow(引入)一个jedis实例时，最大的等待时间，如果超过等待时间，则直接抛出JedisConnectionException；
            jedisPoolConfig.setMaxWaitMillis(10000);

            //在borrow一个jedis实例时，是否提前进行validate操作；如果为true，则得到的jedis实例均是可用的；
            jedisPoolConfig.setTestOnBorrow(true);

            jedisPool = new JedisPool(jedisPoolConfig, ip, port, 5000, password, database);
        }
        return jedisPool;

    }

    /**
     * 获取jedis连接
     * @return
     */
    public synchronized static Jedis getJedisResource(){
        if(jedisPool != null){
            Jedis jedis  = null;
            jedis = jedisPool.getResource();
            return jedis;
        }
        return null;
    }

    /**
     * 获取jedis连接
     * @return
     */
    public synchronized static Jedis getJedisResource(int database){
        if(jedisPool != null){
            Jedis jedis  = null;
            jedis = jedisPool.getResource();
            jedis.select(database);
            return jedis;
        }
        return null;
    }

    /**
     * 手动关闭连接
     * @param jedis
     */
    public static void closeResource(Jedis jedis){
        if(jedis != null){
            jedis.close();
        }
    }


}
