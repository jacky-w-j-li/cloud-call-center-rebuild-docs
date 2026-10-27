package com.dishui.dbpool;


import com.m7.mailServer.AppConfig;
import org.apache.commons.dbcp.BasicDataSource;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by zhangyang on 16/4/5.
 * 数据库连接池
 */
public class M7JdbcPool {
    private static final Logger log = Logger.getLogger(M7JdbcPool.class.getName());
    private static M7JdbcPool instance;
    private static String driverName = "com.mysql.jdbc.Driver";

    private M7JdbcPool() {
        instance = this;
        String ip = AppConfig.getInstance().getVar("mysql.ip");
        String port = AppConfig.getInstance().getVar("mysql.port");
        String db = AppConfig.getInstance().getVar("mysql.db");
        String url = "jdbc:mysql://" + ip + ":" + port +"/"+db;
        String user = AppConfig.getInstance().getVar("mysql.user");
        String password = AppConfig.getInstance().getVar("mysql.password");
        int max = Integer.parseInt(AppConfig.getInstance().getVar("mysql.maxConn"));
        this.initDataSource(url , user , password , driverName , 10 , max , max , max);
        System.out.println("init jdbc pool success .........");
    }

    private DataSource ds;


    public static M7JdbcPool getInstance() {
        if (instance == null) {
            new M7JdbcPool();
        }
        return instance;
    }

    public void initDataSource(String connectURI, String username, String password, String driverClass, int initSize,
                               int maxActive, int maxIdle, int maxWait) {
        BasicDataSource basicDs = new BasicDataSource();
        basicDs.setDriverClassName(driverClass);
        basicDs.setUsername(username);
        basicDs.setPassword(password);
        basicDs.setUrl(connectURI);
        basicDs.setInitialSize(initSize);
        basicDs.setMaxActive(maxActive);
        basicDs.setMaxIdle(maxIdle);
        basicDs.setMaxWait(maxWait);
        basicDs.setValidationQuery("select 1");
        basicDs.setTestOnBorrow(true);
        this.ds = basicDs;
        try {
            basicDs.getConnection();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    public Connection getConnection(){
        Connection con = null;
        if(this.ds != null){
            try{
                con = this.ds.getConnection();
            } catch (Exception e){
                log.log(Level.WARNING,"",e);
            }
//            try{
//                con.setAutoCommit(false);
//            } catch (Exception e){
//                log.log(Level.WARNING,"",e);
//            }
            return con;
        }
        return null;
    }

    public DataSource getDataSource(){
        return this.ds;
    }

    public void closeDatasource() throws SQLException {
        BasicDataSource basicDataSource = (BasicDataSource) this.ds;
        basicDataSource.close();
    }

}
