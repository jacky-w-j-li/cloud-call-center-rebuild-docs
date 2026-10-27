package com.dishui.util.excel;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.service.Utils;
import com.dishui.server.handler.ImportHandler;
import com.dishui.util.CommonUtil;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Vector;
import java.util.logging.Logger;


public class SmsListImport implements RowHandler {
    private static Logger logger = Logger.getLogger(TelListImport.class.getName());
    public final static String TB_SMS_SEND = "app_sms_send";
    public final static String TB_SMS_IMPORT_INVALID = "app_sms_import_invalid";
    public final static String TB_SMS = "_sms";


    public List<DBObject> rows=null;
    public List<DBObject> InvalidRow=null;
    private String accountId="";
    private String batchNo="";
    private String createUser="";
    private HashMap<String, String> signMap = new HashMap<String, String>();
    private String smsChannel="";

    public SmsListImport(DBObject task){
        rows = new ArrayList<DBObject>();
        InvalidRow = new ArrayList<DBObject>();
        accountId = task.get("accountId").toString();
        batchNo = task.get("batchNo").toString();

        List<DBObject> signList = MongoProvider.find("app_sms_sign",new BasicDBObject("account",this.accountId));
        for(int i=0;i<signList.size();i++){
            signMap.put(signList.get(i).get("name").toString(), signList.get(i).get("subcode").toString());
        }
        smsChannel = task.get("smsChannel").toString();
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

        String signDisplay = "【"+collist.get(2)+"】";
        if(signMap.containsKey(signDisplay)){
            row.put("signDisplay", signDisplay);
            row.put("sign", signMap.get(signDisplay));
        }else{
            isOkRow = false;
            row.put("signDisplay", signDisplay);
            reason += " 签名未备案";
        }

        String content = collist.get(1);
        row.put("content", content);
        int splitCount = 1;
        int totalLength = content.length()+signDisplay.length()+2;
        if(totalLength > 280){
            isOkRow = false;
            reason += " 内容长度超过280字";
        }else{
            splitCount = totalLength/66;
            if(totalLength % 66 >0)
                splitCount += 1;
        }
        row.put("splitCount", splitCount);

        String id= Utils.getUniqueid();
        String time=Utils.getCurrentDate();
        row.put("_id", id);
        row.put("account", this.accountId);
        row.put("batchNo", this.batchNo);
        row.put("m7Status", "import");
        row.put("product", "cc");
        row.put("smsChannel", smsChannel);
        row.put("type", "send");
        row.put("submitTime", time);
        row.put("createUser", createUser);
        if(isOkRow){
            rows.add(row);
        }else{
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
            MongoProvider.batchInsert(this.accountId+TB_SMS, rows, this.accountId);
            rows.clear();
        }
        if(InvalidRow.size()>0 && InvalidRow.size()%ImportHandler.batchCount==0){
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
            MongoProvider.batchInsert(this.accountId+TB_SMS, rows, this.accountId);
            rows.clear();
        }
        if(InvalidRow.size()>0){
            MongoProvider.batchInsert(TB_SMS_IMPORT_INVALID, InvalidRow);
            InvalidRow.clear();
        }
    }

    public static void main(String[] args) {
        Vector vc = new Vector();
        Vector vcb = new Vector();
//        for(int i=0 ; i<30 ; i++){
//            vc.add("a"+(i+1));
//        }
        for(int i=0 ; i<10 ; i++){
            vcb.add(vc.remove(0));
        }
        System.out.println(vcb.toString());
        System.out.println(vc.toString());
    }
}
