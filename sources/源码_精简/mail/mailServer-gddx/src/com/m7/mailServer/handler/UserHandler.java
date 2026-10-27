package com.m7.mailServer.handler;

import com.dishui.command.JSONReader;
import com.dishui.command.JSONWriter;
import com.dishui.dbpool.M7JdbcProvider;
import com.dishui.util.DigestUtil;
import com.m7.mailServer.model.User;

import java.util.HashMap;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by zhangyang on 16/4/1.
 */
public class UserHandler {
    private static final Logger log = Logger.getLogger(UserHandler.class.getName());

    public static String handle(String data) {
        Map<String, Object> result = new HashMap<String, Object>();
        result.put("success", false);
        JSONReader reader = new JSONReader();
        Map<String, Object> dataMap = null;
        try {
            dataMap = (Map<String, Object>) reader.read(data);
        } catch (Exception e) {
            e.printStackTrace();
            result.put("message", "parse data error!");
            return new JSONWriter().write(result);
        }
        String action = (String) dataMap.get("action");
        if (action == null) {
            result.put("message", "unkonw action!");
            return new JSONWriter().write(result);
        }
        if (action.equalsIgnoreCase("add")) {
            addUser(dataMap, result);
        } else if (action.equalsIgnoreCase("delete")) {
            deleteUser(dataMap, result);
        }

        return new JSONWriter().write(result);
    }

    private static void deleteUser(Map<String, Object> data, Map<String, Object> result) {
        try {
            String user = (String) data.get("user");
            String sql = "delete form users where username = ?";
            Object[] params = new Object[]{user};
            M7JdbcProvider.delete(sql, params);
            result.put("success", true);
            return;
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
            result.put("message", "db error!");
            return;
        }
    }

    /**
     * 添加邮箱用户
     * 默认密码
     *
     * @param data
     * @param result
     */
    private static void addUser(Map<String, Object> data, Map<String, Object> result) {
        try {
            String user = (String) data.get("user");
            String sql = "select count(*) from users where username = ?";
            Object[] params = new Object[]{user};
            long count = M7JdbcProvider.count(sql, params);
            if (count == 0) {
                sql = "insert into users (username , pwdHash , pwdAlgorithm ) values(?,?,?)";
                params = new Object[]{user, DigestUtil.digestString(User.UserDefaultPwd, "SHA"), "SHA"};
                M7JdbcProvider.insertOne(sql, params);
                result.put("success", true);
                return;
            } else {
                result.put("message", "user is exist!");
                return;
            }
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
            result.put("message", "db error!");
            return;
        }
    }
}
