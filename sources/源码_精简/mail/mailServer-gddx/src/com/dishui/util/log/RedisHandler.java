package com.dishui.util.log;

import com.dishui.dbpool.RedisAPI;
import com.dishui.util.Utils;
import org.apache.commons.pool2.impl.GenericObjectPoolConfig;
import redis.clients.jedis.JedisPool;
import java.net.URI;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.*;

/**
 * Created by jackwong on 16/7/18.
 */
public class RedisHandler extends Handler {


    private ThreadLocal<RedisAPI>  threadLocal = new ThreadLocal<RedisAPI>();
    private JedisPool jedisPool = null;
    private String listName = null;
    Map<String,String> baseLogFields = new HashMap<String, String>();


    public RedisHandler(String hostURI,String fields, int timeoutMs) {
        URI uri = URI.create(hostURI);

        String host = uri.getHost();
        int port = uri.getPort();
        String pass = (uri.getUserInfo() != null) ? uri.getUserInfo().split(":", 2)[1] : null;
        int db = Integer.parseInt(uri.getPath().split("/", 2)[1]);

        jedisPool = new JedisPool(new GenericObjectPoolConfig(),host,port,timeoutMs,pass,db);

        listName = uri.getFragment();
        baseLogFields = fromCommaSeparatedProperties(fields);

        // No logging for Jedis at all.
        Logger.getLogger(JedisPool.class.getName()).setLevel(Level.OFF);
    }

    private RedisAPI getRedis(){
        RedisAPI redis = threadLocal.get();
        if(redis == null){
            redis = new RedisAPI(jedisPool);
            threadLocal.set(redis);
        }

        return redis;
    }

    @Override
    public void flush() {
    }

    @Override
    public void close() throws SecurityException {

    }

    @Override
    public void publish(final LogRecord record) {
        try {
                if (!isLoggable(record)) {
                    return;
                }

                Map<String, Object> msg = new HashMap<String, Object>();

                Level level = record.getLevel();
                long timestamp = record.getMillis();
                String message = record.getMessage();

                msg.put("level", level.getName());
                msg.put("timestamp", timestamp);
                msg.put("message", message);

                msg.putAll(baseLogFields);

                getRedis().rpush(listName, Utils.toJson(msg));
        }catch(Exception e){
            e.printStackTrace();
        }
    }


    private Map<String,String> fromCommaSeparatedProperties(String fields){
        if(fields == null){
            return null;
        }
        Map<String, String> map = new HashMap<String, String>();
        for(String pair : fields.split(",")){
            String[] arr = pair.split("=");
            map.put(arr[0],arr[1]);
        }

        return map;
    }
}
