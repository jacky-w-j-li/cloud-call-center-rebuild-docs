package com.dishui.bill.db.service;

import com.dishui.bill.common.Constants;
import com.dishui.bill.db.model.Intl;
import com.dishui.db.mango.MongoProvider;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.List;


/**
 * Created by jackwong on 16/4/26.
 */
public class IntlService {
    public static Intl getByLineAndCode(String lineID, String code) {
        if(lineID == null || lineID.isEmpty() || code == null || code.isEmpty()){
            return null;
        }

        BasicDBObject condition = new BasicDBObject("line",lineID).append("code",code);
        DBObject dbObj = MongoProvider.findOne(Constants.DB_COLLECTION_PLATFORM_INTL,condition);

        return Intl.fromDB(dbObj);
    }

    public static Intl getByNumberAndLine(String number,String lineID){
        if(number == null || !number.startsWith("00") || lineID == null){
            return null;
        }
        String sNumber = number.substring(2);
        //切出所有可能的区域代码
        BasicDBList possibleCodes = new BasicDBList();
        for(int i = 0;i < sNumber.length(); i++){
            possibleCodes.add(sNumber.substring(0,i+1));
        }

        BasicDBObject condition = new BasicDBObject("code",new BasicDBObject("$in",possibleCodes)).append("line",lineID);//{code:{$in:possibleCodes},line : line};

        List<DBObject> dbIntlList = MongoProvider.find(Constants.DB_COLLECTION_PLATFORM_INTL,condition);
        if(dbIntlList == null || dbIntlList.isEmpty()) {
            return null;
        }

        //找出最长的区域代码.
        Intl matchIntl = null;
        int matchLength=0;
        for(DBObject dbObj : dbIntlList){
            Intl intl = Intl.fromDB(dbObj);
            if(intl==null){
                continue;
            }
            if(intl.getCode() != null && intl.getCode().length() > matchLength){
                matchIntl = intl;
                matchLength = intl.getCode().length();
            }
        }

        return matchIntl;
    }
}
