package com.dishui.bill.db.model;

import com.dishui.bill.service.Utils;
import com.mongodb.BasicDBList;
import com.mongodb.DBObject;

import java.util.ArrayList;
import java.util.List;

/**
 * Created by jackwong on 16/2/19.
 */
public class ProxyLineFee {
    private List<String> lineIds;
    //通话资费
    private long local;
    private long remote;
    private long localTel;
    private long remoteTel;
    private int dialPercent;

    //400资费
    private long num400Local;
    private long num400Remote;
    private int num400Percent;
    //国际长途
//    private long intlFee1;
//    private long intlFee2;
//    private long intlFee3;
    private int intlPercent;

    public long getLocal() {
        return local;
    }

    public void setLocal(long local) {
        this.local = local;
    }

    public long getRemote() {
        return remote;
    }

    public void setRemote(long remote) {
        this.remote = remote;
    }

    public long getLocalTel() {
        return localTel;
    }

    public void setLocalTel(long localTel) {
        this.localTel = localTel;
    }

    public long getRemoteTel() {
        return remoteTel;
    }

    public void setRemoteTel(long remoteTel) {
        this.remoteTel = remoteTel;
    }

    public int getDialPercent() {
        return dialPercent;
    }

    public void setDialPercent(int dialPercent) {
        this.dialPercent = dialPercent;
    }

    public long getNum400Local() {
        return num400Local;
    }

    public void setNum400Local(long num400Local) {
        this.num400Local = num400Local;
    }

    public long getNum400Remote() {
        return num400Remote;
    }

    public void setNum400Remote(long num400Remote) {
        this.num400Remote = num400Remote;
    }

    public int getNum400Percent() {
        return num400Percent;
    }

    public void setNum400Percent(int num400Percent) {
        this.num400Percent = num400Percent;
    }

//    public long getIntlFee1() {
//        return intlFee1;
//    }
//
//    public void setIntlFee1(long intlFee1) {
//        this.intlFee1 = intlFee1;
//    }
//
//    public long getIntlFee2() {
//        return intlFee2;
//    }
//
//    public void setIntlFee2(long intlFee2) {
//        this.intlFee2 = intlFee2;
//    }
//
//    public long getIntlFee3() {
//        return intlFee3;
//    }
//
//    public void setIntlFee3(long intlFee3) {
//        this.intlFee3 = intlFee3;
//    }

    public int getIntlPercent() {
        return intlPercent;
    }

    public void setIntlPercent(int intlPercent) {
        this.intlPercent = intlPercent;
    }


    public List<String> getLineIds() {
        return lineIds;
    }

    public void setLineIds(List<String> lineIds) {
        this.lineIds = lineIds;
    }

    public static ProxyLineFee fromDB(DBObject dbObj){
        if(dbObj==null){
            return null;
        }

        ProxyLineFee lineFee = new ProxyLineFee();

        DBObject dbDialFee = (DBObject)dbObj.get("dialFee");
        DBObject db400DialFee = (DBObject)dbObj.get("dial400Fee");
//        DBObject dbInternationalFee = (DBObject)dbObj.get("internationalFee");

        //线路
        List lineIds = null;
        BasicDBList dbLineIds = (BasicDBList)dbObj.get("lineIds");
        if(dbLineIds!=null && dbLineIds.size()>0){
            lineIds = new ArrayList<String>();
            for(Object dbLineId : dbLineIds){
                String lineId = (String)dbLineId;
                lineIds.add(lineId);
            }
        }

        //各种分成比例
        int dialPercent = Utils.transDBNumberInt(dbObj.get("dialPercent"));
        int num400Percent = Utils.transDBNumberInt(dbObj.get("num400Percent"));
        int intlPercent =  Utils.transDBNumberInt(dbObj.get("intlPercent"));

        //通话资费
        long local = Utils.transDBNumberLong(dbDialFee.get("local"));
        long remote = Utils.transDBNumberLong(dbDialFee.get("remote"));
        long localTel = Utils.transDBNumberLong(dbDialFee.get("localTel"));
        long remoteTel = Utils.transDBNumberLong(dbDialFee.get("remoteTel"));
        //400资费
        long num400Local = Utils.transDBNumberLong(db400DialFee.get("local"));
        long num400Remote = Utils.transDBNumberLong(db400DialFee.get("remote"));
//        //国际长途资费
//        long intlFee1 = dbInternationalFee.get("fee1")==null? 0 : Long.valueOf(String.valueOf(dbInternationalFee.get("fee1")));
//        long intlFee2 = dbInternationalFee.get("fee2")==null? 0 : Long.valueOf(String.valueOf(dbInternationalFee.get("fee2")));
//        long intlFee3 = dbInternationalFee.get("fee3")==null? 0 : Long.valueOf(String.valueOf(dbInternationalFee.get("fee3")));

        //初始化
        lineFee.setLineIds(lineIds);

        lineFee.setDialPercent(dialPercent);
        lineFee.setNum400Percent(num400Percent);
        lineFee.setIntlPercent(intlPercent);

        lineFee.setLocal(local);
        lineFee.setRemote(remote);
        lineFee.setLocalTel(localTel);
        lineFee.setRemoteTel(remoteTel);

        lineFee.setNum400Local(num400Local);
        lineFee.setNum400Remote(num400Remote);

//        lineFee.setIntlFee1(intlFee1);
//        lineFee.setIntlFee2(intlFee2);
//        lineFee.setIntlFee3(intlFee3);

        return lineFee;
    }



}
