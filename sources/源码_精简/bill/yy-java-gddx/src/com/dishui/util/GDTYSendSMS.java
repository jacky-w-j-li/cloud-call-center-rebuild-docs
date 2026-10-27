package com.dishui.util;

import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.*;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.logging.Logger;

public class GDTYSendSMS {

    private static Logger log = Logger.getLogger(GDTYSendSMS.class.getName());

	private String encode = "UTF-8";
	public String getEncode() {
		return encode;
	}

	public void setEncode(String encode) {
		this.encode = encode;
	}

	// 服务器请求地址(需要加密);
	private String servicesRequestAddRess = "";

    //企业ID
    private String userid = "";
	// 登录的用户名(需要加密);
	private String account = "";
	// 登录的密码(需要加密);
	private String password = "";
	// 短信发送定时时间;
	private String sendTime;
    // 动作类型
    private String action = "send";
	// 发送的手机号码(需要加密);
	private String mobile;
	// 发送的内容(需要加密);
	private String content;
    //扩展
    private String extno;

	public String getServicesRequestAddRess() {
		return servicesRequestAddRess;
	}

	public void setServicesRequestAddRess(String servicesRequestAddRess) {
		this.servicesRequestAddRess = servicesRequestAddRess; //Base.base64Decode(servicesRequestAddRess);
	}
    public String getSendTime() { return sendTime; }

    public void setSendTime(String sendTime) { this.sendTime = sendTime; }

    public String getUserid() { return userid; }

    public void setUserid(String userid) { this.userid = userid; }

	public String getAccount() {
		return account;
	}

	public void setAccount(String account) {
		this.account = account; //Base.base64Decode(username);
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;//Base.base64Decode(password);
	}

	public String getMobile() {
		return mobile;
	}

	public void setMobile(String mobile) {
		this.mobile = mobile;//Base.base64Decode(mobiles);
	}

	public String getContent() {
		return content;
	}

	public void setContent(String content) { this.content = content; }

    public void setExtno(String extno) {
        this.extno = extno;
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
			InputStream is = URLConnIO.getSoapInputStream(this
					.getServicesRequestAddRess(), this.getRequestData().toString());
			doc = db.parse(is);

            String returnstatus = doc.getElementsByTagName("returnstatus").item(0).getFirstChild().getNodeValue();
            String message = doc.getElementsByTagName("message").item(0).getFirstChild().getNodeValue();
            String remainpoint = doc.getElementsByTagName("remainpoint").item(0).getFirstChild().getNodeValue();
            String taskID = doc.getElementsByTagName("taskID").item(0).getFirstChild().getNodeValue();
            String successCounts = doc.getElementsByTagName("successCounts").item(0).getFirstChild().getNodeValue();

            if(returnstatus.equalsIgnoreCase("Success")){
                result.put("success", "true");
                result.put("by_errordescription", "成功");
                result.put("gdty_msgid", taskID);
                result.put("gdty_remainpoint", remainpoint);
            }
            result.put("desc", message);
			is.close();
		} catch (Exception e) {
			e.printStackTrace();
            log.warning("国都通用通道 发送短信失败!"+mobile+" Exception:"+e);
		}
        return result;
	}

    // 获取短信报告;
    public ArrayList<Map<String, String>> getSMSReport() {
        DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
        dbf.setNamespaceAware(true);
        Document doc;
        ArrayList<Map<String, String>> resultList =  new ArrayList<Map<String, String>>();
        try {
            log.warning("开始获取国度通用短信报告!");
            String httpRes = HttpProvider.sendPost(this.getServicesRequestAddRess(),
                                    this.getReportRequestData().toString().getBytes("UTF-8"), 60000);
            DocumentBuilder db = dbf.newDocumentBuilder();
            ByteArrayInputStream tInputStringStream = new ByteArrayInputStream(httpRes.getBytes());
            doc = db.parse(tInputStringStream);

            Element root = doc.getDocumentElement();
            //遍历根节点下面的所有子节点
            NodeList statusBox = root.getChildNodes();
            for(int i=0;i<statusBox.getLength();i++){
                NodeList childNodes = statusBox.item(i).getChildNodes();
                Map<String, String> result = new HashMap<String, String>();
                for(int j=0;j<childNodes.getLength();j++){
                    if(childNodes.item(j).getChildNodes().getLength()>0){
                        result.put(childNodes.item(j).getNodeName(), childNodes.item(j).getChildNodes().item(0).getNodeValue());
                    }
                }
                if(result.size()>0)
                    resultList.add(result);
            }
            tInputStringStream.close();
        } catch (Exception e) {
            e.printStackTrace();
            log.warning("获取国度通用短信报告失败!"+"Exception:"+e);
        }
        return resultList;
    }

	// 拼接参数;
	private StringBuffer getRequestData() {
		StringBuffer requestAddRess = new StringBuffer();
		requestAddRess.append("action=");
        requestAddRess.append(this.action);
        requestAddRess.append("&userid=");
        requestAddRess.append(this.userid);
        requestAddRess.append("&account=");
		requestAddRess.append(this.account);
		requestAddRess.append("&password=");
		requestAddRess.append(this.password);
		requestAddRess.append("&mobile=");
		requestAddRess.append(this.mobile);
		requestAddRess.append("&content=");
		requestAddRess.append(this.content);
        if(this.extno != null){
            requestAddRess.append("&extno=");
            requestAddRess.append(this.extno);
        }
		return requestAddRess;
	}

    // 拼接获取报告参数;
    private StringBuffer getReportRequestData() {
        StringBuffer requestAddRess = new StringBuffer();
        requestAddRess.append("action=query");
        requestAddRess.append("&userid=");
        requestAddRess.append(this.userid);
        requestAddRess.append("&account=");
        requestAddRess.append(this.account);
        requestAddRess.append("&password=");
        requestAddRess.append(this.password);
        return requestAddRess;
    }
}
