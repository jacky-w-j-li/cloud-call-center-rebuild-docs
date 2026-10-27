package com.dishui.dbpool;

import org.apache.commons.dbutils.QueryRunner;
import org.apache.commons.dbutils.handlers.BeanHandler;
import org.apache.commons.dbutils.handlers.BeanListHandler;
import org.apache.commons.dbutils.handlers.ScalarHandler;

import java.sql.SQLException;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by zhangyang on 16/4/6.
 * 使用jdbc方式操作数据库的简单封装
 * 使用dbutils
 */
public class M7JdbcProvider {

   private static final Logger log = Logger.getLogger(M7JdbcProvider.class.getName());

   public static boolean init(){
        String sql = "create table if not exists inbox_error (\n" +
                "            message_name varchar (200) NOT NULL,\n" +
                "            repository_name varchar (100) NOT NULL,\n" +
                "            message_state varchar (30) NOT NULL ,\n" +
                "            error_message varchar (200) NULL ,\n" +
                "            sender text  NULL ,\n" +
                "            recipients text NOT NULL ,\n" +
                "            remote_host varchar (255)  NULL ,\n" +
                "            remote_addr varchar (20)  NULL ,\n" +
                "            last_updated datetime  NULL,\n" +
                "            subject text  NULL,\n" +
                "            content longtext  NULL,\n" +
                "            attachment text NULL,\n" +
                "            cc text NULL,\n" +
                "            dto text NULL,\n" +
                "            PRIMARY KEY (repository_name, message_name)\n" +
                "        )";
       QueryRunner runner = new QueryRunner(M7JdbcPool.getInstance().getDataSource());
       try {
           runner.update(sql);
       } catch (SQLException e) {
           log.log(Level.WARNING,"init db tables error!",e);
           return false;
       }
       return true;
   }



    public static <T> T findOne(String sql , Object[] params , java.lang.Class<T> type) throws SQLException {
        QueryRunner runner = new QueryRunner(M7JdbcPool.getInstance().getDataSource());
        T data = runner.query(sql , new BeanHandler<T>(type) , params);
        return data;
    }

    public static <T> List<T> findAll(String sql , Object[] params , Class<T> type) throws SQLException {
        QueryRunner runner = new QueryRunner(M7JdbcPool.getInstance().getDataSource());
        List data = runner.query(sql , new BeanListHandler<T>(type) , params);
        return data;
    }

    public static long count(String sql , Object[] params) throws SQLException {
        QueryRunner runner = new QueryRunner(M7JdbcPool.getInstance().getDataSource());
        long count = runner.query(sql , new ScalarHandler<Long>(1),params);
        return count;
    }

    public static void insertOne(String sql , Object[] params) throws SQLException {
        QueryRunner runner = new QueryRunner(M7JdbcPool.getInstance().getDataSource());
        runner.update(sql,params);
    }

    public static void update(String sql , Object[] params) throws SQLException {
        QueryRunner runner = new QueryRunner(M7JdbcPool.getInstance().getDataSource());
        runner.update(sql,params);
    }

    public static void delete(String sql , Object[] params) throws SQLException {
        QueryRunner runner = new QueryRunner(M7JdbcPool.getInstance().getDataSource());
        runner.update( sql, params);
    }

}
