package com.dishui.m7Redis;


import org.junit.Test;

/**
 * Created by zengyx on 16/6/12.
 */

public class RedisAPITest{
//    @Before
//    public void connect(){
//        RedisConnection.initPool();
//    }

//    @Test
//    public void testConnection(){
//        RedisAPI.StringRedis.set("zengyx", "xixi");
//        Assert.assertEquals("xixi", RedisAPI.StringRedis.get("zengyx"));
//    }
//
//    @Test
//    public void testSetByDatabase(){
//        RedisAPI.StringRedis.set("test2", "123", 1);
//        org.junit.Assert.assertEquals("123", RedisAPI.StringRedis.get("test2", 1));
//    }
//
//    @Test
//    public void testIncr(){
//        RedisAPI.StringRedis.incr("zengyxtest", 1);
//        org.junit.Assert.assertEquals(1, Integer.parseInt(RedisAPI.StringRedis.get("zengyxtest")));
//    }

    @Test
    public void testMset(){
        RedisConnection.initPool();
        RedisAPI redis = new RedisAPI(RedisConnection.getRedisPool(), RedisKeyConstant.REDIS_DB1);
        String[] aa = new String[4*2];

        int j=0;
        for(int i=0; i<4; i++){
            aa[j]="uu"+i;
            aa[j+1]= "123"+i;
            j=j+2;
        }
        redis.mset(aa);
        System.out.println(redis.mget("uu0", "uu1", "uu2","uu3"));
    }

}
