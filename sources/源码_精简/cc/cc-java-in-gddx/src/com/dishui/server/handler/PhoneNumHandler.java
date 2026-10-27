package com.dishui.server.handler;

import com.dishui.db.mango.MongoConnect;
import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.service.Utils;
import com.dishui.server.http.HttpProvider;
import com.mongodb.*;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by Administrator on 2016/7/22.
 */
public class PhoneNumHandler extends TimerTask {

    private static Logger logger = Logger.getLogger(PhoneNumHandler.class.getName());
    private static String vrsionUrlStr = "http://user.ipip.net/download.php?a=version&token=469cda7c6b6675ffdc1ab50e927151e24953dc54";
    private static String phoneUrlStr = "http://user.ipip.net/download.php?token=469cda7c6b6675ffdc1ab50e927151e24953dc54";

    public static void checkVersion() {
        try {
            URL url = new URL(vrsionUrlStr);
            InputStream in=url.openStream();
            BufferedReader brin=new BufferedReader(new InputStreamReader(in));
            String line=null;
            if((line=brin.readLine())!=null){
                System.out.println(line);
                DBObject object = MongoProvider.findOneFromReportDb("cdr","app_ipip_net_versions",
                        new BasicDBObject().append("_id", "1b855e49-29ff-45ab-a7dc-1ea9d8a45069"));
                if (object != null) {
                    String versions = (String)object.get("versions");
                    if (!versions.equals(line.trim())) {
                        downLoadPhoneNum(line.trim());
                        DBObject obj = new BasicDBObject();
                        obj.put("_id","1b855e49-29ff-45ab-a7dc-1ea9d8a45069");
                        DBObject updateData = new BasicDBObject();
                        DBObject setData = new BasicDBObject();
                        setData.put("versions",line.trim());
                        setData.put("updateTime", Utils.getCurrentDate());
                        updateData.put("$set",setData);
                        MongoProvider.reportUpdate("cdr", "app_ipip_net_versions" ,obj, updateData, false, false);
                    } else {
                        logger.info("info: phone version is consistent");
                    }
                }
            }
            brin.close();

        }  catch (Exception e) {
            e.printStackTrace();
            logger.log(Level.WARNING, "checkVersion error!", e);
        }
    }
    public static void downLoadPhoneNum(String date) {
        try {
            URL url = new URL(phoneUrlStr);
            BufferedReader br = null;
            HttpURLConnection conn = (HttpURLConnection)url.openConnection();
            conn.setRequestProperty("User-Agent", "Mozilla/4.0 (compatible; MSIE 5.0; Windows NT; DigExt)");
            InputStream inputStream = conn.getInputStream();
            byte[] getData = readInputStream(inputStream);
            String str2 = new String(getData);
            //str2 = str2.replaceAll("\\r|\\n","--");
            String[] datas = str2.split("\\r|\\n");
            int i  = 1;
            String str = "";
            List<DBObject> list = new ArrayList<DBObject>();
            MongoProvider.dropFromReportDb("cdr","app_ipip_net_newphone");
            for (String s : datas) {
                if(i >= 2) {
                    str = s.replaceAll("\\s+","|");
                    //System.out.println(str);
                    String[] strs = str.split("\\|");
                    if (strs.length >= 3) {
                        DBObject obj = new BasicDBObject();
                        obj.put("_id", strs[0]);
                        obj.put("province", strs[1]);
                        obj.put("city", strs[2]);
                        list.add(obj);
                        if(i % 10000 == 0){
                            System.out.println(i);
                            MongoProvider.reportBatchInsert("cdr","app_ipip_net_newphone",list, new WriteConcern());
                            list.clear();
                        }
                    }
                }
                i++;
            }
            if (list.size() > 0) {
                MongoProvider.reportBatchInsert("cdr","app_ipip_net_newphone",list, new WriteConcern());
                list.clear();
            }
            getCodeFromCompatable(date);
            if(inputStream!=null){
                inputStream.close();
            }
            if (br != null) {
                br.close();
            }
            logger.info("info:"+url+" download success");
        }catch (Exception e) {
            e.printStackTrace();
            logger.log(Level.WARNING, "download false!", e);
        }
    }
    /**
     * 从输入流中获取字节数组
     * @param inputStream
     * @return
     * @throws IOException
     */
    public static  byte[] readInputStream(InputStream inputStream) throws IOException {
        byte[] buffer = new byte[2048];
        int len = 0;
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        while((len = inputStream.read(buffer)) != -1) {
            bos.write(buffer, 0, len);
        }
        bos.close();
        return bos.toByteArray();
    }

    public static void getCodeFromCompatable (String data) {
        Map<String, Object> map = new HashMap<String, Object>();
        List<DBObject> object = MongoProvider.findFromReportDb("cdr","app_ipip_net_compatable",
               new BasicDBObject());
        if (object != null && object.size() > 0) {
            for (DBObject o : object) {
                map.put((String)o.get("city"),o.get("code"));
            }
        }
        if (map != null && map.size() > 0) {
            for (Map.Entry<String, Object> entry : map.entrySet()) {
                DBObject obj = new BasicDBObject();
                obj.put("city",entry.getKey());
                DBObject updateData = new BasicDBObject();
                DBObject setData = new BasicDBObject();
                setData.put("code",entry.getValue());
                updateData.put("$set",setData);
                MongoProvider.reportUpdate("cdr", "app_ipip_net_newphone" ,obj, updateData, false, true);
                //System.out.println("key= " + entry.getKey() + " and value= " + entry.getValue());
            }
        }
        List<DBObject> list = MongoProvider.findFromReportDb("cdr", "app_ipip_net_newphone",new BasicDBObject().append("code",null));
        int count = 0;
        if (list != null && list.size() > 0) {
            count = list.size();
            for (DBObject obj : list) {
                DBObject oj = new BasicDBObject();
                oj.put("_id",obj.get("_id"));
                oj.put("province",obj.get("province"));
                oj.put("city",obj.get("city"));
                oj.put("time",Utils.getCurrentDate());
                MongoProvider.reportInsert("cdr", "app_ipip_net_noCode",oj);
            }
        }
        System.out.println("over.............");
        createNewPhone(data,count);
    }

    public static void createNewPhone (String data, int count){
        BufferedWriter bw = null;
        try{
            File file = new File("/opt/phone/phone_"+data+".txt");
            bw = new BufferedWriter(new FileWriter(file));
            //List<DBObject> list = MongoProvider.findFromReportDb("cdr", "app_ipip_net_newphone", new BasicDBObject());
            DBCollection collection = MongoConnect.getInstance().getReportDB("cdr").getCollection("app_ipip_net_newphone");
            DBCursor result = collection.find(new BasicDBObject());
            int i =1;
            StringBuilder sb = new StringBuilder();
            while (result.hasNext()) {
                DBObject ob = result.next();
                sb.append(ob.get("_id") + "|" + ob.get("province") + "|" + ob.get("city") + "|" + ob.get("code")+"\n");
                if (i % 50000 == 0) {
                    bw.write(sb.toString());
                    sb.delete(0,sb.length());
                    System.out.print(".............."+i);
                }
                i++;
            }
            if(sb.length() > 0) {
                bw.write(sb.toString());
            }
            sendSmsAndMail("生成了新的phone文件，文件名：phone_"+data+".txt,共有:"+count+"条数据没有区号！");
            bw.flush();
            bw.close();
        } catch (Exception e ){
            e.printStackTrace();
        }
    }
    public static void sendSmsAndMail(String content) {
        try{
            String smsData = "http://115.29.14.183:3000/openService?action=sendInterfaceTemplateSms&account=N00000002272&password=bvff334f3x5ids" +
                    "&num=15010457345&templateNum=1&var1="+ URLEncoder.encode(content, "utf-8")+"&md5=81f0e1f0-32df-11e3-a2e6-1d21429e5f46";
            String res = HttpProvider.sendGet(smsData);
            sendMail("ipip.net更新了phone文件",content);
            logger.log(Level.INFO, "生成了新的phone文件，发送短信报警通知!!! res="+res+" smsData="+smsData);
        } catch (Exception e){
            e.printStackTrace();
        }
    }

    @Override
    public void run() {
        checkVersion();
    }
    public static void sendMail(String subject, String content){
        DBObject mail = new BasicDBObject();

        List<String> tolist = new ArrayList<String>();
        tolist.add("suncc@7moor.com");

        List<String> cclist = new ArrayList<String>();
        cclist.add("shenjc@7moor.com");

        mail.put("toAddr", tolist);
        mail.put("type","cdrWarning");
        mail.put("subject",subject);
        mail.put("ccAddr", cclist);
        mail.put("status","undeal");
        mail.put("warningTime",Utils.getDate("yyyy-MM-dd HH:mm:ss"));
        mail.put("content", content);

        MongoProvider.insert("bill", "bill_system_mail_send", mail);
    }
}
