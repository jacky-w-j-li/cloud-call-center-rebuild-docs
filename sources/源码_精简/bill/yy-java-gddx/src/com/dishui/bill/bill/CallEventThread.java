package com.dishui.bill.bill;

import com.dishui.bill.command.Fields;
import com.dishui.bill.command.JSONReader;
import com.dishui.bill.service.AppConfig;
import com.dishui.bill.service.Utils;
import com.dishui.db.mango.MongoConnect;
import com.dishui.db.mango.MongoProvider;
import com.dishui.util.DateUtil;
import com.dishui.util.HttpProvider;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.WriteConcern;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

public class CallEventThread extends Thread {
	private static Logger log = Logger.getLogger(CallEventThread.class.getName());

    private static final int queueMax = 500;
    private static List<String> eventIds=new ArrayList<String>(queueMax);
    @Override
	public void run() {
		DBObject item = null;
		DBObject condition = new BasicDBObject().append("failNum",null);
		while (true) {
			try {
                long timeStamp= DateUtil.getCurrentMs();
                item = MongoConnect.getInstance().getDB("bill_data").getCollection(BillMaster.DB_400_PROXY_CALLEVENT).findOne(condition);
				if (item == null) {
                    sleep(1000);
					continue;
				}
				String pk = String.valueOf(item.get("_id"));
                if(eventIds.contains(pk)){
                    MongoConnect.getInstance().getDB("bill_data").getCollection(BillMaster.DB_400_PROXY_CALLEVENT).remove(
                            new BasicDBObject().append("_id", pk), WriteConcern.SAFE);
                    continue;
                }else{
                    if(eventIds.size()>=queueMax){
                        eventIds.remove(0);
                    }
                    eventIds.add(pk);
                }
                boolean isSuccess=sendEvent(item);
                if(isSuccess){
                    MongoConnect.getInstance().getDB("bill_data").getCollection(BillMaster.DB_400_PROXY_CALLEVENT).remove(
                            new BasicDBObject().append("_id", pk), WriteConcern.SAFE);
                }else{
                    DBObject set = new BasicDBObject().append("$inc",new BasicDBObject().append("failNum", 1))
                            .append("$set", new BasicDBObject().append("timeStamp", timeStamp).append("lock",false));
                    MongoConnect.getInstance().getDB("bill_data").getCollection(BillMaster.DB_400_PROXY_CALLEVENT).update(
                            new BasicDBObject().append("_id", pk),set,false,false,WriteConcern.SAFE);
                }

			} catch (Exception e) {
				log.log(Level.WARNING, "process callEvent bill exception! ", e);
				e.printStackTrace();
				if (item != null) {
					try {
                        long timeStamp= DateUtil.getCurrentMs();
                        DBObject set = new BasicDBObject().append("$inc",new BasicDBObject().append("failNum", 1))
                                .append("$set", new BasicDBObject().append("timeStamp", timeStamp).append("lock",false));
                        MongoConnect.getInstance().getDB("bill_data").getCollection(BillMaster.DB_400_PROXY_CALLEVENT).update(
                                new BasicDBObject().append("_id", item.get("_id")),set,false,false,WriteConcern.SAFE);
					} catch (Exception exception) {
						exception.printStackTrace();
					}
				}
				try {
					sleep(1000);
				} catch (Exception exception) {
					exception.printStackTrace();
				}
			}
		}
	}

    public boolean sendEvent(DBObject eventObj) {
        String _id=(String) eventObj.get("_id");
        String cid=(String) eventObj.get("cid");
        String did=String.valueOf(eventObj.get("did")) ;
        String beginTime=String.valueOf(eventObj.get("beginTime")) ;
        String endTime=String.valueOf(eventObj.get("endTime")) ;
        String callerProvince=String.valueOf(eventObj.get("callerProvince")) ;
        String callerCity=String.valueOf(eventObj.get("callerCity")) ;
        String callerDistrictNo=String.valueOf(eventObj.get("callerDistrictNo")) ;
        String url=String.valueOf(eventObj.get("url")) ;
//        String url = AppConfig.getInstance().getVar("node.server.url");
        StringBuffer _url=new StringBuffer(url);
        _url.append("?_id=").append(_id).append("&cid=").append(cid).append("&did=").append(did)
                .append("&beginTime=").append(beginTime).append("&endTime=").append(endTime)
                .append("&callerProvince=").append(callerProvince).append("&callerCity=").append(callerCity)
                .append("&callerDistrictNo=").append(callerDistrictNo);
        log.log(Level.INFO, url);
        try {
            String result = HttpProvider.sendGet(url);
//            JSONReader reader = new JSONReader();
//            Map<String, Object> resultObj = (Map<String, Object>) reader.read(result);
            if (result != null && ("200").equals(result)) {
                return true;
            }
            return false;
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
            return false;
        }
    }
}
