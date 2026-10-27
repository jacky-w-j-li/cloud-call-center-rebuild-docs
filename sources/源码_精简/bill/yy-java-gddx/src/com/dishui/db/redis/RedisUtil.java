package com.dishui.db.redis;

import com.dishui.bill.service.Utils;
import org.apache.commons.pool2.impl.GenericObjectPoolConfig;
import redis.clients.jedis.*;

import java.io.IOException;
import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by hotchwong on 16/8/31.
 */
public class RedisUtil {
    private final static  int  dialStatsDB=2;
    private static JedisPool pool=null;
    private final static  String  dialStatsPrefix="dial.";
    private static Logger log = Logger.getLogger(RedisUtil.class.getName());

    public static void initDialStatsPool(String ip,int port,String pwd){
        JedisPoolConfig jedisPoolConfig = new JedisPoolConfig();
        //控制一个pool最多有多少个状态为idle(空闲的)的jedis实例。
        jedisPoolConfig.setMaxIdle(20);
        jedisPoolConfig.setMinIdle(0);

        //如果赋值为-1，则表示不限制；如果pool已经分配了maxTotal个jedis实例，则此时pool的状态为exhausted(耗尽)。
        jedisPoolConfig.setMaxTotal(20);

        //表示当borrow(引入)一个jedis实例时，最大的等待时间，如果超过等待时间，则直接抛出JedisConnectionException；
        jedisPoolConfig.setMaxWaitMillis(2000);

        //在borrow一个jedis实例时，是否提前进行validate操作；如果为true，则得到的jedis实例均是可用的；
        jedisPoolConfig.setTestOnBorrow(true);

        pool = new JedisPool(jedisPoolConfig,ip,port,5000,pwd,dialStatsDB);
    }

    public static JedisPool getDialStatsPool() {
        return pool;
    }

    public static int getTelDialStat(String tel){
        try {
            String beginTime=Utils.getCurrentDate();
            String endTime=Utils.getDate("yyyy-MM-dd")+" 23:59:59";
            Long seconds=Utils.getDateInterval(beginTime,endTime);
            String key=dialStatsPrefix+tel;

            RedisAPI redisHandler =new RedisAPI(RedisUtil.getDialStatsPool());
            Pipeline pipe = redisHandler.pipelined();
            pipe.multi();
            pipe.incr(key);
            pipe.expire(key,seconds.intValue());
            Response res =pipe.get(key);
            pipe.exec();
            pipe.close();
            String val=(String)res.get();
            return Integer.parseInt(val);
        } catch (IOException e) {
            e.printStackTrace();
            return 0;
        }
    }




   /* public static void main(String[] args) {
        try {
            pool = new JedisPool(new GenericObjectPoolConfig(),"121.40.194.97",6379,5000,"7moorcom",dialStatsDB);
            String beginTime=Utils.getCurrentDate();
            String endTime=Utils.getDate("yyyy-MM-dd")+" 23:59:59";
            long seconds=Utils.getDateInterval(beginTime,endTime);
            System.out.println("beginTime = " + beginTime + ",endTime==="+endTime+",seconds==="+seconds);
            RedisAPI redisHandler =new RedisAPI(RedisUtil.getDialStatsPool());
            Pipeline pipe = redisHandler.pipelined();
            pipe.multi();
            String key=dialStatsPrefix+"15117942927";
            pipe.incr(key);
            pipe.expire(key,60);
            Response res =pipe.get(key);
            pipe.exec();
            pipe.close();
            String val=(String)res.get();
            System.out.println("args = [" + val + "]");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }*/

    /**
     *
     * @param tel  拨打号码
     * @param type 拨打类型(pt 平台； zh 账户)
     * @return
     */
    public static int CallSum(String tel,String type,String account) {
        log.log(Level.WARNING,"in CallSumMethod,accountId="+account);
        int value=0;
        try {
            String beginTime = Utils.getCurrentDate();
            String endTime = Utils.getDate("yyyy-MM-dd") + " 23:59:59";
            Long seconds = Utils.getDateInterval(beginTime, endTime);
            //System.out.println("beginTime = " + beginTime + ",endTime==="+ endTime + ",seconds===" + seconds);
            RedisAPI redisHandler = new RedisAPI(RedisUtil.getDialStatsPool());
            Pipeline pipe = redisHandler.pipelined();
            pipe.multi();
            String key = type+account+tel;
            pipe.incr(key);
            pipe.expire(key, seconds.intValue());
            //System.out.println("失效时间="+seconds.intValue());
            Response res = pipe.get(key);
            pipe.exec();
            pipe.close();
            value =  Integer.parseInt(res.get().toString());
            log.log(Level.WARNING,"redis_key="+key+",redis_value="+value);
            System.out.println("args = [" + value + "]");
            //如果拨号次数大约最大拨号次数，初始化为最大值s
        } catch (Exception e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
            log.log(Level.WARNING,"in method CallSum exception, tel="+tel+",type="+type+",account="+account,e);
        }
        return value;
    }

    /**
     * redis查询
     * @param tel
     * @param type
     * @param account
     * @return
     */
    public static int getCallCountByKey(String tel,String type,String account){
        int value=0;
        try {
            pool= new JedisPool(new GenericObjectPoolConfig(),"121.40.194.97",6379,5000,"7moorcom",dialStatsDB);
            Jedis jedis = pool.getResource();
            String key = type+account+tel;
            value=Integer.valueOf(jedis.get(key));
        } catch (Exception e) {
            // TODO: handle exception
        }
        return value;
    }

    /**
     * 根据accountid 查询redis 计数
     * zh_N00000000143_*
     * @param accountId
     */
    public static List<Object> queryRedisByAccountId(String accountId){
        List<Object> redisList = new ArrayList<Object>();
        try {
            Jedis jedis = pool.getResource();
            //zh_N00000000143_13439236004
            Set keys = jedis.keys("zh_" + accountId + "_*");
            Iterator iterator = keys.iterator();
            while (iterator.hasNext()) {
                Map<String, Object> map = new HashMap<String, Object>();
                String key = iterator.next().toString();
                String value = jedis.get(key);
                map.put("reids-key", "'" + key + "'");
                map.put("redis-value", "'" + value + "'");
                redisList.add(map);
            }
        }catch (Exception e) {
            // TODO: handle exception
            e.printStackTrace();
            log.log(Level.WARNING,"in method queryRedisByAccountId exception,accountId="+accountId,e);
        }
        System.out.println("redisList=="+redisList);
        return redisList;
    }




}
