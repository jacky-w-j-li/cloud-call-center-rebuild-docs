package com.dishui.server.handler;

import com.dishui.db.mango.MongoProvider;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by Administrator on 2016/10/20.
 */
public class OssBillHandler extends TimerTask{

    private static Logger logger = Logger.getLogger(OssBillHandler.class.getName());//serviceNum

    public static void queryAllPhoneNum () {
        List<String> phoneNos = new ArrayList<String>();
        List<DBObject> objects =  MongoProvider.findFromReportDb("interAPI", "oss_order_account", new BasicDBObject());
        if (objects != null && objects.size() > 0) {
            for (DBObject object : objects) {
                List<DBObject> phoneNums = (List<DBObject>)object.get("numState");
                if (phoneNums != null && phoneNums.size() > 0) {
                    for (DBObject phoneNum : phoneNums) {
                        if (!(Boolean) phoneNum.get("isStorp") && (Boolean)phoneNum.get("isEffective")) {
                            phoneNos.add((String)phoneNum.get("phoneNo"));
                        }
                    }
                }
            }
            if (phoneNos != null && phoneNos.size() > 0) {
                Map<String, String> map = generateBill(phoneNos);
                //http://122.13.2.206:9090/WebServiceGW/wqFTPClient
                sentPostOssBill("http://122.13.2.206:9090/WebServiceGW/wqFTPClient",map);
            } else {
                logger.log(Level.INFO, "OssBillHandler[queryAllPhoneNum] phoneNum id not found");
            }
        } else {
            logger.log(Level.INFO, "OssBillHandler[queryAllPhoneNum] phoneNum id not found");
        }
    }
    public static Map<String, String> generateBill (List<String> phoneNos) {
        Map<String, String> map = new HashMap<String, String>();
        try{
            for (String num : phoneNos) {
                List<DBObject> obj =
                        MongoProvider.find("bill","platform_licence",new BasicDBObject().append("serviceNum",num));
                Integer one = 0;
                Integer two = 0;
                Integer channelPrice = 0;
                Integer count329 = 0;
                Integer count649 = 0;
                if (obj != null && obj.size() > 0) {
                    for (DBObject o : obj) {
                        Integer lonelyPrice = 0;
                        if ("enterprise".equals(o.get("licenceType"))) {
                            lonelyPrice = 32900;
                            count329 = Integer.parseInt(o.get("num").toString());
                            one += count329*lonelyPrice ;
                        } else if ("service".equals(o.get("licenceType"))) {
                            lonelyPrice = 19900;
                            two += Integer.parseInt(o.get("num").toString())*lonelyPrice ;
                        } else if ("monitor".equals(o.get("licenceType"))) {
                            lonelyPrice = 64900;
                            count649 = Integer.parseInt(o.get("num").toString());
                            channelPrice += count649*lonelyPrice ;
                        }
                        String count = o.get("channelCount").toString();
                        if (count == null || count =="") {
                            count = "0";
                        }
                        two += Integer.parseInt(count)*9900;
                    }
                }
                map.put(num,"|"+one.toString()+"|"+two.toString()+"|"+channelPrice.toString()+"|0|"+count329+"|"+count649);
            }
        }catch (Exception e){
            e.printStackTrace();
            logger.log(Level.WARNING,"generateBill error"+e);
        }
        return map;
    }

    public static String getStringBill (Map<String, String> map) {
        String bill = "";
        for (Map.Entry<String, String> entry : map.entrySet()) {
            bill+=entry.getKey() + entry.getValue() + "\r\n";
        }
        return bill;
    }


    public static void sentPostOssBill(String urlStr,Map<String, String> map) {
        String result = "";
        try {
            URL url = new URL(urlStr);
            HttpURLConnection con = (HttpURLConnection)url.openConnection();
            con.setDoOutput(true);
            con.setRequestProperty("Pragma:", "no-cache");
            con.setRequestProperty("Cache-Control", "no-cache");
            con.setRequestProperty("Content-Type", "application/octet-stream");
            con.setRequestProperty("FileName", "WQYH/"+getFileName()+".txt");
            OutputStream out = con.getOutputStream();

            String xmlInfo = getStringBill(map);
            System.out.println(xmlInfo);
            out.write(xmlInfo.getBytes("UTF-8"));
            out.flush();
            out.close();
            BufferedReader br = new BufferedReader(new InputStreamReader(con
                    .getInputStream(),"UTF-8"));
            String line = "";
            for (line = br.readLine(); line != null; line = br.readLine()) {
                result+=line;
            }
            logger.log(Level.INFO, "perform to oss:" + xmlInfo);
            logger.log(Level.INFO, "response for oss:" + result);
        } catch (MalformedURLException e) {
            e.printStackTrace();
            logger.log(Level.WARNING, "OssBillHandler[sentPostOssBill]send post failed:\r\n" + e);
        } catch (IOException e) {
            logger.log(Level.WARNING, "OssBillHandler[sentPostOssBill]send post failed:\r\n" + e);
            e.printStackTrace();
        }
    }
    public static String getFileName () {
        Calendar c = Calendar.getInstance();//可以对每个时间域单独修改
        int year = c.get(Calendar.YEAR);
        int month = c.get(Calendar.MONTH)+1;
        int date = c.get(Calendar.DATE);
        int hour = c.get(Calendar.HOUR_OF_DAY);
        int minute = c.get(Calendar.MINUTE);
        int second = c.get(Calendar.SECOND);
        String mon = month >= 10 ? month+"" : "0"+month;
        String day = date >= 10 ? date+"" : "0"+date;
        String hou = hour >= 10 ? hour+"" : "0"+hour;
        String min = minute >= 10 ? minute+"" : "0"+minute;
        String sec = second >= 10 ? second+"" : "0"+second;
        return "woqi_"+year + "" + mon+ "" + day;
    }

    @Override
    public void run() {
        Calendar c = Calendar.getInstance();
        int datenum=c.get(Calendar.DATE);
        if ("26".equals(datenum+"")) {
            queryAllPhoneNum();
        } else {
            logger.log(Level.INFO, "Timer running normally");
        }
    }
}
