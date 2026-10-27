package com.dishui.server.handler;

import com.dishui.db.mango.MongoProvider;
import com.dishui.exception.BaseRuntimeException;
import com.dishui.manager.command.C5Action;
import com.dishui.manager.command.C5Response;
import com.dishui.manager.command.Fields;
import com.dishui.manager.service.AppConfig;
import com.dishui.model.VOResult;
import com.dishui.util.LuceneUtil;
import com.dishui.util.OooUtil;
import com.dishui.util.Thumbnail;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

import java.io.*;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

public class ImgHandler {
	
	private static Logger log = Logger.getLogger(ImgHandler.class.getName());

	public static C5Response handle(C5Action action) {
		C5Response response = new C5Response(action);
		try {
			String method = action.getStringValue(Fields.Method);
			if(method.equals("customer")) {
                String account = action.getStringValue("account");
                String fileId = action.getStringValue("file");
                String trueName = action.getStringValue("trueName");
                String extenion = "";
                if (trueName != null) {
                    extenion = trueName.substring(trueName.lastIndexOf("."));
                }
                InputStream input = MongoProvider.getFileStreamById(fileId);
                String path=  AppConfig.getInstance().getVar("customer.pic")+account+"/";
                boolean isSuccess = Thumbnail.generatePic(input, account, fileId, extenion,path);
                response.addParameter("isSuccess", isSuccess);
                response.setSucceed(true);
            }else if(method.equals("weixin")){
                String account = action.getStringValue("account");
                String fileId = action.getStringValue("file");
                String trueName = action.getStringValue("trueName");
                String  srcFile=action.getStringValue("srcFile");
                String extenion = "";
                if (trueName != null) {
                    extenion = trueName.substring(trueName.lastIndexOf("."));
                }
                InputStream input = new BufferedInputStream(new FileInputStream(srcFile));
                String path=  AppConfig.getInstance().getVar("common.pic");
                boolean isSuccess = Thumbnail.generatePic(input, account, fileId, extenion,path);
                response.addParameter("isSuccess", isSuccess);
                response.addParameter("extenion", extenion);
                response.setSucceed(true);
			}
			return response;

		} catch (Exception e) {
			e.printStackTrace();
			log.log(Level.WARNING, "transfer img failed", e);
			response.setMessage(e.getMessage());
			response.setSucceed(false);
			if(e instanceof BaseRuntimeException){
				response.addParameter("code", ((BaseRuntimeException) e).getErrorCode());
			}
			response.addParameter("result", "500");
		}
		return response;
	}
    private static String readTxt(String curfile) {
        File f = new File(curfile);
        try {
            if (!f.exists())
                throw new BaseRuntimeException("km003","上传文件不存在");
            FileReader cf = new FileReader(curfile);
//            InputStreamReader cf = new InputStreamReader (new FileInputStream(f),"GBK");
            BufferedReader is = new BufferedReader(cf);
            StringBuffer filecontent = new StringBuffer();
            String line = "";
            while ((line=is.readLine()) != null) {
                filecontent.append(line);
            }
            is.close();
            cf.close();
            return filecontent.toString();
        } catch (Exception e) {
            e.printStackTrace();
            throw new BaseRuntimeException("km003","不能读取文件");
        }
    }
    private static void copyFile(String src,String dest) {
        File sFile = new File(src);
        File dFile = new File(dest);

        InputStream in=null;
        OutputStream out=null;
        try {
            if(!sFile.exists()){
                throw new BaseRuntimeException("km003","上传文件不存在");
            }
            if(!dFile.isDirectory()){dFile.mkdirs();}
//            if(!dFile.exists()){
//              dFile.createNewFile();
//            }
            in =new BufferedInputStream(new FileInputStream(sFile));
            out=new BufferedOutputStream(new FileOutputStream(dFile));
            byte[] data=new byte[2048];
            int count=0;
            while ((count=in.read(data))!=-1){
                out.write(data,0,count);
            }
            out.flush();
            out.close();
            in.close();
        } catch (Exception e) {
            e.printStackTrace();
            throw new BaseRuntimeException("km003","不能读取文件");
        }finally {
            if(in!=null){
                try {
                    in.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
            if(out!=null){
                try {
                    out.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
    }
}
