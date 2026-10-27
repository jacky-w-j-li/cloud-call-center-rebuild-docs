package com.m7.mailServer.model;


import org.apache.commons.codec.binary.Base64;

import java.io.UnsupportedEncodingException;
import java.util.HashMap;
import java.util.Map;

/**
 * Created by zhangyang on 16/5/3.
 */
public class M7Attachment {
    private String url ;
    private String name;

    public M7Attachment(String attStr){
        String [] info = attStr.split("\\|");
        this.name = info[0];
        this.url = info[1];
        if(this.name != null){
            this.name = this.name.replaceAll("\\n","");
        }
        if(this.url != null){
            this.url = this.url.replaceAll("\\n","");
        }
    }

    public M7Attachment(String name, String url) throws Exception {
        if(name != null){
            name = name.replaceAll(" ","+");
        }
        if(url != null){
            url = url.replaceAll(" ","+");
        }
        this.name = new String(Base64.decodeBase64(name.getBytes("UTF-8")));
        this.url = new String(Base64.decodeBase64(url.getBytes("UTF-8")));
    }


    public Map<String,String> getDataMap(){
        Map<String,String> fromData = new HashMap<String, String>();
        fromData.put("name",this.name);
        fromData.put("url",this.url);
        return fromData;
    }


    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
