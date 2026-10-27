package com.m7.mailServer.model;

import java.io.UnsupportedEncodingException;
import java.util.HashMap;
import java.util.Map;

import javax.mail.internet.MimeUtility;

import org.apache.commons.codec.binary.Base64;

/**
 * Created by zhangyang on 16/4/18.
 */
public class M7MailAddr {
    private String addr = "";
    private String name = "";

    public M7MailAddr(String addr) throws UnsupportedEncodingException {
        // added by wangyn
        if (addr != null) {
            addr = addr.replaceAll("\r", "");
            addr = addr.replaceAll("\n", "");
            addr = addr.trim();
            addr = addr.replaceAll(" +", " "); //处理中间多个空格的情况

            if (addr.indexOf("\"") != -1) {//有双引号
                //按照引号来拆分
                this.name = MimeUtility.decodeText(addr.substring(1, addr.lastIndexOf("\"")));
                this.addr = addr.substring(addr.lastIndexOf("\"") + 1);
            } else if (addr.indexOf("<") != -1 && addr.indexOf(">") != -1) {//无引号 有尖括号
                //按照<来拆分
                this.name = MimeUtility.decodeText(addr.substring(0, addr.indexOf("<")));
                this.addr = addr.substring(addr.indexOf("<"), addr.indexOf(">"));
            } else {
                this.name = "";
                this.addr = addr;
            }

        }
        if (this.name.contains("=?")) { //处理形如:=?gb2312?B?1cW ua==?=
            this.name = this.name.replace(" ", "+");
            this.name = MimeUtility.decodeText(this.name);
        }
        if (this.name != null) {
            this.name = this.name.trim();
        }
        if (this.addr != null) {
            this.addr = this.addr.replaceAll("<", "");
            this.addr = this.addr.replaceAll(">", "");
            this.addr = this.addr.replaceAll(" ", "");
        }
        //    	delete by wangyn
        //        if(addr != null){
        //            addr = addr.replaceAll("\r","");
        //            addr = addr.replaceAll("\n","");
        //            addr = addr.trim();
        //
        //            if(addr.indexOf(" ") == -1 &&  addr.indexOf("\"") != -1){
        //               StringBuffer buffer = new StringBuffer();
        //                buffer.append(addr.substring(0,addr.lastIndexOf("\"")+1));
        //                buffer.append(" ");
        //                buffer.append(addr.substring(addr.lastIndexOf("\"")+1));
        //                addr = buffer.toString();
        //            }
        //            String [] addrinfo = addr.split(" ");
        //            if(addrinfo.length == 2){
        //                this.addr = addrinfo[1];
        //                if(addrinfo[0].contains("\"")){
        //                    addrinfo[0] = addrinfo[0].replaceAll("\"","");
        //                }
        //
        //                this.name = MimeUtility.decodeText(addrinfo[0]);
        //            } else {
        //                this.addr = addrinfo[0];
        //            }
        //        }
        //        if(this.addr != null){
        //            this.addr = this.addr.replaceAll("<","");
        //            this.addr = this.addr.replaceAll(">","");
        //        }
    }

    public Map<String,String> getDataMap(){
        Map<String,String> fromData = new HashMap<String, String>();
        fromData.put("addr",this.addr);
        fromData.put("name",new String(Base64.encodeBase64(this.name.getBytes())));
        return fromData;
    }

    public String getAddr() {
        return addr;
    }

    public void setAddr(String addr) {
        this.addr = addr;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public static void main(String[] args) throws UnsupportedEncodingException {
        String addr = "\"=?utf-8?B?emhhbmd5YW5n?=\"zhangyang@supporttest.7moor.com";
        M7MailAddr mailAddr = new M7MailAddr(addr);
        System.out.println(mailAddr.getName());
        System.out.println(mailAddr.getAddr());
    }

}
