package com.dishui.util;


import com.dishui.manager.service.AppConfig;
import com.qiniu.util.Auth;
import java.io.IOException;
import java.util.logging.Logger;

import com.qiniu.common.QiniuException;
import com.qiniu.http.Response;
import com.qiniu.storage.UploadManager;

public class QiniuUtil {
    private static Logger log = Logger.getLogger(QiniuUtil.class.getName());
    //设置好账号的ACCESS_KEY和SECRET_KEY
    private static String ACCESS_KEY = AppConfig.getInstance().getVar("qiniu_conf_ACCESS_KEY");
    private static String SECRET_KEY = AppConfig.getInstance().getVar("qiniu_conf_SECRET_KEY");
    //要上传的空间
    private static String bucketname = "m7-km";
    //要上传的域名
    private static String domain = "http://fs-km.7moor.com/";
    //密钥配置
    private static Auth auth = Auth.create(ACCESS_KEY, SECRET_KEY);
    //创建上传对象
    private static UploadManager uploadManager = new UploadManager();


    public static String getPrivateDownloadUrl(String key){
        //调用privateDownloadUrl方法生成下载链接,第二个参数可以设置Token的过期时间
        String downloadRUL = auth.privateDownloadUrl(domain+key,1892160000);
//        System.out.println(downloadRUL);
        return downloadRUL;
    }

    //简单上传，使用默认策略，只需要设置上传的空间名就可以了
    public static String getUpToken(){
        return auth.uploadToken(bucketname);
    }

    public static boolean upload(String path,String key) throws IOException{
        try {
            //调用put方法上传
            Response res = uploadManager.put(path, key, getUpToken());
            //打印返回的信息
            log.warning(res.bodyString());
            return true;
        } catch (QiniuException e) {
            Response r = e.response;
            // 请求失败时打印的异常的信息
            log.warning(r.toString());
            try {
                //响应的文本信息
                log.warning(r.bodyString());
            } catch (QiniuException e1) {
                //ignore
                e1.printStackTrace();
            }
            return false;
        }
    }

    public static void main(String args[]) throws IOException{
        //上传到七牛后保存的文件名
        String key = "哈哈.png";
        //上传文件的路径
        String filePath = "/Users/hotchwong/Downloads/哈哈.png";

        upload(filePath, key);
        getPrivateDownloadUrl(key);
    }

}

