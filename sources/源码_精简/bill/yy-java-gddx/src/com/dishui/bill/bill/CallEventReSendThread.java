package com.dishui.bill.bill;

import com.dishui.bill.service.Utils;
import com.dishui.db.mango.MongoConnect;
import com.dishui.db.mango.MongoProvider;
import com.dishui.util.DateUtil;
import com.dishui.util.HttpProvider;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.WriteConcern;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

public class CallEventReSendThread extends Thread {
	private static Logger log = Logger.getLogger(CallEventReSendThread.class.getName());

    @Override
	public void run() {
        Map<Integer,Long> periods=new HashMap<Integer,Long>();  // 重发的间隔频率是: 2m,10m,10m,1h,2h
        periods.put(1,120000l);
        periods.put(2,600000l);
        periods.put(3,600000l);
        periods.put(4,3600000l);
        periods.put(5,7200000l);
//        period.put(6,21600l);
		while (true) {
			try {
                long timeStamp= DateUtil.getCurrentMs();
                for(int i=1;i<6;i++){
                    long _seconds= timeStamp- periods.get(i);
                    DBObject condition = new BasicDBObject().append("failNum",i).append("timeStamp",new BasicDBObject().append("$lte",_seconds))
                            .append("lock", false);
                    final List<DBObject> list = MongoProvider.find("bill_data", BillMaster.DB_400_PROXY_CALLEVENT, condition);
                    if(list!=null && list.size()>0){
                        MongoConnect.getInstance().getDB("bill_data").getCollection(BillMaster.DB_400_PROXY_CALLEVENT).update(condition,
                                new BasicDBObject().append("$set", new BasicDBObject().append("lock",true)),false,true,WriteConcern.SAFE);
                        //send url
                        Thread temp=new Thread(){
                            @Override
                            public void run() {
                                for (int j = 0; j <list.size() ; j++) {
                                    DBObject eventObj=list.get(j);
                                    String _id=(String) eventObj.get("_id");
                                    String cid=(String) eventObj.get("cid");
                                    String did=String.valueOf(eventObj.get("did")) ;
                                    String beginTime=String.valueOf(eventObj.get("beginTime")) ;
                                    String endTime=String.valueOf(eventObj.get("endTime")) ;
                                    String callerProvince=String.valueOf(eventObj.get("callerProvince")) ;
                                    String callerCity=String.valueOf(eventObj.get("callerCity")) ;
                                    String callerDistrictNo=String.valueOf(eventObj.get("callerDistrictNo")) ;
                                    String url=String.valueOf(eventObj.get("url")) ;
                                    StringBuffer _url=new StringBuffer(url);
                                    _url.append("?_id=").append(_id).append("&cid=").append(cid).append("&did=").append(did)
                                            .append("&beginTime=").append(beginTime).append("&endTime=").append(endTime)
                                            .append("&callerProvince=").append(callerProvince).append("&callerCity=").append(callerCity)
                                            .append("&callerDistrictNo=").append(callerDistrictNo);
                                    log.log(Level.INFO, url);
                                    long _timeStamp= DateUtil.getCurrentMs();
                                    try {
                                        String result = HttpProvider.sendGet(url);
                                        if (result != null && ("200").equals(result)) {
                                            MongoConnect.getInstance().getDB("bill_data").getCollection(BillMaster.DB_400_PROXY_CALLEVENT).remove(
                                                    new BasicDBObject().append("_id", _id), WriteConcern.SAFE);
                                        }else{
                                            DBObject set = new BasicDBObject().append("$inc",new BasicDBObject().append("failNum", 1))
                                                    .append("$set", new BasicDBObject().append("timeStamp", _timeStamp).append("lock",false));
                                            MongoConnect.getInstance().getDB("bill_data").getCollection(BillMaster.DB_400_PROXY_CALLEVENT).update(
                                                    new BasicDBObject().append("_id", _id),set,false,false,WriteConcern.SAFE);
                                        }
                                    } catch (Exception e) {
                                        e.printStackTrace();
                                        log.log(Level.WARNING, "", e);
                                        DBObject set = new BasicDBObject().append("$inc",new BasicDBObject().append("failNum", 1))
                                                .append("$set", new BasicDBObject().append("timeStamp", _timeStamp).append("lock",false));
                                        MongoConnect.getInstance().getDB("bill_data").getCollection(BillMaster.DB_400_PROXY_CALLEVENT).update(
                                                new BasicDBObject().append("_id", _id),set,false,false,WriteConcern.SAFE);
                                        try {
                                            sleep(1000);
                                        } catch (Exception exception) {
                                            exception.printStackTrace();
                                        }
                                    }
                                }
                            }
                        };
                        temp.start();
                    }
                }
                sleep(60000); //1min
			} catch (Exception e) {
				log.log(Level.WARNING, "process CallEventReSendThread bill exception! ", e);
				e.printStackTrace();
				try {
					sleep(1000);
				} catch (Exception exception) {
					exception.printStackTrace();
				}
			}
		}
	}

}
