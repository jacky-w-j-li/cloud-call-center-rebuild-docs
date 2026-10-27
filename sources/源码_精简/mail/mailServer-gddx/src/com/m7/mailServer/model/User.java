package com.m7.mailServer.model;

/**
 * Created by zhangyang on 16/4/6.
 */
public class User {
    public static final String UserDefaultPwd = "7moorcom";
    private String username;
    private String pwdHash;
    private String password;
    private String pwdAlgorithm;
    private String userAlias;
    private String alias;


    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPwdHash() {
        return pwdHash;
    }

    public void setPwdHash(String pwdHash) {
        this.pwdHash = pwdHash;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getPwdAlgorithm() {
        return pwdAlgorithm;
    }

    public void setPwdAlgorithm(String pwdAlgorithm) {
        this.pwdAlgorithm = pwdAlgorithm;
    }

    public String getUserAlias() {
        return userAlias;
    }

    public void setUserAlias(String userAlias) {
        this.userAlias = userAlias;
    }

    public String getAlias() {
        return alias;
    }

    public void setAlias(String alias) {
        this.alias = alias;
    }
}
