package com.dishui.m7Redis;

import com.dishui.manager.service.AppConfig;
import redis.clients.jedis.*;

/**
 * Created by zengyx on 16/6/7.
 * redis连接类
 *
 */
public class RedisConnection {

    private static JedisPool jedisPool = null;

    public static JedisPool initPool(){
        String ip = AppConfig.getInstance().getVar("redis.ip");
        int port = Integer.parseInt(AppConfig.getInstance().getVar("redis.port"));
        String password = AppConfig.getInstance().getVar("redis.password");
        int maxConns = Integer.parseInt(AppConfig.getInstance().getVar("redis.maxConns"));
        int maxIdles = Integer.parseInt(AppConfig.getInstance().getVar("redis.maxIdles"));
        int minIdles = Integer.parseInt(AppConfig.getInstance().getVar("redis.minIdles"));
        int maxWaitMillis = Integer.parseInt(AppConfig.getInstance().getVar("redis.maxWaitMillis"));
        int timeout = Integer.parseInt(AppConfig.getInstance().getVar("redis.timeout"));
        if(jedisPool == null){
            JedisPoolConfig jedisPoolConfig = new JedisPoolConfig();
            //控制一个pool最多有多少个状态为idle(空闲的)的jedis实例。
            jedisPoolConfig.setMaxIdle(maxIdles);
            jedisPoolConfig.setMinIdle(minIdles);

            //如果赋值为-1，则表示不限制；如果pool已经分配了maxTotal个jedis实例，则此时pool的状态为exhausted(耗尽)。
            jedisPoolConfig.setMaxTotal(maxConns);

            //表示当borrow(引入)一个jedis实例时，最大的等待时间，如果超过等待时间，则直接抛出JedisConnectionException；
            jedisPoolConfig.setMaxWaitMillis(maxWaitMillis);

            //在borrow一个jedis实例时，是否提前进行validate操作；如果为true，则得到的jedis实例均是可用的；
            jedisPoolConfig.setTestOnBorrow(true);
            jedisPool = new JedisPool(jedisPoolConfig, ip, port, timeout, password);


        }
        return jedisPool;

    }

    public static JedisPool initPool(int database){
        String ip = AppConfig.getInstance().getVar("redis.ip");
        int port = Integer.parseInt(AppConfig.getInstance().getVar("redis.port"));
        String password = AppConfig.getInstance().getVar("redis.password");
        int maxConns = Integer.parseInt(AppConfig.getInstance().getVar("redis.maxConns"));
        int maxIdles = Integer.parseInt(AppConfig.getInstance().getVar("redis.maxIdles"));
        int minIdles = Integer.parseInt(AppConfig.getInstance().getVar("redis.minIdles"));
        int maxWaitMillis = Integer.parseInt(AppConfig.getInstance().getVar("redis.maxWaitMillis"));
        int timeout = Integer.parseInt(AppConfig.getInstance().getVar("redis.timeout"));
        if(jedisPool == null){
            JedisPoolConfig jedisPoolConfig = new JedisPoolConfig();
            //控制一个pool最多有多少个状态为idle(空闲的)的jedis实例。
            jedisPoolConfig.setMaxIdle(maxIdles);
            jedisPoolConfig.setMinIdle(minIdles);

            //如果赋值为-1，则表示不限制；如果pool已经分配了maxTotal个jedis实例，则此时pool的状态为exhausted(耗尽)。
            jedisPoolConfig.setMaxTotal(maxConns);

            //表示当borrow(引入)一个jedis实例时，最大的等待时间，如果超过等待时间，则直接抛出JedisConnectionException；
            jedisPoolConfig.setMaxWaitMillis(maxWaitMillis);

            //在borrow一个jedis实例时，是否提前进行validate操作；如果为true，则得到的jedis实例均是可用的；
            jedisPoolConfig.setTestOnBorrow(true);
            jedisPool = new JedisPool(jedisPoolConfig, ip, port, timeout, password, database);


        }
        return jedisPool;

    }

    /**
     * 获取jedis连接
     * @return
     */
    public synchronized static Jedis getJedisResource(){
        try{
            if(jedisPool != null){
                Jedis jedis  = null;
                jedis = jedisPool.getResource();
                return jedis;
            }
            return null;
        }catch (Exception e){
            return null;
        }

    }

    /**
     * 获取jedis连接
     * @return
     */
    public synchronized static Jedis getJedisResource(int database){
        try{
            if(jedisPool != null){
                Jedis jedis  = null;
                jedis = jedisPool.getResource();
                jedis.select(database);
                return jedis;
            }
            return null;
        }catch (Exception e){
            return null;
        }
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

    public static JedisPool getRedisPool(){
        if(jedisPool == null){
            throw new RuntimeException("redis pool has not init!");
        }

        return jedisPool;
    }
}
