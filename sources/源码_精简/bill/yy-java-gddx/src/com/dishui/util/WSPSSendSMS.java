package com.dishui.util;

import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NamedNodeMap;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.*;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.logging.Logger;

public class WSPSSendSMS {

    private static Logger log = Logger.getLogger(WSPSSendSMS.class.getName());

	private String encode = "UTF-8";
	public String getEncode() {
		return encode;
	}

	public void setEncode(String encode) {
		this.encode = encode;
	}

	
    private String userid = "";
	
	private String password = "";
	// 短信发送定时时间;
	private String destnumbers;

	private String msg;

	private String sendtime;
	
	private String url;


    public String getUrl() {
		return url;
	}

	public void setUrl(String url) {
		this.url = url;
	}

	public String getSendtime() {
		return sendtime;
	}

	public void setSendtime(String sendtime) {
		this.sendtime = sendtime;
	}

	public String getUserid() { return userid; }

    public void setUserid(String userid) { this.userid = userid; }

	

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;//Base.base64Decode(password);
	}


	public String getDestnumbers() {
		return destnumbers;
	}

	public void setDestnumbers(String destnumbers) {
		this.destnumbers = destnumbers;
	}

	public String getMsg() {
		return msg;
	}

	public void setMsg(String msg) {
		this.msg = msg;
	}

    // 发送短信;
	public Map<String, String> sendSMS() {
		DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
		dbf.setNamespaceAware(true);
		Document doc;
		Map<String, String> result = new HashMap<String, String>();
        result.put("success", "false");
        result.put("desc", "提交通道通信异常");
		try {
			DocumentBuilder db = dbf.newDocumentBuilder();
			InputStream is = URLConnIO.getSoapInputStream(url, this.getRequestData().toString());
			doc = db.parse(is);
					
            String returnstatus = doc.getElementsByTagName("root").item(0).getAttributes().getNamedItem("return").getNodeValue();
            String message = doc.getElementsByTagName("root").item(0).getAttributes().getNamedItem("info").getNodeValue();

            if(returnstatus.equals("0")){
            	String msgid = doc.getElementsByTagName("root").item(0).getAttributes().getNamedItem("msgid").getNodeValue();
//            	String numbers = doc.getElementsByTagName("root").item(0).getAttributes().getNamedItem("numbers").getNodeValue();
//            	String messages = doc.getElementsByTagName("root").item(0).getAttributes().getNamedItem("messages").getNodeValue();
                result.put("success", "true");
                result.put("by_errordescription", "发送成功");
                result.put("wsps_msgid", msgid);
            }else{
            	result.put("success", "false");
                result.put("by_errordescription", "发送失败");
            }
            result.put("return", returnstatus);
            result.put("info", message);
			is.close();
		} catch (Exception e) {
			e.printStackTrace();
            log.warning("维斯普胜通道 发送短信失败!"+destnumbers+" Exception:"+e);
		}
        return result;
	}

//    // 获取短信报告;
//    public ArrayList<Map<String, String>> getSMSReport() {
//        DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
//        dbf.setNamespaceAware(true);
//        Document doc;
//        ArrayList<Map<String, String>> resultList =  new ArrayList<Map<String, String>>();
//        try {
//            log.warning("开始获取国度通用短信报告!");
//            String httpRes = HttpProvider.sendPost(this.getServicesRequestAddRess(),
//                                    this.getReportRequestData().toString().getBytes("UTF-8"), 60000);
//            DocumentBuilder db = dbf.newDocumentBuilder();
//            ByteArrayInputStream tInputStringStream = new ByteArrayInputStream(httpRes.getBytes());
//            doc = db.parse(tInputStringStream);
//
//            Element root = doc.getDocumentElement();
//            //遍历根节点下面的所有子节点
//            NodeList statusBox = root.getChildNodes();
//            for(int i=0;i<statusBox.getLength();i++){
//                NodeList childNodes = statusBox.item(i).getChildNodes();
//                Map<String, String> result = new HashMap<String, String>();
//                for(int j=0;j<childNodes.getLength();j++){
//                    if(childNodes.item(j).getChildNodes().getLength()>0){
//                        result.put(childNodes.item(j).getNodeName(), childNodes.item(j).getChildNodes().item(0).getNodeValue());
//                    }
//                }
//                if(result.size()>0)
//                    resultList.add(result);
//            }
//            tInputStringStream.close();
//        } catch (Exception e) {
//            e.printStackTrace();
//            log.warning("获取国度通用短信报告失败!"+"Exception:"+e);
//        }
//        return resultList;
//    }


	// 拼接参数;
	private StringBuffer getRequestData() {
		StringBuffer requestAddRess = new StringBuffer();
		requestAddRess.append("userid=");
        requestAddRess.append(this.userid);
        requestAddRess.append("&password=");
        requestAddRess.append(this.password);
        requestAddRess.append("&destnumbers=");
		requestAddRess.append(this.destnumbers);
		requestAddRess.append("&msg=");
		requestAddRess.append(this.msg);
		requestAddRess.append("&sendtime=");
		requestAddRess.append(this.sendtime);
		return requestAddRess;
	}

//    // 拼接获取报告参数;
//    private StringBuffer getReportRequestData() {
//        StringBuffer requestAddRess = new StringBuffer();
//        requestAddRess.append("action=query");
//        requestAddRess.append("&userid=");
//        requestAddRess.append(this.userid);
//        requestAddRess.append("&account=");
//        requestAddRess.append(this.account);
//        requestAddRess.append("&password=");
//        requestAddRess.append(this.password);
//        return requestAddRess;
//    }
}
