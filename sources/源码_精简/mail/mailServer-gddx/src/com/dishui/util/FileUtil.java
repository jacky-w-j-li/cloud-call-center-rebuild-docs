package com.dishui.util;

import com.dishui.command.JSONReader;
import com.qiniu.api.io.IoApi;
import com.qiniu.api.io.PutExtra;
import com.qiniu.api.io.PutRet;

import java.io.*;
import java.util.HashMap;

public class FileUtil {
    public static final String fileTempDir = "/data/mailFileTmp";
    public static final String fileServerUrl = "https://fs-mail-resource.7moor.com";
    public static final String fileServerScope = "m7-mail-resource";
    public static final String fileServerToken = "http://172.42.38.24:3000/openService?action=qiniu.getUptoken&scope=" + fileServerScope;


    public static String getFileByUrl(String url ) throws IOException {
        String tmpPath = fileTempDir;
        File path = new File(tmpPath + "/");
        if(!path.exists()){
            path.mkdirs();
        }
        String fileName = tmpPath + "/" + Utils.getUniqueid();
        System.out.println(fileName);
        String fileUrl = url;
        try {
            boolean result = HttpProvider.sendGetForFile(fileUrl,fileName);
            if(result){
                File file = new File(fileName);
                if(file.exists()){
                    return fileName;
                } else {
                    return null;
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    public static String getFile(String key ) throws IOException {
        String tmpPath = fileTempDir;
        String fileName = tmpPath + "/" + Utils.getUniqueid();
        System.out.println(fileName);
        String fileUrl = fileServerUrl + "/" + key;
        try {
            boolean result = HttpProvider.sendGetForFile(fileUrl,fileName);
            if(result){
                File file = new File(fileName);
                if(file.exists()){
                    return fileName;
                } else {
                    return null;
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }


    public static boolean saveFile(String fileName, InputStream in) throws Exception {
        String tmpPath = fileTempDir;
        File storefile = new File(tmpPath + "/" + fileName);
        BufferedOutputStream bos = null;
        BufferedInputStream bis = null;
        try {
            bos = new BufferedOutputStream(new FileOutputStream(storefile));
            bis = new BufferedInputStream(in);
            int c;
            while ((c = bis.read()) != -1) {
                bos.write(c);
                bos.flush();
            }
        } catch (Exception exception) {
            exception.printStackTrace();
            throw new Exception("???件�??�???失败!");
        } finally {
            bos.close();
            bis.close();
        }


        String url = fileServerToken;
        String urlRes = HttpProvider.sendGet(url);
        JSONReader reader = new JSONReader();
        HashMap<String,Object> resMap = (HashMap<String,Object>)reader.read(urlRes);

        if(resMap.get("success").toString().equals("true")){
            String token = resMap.get("uptoken").toString();
            PutExtra extra = new PutExtra();
            PutRet res = IoApi.putFile(token, fileName, tmpPath + "/" + fileName, extra);

            System.out.println(res.getResponse());
            HashMap<String,Object> qiniuRes = (HashMap<String,Object>)reader.read(res.getResponse());
            if((qiniuRes.get("key") !=null && qiniuRes.get("key").equals(fileName)) || (Boolean)qiniuRes.get("success") != null ){
                storefile.delete();
                return true;
            } else {
                return false;
            }
        }
        return false;
    }

}
