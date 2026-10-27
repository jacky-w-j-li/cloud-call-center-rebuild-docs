package com.dishui.util.excel;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.service.Utils;
import com.dishui.server.handler.ImportHandler;
import com.dishui.util.CommonUtil;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.logging.Logger;


public class SmsTemplateListImport implements RowHandler {
    private static Logger logger = Logger.getLogger(TelListImport.class.getName());
    public final static String TB_SMS_SEND = "app_sms_send";
    public final static String TB_SMS_IMPORT_INVALID = "app_sms_import_invalid";
    public final static String TB_SMS = "_sms";


    public List<DBObject> rows=null;
    public List<DBObject> InvalidRow=null;
    private String accountId="";
    private String batchNo="";
    private String createUser="";
    private HashMap<String, DBObject> signMap = new HashMap<String, DBObject>();
    private HashMap<String, DBObject> templateMap = new HashMap<String, DBObject>();
    private int smsSplitBaseNum = 66;

    public SmsTemplateListImport(DBObject task){
        rows = new ArrayList<DBObject>();
        InvalidRow = new ArrayList<DBObject>();
        accountId = task.get("accountId").toString();
        batchNo = task.get("batchNo").toString();
        if(task.get("smsSplitBaseNum") != null){
            smsSplitBaseNum = Integer.parseInt(task.get("smsSplitBaseNum").toString());
        }

        List<DBObject> signList = MongoProvider.find("app_sms_sign", new BasicDBObject("account", this.accountId));
        for(int i=0;i<signList.size();i++){
            signMap.put(signList.get(i).get("_id").toString(), signList.get(i));
        }
        List<DBObject> templateList = MongoProvider.find("app_sms_template", new BasicDBObject("account", this.accountId));
        for(int i=0;i<templateList.size();i++){
            templateMap.put(templateList.get(i).get("num").toString(), templateList.get(i));
        }
        createUser = task.get("createUser").toString();
    }
    @Override
    public void processRow(int sheetIndex, int curRow, List<String> collist) {
        boolean isOkRow = true;
        String reason = "";
        DBObject row=new BasicDBObject();
        String phone=collist.get(0);
        if(phone == null){
            phone="";
            isOkRow = false;
            reason += "手机号不存在";
        }
        phone=phone.trim();
        if(phone.equals("")){
            isOkRow = false;
        }
        phone = CommonUtil.clearPhone(phone);
        if(!Utils.isMobileNo(phone)){
            isOkRow = false;
            reason += " 手机号不正确";
        }
        row.put("num", phone);

        String templateNum = collist.get(1);
        DBObject templateDoc = templateMap.get(templateNum);

        if(templateDoc != null){
            DBObject signDoc = signMap.get(templateDoc.get("sign").toString());
            if(signDoc != null){
                row.put("signDisplay", signDoc.get("name"));
                row.put("sign", signDoc.get("subcode"));
            }else{
                isOkRow = false;
                reason += " 签名未备案";
            }
            String content = "";
            content = templateDoc.get("content").toString();
            for(int i=1;i <= Integer.parseInt(templateDoc.get("vars").toString()) ; i++){
                if(collist.size() >= i+2 && collist.get(i+1) != null){
                    content = content.replace("{"+i+"}", collist.get(i+1));
                    row.put("importvar"+i, collist.get(i+1));
                }
            }
            row.put("vars", templateDoc.get("vars"));
            row.put("content", content);
            List<String>objlist = (List<String>) templateDoc.get("smsChannel");
            String objsmschannel = objlist.get(0);
            if(objsmschannel.equals("ytx")||objsmschannel.equals("ytxyx")){
             	DBObject dobj=MongoProvider.findOne("bill","ytx_template_id",new BasicDBObject("_id",templateDoc.get("_id")));
             	if(dobj == null){
             		isOkRow = false;
                    reason += " 短信模板异常";
             	}else{
             		row.put("ytxtemplateid", dobj.get("ytxtemplateid"));
             	}
             }
            int splitCount = 1;
            int totalLength = 0;
            if(signDoc != null){
                totalLength = content.length()+signDoc.get("name").toString().length();
            }
            if(totalLength > 280){
                isOkRow = false;
                reason += " 内容长度超过280字";
            }else{
                splitCount = totalLength/smsSplitBaseNum;
                if(totalLength % smsSplitBaseNum >0)
                    splitCount += 1;
            }
            row.put("splitCount", splitCount);

            String smsChannel = "";
            BasicDBList channelList = (BasicDBList)templateDoc.get("smsChannel");
            if (templateDoc.get("operatorStrategy") != null
                    && "true".equals(templateDoc.get("operatorStrategy").toString())) {
                smsChannel = templateDoc.get(Utils.matchingOperator(phone)).toString();
            } else if(channelList != null && channelList.size() > 0){
                smsChannel = channelList.get(0).toString();
            }

            String id= Utils.getUniqueid();
            String time= Utils.getCurrentDate();
            row.put("_id", id);
            row.put("m7Status", "import");
            row.put("product", "cc");
            row.put("smsChannel", smsChannel);
            row.put("type", "send");
            row.put("submitTime", time);
        }else{
            isOkRow = false;
            reason += " 模板编号错误,未找到对应的模板";
        }
        row.put("account", this.accountId);
        row.put("batchNo", this.batchNo);
        row.put("createUser", createUser);
        if(isOkRow){
            rows.add(row);
        }else{
            row.put("signDisplay", "");
            row.put("sign", "");
            row.put("content", "");
            row.put("reason",reason);
            InvalidRow.add(row);
        }
        if(rows.size()>0 &&rows.size()% ImportHandler.batchCount==0){
            try {
                Thread current = Thread.currentThread();
                current.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            MongoProvider.batchInsert(TB_SMS_SEND, rows);
            MongoProvider.batchInsert(this.accountId + TB_SMS, rows, this.accountId);
            rows.clear();
        }
        if(InvalidRow.size()>0 && InvalidRow.size()% ImportHandler.batchCount==0){
            try {
                Thread current = Thread.currentThread();
                current.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            MongoProvider.batchInsert(TB_SMS_IMPORT_INVALID, InvalidRow);
            InvalidRow.clear();
        }
    }

    public void processEndRow() {
        if(rows.size()>0){
            MongoProvider.batchInsert(TB_SMS_SEND, rows);
            MongoProvider.batchInsert(this.accountId + TB_SMS, rows, this.accountId);
            rows.clear();
        }
        if(InvalidRow.size()>0){
            MongoProvider.batchInsert(TB_SMS_IMPORT_INVALID, InvalidRow);
            InvalidRow.clear();
        }
    }

}
