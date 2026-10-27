package com.dishui.bill.db.model;

import com.dishui.bill.service.Utils;
import com.mongodb.DBObject;

/**
 * Created by jackwong on 16/3/8.
 */
public class Account {
    private long overdraw;
    private long balance;
    private String createUser;
    private String id;

    public static Account fromDB(DBObject dbObject){
        if(dbObject == null){
            return null;
        }
        Account account = new Account();

        Object dbOverdraw = dbObject.get("overdraw");
        Object dbBalance = dbObject.get("balance");
        String dbCreateUser = (String)dbObject.get("createUser");
        String dbId = (String)dbObject.get("_id");

        account.setOverdraw(Utils.transDBNumberLong(dbOverdraw));
        account.setBalance(Utils.transDBNumberLong(dbBalance));
        account.setCreateUser(dbCreateUser);
        account.setId(dbId);

        return account;
    }

    public long getOverdraw() {
        return overdraw;
    }

    public void setOverdraw(long overdraw) {
        this.overdraw = overdraw;
    }

    public long getBalance() {
        return balance;
    }

    public void setBalance(long balance) {
        this.balance = balance;
    }

    public String getCreateUser() {
        return createUser;
    }

    public void setCreateUser(String createUser) {
        this.createUser = createUser;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }
}
