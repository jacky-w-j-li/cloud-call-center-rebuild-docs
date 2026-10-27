package com.dishui.util;

import java.security.MessageDigest;
import java.util.*;
import java.util.Map.Entry;

import com.dishui.bill.service.AppConfig;
import org.apache.commons.httpclient.HttpClient;
import org.apache.commons.httpclient.HttpStatus;
import org.apache.commons.httpclient.NameValuePair;
import org.apache.commons.httpclient.methods.PostMethod;
import org.apache.commons.httpclient.params.HttpMethodParams;
import org.dom4j.Document;
import org.dom4j.DocumentException;
import org.dom4j.DocumentHelper;
import org.dom4j.Element;

import java.util.logging.Level;
import java.util.regex.Pattern;

/**
 * Created by chenguang on 11/17/14.
 */
public class SmsUtil {
//    public static String userName = "dh22051"; // 接口账号
//    public static String password = "8j~m4$O~"; // 密码
    public static String userName = AppConfig.getInstance().getSmsUser(); // 接口账号
    public static String password = AppConfig.getInstance().getSmsPassword(); // 密码
//    public static String phone = "18600030392"; // 要发送的手机号码
//    public static String content = "短信内容test"; // 短信内容
//    public static String sign = "【后置签名】"; // 短信签名，该签名必须提前报备
//    public static String sign = ""; // 短信签名，该签名必须提前报备
    public static String msgid ="";	//自定义msgid
    public static String subcode ="";	//扩展字号
    public static String sendtime =""; //定时发送时间，时间格式201305051230
//    public static String url="http://3tong.net"; //无限通使用地址
    public static String url = AppConfig.getInstance().getSmsUrl();


    private static String doPost(String url, Map<String, String> params) {
        String response = null;
        HttpClient client = new HttpClient();
        PostMethod postMethod = new PostMethod(url);
        postMethod.getParams().setParameter(
                HttpMethodParams.HTTP_CONTENT_CHARSET, "utf-8");
        // 设置Post数据
        if (!params.isEmpty()) {
            int i = 0;
            NameValuePair[] data = new NameValuePair[params.size()];
            for (Entry<String, String> entry : params.entrySet()) {
                data[i] = new NameValuePair(entry.getKey(), entry.getValue());
                i++;
            }
            postMethod.setRequestBody(data);
        }
        try {
            client.executeMethod(postMethod);
            if (postMethod.getStatusCode() == HttpStatus.SC_OK) {
                response = postMethod.getResponseBodyAsString();
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            postMethod.releaseConnection();
        }
        return response;
    }

    public static String MD5Encode(String sourceString) {
        MD5 md5=new MD5();
        String resultString=md5.getMD5ofStr(sourceString);
        System.out.println(resultString);

        return resultString;
    }

    public static Map send(String phone,String content,String sign) {
        String posturl = url+"/http/sms/Submit";
        Map<String, String> params = new LinkedHashMap<String, String>();
        SmsUtil docXml = new SmsUtil();
/*			String message = "<?xml version='1.0' encoding='UTF-8'?><message>"
					+ "<account>" + userName + "</account>" + "<password>"
					+ MD5Encode(password) + "</password>"
					+ "<msgid></msgid><phones>" + phone + "</phones><content>"
					+ content + "</content>"
					+ "<sign>"+sign+"</sign><subcode></subcode><sendtime></sendtime></message>";*/
        String message=docXml.DocXml(userName, MD5Encode(password), msgid, phone, content, sign, subcode, sendtime);
        System.out.println(message);
        params.put("message", message);

        String resp = doPost(posturl, params);
        System.out.println("====response==="+resp);
        Map resMap = readStringXmlOut(resp);
        System.out.println(resMap);
        return resMap;
    }

    // 状态报告
    public static Map getReport(String msgid) {
        String posturl = url+"/http/sms/Report";
        Map<String, String> params = new LinkedHashMap<String, String>();
        String message = "<?xml version='1.0' encoding='UTF-8'?><message>"
                + "<account>" + userName + "</account>" + "<password>"
                + MD5Encode(password) + "</password>"
                + "<msgid>"+msgid+"</msgid><phone></phone></message>";
        params.put("message", message);
        String resp = doPost(posturl, params);
        System.out.println("====response==="+resp);
        Map resMap = readStringXmlOut(resp);
        System.out.println(resMap);
        return resMap;
    }

    public static Map getReport() {
        String posturl = url+"/http/sms/Report";
        Map<String, String> params = new LinkedHashMap<String, String>();
        String message = "<?xml version='1.0' encoding='UTF-8'?><message>"
                + "<account>" + userName + "</account>" + "<password>"
                + MD5Encode(password) + "</password>"
                + "</message>";
        params.put("message", message);
        String resp = doPost(posturl, params);
        System.out.println("====response==="+resp);
        Map resMap = readStringXmlOut(resp);
        System.out.println(resMap);
        return resMap;
    }


    // 查询余额
    public static Map getBalance() {
        String posturl = url+"/http/sms/Balance";
        Map<String, String> params = new LinkedHashMap<String, String>();
        String message = "<?xml version='1.0' encoding='UTF-8'?><message><account>"
                + userName
                + "</account>"
                + "<password>"
                + MD5Encode(password)
                + "</password></message>";
        params.put("message", message);
        System.out.println(message);
        String resp = doPost(posturl, params);
        System.out.println("====response==="+resp);
        Map resMap = readStringXmlOut(resp);
        System.out.println(resMap);
        return resMap;
    }

    // 获取上行
    public static Map getSms() {
        String posturl = url+"/http/sms/Deliver";
        Map<String, String> params = new LinkedHashMap<String, String>();
        String message = "<?xml version='1.0' encoding='UTF-8'?><message><account>"
                + userName
                + "</account>"
                + "<password>"
                + MD5Encode(password)
                + "</password></message>";
        params.put("message", message);

        String resp = doPost(posturl, params);
        System.out.println("====response==="+resp);
        Map resMap = readStringXmlOut(resp);
        System.out.println(resMap);
        return resMap;
    }


    public  String DocXml(String userName,String pwd,String msgid,String  phone,String contents,String sign,String  subcode,String sendtime) {
        Document doc = DocumentHelper.createDocument();
        doc.setXMLEncoding("UTF-8");
        Element message = doc.addElement("message");
        Element account = message.addElement("account");
        account.setText(userName);
        Element password = message.addElement("password");
        password.setText(pwd);
        Element msgid1 = message.addElement("msgid");
        msgid1.setText(msgid);
        Element phones = message.addElement("phones");
        phones.setText(phone);
        Element content = message.addElement("content");
        content.setText(contents);
        Element sign1 = message.addElement("sign");
        sign1.setText(sign);
        Element subcode1 = message.addElement("subcode");
        subcode1.setText(subcode);
        Element sendtime1 = message.addElement("sendtime");
        sendtime1.setText(sendtime);
        return message.asXML();
    }

    /**
     * @description 将xml字符串转换成map
     * @param xml
     * @return Map
     */
    public static Map readStringXmlOut(String xml) {
        Map map = new HashMap();
        Document doc = null;
        try {
            doc = DocumentHelper.parseText(xml); // 将字符串转为XML
            Element rootElt = doc.getRootElement(); // 获取根节点
            //System.out.println("根节点：" + rootElt.getName()); // 拿到根节点的名称
            Iterator iter = rootElt.elementIterator(); // 获取根节点下的子节点集合
            // 遍历head节点
            while (iter.hasNext()) {
                Element recordEle = (Element) iter.next();
                if(recordEle.getName().equals("sms") || recordEle.getName().equals("report") || recordEle.getName().equals("statusbox")){
                    Map childMap = new HashMap();
                    Iterator childIter = recordEle.elementIterator(); // 获取根节点下的子节点集合
                    while (childIter.hasNext()) {
                        Element childEle = (Element)childIter.next();
                        childMap.put(childEle.getName(),childEle.getData());
                    }
                    if(map.get(recordEle.getName()) != null){
                        Object tmpObj = map.get(recordEle.getName());
                        if (tmpObj instanceof List) {
                            ((List) tmpObj).add(childMap);
                            map.put(recordEle.getName(),((List)tmpObj));
                        } else if (tmpObj instanceof Map) {
                            List mapList = new ArrayList();
                            mapList.add(tmpObj);
                            mapList.add(childMap);
                            map.put(recordEle.getName(),mapList);
                        }
                    }else{
                        map.put(recordEle.getName(),childMap);
                    }
                }else{
                    map.put(recordEle.getName(),recordEle.getData());
                }
            }
        } catch (DocumentException e) {
            e.printStackTrace();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return map;
    }

    public static void main(String[] args) {
        //发送短信
//        System.out.println("*************发送短信*************");
//        Map map = SmsUtil.send("18600030392","test test 测试带subcode","【超孚金融】");
        //send();

        // 获取状态报告
//        System.out.println("*************状态报告*************");
        //getReport();
//
        // 获取上行
//        System.out.println("*************获取上行*************");
//        getSms();
//
//        // 获取余额
//        System.out.println("*************获取余额*************");
        getBalance();

    }

}
