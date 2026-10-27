package com.dishui.m7Redis;


import junit.framework.Assert;
import org.junit.Before;
import org.junit.Test;

/**
 * Created by zengyx on 16/6/12.
 */

public class RedisAPITest{
    @Before
    public void connect(){
        RedisConnection.initPool();
    }

    @Test
    public void testConnection(){
        RedisAPI.StringRedis.set("zengyx", "xixi");
        Assert.assertEquals("xixi", RedisAPI.StringRedis.get("zengyx"));
    }

    @Test
    public void testSetByDatabase(){
        RedisAPI.StringRedis.set("test2", "123", 1);
        org.junit.Assert.assertEquals("123", RedisAPI.StringRedis.get("test2", 1));
    }

    @Test
    public void testIncr(){
        RedisAPI.StringRedis.incr("test1", 1);
        org.junit.Assert.assertEquals(3, Integer.parseInt(RedisAPI.StringRedis.get("test1")));
    }

}
