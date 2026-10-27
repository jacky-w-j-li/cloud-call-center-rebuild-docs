package com.dishui.repaire;

import com.dishui.db.mango.MongoConnect;
import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.command.C5Action;
import com.dishui.manager.command.C5Response;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.WriteConcern;

import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

public class RepaireCustomerData {
    private static Logger log = Logger.getLogger(RepaireCustomerData.class.getName());

    private static final String request_key = "84706874723d4d19a6c09084d2b69c13";

    /**
     * http://127.0.0.1:9999/service?Action=repairMail&key=84706874723d4d19a6c09084d2b69c13
     * @param action
     * @return
     */
    public static C5Response repairMail(C5Action action){
        C5Response response = new C5Response(action);
        try{
//            String account = action.getStringValue("account");
            String key = action.getStringValue("key");
            if(!request_key.equals(key)){
                log.info("非法的key");
                response.setSucceed(false);
                response.addParameter("result", "500");
                return response;
            }
//            DBObject query = new BasicDBObject("product","cc").append("account","N00000000143");
            DBObject query = new BasicDBObject("product","cc");
            List<DBObject> products = MongoProvider.find("bill","platform_account_product", query);
            for (int i = 0; i < products.size(); i++) {
                DBObject product= products.get(i);
                String db=String.valueOf(product.get("dataDB"));
                String account=String.valueOf(product.get("account"));
                String tb=account+"_customer";
                boolean hasRecord=true;
                while (hasRecord){
                    List cList=new ArrayList();
                    cList.add(null);
                    cList.add("");
                    DBObject condition = new BasicDBObject("delTag",null).append("email",new BasicDBObject("$nin",cList)).append("pin", null);
                    List<DBObject> list = MongoConnect.getInstance().getDB(db).getCollection(tb).find(condition).limit(1000).toArray();
                    if(list!=null && list.size()>0){
                        for (DBObject callObject : list) {
                            try{
                                Object email = callObject.get("email");
                                List<DBObject> mailList=new ArrayList<DBObject>();
                                if(email!=null && (email instanceof String)){
                                    mailList.add(new BasicDBObject("email",email).append("memo",""));
                                    MongoProvider.updateOne(db, tb, new BasicDBObject().append("_id", callObject.get("_id")),
                                            new BasicDBObject().append("$set", new BasicDBObject().append("email", mailList).append("pin", "1")), WriteConcern.SAFE);
                                }else{
                                    MongoProvider.updateOne(db, tb, new BasicDBObject().append("_id", callObject.get("_id")),
                                            new BasicDBObject().append("$set", new BasicDBObject().append("pin", "1")), WriteConcern.SAFE);
                                }
                            }catch (Exception ex){
                                ex.printStackTrace();
                                log.log(Level.WARNING,callObject.get("_id")+"::::"+ex.getMessage());
                                MongoProvider.updateOne(db, tb, new BasicDBObject().append("_id", callObject.get("_id")),
                                        new BasicDBObject().append("$set", new BasicDBObject().append("pin", "0")), WriteConcern.SAFE);  //0 为错误的
                            }
                        }
                    }else{
                        hasRecord=false;
                    }
                }
            }
            response.setSucceed(true);
        } catch (Exception e) {
            e.printStackTrace();
            response.setMessage(e.getMessage());
            response.setSucceed(false);
            response.addParameter("result", "500");
        }
        return response;
    }

}
