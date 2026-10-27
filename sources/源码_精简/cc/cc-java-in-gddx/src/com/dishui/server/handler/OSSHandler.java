package com.dishui.server.handler;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.service.Utils;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import org.dom4j.Document;
import org.dom4j.Element;
import org.dom4j.io.SAXReader;

import java.io.*;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLConnection;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

public class OSSHandler {

    private static Logger logger = Logger.getLogger(OSSHandler.class.getName());

    public static String  oss(String data) {
        String error = "";
        String seq = "";
        if (data.isEmpty()) {
            error = "xml data is empty";
            return  error;
        }
        try {
            SAXReader saxReader = new SAXReader();
            Document document = saxReader.read(new ByteArrayInputStream(data.getBytes("gb2312")));
            Element root = document.getRootElement();
            //System.out.println(root.getName());
            if (root == null || !"wq_interface".equals(root.getName())||
                    !"OSS_DC".equals(root.attributeValue("definition"))) {
                error = "Illegal packet";
                return  error;
            }
            DBObject obj = new BasicDBObject();
            DBObject numobj = new BasicDBObject();
            obj.put("_id", Utils.getUniqueid());
            Iterator it = root.elementIterator();
            while (it.hasNext()) {
                Element action = (Element) it.next();
                if ("action".equals(action.getName())) {
                    seq = action.attributeValue("seq");
                }
                Iterator ite = action.elementIterator();
                while (ite.hasNext()) {
                    Element rquestdata = (Element) ite.next();
                    Iterator iter = rquestdata.elementIterator();
                    while (iter.hasNext()) {
                        Element parameter = (Element) iter.next();
                        if ("phoneNo".equals(parameter.attributeValue("code"))) {
                            numobj.put("phoneNo",parameter.attributeValue("value"));
                            numobj.put("isStorp",false);
                            numobj.put("isEffective",true);
                            List<Object> slist = new ArrayList<Object>();
                            slist.add(numobj);
                            obj.put("numState",slist);
                            obj.put("phoneNum",parameter.attributeValue("value"));
                        } else {
                            obj.put(parameter.attributeValue("code"),parameter.attributeValue("value"));
                        }
                    }
                }
            }
            obj.put("updateTime", Utils.getCurrentDate());
            obj.put("createTime", Utils.getCurrentDate());
            if ("WQYH01".equals(obj.get("operType"))) {
                error = checkdata(obj);
                if (error.isEmpty()) {
                    error = addAccount(obj);
                }
            } else if ("WQYH03".equals(obj.get("operType"))) {
                error = checkdata2(obj);
                if (error.isEmpty()) {
                    error = removeAccount(obj);
                }
            }else if ("WQYH04".equals(obj.get("operType"))) {
                error = checkdata2(obj);
                if (error.isEmpty()) {
                    error = stopAccount(obj);
                }
            }else if ("WQYH05".equals(obj.get("operType"))) {
                error = checkdata2(obj);
                if (error.isEmpty()) {
                    error = restoreAccount(obj);
                }
            }else if ("WQYH06".equals(obj.get("operType"))) {
                error = checkdata2(obj);
                if (error.isEmpty()) {
                    error = changeAccount(obj);
                }
            }else {
                error = "operType is unlawful!";
            }
            error = error+","+obj.get("orderId")+","+seq;


        } catch (Exception e){
            e.printStackTrace();
            error = "Illegal xml data";
            logger.log(Level.WARNING, "inster oss_order_account false!", e);
        }
        return error;
    }

    public static  String addAccount(DBObject obj) {
        DBObject o = new BasicDBObject();
        o.put("phoneNo",obj.get("phoneNum"));
        o.put("isEffective",true);
        DBObject o1 = new BasicDBObject();
        o1.put("$elemMatch",o);
        DBObject o2 = new BasicDBObject();
        o2.put("numState",o1);
        DBObject objet = MongoProvider.findOneFromReportDb("interAPI", "oss_order_account" , o2);
        if (objet != null) {
            return "phoneNo has been occupied";
        }
        DBObject oder = MongoProvider.findOneFromReportDb("interAPI", "oss_order_account" , new BasicDBObject().append("orderId",obj.get("orderId")));
        if (oder != null) {
            return "orderId has been occupied";
        }
        DBObject objc = new BasicDBObject();
        objc.put("customerId",obj.get("customerId"));
        DBObject object = MongoProvider.findOneFromReportDb("interAPI", "oss_order_account" , objc);
        if (object == null) {
            sendMail(getContent(obj,"【开户】"));
            obj.removeField("phoneNum");
            MongoProvider.reportInsert("interAPI", "oss_order_account" , obj);
        } else {
            DBObject os = new BasicDBObject();
            DBObject ojc = new BasicDBObject();
            DBObject oj = new BasicDBObject();
            oj.put("phoneNo",obj.get("phoneNum"));
            oj.put("isStorp",false);
            oj.put("isEffective",true);
            ojc.put("numState",oj);
            os.put("$push",ojc);
            MongoProvider.reportUpdate("interAPI", "oss_order_account",new BasicDBObject().append("_id",object.get("_id")), os, true, false);
            sendMail(getContent(obj,"【开户增加号码】"));
        }

        return "";
    }

    public static String stopAccount(DBObject obj) {
        DBObject object = MongoProvider.findOneFromReportDb("interAPI", "oss_order_account" ,
                new BasicDBObject().append("customerId",obj.get("customerId")).append("numState.phoneNo",obj.get("phoneNum")));
        if (object != null && !object.get("_id").toString().isEmpty()) {
            DBObject objt = new BasicDBObject();
            objt.put("numState.$.isStorp",true);
            objt.put("operType","WQYH04");
            objt.put("updateTime", Utils.getCurrentDate());
            DBObject updateData = new BasicDBObject();
            updateData.put("$set",objt);
            MongoProvider.reportUpdate("interAPI", "oss_order_account",
                    new BasicDBObject().append("_id",object.get("_id")).append("numState.phoneNo",obj.get("phoneNum")), updateData, true, false);
            sendMail(getContent(obj,"【停机】"));
        } else {
            return "Can't find the corresponding customer information";
        }
        return "";
    }

    public static String restoreAccount(DBObject obj) {
        DBObject object = MongoProvider.findOneFromReportDb("interAPI", "oss_order_account" ,
                new BasicDBObject().append("customerId",obj.get("customerId")).append("numState.phoneNo",obj.get("phoneNum")));
        if (object != null && !object.get("_id").toString().isEmpty()) {
            DBObject objt = new BasicDBObject();
            objt.put("numState.$.isStorp",false);
            objt.put("operType","WQYH05");
            objt.put("updateTime", Utils.getCurrentDate());
            DBObject updateData = new BasicDBObject();
            updateData.put("$set",objt);
            MongoProvider.reportUpdate("interAPI", "oss_order_account",
                    new BasicDBObject().append("_id",object.get("_id")).append("numState.phoneNo",obj.get("phoneNum")), updateData, true, false);
            sendMail(getContent(obj,"【复机】"));
        } else {
            return "Can't find the corresponding customer information";
        }
        return "";
    }

    public static String removeAccount(DBObject obj) {
        DBObject object = MongoProvider.findOneFromReportDb("interAPI", "oss_order_account" ,
                new BasicDBObject().append("customerId",obj.get("customerId")).append("numState.phoneNo",obj.get("phoneNum")));
        if (object != null && !object.get("_id").toString().isEmpty()) {
            DBObject objt = new BasicDBObject();
            objt.put("numState.$.isEffective",false);
            objt.put("operType","WQYH05");
            objt.put("updateTime", Utils.getCurrentDate());
            DBObject updateData = new BasicDBObject();
            updateData.put("$set",objt);
            MongoProvider.reportUpdate("interAPI", "oss_order_account",
                    new BasicDBObject().append("_id",object.get("_id")).append("numState.phoneNo",obj.get("phoneNum")), updateData, true, false);
            sendMail(getContent(obj,"【拆机】"));
        } else {
            return "Can't find the corresponding customer information";
        }
        return "";
    }

    public static String changeAccount(DBObject obj) {
        DBObject object = MongoProvider.findOneFromReportDb("interAPI", "oss_order_account" , new BasicDBObject().append("customerId",obj.get("customerId")));
        if (object != null && !object.get("_id").toString().isEmpty()) {
            obj.removeField("_id");
            obj.removeField("createTime");
            obj.removeField("phoneNum");//
            obj.removeField("numState");
            DBObject updateData = new BasicDBObject();
            updateData.put("$set",obj);
            MongoProvider.reportUpdate("interAPI", "oss_order_account",new BasicDBObject().append("_id",object.get("_id")), updateData, true, false);
            sendMail(getContent(obj,"【更改套餐】"));
        } else {
            return "Can't find the corresponding customer information";
        }
        return "";
    }

    public static  String checkdata (DBObject obj) {
        if (obj.get("orderId")==null || obj.get("orderId").toString().isEmpty()) {
            return "The orderId does not exist";
        }
        if (obj.get("AcceptId")==null ||  obj.get("AcceptId").toString().isEmpty()) {
            return "The AcceptId does not exist";
        }
        if (obj.get("operType")==null ||  obj.get("operType").toString().isEmpty()) {
            return "The operType does not exist";
        }
        if (obj.get("companyName")==null ||  obj.get("companyName").toString().isEmpty()) {
            return "The companyName does not exist";
        }
        if (obj.get("managerName")==null ||  obj.get("managerName").toString().isEmpty()) {
            return "The managerName does not exist";
        }
        if (obj.get("mobile")==null ||  obj.get("mobile").toString().isEmpty()) {
            return "The mobile does not exist";
        }
        if (obj.get("phoneNum")==null ||  obj.get("phoneNum").toString().isEmpty()) {
            return "The phoneNo does not exist";
        }
        if (obj.get("WithGroup")==null ||  obj.get("WithGroup").toString().isEmpty()) {
            return "The WithGroup does not exist";
        } else if ("1".equals(obj.get("WithGroup"))) {
            if (obj.get("GroupID")==null ||  obj.get("GroupID").toString().isEmpty()) {
                return "The GroupID does not exist";
            }
        }
        if (obj.get("customerId")==null ||  obj.get("customerId").toString().isEmpty()) {
            return "The customerId does not exist";
        }
        return "";
    }
    public static  String checkdata2 (DBObject obj) {

        if (obj.get("phoneNum")==null ||  obj.get("phoneNum").toString().isEmpty()) {
            return "The phoneNo does not exist";
        }

        if (obj.get("customerId")==null ||  obj.get("customerId").toString().isEmpty()) {
            return "The customerId does not exist";
        }
        return "";
    }
    public static void sentPostOss(String urlStr,String oderId,String seq, String code, String error) {
        String result = "";
        try {
            URL url = new URL(urlStr);
            URLConnection con = url.openConnection();
            con.setDoOutput(true);
            con.setRequestProperty("Pragma:", "no-cache");
            con.setRequestProperty("Cache-Control", "no-cache");
            con.setRequestProperty("Content-Type", "text/xml");
            OutputStream out = con.getOutputStream();

            String xmlInfo = getXmlInfo(oderId,seq, code, error);
            System.out.println("urlStr=" + urlStr);
            System.out.println("xmlInfo=" + xmlInfo);
            out.write(xmlInfo.getBytes("GB2312"));
            out.flush();
            out.close();
            BufferedReader br = new BufferedReader(new InputStreamReader(con
                    .getInputStream(),"gb2312"));
            String line = "";
            for (line = br.readLine(); line != null; line = br.readLine()) {
                result+=line;
            }
            logger.log(Level.INFO, "perform to oss:" + xmlInfo);
            logger.log(Level.INFO, "response for oss:" + result);
        } catch (MalformedURLException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private static String getXmlInfo(String oderId,String seq, String code, String error) {
        StringBuilder sb = new StringBuilder();
        sb.append("<?xml version=\"1.0\" encoding=\"gb2312\" ?>");
        sb.append("  <wq_interface definition=\"WQ_DC\">");
        sb.append("  <action name=\"2005\" seq=\""+seq+"\"> ");
        sb.append("   <responsedata>");
        sb.append("     <parameter name=\"工单编号\" code=\"orderId\" value=\""+oderId+"\" />");
        sb.append("     <parameter name=\"执行结果\" code=\"result\" value=\""+code+"\" />");
        sb.append("     <parameter name=\"备注\" code=\"ErrReason\" value=\""+error+"\" />");
        sb.append("   </responsedata>");
        sb.append("  </action>");
        sb.append("</wq_interface>");
        return sb.toString();
    }
    public static void sendMail(String content){
        String subject = "【广东联通业务对接】";
        DBObject mail = new BasicDBObject();

        List<String> tolist = new ArrayList<String>();
        tolist.add("service@7moor.com");

        List<String> cclist = new ArrayList<String>();
        cclist.add("dev@7moor.com");
        cclist.add("suncc@7moor.com");
        cclist.add("chenguang@7moor.com");
        cclist.add("service-yys@yuntongxun.com");
        cclist.add("channel@7moor.com");

        mail.put("toAddr", tolist);
        mail.put("type","cdrWarning");
        mail.put("subject",subject);
        mail.put("ccAddr", cclist);
        mail.put("status","undeal");
        mail.put("warningTime",Utils.getDate("yyyy-MM-dd HH:mm:ss"));
        mail.put("content", content);

        MongoProvider.insert("bill", "bill_system_mail_send", mail);
    }
    public static String getContent(DBObject obj, String type) {
        String content = "收到广东联通的"+type+"业务邮件：<br/>";
        if (obj != null) {
            if (obj.get("orderId") != null) {
                content += "工单编号："+obj.get("orderId")+"<br/>";
            }
            if (obj.get("AcceptId") != null) {
                content += "受理编号："+obj.get("AcceptId")+"<br/>";
            }
            if (obj.get("operType") != null) {
                String otp = "";
                if(obj.get("operType").equals("WQYH01")) {
                    otp = "装机(开户)";
                } else if (obj.get("operType").equals("WQYH03")) {
                    otp = "拆机(号码释放)";
                } else if (obj.get("operType").equals("WQYH04")) {
                    otp = "停机(号码停用)";
                } else if (obj.get("operType").equals("WQYH05")) {
                    otp = "复机(号码启用)";
                } else if (obj.get("operType").equals("WQYH06")) {
                    otp = "修改套餐";
                }
                content += "业务编码："+obj.get("operType")+"["+otp+"]<br/>";
            }
            if (obj.get("companyName") != null) {
                content += "企业名称："+obj.get("companyName")+"<br/>";
            }
            if (obj.get("managerName") != null) {
                content += "联系人名称："+obj.get("managerName")+"<br/>";
            }
            if (obj.get("mobile") != null) {
                content += "联系人手机号："+obj.get("mobile")+"<br/>";
            }
            content += "联系人邮箱："+obj.get("email")+"<br/>";
            content += "发货地址："+obj.get("address")+"<br/>";
            if (obj.get("customerId") != null) {
                content += "客户集团编号："+obj.get("customerId")+"<br/>";
            }
            content += "区号："+obj.get("areaCode")+"<br/>";
            if (obj.get("phoneNum") != null) {//
                content += "语音号码："+obj.get("phoneNum")+"<br/>";
            }
            content += "license数量："+obj.get("license")+"<br/>";
            if (obj.get("trunkCode") != null) {
                content += "呼叫权限："+obj.get("trunkCode")+"<br/>";
            }
            if(obj.get("WithGroup").equals("0")) {
                content += "是否组网："+obj.get("WithGroup")+"(否)<br/>";
            } else if (obj.get("WithGroup").equals("1")) {
                content += "是否组网："+obj.get("WithGroup")+"(是)<br/>";
            }
            content += "组网企业集团编码："+obj.get("GroupID")+"<br/>";//
            content += "备注："+obj.get("remark")+"<br/>";
        }
        return content;
    }
}