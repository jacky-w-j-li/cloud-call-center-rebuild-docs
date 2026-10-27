package com.dishui.bill.db.model;

import com.dishui.bill.service.Utils;
import com.mongodb.DBObject;

/**
 * 国际长途运营成本设置
 *
 * Created by jackwong on 16/4/26.
 */
/*
{
    "_id" : "004_355424",
    "code" : "355424",
    "line" : "004",
    "dest" : "Albania - Tirana",
    "price" : NumberInt(11810),
    "priceWithTax" : NumberInt(12566)
}

 */
public class Intl {
    private String id;
    /**
     * 区域代码
     */
    private String code;
    /**
     * 线路ID
     */
    private String line;
    /**
     * 目的地
     */
    private String dest;
    /**
     * 不含税价格
     */
    private long price;
    /**
     * 含税价格
     */
    private long priceWithTax;


    public static Intl fromDB(DBObject dbObj) {
        if(dbObj == null){
            return null;
        }
        Intl intl = new Intl();

        String dbId = (String)dbObj.get("_id");
        String dbCode = (String)dbObj.get("code");
        String dbLine =(String)dbObj.get("line");
        String dbDest =(String)dbObj.get("dest");
        long dbPrice = Utils.transDBNumberLong(dbObj.get("price"));
        long dbPriceWithTax = Utils.transDBNumberLong(dbObj.get("priceWithTax"));

        intl.setId(dbId);
        intl.setCode(dbCode);
        intl.setLine(dbLine);
        intl.setDest(dbDest);
        intl.setPrice(dbPrice);
        intl.setPriceWithTax(dbPriceWithTax);

        return intl;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getLine() {
        return line;
    }

    public void setLine(String line) {
        this.line = line;
    }

    public String getDest() {
        return dest;
    }

    public void setDest(String dest) {
        this.dest = dest;
    }

    public long getPrice() {
        return price;
    }

    public void setPrice(long price) {
        this.price = price;
    }

    public long getPriceWithTax() {
        return priceWithTax;
    }

    public void setPriceWithTax(long priceWithTax) {
        this.priceWithTax = priceWithTax;
    }

}
