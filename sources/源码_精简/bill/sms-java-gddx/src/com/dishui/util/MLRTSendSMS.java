package com.dishui.util;
/**
 * Created by chenguang on 3/6/15.
 */

import com.dishui.sms.SmsMaster;
import com.mongodb.util.Hash;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Logger;

/**
 * 文件名称：sendSMS_demo.java
 *
 * 文件作用：美联软通 http接口使用实例
 *
 * 创建时间：2012-05-18
 *
 *
 返回值											说明
 success:msgid								提交成功，发送状态请见4.1
 error:msgid									提交失败
 error:Missing username						用户名为空
 error:Missing password						密码为空
 error:Missing apikey						APIKEY为空
 error:Missing recipient						手机号码为空
 error:Missing message content				短信内容为空
 error:Account is blocked					帐号被禁用
 error:Unrecognized encoding					编码未能识别
 error:APIKEY or password error				APIKEY 或密码错误
 error:Unauthorized IP address				未授权 IP 地址
 error:Account balance is insufficient		余额不足
 error:Black keywords is:党中央				屏蔽词
 */
public class MLRTSendSMS {
    private static Logger log = Logger.getLogger(MLRTSendSMS.class.getName());

    public static String userName = "qimo";
    public static String passWord = "mlrt888";
    public static String apikey = "27661315c7e78e1fcd459cd0ff828b2a";
    public static String url = "http://m.5c.com.cn/api/send/index.php?";

    public static Map<String,String> send(String phone,String content){
        HashMap<String,String> resMap = new HashMap<String, String>();
        //发送内容
//        String content = "你好！我公司最近开展了一个神秘活动，邀请您参加。时间随意，地点随意！【我的签名我做主】";
        try{
            // 创建StringBuffer对象用来操作字符串
            StringBuffer sb = new StringBuffer(url);
            // APIKEY
            sb.append("apikey=27661315c7e78e1fcd459cd0ff828b2a");
            //用户名
            sb.append("&username="+userName);
            // 向StringBuffer追加密码
            sb.append("&password="+passWord);
            // 向StringBuffer追加手机号码
            sb.append("&mobile="+phone);
            // 向StringBuffer追加消息内容转URL标准码
            sb.append("&content="+URLEncoder.encode(content,"GBK"));
            // 创建url对象
            URL url = new URL(sb.toString());
            // 打开url连接
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            // 设置url请求方式 ‘get’ 或者 ‘post’
            connection.setRequestMethod("POST");
            // 发送
            BufferedReader in = new BufferedReader(new InputStreamReader(url.openStream()));
            // 返回发送结果
            String inputline = in.readLine();
            // 输出结果
            if(inputline.startsWith("success")){
                resMap.put("success","true");
                if(inputline.split(":").length == 2)
                    resMap.put("mlrt_msgid",inputline.split(":")[1]);
            }else{
                resMap.put("success","false");
                resMap.put("message",inputline);
            }
//            System.out.println(inputline);
            return resMap;

        }catch (Exception e){
            log.warning("MLRT SMS send failed! Exception="+e);
            resMap.put("success","false");
            resMap.put("message","send fail,has excepiton!");
            return resMap;
        }
    }
    /**
     * @param args
     * @throws IOException
     */
    public static void main(String[] args) throws IOException {
//        //发送内容
//        String content = "你好！我公司最近开展了一个神秘活动，邀请您参加。时间随意，地点随意！【我的签名我做主】";
//        // 创建StringBuffer对象用来操作字符串
//        StringBuffer sb = new StringBuffer("http://m.5c.com.cn/api/send/?");
//        // APIKEY
//        sb.append("apikey=27661315c7e78e1fcd459cd0ff828b2a");
//        //用户名
//        sb.append("&username=qimo");
//        // 向StringBuffer追加密码
//        sb.append("&password=mlrt888");
//        // 向StringBuffer追加手机号码
//        sb.append("&mobile=");
//        // 向StringBuffer追加消息内容转URL标准码
//        sb.append("&content="+URLEncoder.encode(content,"GBK"));
//        // 创建url对象
//        URL url = new URL(sb.toString());
//        // 打开url连接
//        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
//        // 设置url请求方式 ‘get’ 或者 ‘post’
//        connection.setRequestMethod("POST");
//        // 发送
//        BufferedReader in = new BufferedReader(new InputStreamReader(url.openStream()));
//        // 返回发送结果
//        String inputline = in.readLine();
//        // 输出结果
//        System.out.println(inputline);
    }
}