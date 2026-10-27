package com.dishui.util;

import org.w3c.dom.*;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

/**
 * Created by chenguang on 2/6/15.
 */
public class GDTYSmsUtil {
    public static String userid = "88";
    public static String account = "qmkjzy";
    public static String password = "qm6688";
    public static String url = "http://116.255.153.10:7788/sms.aspx";
    public static String reportUrl = "http://116.255.153.10:7788/statusApi.aspx";


    public static Map<String,String> send(String phone,String content) {
        GDTYSendSMS ss = new GDTYSendSMS();
        ss.setUserid(userid);
        ss.setAccount(account);
        ss.setPassword(password);
        ss.setContent(content);
        ss.setMobile(phone);
        ss.setServicesRequestAddRess(url);
        Map<String, String> map = ss.sendSMS();
        return map;
    }

    public static ArrayList<Map<String, String>> getReport(){
        GDTYSendSMS ss = new GDTYSendSMS();
        ss.setUserid(userid);
        ss.setAccount(account);
        ss.setPassword(password);
        ss.setServicesRequestAddRess(reportUrl);
        ArrayList<Map<String, String>> list = ss.getSMSReport();
        return list;
    }

    public static void main(String[] args) {
        //15210988171
        //13381096522
//        System.out.println(send("15210988171", "你的验证码98932【九牧王】"));
//        System.out.println(getReport());

//        try{
//            DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
//            dbf.setNamespaceAware(true);
//            Document doc;
//            String xml = "<?xml version=\"1.0\" encoding=\"utf-8\" ?><returnsms> <statusbox> <mobile>15210988171</mobile> " +
//                    "<taskid>2182488</taskid> <status>10</status> <receivetime>2015-5-29 17:06:12</receivetime> " +
//                    "<errorcode>DELIVRD</errorcode> <extno></extno> </statusbox> " +
//                    "<statusbox> <mobile>15210988171</mobile> <taskid>2182517</taskid> " +
//                    "<status>10</status> <receivetime>2015-5-29 17:17:16</receivetime> " +
//                    "<errorcode>DELIVRD</errorcode> <extno></extno> " +
//                    "</statusbox> </returnsms>";
////            String xml = "<?xml version=\"1.0\" encoding=\"utf-8\" ?><returnsms>" +
////                    "<statusbox><mobile>18600030392</mobile><code>10</code></statusbox>" +
//////                    "<statusbox><mobile>18600030392</mobile><code>10</code></statusbox>" +
////                    "</returnsms>";
//            DocumentBuilder db = dbf.newDocumentBuilder();
//
//            ByteArrayInputStream tInputStringStream = new ByteArrayInputStream(xml.getBytes());
//
//            doc = db.parse(tInputStringStream);
//            Element root = doc.getDocumentElement();
//            //遍历根节点下面的所有子节点
//            NodeList statusBox = root.getChildNodes();
//
//            for(int i=0;i<statusBox.getLength();i++){
//                NodeList childNodes = statusBox.item(i).getChildNodes();
//                for(int j=0;j<childNodes.getLength();j++){
//                    if(childNodes.item(j).getChildNodes().getLength()>0){
//                        System.out.println("--"+childNodes.item(j).getNodeName());
//                        System.out.println("=="+childNodes.item(j).getChildNodes().item(0).getNodeValue());
//                    }
//                }
//            }
//        }catch (Exception e){
//            e.printStackTrace();
//        }
    }
}
