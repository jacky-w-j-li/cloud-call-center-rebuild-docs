package com.dishui.server.http;

import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by sjc on 16/7/18.
 */
public class FjdxXiaoHaoRunnable implements Runnable {
    private static Logger log = Logger.getLogger(FjdxXiaoHaoRunnable.class.getName());
    private String url;
    private String account;

    public FjdxXiaoHaoRunnable(String url){
        this.url = url;
    }

    public FjdxXiaoHaoRunnable(String url,String account){
        this.url = url;
        this.account = account;
    }

    @Override
    public void run() {
        try {
            String res = HttpProvider.sendGet(url);
            String resend = "false";
            if(resend.equals("true")){
                if(!res.trim().equals("200")){

                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            log.log(Level.WARNING, "FjdxXiaoHaoRunnable run has error!", e);
        }

    }
}
