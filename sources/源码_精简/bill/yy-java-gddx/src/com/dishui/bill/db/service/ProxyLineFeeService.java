package com.dishui.bill.db.service;

import com.dishui.bill.db.model.ProxyLineFee;
import com.dishui.db.mango.MongoConnect;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.ArrayList;
import java.util.List;
import java.util.logging.Logger;

/**
 * Created by jackwong on 16/2/19.
 *
 * 线路的代理价格管理.
 *
 * db: bill.bill_system_user
 */
public class ProxyLineFeeService {
    private static Logger log = Logger.getLogger(ProxyLineFeeService.class.getName());

    public static ProxyLineFee getFee(String userId, String lineId){
        if(userId==null){
            return null;
        }
        DBObject dbUser = getSystemUserById(userId);
        if(dbUser==null){
            return null;
        }

        if(lineId==null || lineId.equalsIgnoreCase("")){
            return getDefaultLineFee(dbUser);
        }

        //尝试关联线路
        List<ProxyLineFee> externalLineFees = getExternalLineFees(dbUser);
        if(externalLineFees == null || externalLineFees.size() <= 0){
            return getDefaultLineFee(dbUser);
        }

        for(ProxyLineFee lineFee : externalLineFees){
            List<String> lineIds = lineFee.getLineIds();
            if(lineIds==null || lineIds.size() <= 0){
                log.warning("illegal external line fee config,no line id !");
                continue;
            }

            if(lineIds.contains(lineId)){
                return lineFee;
            }
        }

        //保底
        return getDefaultLineFee(dbUser);
    }

    public static List<ProxyLineFee> getExternalLineFees(DBObject dbUser){
        if(dbUser == null){
            return null;
        }
        List<ProxyLineFee> proxyLineFeeList = new ArrayList<ProxyLineFee>();

        //关联线路配置
        BasicDBList dbExternalLineFees = (BasicDBList)dbUser.get("externalLineFees");
        if(dbExternalLineFees == null || dbExternalLineFees.size()<=0){
            return null;
        }

        for(Object objLineFee : dbExternalLineFees){
            DBObject dbLineFee = (DBObject)objLineFee;
            ProxyLineFee lineFee = ProxyLineFee.fromDB(dbLineFee);
            if(lineFee!=null){
                proxyLineFeeList.add(lineFee);
            }
        }

        return proxyLineFeeList;
    }

    public static ProxyLineFee getDefaultLineFee(DBObject dbUser){
        if(dbUser == null){
            return null;
        }
        //默认配置
        ProxyLineFee defaultLineFee = ProxyLineFee.fromDB(dbUser);

        return defaultLineFee;

    }

    private static DBObject getSystemUserById(String userId){
        if(userId==null){
            return null;
        }

        BasicDBObject condition = new BasicDBObject("_id",userId);
        DBObject dbUser = MongoConnect.getInstance().getDB("bill")
                .getCollection("bill_system_user").findOne(condition);

        return dbUser;
    }

}
